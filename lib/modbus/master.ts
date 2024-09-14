import BufferPut from 'bufferput'

import {SerialHelper, SerialHelperFactory} from './serial-helper'
import {Logger} from './logger'

import {FUNCTION_CODES, RESPONSE_TIMEOUT, QUEUE_TIMEOUT, DEFAULT_RETRY_COUNT} from './constants'

import {ModbusRetryLimitExceed, ModbusCrcError} from './errors'
import * as packetUtils from './packet-utils'
import SerialPort from './SerialPort'
import {SerialConnectionParameters} from '@adeunis/capacitor-serial'
import $eventBus from '../eventbus'
import {getDefaultStore} from 'jotai'
import {Store} from '@/components/provider/JotaiProvider'
import {LBIT_ATOM, LWORD_ATOM} from '@/atom/modbus'

export type ModbusMasterOptions = {
  responseTimeout: number
  queueTimeout: number
  retryCount: number
}

export class ModbusMaster {
  serial: SerialHelper
  _options: ModbusMasterOptions
  _unitID: number = 0
  logger: Logger
  _lockPollCoils = false
  _lockPollRegisters = false
  _store: Store

  constructor(serialPort: SerialPort, options?: ModbusMasterOptions) {
    // this.serial = serialPort
    // serialPort.on('error', (err) => {
    //     console.error(err);
    // });
    this._options = Object.assign(
      {},
      {
        responseTimeout: RESPONSE_TIMEOUT,
        queueTimeout: QUEUE_TIMEOUT,
        retryCount: DEFAULT_RETRY_COUNT,
      },
      options || {},
    )
    this.logger = new Logger(this._options)
    this.serial = SerialHelperFactory.create(serialPort, this._options)
    this._store = getDefaultStore()
  }

  /**
   * Modbus function: 1, read coils
   * @param {number} address
   * @param {number} length
   * @param {number} [retryCount]
   * @returns {Promise<number[]>}
   */
  async readCoils(address: number, length: number): Promise<number[]> {
    const packet = this.createFixedPacket(this._unitID, FUNCTION_CODES.READ_COILS, address, length)
    // $eventBus.trigger('data', packet)

    return this.request(packet).then((buffer) => {
      const buf = packetUtils.getDataBuffer(buffer)
      // $eventBus.trigger('data', buf)

      return packetUtils.parseFc01Packet(buf, length)
    })
  }

  /**
   * Modbus function: 5, write single coil
   * @param {number} address
   * @param {boolean} value
   * @param {number} [retryCount]
   */
  async writeCoil(address: number, value: boolean, retryCount?: number) {
    const packet = this.createFixedPacket(this._unitID, FUNCTION_CODES.WRITE_SINGLE_COIL, address, value ? 1 : 0)
    retryCount = retryCount ?? this._options.retryCount

    const performRequest = (retry: number) => {
      return new Promise((resolve, reject) => {
        const funcName = 'writeSingleCoil: '
        const funcId =
          `Slave ${this._unitID}; Address: ${address}; Value: ${value ? 'true' : 'false'};` +
          `Retry ${retryCount - retry} of ${retryCount}`

        if (retry < 0) {
          throw new ModbusRetryLimitExceed(funcId)
        }

        this.logger.info(funcName + 'perform request.' + funcId)

        this.request(packet)
          .then(resolve)
          .catch((err) => {
            this.logger.info(funcName + err + funcId)

            return performRequest(--retry).then(resolve).catch(reject)
          })
      })
    }
    return performRequest(retryCount)
  }

  /**
   * Modbus function: 3, read holding registers
   * @param {number} address
   * @param {number} length
   * @param {number | function} [dataType] value from DATA_TYPES const or callback
   * @returns {Promise<number[]>}
   */
  readHoldingRegisters(address: number, length: number, dataType: packetUtils.DATA_TYPES) {
    const packet = this.createFixedPacket(this._unitID, FUNCTION_CODES.READ_HOLDING_REGISTERS, address, length)

    return this.request(packet).then((buffer) => {
      const buf = packetUtils.getDataBuffer(buffer)
      $eventBus.trigger('data', buf)

      return packetUtils.parseFc03Packet(buf, dataType)
    })
  }

