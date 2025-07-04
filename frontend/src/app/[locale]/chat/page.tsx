'use client'

import { useEffect } from 'react'

import {SidebarProvider, useSidebar} from '@/components/ui/sidebar'

import LeftSidebar from './components/left-sidebar'
import MainContent from './components/main-content'
import RightSidebar from './components/right-sidebar'

// 边缘触发组件
const EdgeTrigger = () => {
  const { state, toggleSidebar } = useSidebar()
  
  useEffect(() => {
    let timeoutId: NodeJS.Timeout
    
    const handleMouseMove = (e: MouseEvent) => {
      // 只在侧边栏收起时监听
      if (state === 'expanded') return
      
      // 鼠标在左边缘 10px 范围内
      if (e.clientX <= 10) {
        // 清除之前的定时器
        if (timeoutId) clearTimeout(timeoutId)
        
        // 延迟一点点再触发，避免误触
        timeoutId = setTimeout(() => {
          toggleSidebar()
        }, 100)
      } else if (e.clientX > 50) {
        // 鼠标离开左边缘区域，清除定时器
        if (timeoutId) {
          clearTimeout(timeoutId)
        }
      }
    }
    
    // 添加全局鼠标移动监听
    document.addEventListener('mousemove', handleMouseMove)
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      if (timeoutId) clearTimeout(timeoutId)
    }
  }, [state, toggleSidebar])
  
  return null
}

export default function TallyAI() {
  return (
    <div className="flex h-screen bg-[linear-gradient(242.72deg,_#EF58581A_15.14%,_#5BF78C1A_52.08%,_#449EF91A_94.36%)]">
      <SidebarProvider
        style={
          {
            '--sidebar-width': '320px',
          } as React.CSSProperties
        }
      >
        <EdgeTrigger />
        <LeftSidebar />
        <MainContent />
        <RightSidebar />
      </SidebarProvider>
    </div>
  )
}
