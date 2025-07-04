import React from 'react';
// import { useState, useEffect } from 'react';

import { Plus, Settings, Bell } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Image from 'next/image';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Sidebar, SidebarContent, useSidebar } from '@/components/ui/sidebar';

import useUserStore from '@/store/user';

// 侧边栏切换按钮组件
const SidebarToggleButton = () => {
  const { state, toggleSidebar } = useSidebar();
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleSidebar}
      title={state === 'expanded' ? '收起侧边栏' : '展开侧边栏'}
    >
      <Image
        src="/side-bar.svg"
        alt="切换侧边栏"
        width={20}
        height={20}
        className="text-gray-600"
      />
    </Button>
  );
};

const LeftSidebar: React.FC = (props) => {
  const t = useTranslations('HomePage');
  const { userInfo } = useUserStore();
  const jobs = [
    {
      id: 1,
      title: 'User Experience Designer',
      company: 'Begin',
      color: 'bg-teal-500',
      initials: 'B',
    },
    {
      id: 2,
      title: 'Senior UX Designer (Remote - US)',
      company: 'Jobgether',
      color: 'bg-purple-600',
      initials: 'K',
      active: true,
    },
    {
      id: 3,
      title: 'Internship, UX Design, Design Studio (Fall 2025)',
      company: 'Tesla',
      color: 'bg-red-500',
      initials: 'T',
    },
    {
      id: 4,
      title: 'UX/UI Design Lead',
      company: 'HCLTech',
      color: 'bg-blue-500',
      initials: 'H',
    },
    {
      id: 5,
      title: 'User Experience Designer',
      company: 'ATC',
      color: 'bg-black',
      initials: 'atc',
    },
  ];

  return (
    <Sidebar {...props}>
      <SidebarContent>
        {/* 侧边栏容器，折叠时透明背景 */}
        <div className={`h-screen flex flex-col bg-[#EBEBEBE5]`}>
          {/* Header */}
          <div className={`flex items-center justify-between mb-4 p-5`}>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
                <div className="grid grid-cols-2 gap-0.5">
                  <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                  <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                  <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                  <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                </div>
              </div>
              <span className="font-semibold text-lg">{t('appName')}</span>
            </div>
            <SidebarToggleButton />
          </div>

          {/* New Job 按钮 */}
          <div className={`overflow-hidden  opacity-100 max-h-24 px-5`}>
            <Button
              variant="outline"
              className="w-full p-4 bg-[#FFFFFF66] justify-center rounded-[12px] gap-2 text-gray-600"
            >
              <Plus className="w-4 h-4" />
              {t('addNewJob')}
            </Button>
          </div>

          {/* Coach Section */}
          <div className={`flex flex-col  overflow-hidden  max-h-[1000px] flex-1`}>
            <div className="p-3 flex flex-col h-[calc(100vh-190px)]">
              <div className="flex font-semibold flex-col gap-1 mb-3 pl-3">
                <h3 className="text-lg text-gray-900 pl-3">{t('coach')}</h3>
                <div className="text-[15px] text-gray-500 pl-3">{t('myJobs')}</div>
              </div>

              <div className="space-y-4 overflow-y-auto scrollbar-custom pr-2">
                {jobs.map((job) => (
                  <div
                    key={job.id}
                    className={`flex items-center gap-3 px-4 py-3 rounded-2xl cursor-pointer transition-colors ${
                      job.active ? 'bg-white shadow-sm' : 'bg-[#FFFFFF33] hover:bg-gray-50'
                    }`}
                  >
                    <div
                      className={`w-10 h-10 ${job.color} rounded-full flex items-center justify-center text-white text-sm font-medium`}
                    >
                      {job.initials}
                    </div>
                    <div className="flex-1 flex flex-col gap-1 min-w-0">
                      <div className="font-semibold text-gray-900 text-sm truncate">{job.title}</div>
                      <div className="text-sm font-medium text-gray-500">{job.company}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* User Profile */}
            <div className="mt-auto p-4 border-t border-gray-200">
              <div className="flex items-center gap-3">
                <Avatar className="w-8 h-8">
                  <AvatarImage src="/placeholder.svg?height=32&width=32" />
                  <AvatarFallback>AC</AvatarFallback>
                </Avatar>
                <span className="font-medium text-gray-900">
                  {userInfo?.user_metadata.first_name || userInfo?.user_metadata.full_name}
                </span>
                <div className="ml-auto flex gap-2">
                  <Bell className="w-4 h-4 text-gray-400" />
                  <Settings className="w-4 h-4 text-gray-400" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </SidebarContent>
    </Sidebar>
  );
};

export default LeftSidebar;
