/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/ban-types */
import events from 'events'

const PORT_NOT_OPEN_MESSAGE = 'Port Not Open'
const PORT_NOT_OPEN_ERRNO = 'ECONNREFUSED'

const BAD_ADDRESS_MESSAGE = 'Bad Client Address'
const BAD_ADDRESS_ERRNO = 'ECONNREFUSED'

const TRANSACTION_TIMED_OUT_MESSAGE = 'Timed out'
const TRANSACTION_TIMED_OUT_ERRNO = 'ETIMEDOUT'

class PortNotOpenError extends Error {
  errno: string
  constructor() {
    super()
    this.name = this.constructor.name // (2)
    this.message = PORT_NOT_OPEN_MESSAGE
    this.errno = PORT_NOT_OPEN_ERRNO
  }
}

class BadAddressError extends Error {
  errno: string
  constructor() {
    super()
    this.name = this.constructor.name // (2)
    this.message = BAD_ADDRESS_MESSAGE
    this.errno = BAD_ADDRESS_ERRNO
  }
}

class TransactionTimedOutError extends Error {
  errno: string
  constructor() {
    super()
    this.name = this.constructor.name // (2)
    this.message = TRANSACTION_TIMED_OUT_MESSAGE
    this.errno = TRANSACTION_TIMED_OUT_ERRNO
  }
}

class SerialPortError extends Error {
  errno: string
  constructor() {
    super()
    this.name = this.constructor.name // (2)
    this.message = ''
    this.errno = 'ECONNREFUSED'
  }
}

import addConnctionAPI from './apis/connection'
import addWorkerAPI from './apis/worker'
import addPromiseAPI from './apis/promise'
import SerialPort from './ports/SerialPort'
import {ReadCoilResult, SerialPortOptions} from './ModbusRTU'

const EventEmitter = events.EventEmitter || events

/**
 * @fileoverview ModbusRTU module, exports the ModbusRTU class.
 * this class makes ModbusRTU calls fun and easy.
 *
 * Modbus is a serial communications protocol, first used in 1979.
 * Modbus is simple and robust, openly published, royalty-free and
 * easy to deploy and maintain.
 */

/**
 * Parse the data for a Modbus -
 * Read Coils (FC=02, 01)
 *
 * @param {Buffer} data the data buffer to parse.
 * @param {Function} next the function to call next.
 */
function _readFC2(data: Buffer, next: Function) {
  const length = data.readUInt8(2)
  const contents = []

  for (let i = 0; i < length; i++) {
    let reg = data[i + 3]

    for (let j = 0; j < 8; j++) {
      contents.push((reg & 1) === 1)
      reg = reg >> 1
    }
  }

  if (next) next(null, {data: contents, buffer: data.slice(3, 3 + length)})
}

/**
 * Parse the data for a Modbus -
 * Read Input Registers (FC=04, 03)
 *
 * @param {Buffer} data the data buffer to parse.
 * @param {Function} next the function to call next.
 */
function _readFC3or4(data: Buffer, next: Function) {
  const length = data.readUInt8(2)
  const contents = []

  for (let i = 0; i < length; i += 2) {
    const reg = data.readUInt16BE(i + 3)
    contents.push(reg)
  }

  if (next) next(null, {data: contents, buffer: data.slice(3, 3 + length)})
}

/**
 * Parse the data for a Modbus (Enron) -
 * Read Registers (FC=04, 03)
 *
 * @param {Buffer} data the data buffer to parse.
 * @param {Function} next the function to call next.
 */
function _readFC3or4Enron(data: Buffer, next: Function) {
  const length = data.readUInt8(2)
  const contents = []

  for (let i = 0; i < length; i += 4) {
    const reg = data.readUInt32BE(i + 3)
    contents.push(reg)
  }

  if (next) next(null, {data: contents, buffer: data.slice(3, 3 + length)})
}

