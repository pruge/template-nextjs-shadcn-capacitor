import {getDefaultStore} from 'jotai'
import {ModbusMaster} from '../modbus'
import Device from './device'
import {LBIT_ATOM} from '@/atom/modbus'

class Output extends Device {
  constructor(client: ModbusMaster, name: string, index: number) {
    super(client, name, index)
  }

  isOn(): boolean {
    const store = getDefaultStore()
    const LBIT = store.get(LBIT_ATOM)
    return LBIT[this._index] === 1
  }

  isOff(): boolean {
    const store = getDefaultStore()
    const LBIT = store.get(LBIT_ATOM)
    return LBIT[this._index] === 0
  }
}

export default Output
