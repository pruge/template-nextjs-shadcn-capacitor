import ThemeSwitcher from '@/components/ThemeSwitcher'
import React from 'react'

function Layout({children}: {children: React.ReactNode}) {
  return (
    <div className="flex flex-col min-h-screen mx-auto bg-background max-h-screen ">
      <nav className="flex justify-between items-center border-b h-[60px] px-4 py-2">
        <h1 className="text-4xl font-bold">Serial Test</h1>
        <div className="flex gap-4 items-center ">
          <ThemeSwitcher />
        </div>
      </nav>
      <main className="flex w-full flex-grow">{children}</main>
    </div>
  )
}

export default Layout