/**
 * Parse the data for a Modbus -
 * Force Single Coil (FC=05)
 *
 * @param {Buffer} data the data buffer to parse.
 * @param {Function} next the function to call next.
 */
function _readFC5(data: Buffer, next: Function) {
  const dataAddress = data.readUInt16BE(2)
  const state = data.readUInt16BE(4)

  if (next) next(null, {address: dataAddress, state: state === 0xff00})
}

/**
 * Parse the data for a Modbus -
 * Preset Single Registers (FC=06)
 *
 * @param {Buffer} data the data buffer to parse.
 * @param {Function} next the function to call next.
 */
function _readFC6(data: Buffer, next: Function) {
  const dataAddress = data.readUInt16BE(2)
  const value = data.readUInt16BE(4)

  if (next) next(null, {address: dataAddress, value: value})
}

/**
 * Parse the data for a Modbus (Enron) -
 * Preset Single Registers (FC=06)
 *
 * @param {Buffer} data the data buffer to parse.
 * @param {Function} next the function to call next.
 */
function _readFC6Enron(data: Buffer, next: Function) {
  const dataAddress = data.readUInt16BE(2)
  const value = data.readUInt32BE(4)

  if (next) next(null, {address: dataAddress, value: value})
}

/**
 * Parse the data for a Modbus -
 * Preset Multiple Registers (FC=15, 16)
 *
 * @param {Buffer} data the data buffer to parse.
 * @param {Function} next the function to call next.
 */
function _readFC16(data: Buffer, next: Function) {
  const dataAddress = data.readUInt16BE(2)
  const length = data.readUInt16BE(4)

  if (next) next(null, {address: dataAddress, length: length})
}

/**
 * Parse the data for a Modbus -
 * Report server ID (FC=17)
 *
 * @param {Buffer} data the data buffer to parse.
 * @param {Function} next the function to call next.
 */
function _readFC17(data: Buffer, next: Function) {
  const length = data.readUInt8(2)
  const serverId = data.readUInt8(3)
  const running = data.readUInt8(4) === 0xff
  let additionalData
  if (length > 2) {
    additionalData = Buffer.alloc(length - 2)
    // copy additional data
    data.copy(additionalData, 0, 5, data.length - 2)
  } else {
    additionalData = Buffer.alloc(0)
  }

  if (next) next(null, {serverId: serverId, running: running, additionalData: additionalData})
}

/**
 * Parse  the data fro Modbus -
 * Read File Records
 *
 * @param {Buffer4} buffer
 * @param {Function} next
 */
function _readFC20(data: Buffer, next: Function) {
  const fileRespLength = data.readUInt8(2)
  const result = []
  for (let i = 5; i < fileRespLength + 5; i++) {
    const reg = data.readUInt8(i)
    result.push(reg)
  }
  if (next) next(null, {data: result, length: fileRespLength})
}

/**
 * Parse the data for a Modbus -
 * Read Device Identification (FC=43)
 *
 * @param {Buffer} data the data buffer to parse.
 * @param {Modbus} modbus the client in case we need to read more device information
 * @param {Function} next the function to call next.
 */
function _readFC43(data: Buffer, modbus: ModbusRTU, next: Function) {
  const address = data.readUInt8(0)
  const readDeviceIdCode = data.readUInt8(3)
  const conformityLevel = data.readUInt8(4)
  const moreFollows = data.readUInt8(5)
  const nextObjectId = data.readUInt8(6)
  const numOfObjects = data.readUInt8(7)

  let startAt = 8
  const result = {}
  // The modbus specification states that numOfObjects is the number of
  // objects in the response, but the example on page 45 shows the total
  // number over all responses. Therefore be careful about reading more data than available
  for (let i = 0; i < numOfObjects && startAt < data.length; i++) {
    const objectId = data.readUInt8(startAt).toString()
    const objectLength = data.readUInt8(startAt + 1)
    const startOfData = startAt + 2
    result[objectId] = data.toString('ascii', startOfData, startOfData + objectLength)
    startAt = startOfData + objectLength
  }

  // is it saying to follow and did you previously get data
  // if you did not previously get data go ahead and halt to prevent an infinite loop
  if (moreFollows && numOfObjects) {
    const cb = function (err, data) {
      data.data = Object.assign(data.data, result)
      return next(err, data)
    }
    modbus.writeFC43(address, readDeviceIdCode, nextObjectId, cb)
  } else if (next) {
    next(null, {data: result, conformityLevel})
  }
}

