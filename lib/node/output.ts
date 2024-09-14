import Device from './device'

class Output extends Device {
  constructor(name: string, index: number) {
    super(name, index)
  }

  isOn(): boolean {
    return true
  }

  isOff(): boolean {
    return false
  }
}

export default Output
