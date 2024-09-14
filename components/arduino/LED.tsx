'use client'

import {cn} from '@/lib/utils'
import {useEffect, useState} from 'react'

function LED({name}: {name: string}) {
  const [state, setState] = useState(false)

  return (
    <div
      className={cn(
        'w-[200px] h-[200px] rounded-full text-black flex items-center justify-center',
        state ? 'bg-green-300' : 'bg-white',
      )}
    >
      {name}
    </div>
  )
}

export default LED
