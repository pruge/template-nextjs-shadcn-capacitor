import Device from './device'

class Button extends Device {
  constructor(name: string, index: number) {
    super(name, index)
  }

  async click() {
    // await client?.writeCoil(this._index, true)
    // await client?.delay(200)
    // await client?.writeCoil(this._index, false)
  }
}

export default Button
