'use client'

import useModbus from '@/hooks/useModbus'
import $eventBus from '@/lib/eventbus'
import {useEffect, useState} from 'react'
import {Button} from '../ui/button'
import {set} from 'date-fns'

function ArduinoVariable({name}: {name: string}) {
  const {node} = useModbus()
  const [value, setValue] = useState<number>()

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
    <div className={'w-32 h-32 rounded-full flex flex-col items-center justify-center'}>
      <div className="mb-3">
        {name} : {value}
      </div>
      <Button
        onClick={() => {
          console.log('click')
          const variable = node?.variable(name)
          if (!variable) return

          variable.value = getRandomInt()
          setValue(variable.value)
        }}
      >
        {value}
      </Button>
    </div>
  )
}

export default ArduinoVariable

function getRandomInt(max: number = 100) {
  return Math.floor(Math.random() * max) - 50
}
