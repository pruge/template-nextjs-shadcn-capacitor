'use client'

import {ModbusContext} from '@/lib/modbus/ModbusContext'
import React, {useContext} from 'react'

function useModbus() {
  const context = useContext(ModbusContext)

  if (!context) {
    throw new Error('useModbus must be used within a ModbusContextProvider')
  }

  return context
}

export default useModbus
