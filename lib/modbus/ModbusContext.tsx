'use client'

import {createContext, useState} from 'react'
import useEffectOnce from '../useEffectOnce'
import {ModbusMaster} from '../modbus2'
import SerialPort from '../modbus2/SerialPort'

type ModbusContextType = {
  client: ModbusMaster | null
  isConnected: boolean
  message: string
}

export const ModbusContext = createContext<ModbusContextType | null>(null)

export default function ModbusContextProvider({children}: {children: React.ReactNode}) {
  const [client, setClient] = useState<ModbusMaster | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [message, setMessage] = useState('')

  useEffectOnce(() => {
    ;(async () => {
      const serial = new SerialPort({baudRate: 57600 /* , rts: true, dtr: true */})
      const client = new ModbusMaster(serial)

      await serial.open()
      setIsConnected(serial.isOpen)
      client.setID(1)
      setClient(client)
    })()
  })

  return <ModbusContext.Provider value={{client, isConnected, message}}>{children}</ModbusContext.Provider>
}
