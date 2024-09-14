import Device from './device'

class Variable extends Device {
  constructor(name: string, index: number) {
    super(name, index)
  }

  get value() {
    // return LWORD[this._index]
    return 0
  }

  set value(value: number) {
    // client?.writeRegister(this._index, value)
  }
}

export default Variable
