'use client'

import {useTheme} from 'next-themes'
import React, {useEffect, useState} from 'react'
import {Tabs, TabsList, TabsTrigger} from './ui/tabs'
import {DesktopIcon, MoonIcon, SunIcon} from '@radix-ui/react-icons'

function ThemeSwitcher() {
  const {theme, setTheme} = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  return (
    <Tabs defaultValue={theme}>
      <TabsList className="border">
        <TabsTrigger value="light" onClick={() => setTheme('light')}>
          <SunIcon className="w-4 h-4" />
        </TabsTrigger>
        <TabsTrigger value="dark" onClick={() => setTheme('dark')}>
          <MoonIcon className="w-4 h-4 rotate-90 transition-all dark:rotate-0" />
        </TabsTrigger>
        <TabsTrigger value="system" onClick={() => setTheme('system')}>
          <DesktopIcon className="w-4 h-4" />
        </TabsTrigger>
      </TabsList>
    </Tabs>
  )
}

export default ThemeSwitcher
