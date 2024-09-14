import Worker from '../worker'

export default function addWorkerAPI(Modbus) {
  const mp = Modbus.prototype

  mp.setWorkerOptions = function (options) {
    if (this._worker) {
      this._worker.setOptions(options)
    } else {
      this._worker = new Worker(this, options)
    }
  }

  mp.send = function (request) {
    if (!this._worker) {
      this._worker = new Worker(this)
    }

    return this._worker.send(request)
  }

  mp.poll = function (options) {
    if (!this._worker) {
      this._worker = new Worker(this)
    }

    return this._worker.poll(options)
  }
}
