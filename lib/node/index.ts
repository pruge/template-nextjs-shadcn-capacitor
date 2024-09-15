import {ModbusMaster} from '../modbus'
import Button from './button'
import Device from './device'
import Encoder from './encoder'
import Output from './output'
import Sensor from './sensor'
import Switch2 from './switch2'
import Variable from './variable'

export class Node {
  _coilCount: number = 0
  _registerCount: number = 0
  _client: ModbusMaster
  LBIT = new Map<string, Device>()
  LWORD = new Map<string, Device>()

  constructor(client: ModbusMaster) {
    this._client = client
  }

  // ==== coil ====
  button(name: string): Button
  button(name: string, pin?: number): Node
  button(name: string, slave?: number, pin?: number): Node
  button(name: string, slave?: number, pin?: number): Node | Button {
    if (slave === undefined) {
      const device = this.LBIT.get(name)
      if (device == undefined) {
        throw new Error(`${name} is not found`)
      }
      return device as Button
    } else {
      const device = new Button(this._client, name, this._coilCount)
      this.LBIT.set(name, device)
      this._coilCount++
      return this
    }
  }

  // ==== coil ====
  switch2(name: string): Switch2
  switch2(name: string, pin?: number): Node
  switch2(name: string, slave?: number, pin?: number): Node
  switch2(name: string, slave?: number, pin?: number): Node | Switch2 {
    if (slave === undefined) {
      const device = this.LBIT.get(name)
      if (device == undefined) {
        throw new Error(`${name} is not found`)
      }
      return device as Switch2
    } else {
      const device = new Button(this._client, name, this._coilCount)
      this.LBIT.set(name, device)
      this._coilCount++
      return this
    }
  }

  // ==== coil ====
  sensor(name: string): Sensor
  sensor(name: string, pin?: number): Node
  sensor(name: string, slave?: number, pin?: number): Node
  sensor(name: string, slave?: number, pin?: number): Node | Sensor {
    if (slave === undefined) {
      const device = this.LBIT.get(name)
      if (device == undefined) {
        throw new Error(`${name} is not found`)
      }
      return device as Sensor
    } else {
      const device = new Sensor(this._client, name, this._coilCount)
      this.LBIT.set(name, device)
      this._coilCount++
      return this
    }
  }

  // ==== coil ====
  output(name: string): Output
  output(name: string, pin?: number): Node
  output(name: string, slave?: number, pin?: number): Node
  output(name: string, slave?: number, pin?: number): Node | Output {
    if (slave === undefined) {
      const device = this.LBIT.get(name)
      if (device == undefined) {
        throw new Error(`${name} is not found`)
      }
      return device as Output
    } else {
      const device = new Output(this._client, name, this._coilCount)
      this.LBIT.set(name, device)
      this._coilCount++
      return this
    }
  }

  // ==== register ====
  encoder(name: string): Encoder
  encoder(name: string, pin1: number, pin2: number): Node
  encoder(name: string, pin1?: number, pin2?: number): Node | Encoder {
    if (pin1 == undefined) {
      const device = this.LWORD.get(name)
      if (device == undefined) {
        throw new Error(`${name} is not found`)
      }
      return device as Encoder
    } else {
      const device = new Encoder(this._client, name, this._registerCount)
      this.LWORD.set(name, device)
      this._registerCount++
      return this
    }
  }

  // ==== register ====
  variable(name: string): Variable {
    const device = this.LWORD.get(name)
    if (device !== undefined) {
      return device as Variable
    } else {
      const device = new Variable(this._client, name, this._registerCount)
      this.LWORD.set(name, device)
      this._registerCount++
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-expect-error
      return this
    }
  }

  start(polling: number) {
    this._client.pollCoils(0, this._coilCount, polling)
    this._client.pollRegisters(0, this._registerCount, 'INT', polling)
  }
}

export function nodeInitialize(node: Node) {
  node
    .output('active led', 13)
    .button('button', 0, 0)
    .switch2('switch', 0, 1)
    .sensor('sensor', 0, 2)
    .output('bulb A', 0, 0)
    .output('run led', 22)
    .encoder('encoder', 2, 5)
    .variable('val')
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    .start(1000)
}

// export default node
