import {ModbusMaster} from '../modbus'
import Device from './device'

class Button extends Device {
  constructor(client: ModbusMaster, name: string, index: number) {
    super(client, name, index)
  }

  async click() {
    try {
      await this._client.writeCoil(this._index, true)
      await this._client.delay(200)
      await this._client.writeCoil(this._index, false)
    } catch (error) {}
  }
}

export default Button
