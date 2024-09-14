'use client'

import useModbus from '@/hooks/useModbus'
import $eventBus from '@/lib/eventbus'
import useEffectOnce from '@/lib/useEffectOnce'
import {cn} from '@/lib/utils'
import {useEffect, useState} from 'react'

function LED({name}: {name: string}) {
  const {client, LBIT} = useModbus()
  const [state, setState] = useState(false)

  // useEffectOnce(() => {
  //   // client?.pollCoils(0, 6, 500)
  //   $eventBus.on('LBIT', (LBIT) => {
  //     setState(LBIT?.[0] ? true : false)
  //   })
  // })

  useEffect(() => {
    // const led = node.output('active led')
    // setState(led.isOn() ? true : false)

    setState(LBIT?.[0] ? true : false)
  }, [LBIT])

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