// /**
//  * Wrapper method for writing to a port with timeout. <code><b>[this]</b></code> has the context of ModbusRTU
//  * @param {Buffer} buffer The data to send
//  * @private
//  */
// function _writeBufferToPort(buffer: Buffer, transactionId) {
//   const transaction = this._transactions[transactionId]

//   if (transaction) {
//     transaction._timeoutFired = false
//     transaction._timeoutHandle = _startTimeout(this._timeout, transaction)

//     // If in debug mode, stash a copy of the request payload
//     if (this._debugEnabled) {
//       transaction.request = Uint8Array.prototype.slice.call(buffer)
//       transaction.responses = []
//     }
//   }

//   // this._port.write(buffer)
//   this._port.writeHexadecimal({data: buffer.toString('hex')})
// }

/**
 * Starts the timeout timer with the given duration.
 * If the timeout ends before it was cancelled, it will call the callback with an error.
 * @param {number} duration the timeout duration in milliseconds.
 * @param {Function} next the function to call next.
 * @return {number} The handle of the timeout
 * @private
 */
function _startTimeout(duration, transaction) {
  if (!duration) {
    return undefined
  }
  return setTimeout(function () {
    transaction._timeoutFired = true
    if (transaction.next) {
      const err = new TransactionTimedOutError()
      if (transaction.request && transaction.responses) {
        err.modbusRequest = transaction.request
        err.modbusResponses = transaction.responses
      }
      transaction.next(err)
    }
  }, duration)
}

/**
 * Cancel the given timeout.
 *
 * @param {number} timeoutHandle The handle of the timeout
 * @private
 */
function _cancelTimeout(timeoutHandle) {
  clearTimeout(timeoutHandle)
}

/**
 * Handle incoming data from the Modbus port.
 *
 * @param {Buffer} data The data received
 * @private
 */
// function _onReceive(data) {
//   // eslint-disable-next-line @typescript-eslint/no-this-alias
//   const modbus = this
//   let error

//   // set locale helpers variables
//   const transaction = modbus._transactions[modbus._port._transactionIdRead]

//   // the _transactionIdRead can be missing, ignore wrong transaction it's
//   if (!transaction) {
//     return
//   }

//   if (transaction.responses) {
//     /* Stash what we received */
//     transaction.responses.push(Uint8Array.prototype.slice.call(data))
//   }

//   /* What do we do next? */
//   const next = function (err, res) {
//     if (transaction.next) {
//       /* Include request/response data if enabled */
//       if (transaction.request && transaction.responses) {
//         if (err) {
//           err.modbusRequest = transaction.request
//           err.modbusResponses = transaction.responses
//         }

//         if (res) {
//           res.request = transaction.request
//           res.responses = transaction.responses
//         }
//       }

//       /* Pass the data on */
//       return transaction.next(err, res)
//     }
//   }

//   /* cancel the timeout */
//   _cancelTimeout(transaction._timeoutHandle)
//   transaction._timeoutHandle = undefined

//   /* check if the timeout fired */
//   if (transaction._timeoutFired === true) {
//     // we have already called back with an error, so don't generate a new callback
//     return
//   }

//   /* check incoming data
//    */

//   /* check minimal length
//    */
//   if (!transaction.lengthUnknown && data.length < 5) {
//     error = 'Data length error, expected ' + transaction.nextLength + ' got ' + data.length
//     next(new Error(error))
//     return
//   }

