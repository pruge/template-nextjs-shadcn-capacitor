import {Serial, SerialConnectionParameters, SerialReadCallback} from '@adeunis/capacitor-serial'
import events from 'events'
import $eventBus from '../eventbus'

const EventEmitter = events.EventEmitter || events

class SerialPort extends EventEmitter {
  options: SerialConnectionParameters
  _connected: boolean = false

  constructor(options: SerialConnectionParameters) {
    super()
    this.options = options
  }

  async open() {
    return Serial.requestSerialPermissions()
      .then((permissionResponse) => {
        if (!permissionResponse.granted) {
          return Promise.reject('Permission refused')
        }
        return Promise.resolve()
      })
      .then(() => {
        Serial.openConnection(this.options)
      })
      .then(() => {
        console.info('Serial connection opened')
        this._connected = true
        this.registerReadCallback()
        this.emit('open')
      })
      .catch((error) => {
        console.error(error)
        this._connected = false
      })
  }

  async close() {
    return Serial.closeConnection()
  }

  /**
   * Check if port is open.
   *
   * @returns {boolean}
   */
  get isOpen() {
    return this._connected
  }

  async write(data: Buffer) {
    // throw new Error(JSON.stringify(data))
    const hexData = {data: data.toString('hex')}
    await Serial.writeHexadecimal(hexData)
    // const resp = await Serial.read({readRaw: false})
    // // console.log('Response:', resp.data)
    // throw new Error(JSON.stringify(resp))
    // this.emit('data', resp.data)
    // // TODO data: string => Buffer
    // return resp.data
  }

  registerReadCallback() {
    $eventBus.trigger('state', JSON.stringify('register read callback'))
    Serial.registerReadRawCallback((message, error) => {
      if (message) {
        this.emit('data', Buffer.from(message.data, 'base64'))
        // $eventBus.trigger('data', Buffer.from(message.data, 'base64'))
        // $eventBus.trigger('data', Buffer.from(message.data, 'base64'))
      }
      if (error) {
        this.emit('error', error)
        $eventBus.trigger('error', JSON.stringify(message))
      }
    })
  }
}

export default SerialPort
