import React, {ReactNode} from 'react'
import {createStore, Provider} from 'jotai'
const store = createStore()

export type Store = typeof store

function JotaiProvider({children}: {children: ReactNode}) {
  return <Provider store={store}>{children}</Provider>
}

export default JotaiProvider
