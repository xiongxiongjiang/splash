'use client';

import { PanelLeft, PanelLeftClose } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { SidebarProvider, useSidebar } from '@/components/ui/sidebar';

import LeftSidebar from './components/left-sidebar';
import MainContent from './components/main-content';
import RightSidebar from './components/right-sidebar';

export default function TallyAI() {
  // 自定义切换按钮组件(SidebarTrigger)
  const SidebarToggleButton = () => {
    const { state, toggleSidebar } = useSidebar();
    return (
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleSidebar}
        title={state === 'expanded' ? '收起侧边栏' : '展开侧边栏'}
      >
        {state === 'expanded' ? (
          <PanelLeftClose className=" text-gray-600" />
        ) : (
          <PanelLeft className=" text-gray-600" />
        )}
      </Button>
    );
  };
  return (
    <div className="flex h-screen bg-[linear-gradient(242.72deg,_#EF58581A_15.14%,_#5BF78C1A_52.08%,_#449EF91A_94.36%)]">
      <SidebarProvider
        style={
          {
            '--sidebar-width': '320px',
          } as React.CSSProperties
        }
      >
        <LeftSidebar />
        <SidebarToggleButton />
        <MainContent />
        <RightSidebar />
      </SidebarProvider>
    </div>
  );
}
