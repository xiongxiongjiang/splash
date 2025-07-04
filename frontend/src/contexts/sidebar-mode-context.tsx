'use client'

import { createContext, useContext, useState, ReactNode } from 'react'

// 侧边栏模式类型
export type SidebarMode = 'floating' | 'fixed'

// 侧边栏模式上下文
const SidebarModeContext = createContext<{
  mode: SidebarMode
  setMode: (mode: SidebarMode) => void
}>({ mode: 'floating', setMode: () => {} })

export const useSidebarMode = () => useContext(SidebarModeContext)

export const SidebarModeProvider = ({ children }: { children: ReactNode }) => {
  const [sidebarMode, setSidebarMode] = useState<SidebarMode>('floating')

  return (
    <SidebarModeContext.Provider value={{ mode: sidebarMode, setMode: setSidebarMode }}>
      {children}
    </SidebarModeContext.Provider>
  )
}