//   /* check message CRC
//    * if CRC is bad raise an error
//    */
//   const crcIn = data.readUInt16LE(data.length - 2)
//   if (crcIn !== crc16(data.slice(0, -2))) {
//     error = 'CRC error'
//     next(new Error(error))
//     return
//   }

//   // if crc is OK, read address and function code
//   const address = data.readUInt8(0)
//   const code = data.readUInt8(1)

//   /* check for modbus exception
//    */
//   if (data.length >= 5 && code === (0x80 | transaction.nextCode)) {
//     const errorCode = data.readUInt8(2)
//     if (transaction.next) {
//       error = new Error('Modbus exception ' + errorCode + ': ' + (modbusErrorMessages[errorCode] || 'Unknown error'))
//       error.modbusCode = errorCode
//       next(error)
//     }
//     return
//   }

//   /* check enron options are valid
//    */
//   if (modbus._enron) {
//     const example = {
//       enronTables: {
//         booleanRange: [1001, 1999],
//         shortRange: [3001, 3999],
//         longRange: [5001, 5999],
//         floatRange: [7001, 7999],
//       },
//     }

//     if (
//       typeof modbus._enronTables === 'undefined' ||
//       modbus._enronTables.shortRange.length !== 2 ||
//       modbus._enronTables.shortRange[0] >= modbus._enronTables.shortRange[1]
//     ) {
//       next(new Error('Enron table definition missing from options. Example: ' + JSON.stringify(example)))
//       return
//     }
//   }

//   /* check message length
//    * if we do not expect this data
//    * raise an error
//    */
//   if (!transaction.lengthUnknown && data.length !== transaction.nextLength) {
//     error = 'Data length error, expected ' + transaction.nextLength + ' got ' + data.length
//     next(new Error(error))
//     return
//   }

//   /* check message address
//    * if we do not expect this message
//    * raise an error
//    */
//   if (address !== transaction.nextAddress) {
//     error = 'Unexpected data error, expected ' + 'address ' + transaction.nextAddress + ' got ' + address
//     if (transaction.next) next(new Error(error))
//     return
//   }

//   /* check message code
//    * if we do not expect this message
//    * raise an error
//    */
//   if (code !== transaction.nextCode) {
//     error = 'Unexpected data error, expected ' + 'code ' + transaction.nextCode + ' got ' + code
//     if (transaction.next) next(new Error(error))
//     return
//   }

//   /* parse incoming data
//    */
//   try {
//     switch (code) {
//       case 1:
//       case 2:
//         // Read Coil Status (FC=01)
//         // Read Input Status (FC=02)
//         _readFC2(data, next)
//         break
//       case 3:
//       case 4:
//         // Read Input Registers (FC=04)
//         // Read Holding Registers (FC=03)
//         if (
//           modbus._enron &&
//           !(
//             transaction.nextDataAddress >= modbus._enronTables.shortRange[0] &&
//             transaction.nextDataAddress <= modbus._enronTables.shortRange[1]
//           )
//         ) {
//           _readFC3or4Enron(data, next)
//         } else {
//           _readFC3or4(data, next)
//         }
//         break
//       case 5:
//         // Force Single Coil
//         _readFC5(data, next)
//         break
//       case 6:
//         // Preset Single Register
//         if (
//           modbus._enron &&
//           !(
//             transaction.nextDataAddress >= modbus._enronTables.shortRange[0] &&
//             transaction.nextDataAddress <= modbus._enronTables.shortRange[1]
//           )
//         ) {
//           _readFC6Enron(data, next)
//         } else {
//           _readFC6(data, next)
//         }
//         break
//       case 15:
//       case 16:
//         // Force Multiple Coils
//         // Preset Multiple Registers
//         _readFC16(data, next)
//         break
//       case 17:
//         _readFC17(data, next)
//         break
//       case 20:
//         _readFC20(data, transaction.next)
//         break
//       case 43:
//         // read device identification
//         _readFC43(data, modbus, next)
//     }
//   } catch (e) {
//     if (transaction.next) {
//       next(e)
//     }
//   }
// }

