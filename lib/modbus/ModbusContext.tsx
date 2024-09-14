'use client'

import {createContext, useState} from 'react'
import useEffectOnce from '../useEffectOnce'
import {ModbusMaster} from '../modbus2'
import SerialPort from '../modbus2/SerialPort'
import $eventBus from '../eventbus'

type ModbusContextType = {
  client: ModbusMaster | null
  isConnected: boolean
  LBIT: number[]
  LWORD: number[]
}

export type MemoryType = 'COIL' | 'INPUT' | 'HOLDING' | 'INPUT_REGISTER'

export const ModbusContext = createContext<ModbusContextType | null>(null)

export default function ModbusContextProvider({children}: {children: React.ReactNode}) {
  const [client, setClient] = useState<ModbusMaster | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [LBIT, setLBIT] = useState([])
  const [LWORD, setLWORD] = useState([])

  useEffectOnce(() => {
    ;(async () => {
      // const serial = new SerialPort({baudRate: 57600, rts: true, dtr: true})
      const serial = new SerialPort({baudRate: 38400, rts: true, dtr: true})
      const client = new ModbusMaster(serial)

      await serial.open()
      setIsConnected(serial.isOpen)
      client.setID(1)
      setClient(client)

      // client.pollCoils(0, node.coilCount)
      // client.pollRegisters(0, node.registerCount)

      $eventBus.on('LBIT', (data) => {
        setLBIT(data)
      })
      $eventBus.on('LWORD', (data) => {
        setLWORD(data)
      })
    })()
  })

  return <ModbusContext.Provider value={{client, isConnected, LBIT, LWORD}}>{children}</ModbusContext.Provider>
}
