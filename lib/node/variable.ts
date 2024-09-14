import {getDefaultStore} from 'jotai'
import {ModbusMaster} from '../modbus'
import Device from './device'
import {LWORD_ATOM} from '@/atom/modbus'
class Variable extends Device {
  constructor(client: ModbusMaster, name: string, index: number) {
    super(client, name, index)
  }

  get value() {
    const store = getDefaultStore()
    const LWORD = store.get(LWORD_ATOM)
    return LWORD[this._index]
  }

  set value(value: number) {
    try {
      this._client.writeRegister(this._index, value)
    } catch (error) {}
  }
}

export default Variable
