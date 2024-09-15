import Button from '@/components/arduino/Button'
import LED from '@/components/arduino/LED'
import SerialState from '@/components/arduino/SerialState'
import Variable from '@/components/arduino/Variable'
// import SerialPortConnect from '@/components/arduino/SerialPortConnect'

import React from 'react'

function page() {
  return (
    <div className="flex flex-col w-full">
      <SerialState />

      <div className="grid grid-cols-2 gap-3 space-y-3">
        <div className="flex flex-col w-full justify-center items-center">
          <Button />
        </div>
        <div className="flex flex-col w-full justify-center items-center">
          <LED name={'active led'} />
        </div>
        <div className="flex flex-col w-full justify-center items-center">
          <Variable name={'val'} />
        </div>
      </div>
    </div>
  )
}

export default page
