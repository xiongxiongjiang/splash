'use client'

import {useState} from 'react'

import {Tabs, ConfigProvider, Upload, message, Button as AntButton} from 'antd'
import {Upload as UploadIcon} from 'lucide-react'
import Image from 'next/image'

import Header from '@/components/Header'
import {Button} from '@/components/ui/button'
import {Input} from '@/components/ui/input'
import {apiClient} from '@/lib/api'
import ProcessingView from '@/components/ProcessingView'
import IconClose from '@/assets/images/icon_close.svg'
import IconFiles from '@/assets/images/icon_files.png'
import IconLink from '@/assets/images/icon_link.png'
import IconLoading from '@/assets/images/icon_loading_dark.svg'
import IconTick from '@/assets/images/icon_tick.svg'
import useBreakpoint from '@/hooks/useBreakpoint'

import type {TabsProps, UploadProps} from 'antd'
import type {UploadFile} from 'antd/es/upload/interface'
import type {UploadRequestOption} from 'rc-upload/lib/interface'

export default function WelcomePage() {
  const [linkedinUrl, setLinkedinUrl] = useState('')
  const [activeKey, setActiveKey] = useState('resume')
  const deviceType = useBreakpoint() // 获取设备类型
  const [uploadError, setUploadError] = useState('')
  const [linkedinError, setLinkedinError] = useState('')
  const [fileList, setFileList] = useState<UploadFile[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [parseResult, setParseResult] = useState('')
  const [uploadedFileUrl, setUploadedFileUrl] = useState('')

  // 检查是否可以继续
  const canContinue = () => {
    if (activeKey === 'resume') {
      // 简历模式下，需要有成功上传的文件
      return fileList.some(file => file.status === 'done')
    } else if (activeKey === 'linkedin') {
      // LinkedIn模式下，需要有有效的LinkedIn URL
      // return linkedinUrl.trim() !== '' && linkedinUrl.includes('linkedin.com/in/');
      return true
    }
    return false
  }

  const beforeUpload = (file: UploadFile) => {
    // 文件格式验证
    const isValidFormat = /\.(pdf|doc|docx)$/i.test(file.name)
    if (!isValidFormat) {
      setUploadError('Wrong file format, pdf or doc format required')
      return Upload.LIST_IGNORE
    }

    // 文件大小验证 (20MB = 20 * 1024 * 1024 bytes)
    const maxSize = 20 * 1024 * 1024
    if (file.size && file.size > maxSize) {
      setUploadError('File size exceeds 20MB limit')
      return Upload.LIST_IGNORE
    }

    // 清除之前的错误信息
    setUploadError('')
    return true
  }

  const uploadCustomRequest = async (options: UploadRequestOption) => {
    const {file, onProgress, onSuccess, onError} = options

    try {
      // 使用API客户端上传文件
      const response = await apiClient.uploadFile(file as File)

      // 保存上传的文件URL
      setUploadedFileUrl(response.file_url)

      // 调用成功回调
      onSuccess?.(response)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed'
      setUploadError(errorMessage)
      onError?.(new Error(errorMessage))
    }

    // 返回一个取消函数（对于fetch请求，这里是空实现）
    return {
      abort: () => {
        // Fetch API 不支持直接取消，这里是空实现
      },
    }
  }

  const uploadProps: UploadProps = {
    name: 'file',
    accept: '.pdf,.doc,.docx',
    maxCount: 1,
    fileList: fileList,
    showUploadList: false, // 隐藏默认的上传列表
    beforeUpload: beforeUpload,
    customRequest: uploadCustomRequest,
    onChange(info) {
      // 更新文件列表状态
      setFileList(info.fileList)
      // 处理上传错误
      if (info.file.status === 'error') {
        setUploadError(info.file.error?.message || 'Upload failed')
        // 上传失败时从文件列表中移除该文件
        const newFileList = info.fileList.filter(file => file.uid !== info.file.uid)
        setFileList(newFileList)
      } else if (info.file.status === 'done') {
        // 上传成功时清除错误信息
        setUploadError('')
      }
    },
  }

  // 渲染文件列表的函数
  const renderFileList = () => {
    if (fileList.length === 0) return null

    return fileList.map(file => {
      const isUploading = file.status === 'uploading'
      const isDone = file.status === 'done'

      // 调试信息
      console.log('Rendering file:', file.name, 'status:', file.status, 'isUploading:', isUploading, 'isDone:', isDone)

      return (
        <div key={file.uid} className="flex w-full items-center py-2 relative group hover:bg-gray-50 rounded px-2">
          <div className="flex w-full items-center">
            {/* 上传中显示 loading */}
            {isUploading ? (
              <span className="w-5 h-5 flex items-center justify-center mr-2">
                <Image src={IconLoading} alt="loading" className="animate-spin" />
              </span>
            ) : (
              <Image src={IconTick} alt="icon_check" className="w-5 h-5 mr-2" />
            )}
            <span className="flex-1 text-center truncate">{file.name}</span>
            {/* 上传成功时显示移除按钮 */}
            {isDone && (
              <button
                type="button"
                className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-gray-200 rounded"
                onClick={() => {
                  const newFileList = fileList.filter(f => f.uid !== file.uid)
                  setFileList(newFileList)
                  // 清除错误信息
                  setUploadError('')
                }}
                title="移除"
              >
                <Image src={IconClose} alt="icon_close" className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )
    })
  }

  const items: TabsProps['items'] = [
    {
      key: 'resume',
      label: 'Résumé File',
      children: (
        <div className="flex flex-col items-center">
          <div className="h-[128px]  flex flex-col justify-center items-center">
            <Image src={IconFiles} alt="icon_files" width={128} height={128} />
            <p className="text-xs text-[rgba(0,0,0,0.5)]">.doc, .docx or .pdf, up to 20 MB.</p>
          </div>

          <div className="mobile:hidden w-full tablet:flex justify-center py-6 rounded-2xl bg-[rgba(235,235,235,0.5)]">
            <Upload {...uploadProps}>
              <Button variant="outline" className="bg-transparent">
                <UploadIcon />
                Upload resume
              </Button>
            </Upload>
          </div>
          {/* 自定义文件列表渲染 */}
          <div className="w-full">{renderFileList()}</div>
          {uploadError && <div className="w-full text-center text-base text-[#FF6767] mt-2">{uploadError}</div>}
        </div>
      ),
    },
    {
      key: 'linkedin',
      label: 'LinkedIn Import',
      children: (
        <div className="flex flex-col items-center">
          <div className="h-[128px] w-[128px] flex justify-center items-center">
            <Image src={IconLink} alt="icon_files" width={128} height={128} />
          </div>
          <div className="w-full flex justify-center py-6 rounded-2xl bg-[rgba(235,235,235,0.5)]">
            <Input
              placeholder="https://linkedin.com/in/"
              className="!text-semibold !text-base border-0
                          focus:outline-none shadow-none text-center
                          focus-visible:!ring-0 focus-visible:!ring-transparent
                          rounded-none bg-transparent transition-colors
                        text-[rgba(0,0,0,0.8)] placeholder:text-[rgba(0,0,0,0.3)]"
              value={linkedinUrl}
              onChange={e => setLinkedinUrl(e.target.value)}
            />
          </div>
          {linkedinError && <div className="w-full text-center text-base text-[#FF6767] mt-2">{linkedinError}</div>}
        </div>
      ),
    },
  ]

  const handleTabChange = (key: string) => {
    setActiveKey(key)
  }

  // 处理简历解析
  const handleResumeParseAsync = async (fileUrl: string) => {
    setIsProcessing(true)
    setParseResult('')

    try {
      await apiClient.parseResumeWithCallback(
        fileUrl,
        (data: string) => {
          // 实时接收解析数据
          setParseResult(prev => prev + data)
        },
        () => {
          console.log('Resume parsing completed')
        },
        (error: Error) => {
          setUploadError(`Resume parsing failed: ${error.message}`)
        }
      )
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Resume parsing failed'
      setUploadError(errorMessage)
    }
  }

  // 处理Continue按钮点击
  const handleContinue = async () => {
    if (activeKey === 'resume') {
      // 简历模式：开始解析简历
      if (uploadedFileUrl) {
        await handleResumeParseAsync(uploadedFileUrl)
      } else {
        setUploadError('No file uploaded')
      }
    } else if (activeKey === 'linkedin') {
      // LinkedIn模式：验证URL格式
      if (!linkedinUrl.trim() || !linkedinUrl.includes('linkedin.com/in/')) {
        setLinkedinError('The link format is incorrect')
        return
      }
      // TODO: 处理LinkedIn导入逻辑
      console.log('Processing LinkedIn URL:', linkedinUrl)
    }
  }
  // 如果正在处理，显示ProcessingView
  if (isProcessing) {
    return <ProcessingView linkedinUrl={activeKey === 'linkedin' ? linkedinUrl : undefined} parseResult={parseResult} />
  }

  return (
    <div className={`relative welcome-bg is-${deviceType}`}>
      <style jsx global>{`
        .ant-tabs-top > .ant-tabs-nav::before {
          border-bottom: none !important;
        }
        .ant-tabs-ink-bar {
          height: 4px !important;
          border-radius: 4px !important;
        }
        .is-mobile .ant-tabs-tab {
          font-size: 18px !important;
        }
        .is-tablet .ant-tabs-tab,
        .is-web .ant-tabs-tab {
          font-size: 22px !important;
        }
      `}</style>
      <div className="welcome-content w-full min-h-screen flex flex-col items-center">
        <div className="w-full">
          <Header />
        </div>
        <div className="tablet:max-w-md flex-1 w-full flex flex-col items-center">
          <div className="flex-1 px-6 tablet:px-3 tablet:flex-none text-[18px] tablet:text-[20px] text-[rgba(0,0,0,0.8)] flex flex-col gap-6">
            <p className="font-bold">Welcome</p>
            <p className="text-base">{`I'm Tally, your career wingman. Let's land your dream job together.`} </p>
            <p className="font-bold">Start by sharing your LinkedIn or résumé.</p>
          </div>

          <div className="flex-1 justify-between items-center flex flex-col rounded-t-[12px] tablet:flex-none  tablet:rounded-3xl bg-[rgba(255,255,255,0.8)] tablet:mt-13 tablet:p-9 w-full tablet:shadow-sm">
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
              <Tabs
                defaultActiveKey={activeKey}
                indicator={{size: 40}}
                className="font-semibold !border-none "
                items={items}
                centered
                onChange={handleTabChange}
              />
            </ConfigProvider>

            <div className="flex tablet:mt-8 w-full justify-center gap-4 mb-10 tablet:mb-0">
              {(fileList.length !== 0 || activeKey === 'linkedin' || deviceType !== 'mobile') && (
                <Button
                  className="w-[270px] tablet:w-[180px] rounded-[12px] text-base font-semibold py-[25px] disabled:bg-[rgba(0,0,0,0.2)] disabled:text-white]"
                  onClick={handleContinue}
                >
                  CONTINUE
                </Button>
              )}

              {/* 手机端：没有文件时显示UPLOAD RESUME，有文件时显示Continue */}
              {activeKey === 'resume' && (
                <>
                  {/* 没有文件时显示UPLOAD RESUME */}
                  <Upload {...uploadProps} key="mobile-upload">
                    <Button className="w-[270px] rounded-[12px] tablet:hidden text-base font-semibold py-[25px]">
                      <UploadIcon />
                      UPLOAD RESUME
                    </Button>
                  </Upload>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
