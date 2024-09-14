import BufferPut from 'bufferput'

import {SerialHelper, SerialHelperFactory} from './serial-helper'
import {Logger} from './logger'

import {FUNCTION_CODES, RESPONSE_TIMEOUT, QUEUE_TIMEOUT, DEFAULT_RETRY_COUNT} from './constants'

import {ModbusRetryLimitExceed, ModbusCrcError} from './errors'
import * as packetUtils from './packet-utils'
import SerialPort from './SerialPort'
import {SerialConnectionParameters} from '@adeunis/capacitor-serial'
import $eventBus from '../eventbus'

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
  _flgPollingCoils = false

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
  }

  /**
   * Modbus function write single coil
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
   * Modbus function read coils
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
      $eventBus.trigger('data', buf)

      return packetUtils.parseFc01Packet(buf, length)
    })
  }

  /**
   * Modbus function read holding registers
   * @param {number} slave
   * @param {number} start
   * @param {number} length
   * @param {number | function} [dataType] value from DATA_TYPES const or callback
   * @returns {Promise<number[]>}
   */
  // readHoldingRegisters(slave, start, length, dataType) {
  //     const packet = this.createFixedPacket(slave, FUNCTION_CODES.READ_HOLDING_REGISTERS, start, length);

  //     return this.request(packet).then((buffer) => {
  //         const buf = packetUtils.getDataBuffer(buffer);

  //         if (typeof (dataType) === 'function') {
  //             return dataType(buf);
  //         }

  //         return packetUtils.parseFc03Packet(buf, dataType);
  //     });
  // }

  /**
   *
   * @param {number} slave
   * @param {number} register
   * @param {number} value
   * @param {number} [retryCount]
   */
  // writeSingleRegister(slave, register, value, retryCount) {
  //     const packet = this.createFixedPacket(slave, FUNCTION_CODES.WRITE_SINGLE_REGISTER, register, value);
  //     retryCount = retryCount || DEFAULT_RETRY_COUNT;

  //     const performRequest = (retry) => {
  //         return new Promise((resolve, reject) => {
  //             const funcName = 'writeSingleRegister: ';
  //             const funcId =
  //                 `Slave ${slave}; Register: ${register}; Value: ${value};` +
  //                 `Retry ${retryCount + 1 - retry} of ${retryCount}`;

  //             if (retry <= 0) {
  //                 throw new ModbusRetryLimitExceed(funcId);
  //             }

  //             this.logger.info(funcName + 'perform request.' + funcId);

  //             this.request(packet)
  //                 .then(resolve)
  //                 .catch((err) => {
  //                     this.logger.info(funcName + err + funcId);

  //                     return performRequest(--retry)
  //                         .then(resolve)
  //                         .catch(reject);
  //                 });
  //         });
  //     };
  //     return performRequest(retryCount);
  // }

  /**
   *
   * @param {number} slave
   * @param {number} start
   * @param {number[]} array
   */
  // writeMultipleRegisters(slave, start, array) {
  //     const packet = this.createVariousPacket(slave, FUNCTION_CODES.WRITE_MULTIPLE_REGISTERS, start, array);
  //     return this.request(packet);
  // }

  /**
   * Modbus polling coils
   * @param {number} address
   * @param {number} length
   * @param {number} polling
   */
  pollCoils(address: number, length: number, polling: number = 500) {
    $eventBus.trigger('state', 'polling: ' + polling)
    if (this._flgPollingCoils) {
      return
    }

    this._flgPollingCoils = true

    this.readCoils(address, length)
      .then((data) => {
        $eventBus.trigger('LBIT', data)
      })
      .finally(() => {
        setTimeout(() => {
          this._flgPollingCoils = false
          this.pollCoils(address, length, polling)
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