/**
 * Handle SerialPort errors.
 *
 * @param {Error} error The error received
 * @private
 */
// function _onError(e) {
//   const err = new SerialPortError()
//   err.message = e.message
//   err.stack = e.stack
//   this.emit('error', err)
// }

class ModbusRTU extends EventEmitter {
  _port: SerialPort
  _options: SerialPortOptions
  _transactions: {[key: string]: any}
  _timeout: number | null
  _unitID: number
  _connected: boolean

  /**
   * Class making ModbusRTU calls fun and easy.
   *
   * @param {SerialPort} port the serial port to use.
   */
  constructor(options: SerialPortOptions) {
    super()

    // the serial port to use
    // this._port = port
    this._options = options

    // state variables
    this._transactions = {}
    this._timeout = null // timeout in msec before unanswered request throws timeout error
    this._unitID = 1
    this._connected = false
    this._port = new SerialPort(options)

    // this._onReceive = _onReceive.bind(this)
    // this._onError = _onError.bind(this)
  }

  /**
   * Open the serial port and register Modbus parsers
   *
   * @param {Function} callback the function to call next on open success
   *      of failure.
   */
  async open(callback: Function) {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const modbus = this

    this._port.open(this._options, (connected) => {
      // callback(connected)
      if (connected) {
        /* init ports transaction id and counter */
        modbus._port._transactionIdRead = 1
        modbus._port._transactionIdWrite = 1

        /* On serial port success
         * (re-)register the modbus parser functions
         */
        modbus._port.removeListener('data', modbus._onReceive)
        modbus._port.on('data', modbus._onReceive)
      }
    })

    // open the serial port
    // modbus._port.open(function (error) {
    //   if (error) {
    //     // modbusSerialDebug({action: 'port open error', error: error})
    //     /* On serial port open error call next function */
    //     if (callback) callback(error)
    //   } else {
    //     /* init ports transaction id and counter */
    //     modbus._port._transactionIdRead = 1
    //     modbus._port._transactionIdWrite = 1

    //     /* On serial port success
    //      * (re-)register the modbus parser functions
    //      */
    //     modbus._port.removeListener('data', modbus._onReceive)
    //     modbus._port.on('data', modbus._onReceive)

    //     /* On serial port error
    //      * (re-)register the error listener function
    //      */
    //     modbus._port.removeListener('error', modbus._onError)
    //     modbus._port.on('error', modbus._onError)

    //     /* Hook the close event so we can relay it to our callers. */
    //     modbus._port.once('close', modbus.emit.bind(modbus, 'close'))

    //     /* On serial port open OK call next function with no error */
    //     if (callback) callback(error)
    //   }
    // })
  }

  // get isDebugEnabled() {
  //   return this._debugEnabled
  // }

  // set isDebugEnabled(enable) {
  //   enable = Boolean(enable)
  //   this._debugEnabled = enable
  // }

  get isOpen() {
    return this._connected
  }

  setID(address: number) {
    this._unitID = address
  }

  /**
   * Clears the timeout for all pending transactions.
   * This essentially cancels all pending requests.
   */
  _cancelPendingTransactions() {
    if (Object.keys(this._transactions).length > 0) {
      Object.values(this._transactions).forEach((transaction) => {
        if (transaction._timeoutHandle) {
          _cancelTimeout(transaction._timeoutHandle)
        }
      })
    }
  }

