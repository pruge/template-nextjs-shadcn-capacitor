'use client'

import useModbus from '@/hooks/useModbus'
import {Button} from '../ui/button'

function ArduinoButton() {
  const {client, node} = useModbus()

  const handleClick = async () => {
    console.log('Button Click!')
    const btn = node?.button('button')
    await btn?.click()
  }

  return (
    <Button className="w-32 h-32" onClick={handleClick}>
      button
    </Button>
  )
}

export default ArduinoButton
