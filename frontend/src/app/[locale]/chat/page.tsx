'use client'

import {useEffect, useState, createContext, useContext, useMemo} from 'react'

import {SidebarProvider, useSidebar} from '@/components/ui/sidebar'

import LeftSidebar from './components/left-sidebar'
import MainContent from './components/main-content'
import RightSidebar from './components/right-sidebar'

// 侧边栏模式类型
type SidebarMode = 'floating' | 'fixed'

// 侧边栏模式上下文
const SidebarModeContext = createContext<{
  mode: SidebarMode
  setMode: (mode: SidebarMode) => void
}>({mode: 'floating', setMode: () => {}})

export const useSidebarMode = () => useContext(SidebarModeContext)

// 悬浮模式边缘触发组件
const FloatingModeTrigger = () => {
  const {state, toggleSidebar} = useSidebar()
  const {mode} = useSidebarMode()

  useEffect(() => {
    // 只在悬浮模式下工作
    if (mode !== 'floating') return

    let showTimeoutId: NodeJS.Timeout
    let hideTimeoutId: NodeJS.Timeout

    const handleMouseMove = (e: MouseEvent) => {
      // 鼠标在左边缘 15px 范围内
      if (e.clientX <= 15) {
        // 清除隐藏定时器
        // if (hideTimeoutId) clearTimeout(hideTimeoutId)

        // 如果侧边栏未展开，则显示
        if (state === 'collapsed') {
          if (showTimeoutId) clearTimeout(showTimeoutId)
          showTimeoutId = setTimeout(() => {
            toggleSidebar()
          }, 100)
        }
      } else if (e.clientX > 320) {
        // 鼠标离开侧边栏区域（320px是侧边栏宽度）
        if (showTimeoutId) clearTimeout(showTimeoutId)

        // 如果侧边栏已展开，则隐藏
        if (state === 'expanded') {
          // if (hideTimeoutId) clearTimeout(hideTimeoutId)
          // hideTimeoutId = setTimeout(() => {
          //   toggleSidebar()
          // }, 300) // 稍长的延迟，避免误触
          toggleSidebar()
        }
      }
    }

    // 添加全局鼠标移动监听
    document.addEventListener('mousemove', handleMouseMove)

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      if (showTimeoutId) clearTimeout(showTimeoutId)
      // if (hideTimeoutId) clearTimeout(hideTimeoutId)
    }
  }, [state, toggleSidebar, mode])

  return null
}

// 固定模式控制组件
const FixedModeController = () => {
  const {state, toggleSidebar} = useSidebar()
  const {mode} = useSidebarMode()

  useEffect(() => {
    // 在固定模式下，确保侧边栏始终展开
    if (mode === 'fixed' && state === 'collapsed') {
      toggleSidebar()
    }
  }, [mode, state, toggleSidebar])

  useEffect(() => {
    // 在固定模式下，确保侧边栏始终展开
    if (mode === 'floating') {
      toggleSidebar()
    }
  }, [mode])

  return null
}

const MainContentWrapper = () => {
  const {state: sidebarState} = useSidebar()
  const {mode: sidebarMode} = useSidebarMode()

  const mainContentPadding = useMemo(() => {
    if (sidebarMode === 'fixed' && sidebarState === 'expanded') {
      return 'calc(var(--sidebar-width) + 16px)' // Sidebar width + some gap
    }
    return '0px'
  }, [sidebarMode, sidebarState])

  return (
    <>
      <MainContent style={{paddingLeft: mainContentPadding}} />
      <RightSidebar />
    </>
  )
}

export default function TallyAI() {
  const [sidebarMode, setSidebarMode] = useState<SidebarMode>('floating')

  return (
    <SidebarModeContext.Provider value={{mode: sidebarMode, setMode: setSidebarMode}}>
      <div className="flex h-screen bg-[linear-gradient(242.72deg,_#EF58581A_15.14%,_#5BF78C1A_52.08%,_#449EF91A_94.36%)]">
        <SidebarProvider
          style={
            {
              '--sidebar-width': '320px',
            } as React.CSSProperties
          }
        >
          <FloatingModeTrigger />
          <FixedModeController />
          <LeftSidebar collapsible={sidebarMode === 'floating' ? 'offcanvas' : 'none'} />
          <MainContentWrapper />
        </SidebarProvider>
      </div>
    </SidebarModeContext.Provider>
  )
}