  /**
   * Handle incoming data from the Modbus port.
   *
   * @param {Buffer} data The data received
   * @private
   */
  _onReceive(data: Buffer) {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const modbus = this
    let error

    // set locale helpers variables
    const transaction = modbus._transactions[modbus._port._transactionIdRead]

    // the _transactionIdRead can be missing, ignore wrong transaction it's
    if (!transaction) {
      return
    }

    if (transaction.responses) {
      /* Stash what we received */
      transaction.responses.push(Uint8Array.prototype.slice.call(data))
    }

    /* What do we do next? */
    const next = function (err, res) {
      if (transaction.next) {
        /* Include request/response data if enabled */
        if (transaction.request && transaction.responses) {
          if (err) {
            err.modbusRequest = transaction.request
            err.modbusResponses = transaction.responses
          }

          if (res) {
            res.request = transaction.request
            res.responses = transaction.responses
          }
        }

        /* Pass the data on */
        return transaction.next(err, res)
      }
    }

    /* cancel the timeout */
    _cancelTimeout(transaction._timeoutHandle)
    transaction._timeoutHandle = undefined

    /* check if the timeout fired */
    if (transaction._timeoutFired === true) {
      // we have already called back with an error, so don't generate a new callback
      return
    }

    /* check incoming data
     */

    /* check minimal length
     */
    if (!transaction.lengthUnknown && data.length < 5) {
      error = 'Data length error, expected ' + transaction.nextLength + ' got ' + data.length
      next(new Error(error))
      return
    }

    /* check message CRC
     * if CRC is bad raise an error
     */
    const crcIn = data.readUInt16LE(data.length - 2)
    if (crcIn !== crc16(data.slice(0, -2))) {
      error = 'CRC error'
      next(new Error(error))
      return
    }

    // if crc is OK, read address and function code
    const address = data.readUInt8(0)
    const code = data.readUInt8(1)

    /* check for modbus exception
     */
    if (data.length >= 5 && code === (0x80 | transaction.nextCode)) {
      const errorCode = data.readUInt8(2)
      if (transaction.next) {
        error = new Error('Modbus exception ' + errorCode + ': ' + (modbusErrorMessages[errorCode] || 'Unknown error'))
        error.modbusCode = errorCode
        next(error)
      }
      return
    }

    /* check enron options are valid
     */
    if (modbus._enron) {
      const example = {
        enronTables: {
          booleanRange: [1001, 1999],
          shortRange: [3001, 3999],
          longRange: [5001, 5999],
          floatRange: [7001, 7999],
        },
      }

      if (
        typeof modbus._enronTables === 'undefined' ||
        modbus._enronTables.shortRange.length !== 2 ||
        modbus._enronTables.shortRange[0] >= modbus._enronTables.shortRange[1]
      ) {
        next(new Error('Enron table definition missing from options. Example: ' + JSON.stringify(example)))
        return
      }
    }

    /* check message length
     * if we do not expect this data
     * raise an error
     */
    if (!transaction.lengthUnknown && data.length !== transaction.nextLength) {
      error = 'Data length error, expected ' + transaction.nextLength + ' got ' + data.length
      next(new Error(error))
      return
    }

    /* check message address
     * if we do not expect this message
     * raise an error
     */
    if (address !== transaction.nextAddress) {
      error = 'Unexpected data error, expected ' + 'address ' + transaction.nextAddress + ' got ' + address
      if (transaction.next) next(new Error(error))
      return
    }

    /* check message code
     * if we do not expect this message
     * raise an error
     */
    if (code !== transaction.nextCode) {
      error = 'Unexpected data error, expected ' + 'code ' + transaction.nextCode + ' got ' + code
      if (transaction.next) next(new Error(error))
      return
    }

    /* parse incoming data
     */
    try {
      switch (code) {
        case 1:
        case 2:
          // Read Coil Status (FC=01)
          // Read Input Status (FC=02)
          _readFC2(data, next)
          break
        case 3:
        case 4:
          // Read Input Registers (FC=04)
          // Read Holding Registers (FC=03)
          if (
            modbus._enron &&
            !(
              transaction.nextDataAddress >= modbus._enronTables.shortRange[0] &&
              transaction.nextDataAddress <= modbus._enronTables.shortRange[1]
            )
          ) {
            _readFC3or4Enron(data, next)
          } else {
            _readFC3or4(data, next)
          }
          break
        case 5:
          // Force Single Coil
          _readFC5(data, next)
          break
        case 6:
          // Preset Single Register
          if (
            modbus._enron &&
            !(
              transaction.nextDataAddress >= modbus._enronTables.shortRange[0] &&
              transaction.nextDataAddress <= modbus._enronTables.shortRange[1]
            )
          ) {
            _readFC6Enron(data, next)
          } else {
            _readFC6(data, next)
          }
          break
        case 15:
        case 16:
          // Force Multiple Coils
          // Preset Multiple Registers
          _readFC16(data, next)
          break
        case 17:
          _readFC17(data, next)
          break
        case 20:
          _readFC20(data, transaction.next)
          break
        case 43:
          // read device identification
          _readFC43(data, modbus, next)
      }
    } catch (e) {
      if (transaction.next) {
        next(e)
      }
    }
  }