  /**
   * Modbus function: 6,  write single register
   * @param {number} address
   * @param {number} value
   * @param {number} [retryCount]
   */
  writeRegister(address: number, value: number, retryCount?: number) {
    const packet = this.createFixedPacket(this._unitID, FUNCTION_CODES.WRITE_SINGLE_REGISTER, address, value)
    retryCount = retryCount ?? this._options.retryCount

    const performRequest = (retry: number) => {
      return new Promise((resolve, reject) => {
        const funcName = 'writeSingleRegister: '
        const funcId =
          `Slave ${this._unitID}; Address: ${address}; Value: ${value};` +
          `Retry ${retryCount - retry} of ${retryCount}`

        if (retry < 0) {
          throw new ModbusRetryLimitExceed(funcId)
        }

        this.logger.info(funcName + 'perform request.' + funcId)

        this.request(packet)
          .then(resolve)
          .catch((err) => {
            this.logger.info(funcName + err + funcId)

            return performRequest(--retry).then(resolve).catch(reject)
          })
      })
    }
    return performRequest(retryCount)
  }

  /**
   * Modbus function: 16, write multiple registers
   * @param {number} address
   * @param {number[]} array
   * @param {number} [retryCount]
   */
  writeRegisters(address: number, array: number[], retryCount?: number) {
    const packet = this.createVariousPacket(this._unitID, FUNCTION_CODES.WRITE_MULTIPLE_REGISTERS, address, array)

    retryCount = retryCount ?? this._options.retryCount

    const performRequest = (retry: number) => {
      return new Promise((resolve, reject) => {
        const funcName = 'writeMultipleRegisters: '
        const funcId =
          `Slave ${this._unitID}; Address: ${address}; Value: ${array.toString()};` +
          `Retry ${retryCount + 1 - retry} of ${retryCount}`

        if (retry < 0) {
          throw new ModbusRetryLimitExceed(funcId)
        }

        this.logger.info(funcName + 'perform request.' + funcId)

        this.request(packet)
          .then(resolve)
          .catch((err) => {
            this.logger.info(funcName + err + funcId)

            return performRequest(--retry).then(resolve).catch(reject)
          })
      })
    }
    return performRequest(retryCount)
  }

  /**
   * Modbus polling coils
   * @param {number} address
   * @param {number} length
   * @param {number} polling
   */
  pollCoils(address: number, length: number, polling: number = 500) {
    $eventBus.trigger('state', 'coil polling: ' + polling)
    if (this._lockPollCoils) {
      return
    }

    this._lockPollCoils = true

    this.readCoils(address, length)
      .then((data) => {
        this._store.set(LBIT_ATOM, data)
        $eventBus.trigger('LBIT', data)
      })
      .finally(() => {
        setTimeout(() => {
          this._lockPollCoils = false
          this.pollCoils(address, length, polling)
        }, polling)
      })
  }

  /**
   * Modbus polling coils
   * @param {number} address
   * @param {number} length
   * @param {number} polling
   */
  pollRegisters(address: number, length: number, dataType: packetUtils.DATA_TYPES = 'INT', polling: number = 500) {
    $eventBus.trigger('state', 'register polling: ' + polling)
    if (this._lockPollRegisters) {
      return
    }

    this._lockPollRegisters = true

    this.readHoldingRegisters(address, length, dataType)
      .then((data) => {
        this._store.set(LWORD_ATOM, data)
        $eventBus.trigger('LWORD', data)
      })
      .finally(() => {
        setTimeout(() => {
          this._lockPollRegisters = false
          this.pollRegisters(address, length, dataType, polling)
        }, polling)
      })
  }

  /**
   * Create modbus packet with fixed length
   * @private
   * @param {number} slave
   * @param {number} func
   * @param {number} param
   * @param {number} param2
   * @returns {Buffer}
   */
  createFixedPacket(slave: number, func: number, param: number, param2: number) {
    const buf = new BufferPut().word8be(slave).word8be(func)
    switch (func) {
      case FUNCTION_CODES.WRITE_SINGLE_COIL:
        buf.word16be(param)
        if (param2 === 0) {
          buf.word16be(0)
        } else {
          buf.word8be(255)
          buf.word8be(0)
        }
        break

      default:
        buf.word16be(param).word16be(param2).buffer()
        break
    }
    return buf.buffer()
  }

  /**
   * Create modbus packet with various length
   * @private
   * @param {number} slave
   * @param {number} func
   * @param {number} start
   * @param {number[]} array
   * @returns {Buffer}
   */
  createVariousPacket(slave: number, func: number, start: number, array: number[]) {
    const buf = new BufferPut()
      .word8be(slave)
      .word8be(func)
      .word16be(start)
      .word16be(array.length)
      .word8be(array.length * 2)

    array.forEach((value) => buf.word16be(value))

    return buf.buffer()
  }

  /**
   * @private
   * @param {Buffer} buffer
   * @returns {Promise<Buffer>}
   */
  async request(buffer: Buffer) {
    const response = await this.serial.write(packetUtils.addCrc(buffer))
    if (!packetUtils.checkCrc(response)) {
      throw new ModbusCrcError()
    }
    return response
  }

  delay(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  setID(id: number) {
    this._unitID = id
  }
}
