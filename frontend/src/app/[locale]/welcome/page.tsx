'use client';

import { useState } from 'react';
import { Tabs, ConfigProvider } from 'antd';
import type { TabsProps } from 'antd';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Image from 'next/image';
import IconFiles from '@/assets/images/icon_files.png';
import IconLink from '@/assets/images/icon_link.png';

export default function WelcomePage() {
  const [linkedinUrl, setLinkedinUrl] = useState('https://linkedin.com/in/');

  const items: TabsProps['items'] = [
    {
      key: 'resume',
      label: 'Resume File',
      children: (
        <div className="flex flex-col items-center space-y-6">
          <Image src={IconFiles} alt="icon_files" width={128} height={128} />
          <p className="text-sm text-gray-500">Drag and drop your resume or click to browse</p>
          <Button className="w-full" variant="outline">
            Upload Resume
          </Button>
        </div>
      ),
    },
    {
      key: 'linkedin',
      label: 'LinkedIn Import',
      children: (
        <div className="flex flex-col items-center space-y-6">
          <Image src={IconLink} alt="icon_files" width={128} height={128} />
          <Input
            className="bg-gray-50 text-center"
            value={linkedinUrl}
            onChange={(e) => setLinkedinUrl(e.target.value)}
          />
        </div>
      ),
    },
  ];

  return (
    <div className="relative bg-pink-100 min-h-screen w-full flex flex-col items-center justify-center p-4">
      {/* todo 背景 & 上传简历或者linkedin */}
      <div className="max-w-md w-full flex flex-col items-center">
        <div className="text-[20px] text-[rgba(0,0,0,0.8)] flex flex-col gap-6">
          <p className="font-bold">Welcome</p>
          <p>I&apos;m Tally. Let&apos;s find your dream job together.</p>
          <p className="font-bold">Start by sharing your LinkedIn or resume.</p>
        </div>

        <div className="rounded-3xl bg-white mt-13 p-9 w-full shadow-sm">
          <ConfigProvider
            theme={{
              components: {
                Tabs: {
                  itemColor: 'rgba(0,0,0,0.3)',
                  titleFontSize: 22,
                  itemHoverColor: 'black',
                  itemActiveColor: 'black',
                  itemSelectedColor: 'black',
                  inkBarColor: 'black',
                },
              },
            }}
          >
            <style jsx global>{`
              .ant-tabs-top > .ant-tabs-nav::before {
                border-bottom: none !important;
              }
              .ant-tabs-ink-bar {
                height: 4px !important;
                border-radius: 4px !important;
              }
            `}</style>
            <Tabs
              defaultActiveKey="resume"
              indicator={{ size: 40 }}
              className="font-semibold !border-none"
              items={items}
              centered
            />
          </ConfigProvider>

          <div className="flex justify-center mt-4">
            <Button>CONTINUE</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