  /**
   * Handle SerialPort errors.
   *
   * @param {Error} error The error received
   * @private
   */
  _onError(e: any) {
    const err = new SerialPortError()
    err.message = e.message
    err.stack = e.stack
    this.emit('error', err)
  }
  /**
   * Close the serial port
   *
   * @param {Function} callback the function to call next on close success
   *      or failure.
   */
  close(callback: Function) {
    // close the serial port if exist
    if (this._port) {
      this._port.removeAllListeners('data')
      this._port.close()
      callback()
    } else {
      // nothing needed to be done
      callback()
    }
  }

  /**
   * Wrapper method for writing to a port with timeout. <code><b>[this]</b></code> has the context of ModbusRTU
   * @param {Buffer} buffer The data to send
   * @private
   */
  _writeBufferToPort(buffer: Buffer, transactionId: string) {
    const transaction = this._transactions[transactionId]

    if (transaction) {
      transaction._timeoutFired = false
      transaction._timeoutHandle = _startTimeout(this._timeout, transaction)
    }

    this._port.write(buffer)
  }

  /**
   * Write a Modbus "Read Coil Status" (FC=01) to serial port.
   *
   * @param {number} address the slave unit address.
   * @param {number} dataAddress the Data Address of the first coil.
   * @param {number} length the total number of coils requested.
   * @param {Function} next the function to call next.
   */
  writeFC1(address, dataAddress, length, next) {
    this.writeFC2(address, dataAddress, length, next, 1)
  }

  async readCoils(dataAddress: number, length: number): Promise<ReadCoilResult> {
    const address = this._unitID
    // check port is actually open before attempting write
    if (this.isOpen !== true) {
      const error = new PortNotOpenError()
      return Promise.reject(error)
    }

    // sanity check
    if (typeof dataAddress === 'undefined') {
      const error = new BadAddressError()
      return Promise.reject(error)
    }

    // function code defaults to 2
    const code = 1

    // set state variables
    this._transactions[this._port._transactionIdWrite] = {
      nextAddress: address,
      nextCode: code,
      nextLength: 3 + Math.ceil((length - 1) / 8 + 1) + 2,
      next: next,
    }

    const codeLength = 6
    const buf = Buffer.alloc(codeLength + 2) // add 2 crc bytes

    buf.writeUInt8(address, 0)
    buf.writeUInt8(code, 1)
    buf.writeUInt16BE(dataAddress, 2)
    buf.writeUInt16BE(length, 4)

    // add crc bytes to buffer
    buf.writeUInt16LE(crc16(buf.subarray(0, -2)), codeLength)

    // write buffer to serial port
    _writeBufferToPort.call(this, buf, this._port._transactionIdWrite)
  }

  /**
   * Write a Modbus "Read Holding Registers" (FC=03) to serial port.
   *
   * @param {number} address the slave unit address.
   * @param {number} dataAddress the Data Address of the first register.
   * @param {number} length the total number of registers requested.
   * @param {Function} next the function to call next.
   */
  writeFC3(address, dataAddress, length, next) {
    this.writeFC4(address, dataAddress, length, next, 3)
  }

