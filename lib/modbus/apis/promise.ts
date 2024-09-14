'use strict'

import {SerialMessage} from '@adeunis/capacitor-serial'
import ModbusRTU from '..'

/**
 * Copyright (c) 2015, Yaacov Zamir <kobi.zamir@gmail.com>
 *
 * Permission to use, copy, modify, and/or distribute this software for any
 * purpose with or without fee is hereby granted, provided that the above
 * copyright notice and this permission notice appear in all copies.
 *
 * THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
 * WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
 * MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
 * ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
 * WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
 * ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF
 * OR IN CONNECTION WITH THE USE OR PERFORMANCE OF  THIS SOFTWARE.
 */

/**
 * Take a modbus serial function and convert it to use promises.
 *
 * @param {Function} f the function to convert
 * @return a function that calls function "f" and return a promise.
 * @private
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const _convert = function (f: any) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const converted = function (...args: any[]) {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const client = this
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    const id = this._unitID

    // The last argument might be the callback (next)
    const next = args[args.length - 1]

    // Determine if the last argument is actually a callback
    const hasCallback = typeof next === 'function'

    if (hasCallback) {
      // If there is a callback, call the function with the appropriate arguments
      if (args.length === 1) {
        // This case is used for client close method
        f.bind(client)(next)
      } else {
        // This case is used for client writeFC methods
        f.bind(client)(id, ...args)
      }
    } else {
      // Otherwise, use a promise
      return new Promise(function (resolve, reject) {
        function cb(err: unknown, data: SerialMessage) {
          if (err) {
            reject(err)
          } else {
            resolve(data)
          }
        }

        if (args.length === 0) {
          // This case is used for client close method
          f.bind(client)(cb)
        } else {
          // This case is used for client writeFC methods
          f.bind(client)(id, ...args, cb)
        }
      })
    }
  }

  return converted
}

/**
 * Adds promise API to a Modbus object.
 *
 * @param {ModbusRTU} Modbus the ModbusRTU object.
 */
const addPromiseAPI = function (Modbus: ModbusRTU) {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-expect-error
  const mp = Modbus.prototype

  // set/get unitID
  mp.setID = function (id: number) {
    this._unitID = Number(id)
  }
  mp.getID = function () {
    return this._unitID
  }

  // set/get timeout
  mp.setTimeout = function (timeout: number) {
    this._timeout = timeout
  }
  mp.getTimeout = function () {
    return this._timeout
  }

  // convert functions to return promises
  mp.close = _convert(mp.close)
  mp.readCoils = _convert(mp.writeFC1)
  mp.readHoldingRegisters = _convert(mp.writeFC3)
  mp.writeCoil = _convert(mp.writeFC5)
  mp.writeRegister = _convert(mp.writeFC6)
}

/**
 * Promise API Modbus library.
 *
 * @type {addPromiseAPI}
 */
export default addPromiseAPI
