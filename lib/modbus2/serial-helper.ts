/* eslint-disable @typescript-eslint/ban-types */
import {Task} from './task'
import {Queue} from './queue'
import {ModbusResponseTimeout} from './errors'
import {Logger} from './logger'
import SerialPort from './SerialPort'
import {ModbusMasterOptions} from './master'
import $eventBus from '../eventbus'

export class SerialHelperFactory {
  /**
   * @param {SerialPort} serialPort
   * @param options
   * @returns {SerialHelper}
   */
  static create(serialPort: SerialPort, options: ModbusMasterOptions) {
    const queue = new Queue(options.queueTimeout)
    return new SerialHelper(serialPort, queue, options)
  }
}

export class SerialHelper {
  queue: Queue
  options: ModbusMasterOptions
  serialPort: SerialPort
  logger: Logger

  /**
   * @param {SerialPort} serialPort
   * @param {Queue<Task>} queue
   * @param options
   */
  constructor(serialPort: SerialPort, queue: Queue, options: ModbusMasterOptions) {
    /**
     * @type {Queue<Task>}
     * @private
     */
    this.queue = queue
    queue.setTaskHandler(this.handleTask.bind(this))

    /**
     * @private
     */
    this.options = options
    this.serialPort = serialPort
    this.logger = new Logger(options)

    this.bindToSerialPort()
  }

  /**
   *
   * @param {Buffer} buffer
   * @returns {Promise}
   */
  write(buffer: Buffer) {
    const task = new Task(buffer)
    this.queue.push(task)

    return task.promise
  }

  /**
   * @private
   */
  bindToSerialPort() {
    this.serialPort.on('open', () => {
      this.queue.start()
    })
    // this.queue.start()
  }

  /**
   *
   * @param {Task} task
   * @param {function} done
   * @private
   */
  async handleTask(task: Task, done: Function) {
    this.logger.info('write ' + task.payload.toString('hex'))
    this.serialPort.write(task.payload).catch((error) => {
      if (error) {
        task.reject(error)
      }
    })

    // set execution timeout for task
    setTimeout(() => {
      task.reject(new ModbusResponseTimeout(this.options.responseTimeout))
    }, this.options.responseTimeout)

    const onData = (data: Buffer) => {
      // $eventBus.trigger('state', typeof data)
      // $eventBus.trigger('data', data.toString('hex'))
      task.receiveData(data, (response: Buffer) => {
        this.logger.info('resp ' + response.toString('hex'))
        // $eventBus.trigger('error', response.toString('hex'))
        // $eventBus.trigger('state', 'get response')
        // $eventBus.trigger('data', response.toString('hex'))
        task.resolve(response)
      })
    }

    this.serialPort.on('data', onData)

    task.promise
      .catch(() => {})
      .finally(() => {
        this.serialPort.removeListener('data', onData)
        done()
      })
  }
}
