import {ModbusMaster} from '../modbus'

class Device {
  _name: string
  _index: number
  _client: ModbusMaster
  constructor(client: ModbusMaster, name: string, index: number) {
    this._name = name
    this._index = index
    this._client = client
  }
}

export default Device
