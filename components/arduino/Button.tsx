'use client'

import useModbus from '@/hooks/useModbus'
import {Button} from '../ui/button'
// import {ButtonClick} from '@/actions/arduino'

function ArduinoButton() {
  const {client} = useModbus()

  const handleClick = async () => {
    // await ButtonClick()
    console.log('Button Click!')
    await client?.writeCoil(1, true)
    await client?.delay(300)
    await client?.writeCoil(1, false)
  }

  return (
    <Button className="w-[200px] h-[200px]" onClick={handleClick}>
      button
    </Button>
  )
}

export default ArduinoButton
