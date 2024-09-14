'use strict'
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

const MIN_MODBUSRTU_FRAMESZ = 5

import ModbusRTU from '..'
import {SerialPortOptions} from '../ModbusRTU'
import SerialPort from '../ports/SerialPort'

/**
 * Adds connection shorthand API to a Modbus objext
 *
 * @param {ModbusRTU} Modbus the ModbusRTU object.
 */
const addConnctionAPI = function (Modbus: ModbusRTU) {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-expect-error
  const mp = Modbus.prototype

  // const open = function (obj, next) {
  //   /* the function check for a callback
  //    * if we have a callback, use it
  //    * o/w build a promise.
  //    */
  //   if (next) {
  //     // if we have a callback, use the callback
  //     obj.open(next)
  //   } else {
  //     // o/w use  a promise
  //     return new Promise(function (resolve, reject) {
  //       function cb(err) {
  //         if (err) {
  //           reject(err)
  //         } else {
  //           resolve(true)
  //         }
  //       }

  //       obj.open(cb)
  //     })
  //   }
  // }

  /**
   * Connect to a communication port, using Bufferd Serial port.
   *
   * @param {string} path the path to the Serial Port - required.
   * @param {Object} options - the serial port options - optional.
   * @param {Function} next the function to call next.
   */
  mp.connectRTUBuffered = async function (options: SerialPortOptions, next: (isOpen: boolean) => void) {
    // if (options) {
    //   this._enron = options.enron
    //   this._enronTables = options.enronTables
    // }

    // // check if we have options
    // if (typeof next === 'undefined' && typeof options === 'function') {
    //   next = options
    //   options = {}
    // }

    // // check if we have options
    if (typeof options === 'undefined') {
      options = {}
    }

    // create the SerialPort
    // const SerialPort = require('../ports/SerialPort')
    this._port = new SerialPort(options)

    // set vmin to smallest modbus packet size
    // options.platformOptions = {vmin: MIN_MODBUSRTU_FRAMESZ, vtime: 0}

    // open and call next
    return this.open(next)
  }
}

/**
 * Connection API Modbus.
 *
 * @type {addConnctionAPI}
 */
export default addConnctionAPI
