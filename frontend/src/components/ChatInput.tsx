import React, { useState, useRef } from 'react';

import { Sender, Attachments, type AttachmentsProps } from '@ant-design/x';
import { Button } from 'antd';
import { Upload, Link } from 'lucide-react';
import { useTranslations } from 'next-intl';

const ChatInput: React.FC<{ handleSend: (content: string) => void }> = ({ handleSend }) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [value, setValue] = useState<string>('');
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<AttachmentsProps['items']>([]);
  const attachmentsRef = useRef(null);
  const t = useTranslations('HomePage');

  React.useEffect(() => {
    if (loading) {
      const timer = setTimeout(() => {
        setLoading(false);
        setValue('');
        // 这里可以添加发送消息的逻辑
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [loading]);

  const senderHeader = (
    <Sender.Header
      title="附件"
      styles={{
        content: {
          padding: 0,
        },
      }}
      open={open}
      onOpenChange={setOpen}
      forceRender
    >
      <Attachments
        ref={attachmentsRef}
        beforeUpload={() => false}
        items={items}
        onChange={({ fileList }) => setItems(fileList)}
        placeholder={(type) =>
          type === 'drop'
            ? {
                title: '拖拽文件到这里',
              }
            : {
                icon: <Upload />,
                title: '上传文件',
                description: '点击或拖拽文件到此区域上传',
              }
        }
      />
    </Sender.Header>
  );

  return (
    <div className="flex">
      <div className="flex-1 relative p-[2px] rounded-xl overflow-hidden group">
        {/* todo渐变动画 */}
        {/* <div
          className="animate-borderFlow absolute inset-0 rounded-xl bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 
              blur-xl opacity-60 group-hover:opacity-90 transition-opacity
              animate-[borderFlow_6s_linear_infinite]"
        ></div> */}
        <Sender
          className="bg-white"
          header={senderHeader}
          value={value}
          placeholder={t('chatInputPlaceholder')}
          onChange={setValue}
          autoSize={{ minRows: 2, maxRows: 6 }}
          footer={({ components }) => {
            const { SendButton } = components;
            return (
              <div className="flex justify-end">
                <Button type="text" icon={<Link />} onClick={() => setOpen(!open)} />
                <SendButton style={{ color: 'white', backgroundColor: 'black' }} />
              </div>
            );
          }}
          onSubmit={() => {
            handleSend(value);
            setLoading(true);
            setItems([]);
            setValue('');
          }}
          onCancel={() => setLoading(false)}
          actions={() => false}
        />
      </div>
    </div>
  );
};

export default ChatInput;
