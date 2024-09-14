import {Task} from './task'

export class Queue {
  taskHandler: (task: Task, done: () => void) => void
  queueTimeout: number
  queue: Task[]
  isActive: boolean = false

  /**
   * @template T
   * @param {number} timeout pause between queue tasks
   */
  constructor(timeout: number) {
    /** @potected */
    this.taskHandler = (task, done) => done()

    /** @private */
    this.queueTimeout = timeout

    /**
     * @protected
     * @type {T[]}
     */
    this.queue = []
  }

  /**
   * Set handler which will be called on each task
   * @param {function(task: T, done: function):void} handler
   */
  setTaskHandler(handler: (task: Task, done: () => void) => void) {
    this.taskHandler = handler
  }

  /**
   * @param {T} task
   */
  push(task: Task) {
    this.queue.push(task)
  }

  start() {
    this.isActive = true
    this.handle()
  }

  stop() {
    this.isActive = false
  }

  /**
   * @private
   */
  handle() {
    if (!this.isActive) {
      return
    }

    if (this.queue.length) {
      const task = this.queue.shift()!
      this.taskHandler(task, this.continueQueue.bind(this))
    } else {
      this.continueQueue()
    }
  }

  /**
   * @private
   */
  continueQueue() {
    // pause between calls
    setTimeout(this.handle.bind(this), this.queueTimeout)
  }
}
