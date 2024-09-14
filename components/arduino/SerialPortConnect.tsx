'use client'

import useEffectOnce from '@/lib/useEffectOnce'
import ModbusRTU from '@/lib/modbus'

function SerialPortConnect() {
  useEffectOnce(() => {
    ;(async () => {
      // await SerialPortOpen()
    })()
  })

  return null
}

export default SerialPortConnect
