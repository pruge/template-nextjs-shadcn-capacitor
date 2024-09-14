'use client'

import {createContext, useState} from 'react'
import useEffectOnce from '../useEffectOnce'
import {ModbusMaster} from '../modbus'
import SerialPort from '../modbus/SerialPort'
import $eventBus from '../eventbus'
import {Node, nodeInitialize} from '../node'

type ModbusContextType = {
  client: ModbusMaster | null
  isConnected: boolean
  node: Node | null
}

export type MemoryType = 'COIL' | 'INPUT' | 'HOLDING' | 'INPUT_REGISTER'

export const ModbusContext = createContext<ModbusContextType | null>(null)

export default function ModbusContextProvider({children}: {children: React.ReactNode}) {
  const [client, setClient] = useState<ModbusMaster | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [node, setNode] = useState<Node | null>(null)

  useEffectOnce(() => {
    ;(async () => {
      // modbus
      const serial = new SerialPort({baudRate: 38400, rts: true, dtr: true})
      const client = new ModbusMaster(serial)

      await serial.open()
      setIsConnected(serial.isOpen)
      client.setID(1)
      setClient(client)

      // node
      const _node = new Node(client)
      nodeInitialize(_node)
      setNode(_node)

      // client.pollCoils(0, node.coilCount)
      // client.pollRegisters(0, node.registerCount)

      // $eventBus.on('LBIT', (data) => {
      //   setLBIT(data)
      // })
      // $eventBus.on('LWORD', (data) => {
      //   setLWORD(data)
      // })
    })()
  })

  return <ModbusContext.Provider value={{client, isConnected, node}}>{children}</ModbusContext.Provider>
}
