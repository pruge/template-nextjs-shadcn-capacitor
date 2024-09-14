'use client'
import React, {useEffect, useState} from 'react'
import hexToArrayBuffer from 'hex-to-array-buffer'
import {Serial} from '@adeunis/capacitor-serial'
import {Button} from './ui/button'

function SerialTest() {
  const [list, setList] = useState('')
  const [some, setSome] = useState('')
  const [serialOptions, setSerialOptions] = useState('')
  const [state, setState] = useState('')

  useEffect(() => {
    ;(async () => {
      // const list = await Serial.devices()
      // setList(JSON.stringify(list, null, 2))

      // const deviceId = list.data?.devices[0].device.deviceId
      // const portNum = list.data?.devices[0].port

      // try {
      //   const options: SerialOptions = {
      //     baudRate: 57600,
      //     deviceId,
      //     portNum,
      //   }
      //   setSerialOptions(JSON.stringify(options, null, 2))
      //   const some = await Serial.open(options)
      //   setSome(JSON.stringify(some, null, 2))
      //   setState('connected')
      // } catch (error) {
      //   setState('error')
      // }

      Serial.requestSerialPermissions()
        .then((permissionResponse) => {
          if (!permissionResponse.granted) {
            setState('fail')
            return Promise.reject('Permission refused')
          }
          return Promise.resolve()
        })
        .then(() => {
          Serial.openConnection({baudRate: 57600})
        })
        .then(() => {
          setState('connected')
          console.info('Serial connection opend')
        })
        .catch((error) => {
          // setState('error')
          console.error(error)
        })
    })()
  }, [])
  const btnClick = async () => {
    setList('try button click')
    // Serial.write({data: 'hello'})
    // const buffer = hexToArrayBuffer('01010005FF00FB6D')
    // console.log(buffer)
    // setState(JSON.stringify(buffer))

    Serial.writeHexadecimal({data: '01050001ff00ddfa'})
    await delay(300)
    Serial.writeHexadecimal({data: '0105000100009c0a'})
    //   .then(() => {
    //     setList((prev) => prev + ' first success')
    //     return new Promise((resolve) =>
    //       setTimeout(() => {
    //         Serial.writeHexadecimal({data: '0101000500000B2C'})
    //         resolve(true)
    //       }, 200),
    //     )
    //   })
    //   .catch((error) => {
    //     // console.error(error)
    //     setSome(JSON.stringify(error, null, 2))
    //   })
  }
  return (
    <div className="p-6">
      <h1 className="text-5xl">Serial Tests 1</h1>
      <p className="py-3">{list}</p>
      <p className="py-3">{serialOptions}</p>
      <p className="py-3">{some}</p>
      <p className="py-3">{state}</p>
      <div className="py-3">
        <Button className="p-6" variant={'secondary'} onClick={btnClick}>
          button
        </Button>
      </div>
    </div>
  )
}

export default SerialTest

async function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