  /**
   * Write a Modbus "Force Single Coil" (FC=05) to serial port.
   *
   * @param {number} address the slave unit address.
   * @param {number} dataAddress the Data Address of the coil.
   * @param {number} state the boolean state to write to the coil (true / false).
   * @param {Function} next the function to call next.
   */
  writeFC5(address, dataAddress, state, next) {
    // check port is actually open before attempting write
    if (this.isOpen !== true) {
      if (next) next(new PortNotOpenError())
      return
    }

    // sanity check
    if (typeof address === 'undefined' || typeof dataAddress === 'undefined') {
      if (next) next(new BadAddressError())
      return
    }

    const code = 5

    // set state variables
    this._transactions[this._port._transactionIdWrite] = {
      nextAddress: address,
      nextCode: code,
      nextLength: 8,
      next: next,
    }

    const codeLength = 6
    const buf = Buffer.alloc(codeLength + 2) // add 2 crc bytes

    buf.writeUInt8(address, 0)
    buf.writeUInt8(code, 1)
    buf.writeUInt16BE(dataAddress, 2)

    if (state) {
      buf.writeUInt16BE(0xff00, 4)
    } else {
      buf.writeUInt16BE(0x0000, 4)
    }

    // add crc bytes to buffer
    buf.writeUInt16LE(crc16(buf.subarray(0, -2)), codeLength)

    // write buffer to serial port
    _writeBufferToPort.call(this, buf, this._port._transactionIdWrite)
  }

  /**
   * Write a Modbus "Preset Single Register " (FC=6) to serial port.
   *
   * @param {number} address the slave unit address.
   * @param {number} dataAddress the Data Address of the register.
   * @param {number} value the value to write to the register.
   * @param {Function} next the function to call next.
   */
  writeFC6(address, dataAddress, value, next) {
    // check port is actually open before attempting write
    if (this.isOpen !== true) {
      if (next) next(new PortNotOpenError())
      return
    }

    // sanity check
    if (typeof address === 'undefined' || typeof dataAddress === 'undefined') {
      if (next) next(new BadAddressError())
      return
    }

    const code = 6

    let valueSize = 8
    if (
      this._enron &&
      !(dataAddress >= this._enronTables.shortRange[0] && dataAddress <= this._enronTables.shortRange[1])
    ) {
      valueSize = 10
    }

    // set state variables
    this._transactions[this._port._transactionIdWrite] = {
      nextAddress: address,
      nextDataAddress: dataAddress,
      nextCode: code,
      nextLength: valueSize,
      next: next,
    }

    let codeLength = 6 // 1B deviceAddress + 1B functionCode + 2B dataAddress + (2B value | 4B value (enron))
    if (
      this._enron &&
      !(dataAddress >= this._enronTables.shortRange[0] && dataAddress <= this._enronTables.shortRange[1])
    ) {
      codeLength = 8
    }

    const buf = Buffer.alloc(codeLength + 2) // add 2 crc bytes

    buf.writeUInt8(address, 0)
    buf.writeUInt8(code, 1)
    buf.writeUInt16BE(dataAddress, 2)

    if (Buffer.isBuffer(value)) {
      value.copy(buf, 4)
    } else if (
      this._enron &&
      !(dataAddress >= this._enronTables.shortRange[0] && dataAddress <= this._enronTables.shortRange[1])
    ) {
      buf.writeUInt32BE(value, 4)
    } else {
      buf.writeUInt16BE(value, 4)
    }

    // add crc bytes to buffer
    buf.writeUInt16LE(crc16(buf.subarray(0, -2)), codeLength)

    // write buffer to serial port
    _writeBufferToPort.call(this, buf, this._port._transactionIdWrite)
  }
}

addConnctionAPI(ModbusRTU)
addWorkerAPI(ModbusRTU)
addPromiseAPI(ModbusRTU)

export default ModbusRTU
