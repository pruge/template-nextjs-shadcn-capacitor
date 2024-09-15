'use client'

import useModbus from '@/hooks/useModbus'
import $eventBus from '@/lib/eventbus'
import {cn} from '@/lib/utils'
import {useEffect, useRef, useState} from 'react'

function ArduinoVariable({name}: {name: string}) {
  const {client, node} = useModbus()
  const [value, setValue] = useState<number>()
  const count = useRef(0)

  useEffect(() => {
    const variable = node?.variable(name)
    const handler = () => {
      setValue(variable?.value)
    }
    $eventBus.on('LWORD', handler)
    return () => {
      $eventBus.off('LWORD', handler)
    }
  }, [node, name])

  return (
    <div className={'w-32 h-32 rounded-full  flex items-center justify-center'}>
      {name} : {value}
    </div>
  )
}

export default ArduinoVariable
