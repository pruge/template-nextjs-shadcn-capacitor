import Button from '@/components/arduino/Button'
import LED from '@/components/arduino/LED'
import SerialState from '@/components/arduino/SerialState'
// import SerialPortConnect from '@/components/arduino/SerialPortConnect'

import React from 'react'

function page() {
  return (
    <div className="flex flex-col w-full">
      <SerialState />

      <div className="flex w-full justify-between">
        <div className="flex flex-col w-full  h-[300px] justify-center items-center">
          <Button />
        </div>
        <div className="flex flex-col w-full  h-[300px] justify-center items-center">
          <LED name={'active led'} />
        </div>
      </div>
    </div>
  )
}

export default page
