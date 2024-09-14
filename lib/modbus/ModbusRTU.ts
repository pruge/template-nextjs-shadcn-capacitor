/* eslint-disable @typescript-eslint/ban-types */
/* eslint-disable @typescript-eslint/no-explicit-any */
// import {Socket, SocketConstructorOpts, TcpSocketConnectOpts} from 'net'
// import {TestPort} from './TestPort'
// import {PortInfo} from '@serialport/bindings-cpp'
import {SerialConnectionParameters} from '@adeunis/capacitor-serial'

export interface ModbusRTUInterface {
  // constructor()
  // static TestPort: typeof TestPort

  // static getPorts(): Promise<PortInfo[]>

  open(callback?: Function): void
  close(callback?: Function): void
  destroy(callback?: Function): void

  writeFC1(address: number, dataAddress: number, length: number, next: NodeStyleCallback<ReadCoilResult>): void
  writeFC2(address: number, dataAddress: number, length: number, next: NodeStyleCallback<ReadCoilResult>): void
  writeFC3(address: number, dataAddress: number, length: number, next: NodeStyleCallback<ReadRegisterResult>): void
  writeFC4(address: number, dataAddress: number, length: number, next: NodeStyleCallback<ReadRegisterResult>): void
  writeFC5(address: number, dataAddress: number, state: boolean, next: NodeStyleCallback<WriteCoilResult>): void
  writeFC6(address: number, dataAddress: number, value: number, next: NodeStyleCallback<WriteRegisterResult>): void

  writeFC15(
    address: number,
    dataAddress: number,
    states: Array<boolean>,
    next: NodeStyleCallback<WriteMultipleResult>,
  ): void
  writeFC16(
    address: number,
    dataAddress: number,
    values: Array<number>,
    next: NodeStyleCallback<WriteMultipleResult>,
  ): void

  // Connection shorthand API
  connectRTUBuffered(options: SerialPortOptions, next?: Function): Promise<void>

  // Promise API
  setID(id: number): void
  getID(): number
  setTimeout(duration: number): void
  getTimeout(): number

  readCoils(dataAddress: number, length: number): Promise<ReadCoilResult>
  readDiscreteInputs(dataAddress: number, length: number): Promise<ReadCoilResult>
  readHoldingRegisters(dataAddress: number, length: number): Promise<ReadRegisterResult>
  readRegistersEnron(dataAddress: number, length: number): Promise<ReadRegisterResult>
  readInputRegisters(dataAddress: number, length: number): Promise<ReadRegisterResult>
  writeCoil(dataAddress: number, state: boolean): Promise<WriteCoilResult>
  writeCoils(dataAddress: number, states: Array<boolean>): Promise<WriteMultipleResult>
  writeRegister(dataAddress: number, value: number): Promise<WriteRegisterResult>
  writeRegisterEnron(dataAddress: number, value: number): Promise<WriteRegisterResult>
  writeRegisters(dataAddress: number, values: Array<number> | Buffer): Promise<WriteMultipleResult> // 16

  on(event: 'close', listener: () => unknown): this
  on(event: 'error', listener: (error: unknown) => unknown): this
  readDeviceIdentification(deviceIdCode: number, objectId: number): Promise<ReadDeviceIdentificationResult>
  reportServerID(deviceIdCode: number): Promise<ReportServerIDResult>

  isOpen: boolean
}

export interface NodeStyleCallback<T> {
  (err: NodeJS.ErrnoException, param: T): void
}

export interface ReadCoilResult {
  data: Array<boolean>
  buffer: Buffer
}

export interface ReadRegisterResult {
  data: Array<number>
  buffer: Buffer
}

export interface WriteCoilResult {
  address: number
  state: boolean
}

export interface WriteRegisterResult {
  address: number
  value: number
}

export interface WriteMultipleResult {
  address: number
  length: number
}

export interface ReadDeviceIdentificationResult {
  data: string[]
  conformityLevel: number
}

export interface ReportServerIDResult {
  serverId: number
  running: boolean
  additionalData: Buffer
}

export type SerialPortOptions = SerialConnectionParameters
