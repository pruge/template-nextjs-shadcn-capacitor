import Device from './device'

class Sensor extends Device {
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

export default Sensor
