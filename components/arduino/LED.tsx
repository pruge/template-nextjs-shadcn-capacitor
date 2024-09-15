'use client'

import useModbus from '@/hooks/useModbus'
import $eventBus from '@/lib/eventbus'
import {cn} from '@/lib/utils'
import {useEffect, useRef, useState} from 'react'

function LED({name}: {name: string}) {
  const {client, node} = useModbus()
  const [state, setState] = useState(false)
  const count = useRef(0)

  useEffect(() => {
    const led = node?.output(name)
    const handler = () => {
      setState(led?.isOn() ? true : false)
    }
    $eventBus.on('LBIT', handler)
    return () => {
      $eventBus.off('LBIT', handler)
    }
  }, [node, name])

  return (
    <div
      className={cn(
        'w-32 h-32 rounded-full text-black flex items-center justify-center',
        state ? 'bg-green-300' : 'bg-white',
      )}
    >
      {name}
    </div>
  )
}

export default LED
