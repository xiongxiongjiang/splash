'use client';

import { useState } from 'react';

import { Tabs, ConfigProvider, Upload, message, Button as AntButton } from 'antd';
import { Upload as UploadIcon } from 'lucide-react';
import Image from 'next/image';

import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

import IconFiles from '@/assets/images/icon_files.png';
import IconLink from '@/assets/images/icon_link.png';

import type { TabsProps, UploadProps } from 'antd';

export default function WelcomePage() {
  const [linkedinUrl, setLinkedinUrl] = useState('');

  const uploadProps: UploadProps = {
    name: 'file',
    accept: '.pdf,.jpg',
    maxCount: 1,
    action: 'https://660d2bd96ddfa2943b33731c.mockapi.io/api/upload',
    headers: {
      authorization: 'authorization-text',
    },
    onChange(info) {
      if (info.file.status !== 'uploading') {
        console.log(info.file, info.fileList);
      }
      if (info.file.status === 'done') {
        message.success(`${info.file.name} 文件上传成功`);
      } else if (info.file.status === 'error') {
        message.error(`${info.file.name} 文件上传失败。`);
      }
    },
  };

  const items: TabsProps['items'] = [
    {
      key: 'resume',
      label: 'Résumé File',
      children: (
        <div className="flex flex-col items-center space-y-6">
          <Image src={IconFiles} alt="icon_files" width={128} height={128} />
          <div className="w-full flex justify-center py-6 rounded-2xl bg-[rgba(235,235,235,0.5)]">
            <Upload {...uploadProps}>
              <Button variant="outline" className="bg-transparent">
                <UploadIcon />
                Upload resume
              </Button>
            </Upload>
          </div>
        </div>
      ),
    },
    {
      key: 'linkedin',
      label: 'LinkedIn Import',
      children: (
        <div className="flex flex-col items-center space-y-6">
          <Image src={IconLink} alt="icon_files" width={128} height={128} />
          <div className="w-full flex justify-center py-6 rounded-2xl bg-[rgba(235,235,235,0.5)]">
            <Input
              placeholder="https://linkedin.com/in/"
              className="!text-semibold !text-base border-0
                          focus:outline-none shadow-none text-center
                          focus-visible:!ring-0 focus-visible:!ring-transparent
                          rounded-none bg-transparent transition-colors
                        text-[rgba(0,0,0,0.8)] placeholder:text-[rgba(0,0,0,0.3)]"
              value={linkedinUrl}
              onChange={(e) => setLinkedinUrl(e.target.value)}
            />
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="relative welcome-bg min-h-screen ">
      <div className="welcome-content w-full flex flex-col items-center">
        <div className="w-full">
          <Header />
        </div>
        {/* todo 背景 & 上传简历或者linkedin */}
        <div className="max-w-md  w-full flex flex-col items-center">
          <div className="text-[20px] text-[rgba(0,0,0,0.8)] flex flex-col gap-6">
            <p className="font-bold">Welcome</p>
            <p>I&apos;m Tally. Let&apos;s find your dream job together.</p>
            <p className="font-bold">Start by sharing your LinkedIn or résumé.</p>
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
    </div>
  );
}
