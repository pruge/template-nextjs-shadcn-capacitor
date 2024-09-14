'use client'

import useModbus from '@/hooks/useModbus'
import $eventBus from '@/lib/eventbus'
import useEffectOnce from '@/lib/useEffectOnce'
import {cn} from '@/lib/utils'
import {useState} from 'react'

function LED({name}: {name: string}) {
  const {client, node} = useModbus()
  const [state, setState] = useState(false)

  useEffectOnce(() => {
    const led = node?.output('active led')
    const handler = () => {
      setState(led?.isOn() ? true : false)
    }
    $eventBus.on('LBIT', handler)
    return () => {
      $eventBus.off('LBIT', handler)
    }
  })

  const handleClick = async () => {
    console.log('Led Click!')
    // const LBIT = await client?.readCoils(0, 6)
    // setState(LBIT?.[0] ? true : false)
    client?.pollCoils(0, 6)
  }

  return (
    <div
      className={cn(
        'w-[200px] h-[200px] rounded-full text-black flex items-center justify-center',
        state ? 'bg-green-300' : 'bg-white',
      )}
      onClick={handleClick}
    >
      {name}
    </div>
  )
}

export default LED
