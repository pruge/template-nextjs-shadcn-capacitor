'use client'

import useModbus from '@/hooks/useModbus'
import $eventBus from '@/lib/eventbus'
import useEffectOnce from '@/lib/useEffectOnce'
import React, {use, useState} from 'react'

function SerialState() {
  const {isConnected} = useModbus()
  const [state, setState] = useState('')
  const [data, setData] = useState('')
  const [error, setError] = useState('')

  useEffectOnce(() => {
    $eventBus.on('state', (state) => {
      setState(JSON.stringify(state))
    })
    $eventBus.on('error', (error) => {
      setError(JSON.stringify(error))
    })
    $eventBus.on('data', (data) => {
      setData(JSON.stringify(data))
      // setData('a <br/> b c')
    })
  })

  return (
    <>
      <div className="text-3xl flex items-center gap-3">
        <span>SerialState :</span>
        <span>{isConnected ? 'connected' : 'not connected'}</span>
      </div>
      <div>state: {state}</div>
      <div>data: {data}</div>
      <div>error: {error}</div>
    </>
  )
}

export default SerialState
