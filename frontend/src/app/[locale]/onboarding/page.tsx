'use client'

import {useState, useEffect} from 'react'

import {Tabs, ConfigProvider, Upload, message, Button as AntButton} from 'antd'
import {Upload as UploadIcon} from 'lucide-react'
import Image from 'next/image'

import Header from '@/components/Header'
import AuthForm from '@/components/AuthForm'
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
import useUserStore from '@/store/user'
import {supabase} from '@/lib/supabase'

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
  const [showAuthModal, setShowAuthModal] = useState(false)
  const {userInfo, updateUserInfo, updateToken} = useUserStore()

  // 检查用户session并更新状态
  useEffect(() => {
    const checkUserSession = async () => {
      try {
        const {
          data: {session},
        } = await supabase.auth.getSession()
        if (session && session.user && !userInfo) {
          // 如果有session但store中没有用户信息，更新store
          updateUserInfo(session.user)
          updateToken({
            access_token: session.access_token,
            refresh_token: session.refresh_token,
            expires_at: session.expires_at as number,
          })
        }
      } catch (error) {
        console.error('检查用户session失败:', error)
      }
    }

    checkUserSession()
  }, [userInfo, updateUserInfo, updateToken])

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

  // 处理上传按钮点击
  const handleUploadClick = () => {
    // 检查用户是否已登录
    if (!userInfo) {
      setShowAuthModal(true)
      return false
    }
    return true
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

  // 上传和解析文件的函数
  const uploadAndParseFile = async (file: File) => {
    try {
      // 设置认证token
      const {
        data: {session},
      } = await supabase.auth.getSession()
      if (session?.access_token) {
        apiClient.setToken(session.access_token)
      } else {
        throw new Error('用户未登录')
      }

      // 直接使用parseResume方法解析文件
      const response = await apiClient.parseResume(file)

      if (response.success && response.profile) {
        // 解析成功，保存结果
        setParseResult(JSON.stringify(response.profile, null, 2))
        return true
      } else {
        // 解析失败
        const errorMessage = response.error || response.message || 'Parse failed'
        setUploadError(errorMessage)
        return false
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed'
      setUploadError(errorMessage)
      return false
    }
  }

  const uploadCustomRequest = async (options: UploadRequestOption) => {
    const {file, onSuccess} = options
    console.log('uploadCustomRequest called with file:', file)
    // 文件选择后不立即上传，只是标记为完成状态
    onSuccess?.({file, message: 'File selected'})

    return {
      abort: () => {},
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

      return (
        <div key={file.uid} className="flex w-full items-center py-2 relative group rounded px-2">
          <div className="flex w-full items-center justify-center">
            {/* 上传中显示 loading */}
            {/* {isUploading ? (
              <span className="w-5 h-5 flex items-center justify-center mr-2">
                <Image src={IconLoading} alt="loading" className="animate-spin" />
              </span>
            ) : (
              <Image src={IconTick} alt="icon_check" className="w-5 h-5 mr-2" />
            )} */}
            <Image src={IconTick} alt="icon_check" className="w-5 h-5 mr-2" />
            <span className="text-center truncate">{file.name}</span>
            {/* 上传成功时显示移除按钮 */}
            {/* {isDone && (
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
            )} */}
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

          <div className="mobile:hidden tablet:w-[400px] web:w-[400px] tablet:flex justify-center py-6 rounded-2xl bg-[rgba(235,235,235,0.5)] relative mt-6">
            <Upload {...uploadProps} style={{opacity: fileList.length === 0 ? 1 : 0}} openFileDialogOnClick={false}>
              <Button
                variant="outline"
                className="bg-transparent"
                onClick={e => {
                  e.preventDefault()
                  if (handleUploadClick()) {
                    // 只有在用户已登录时才打开文件对话框
                    const input = document.createElement('input')
                    input.type = 'file'
                    input.accept = '.pdf,.doc,.docx'
                    input.onchange = event => {
                      const file = (event.target as HTMLInputElement).files?.[0]
                      if (file) {
                        const uploadFile = {
                          uid: Date.now().toString(),
                          name: file.name,
                          size: file.size,
                          type: file.type,
                          originFileObj: file,
                        } as UploadFile

                        if (beforeUpload(uploadFile)) {
                          uploadCustomRequest({
                            file,
                            action: '',
                            method: 'POST',
                            onProgress: () => {},
                            onSuccess: response => {
                              setFileList([{...uploadFile, status: 'done', response}])
                            },
                            onError: error => {
                              setFileList([{...uploadFile, status: 'error', error}])
                            },
                          })
                          setFileList([{...uploadFile, status: 'uploading'}])
                        }
                      }
                    }
                    input.click()
                  }
                }}
              >
                <UploadIcon />
                Upload resume
              </Button>
            </Upload>
            {fileList.length !== 0 && (
              <div className="w-full absolute top-0 left-0 right-0 bottom-0 flex justify-center items-center">{renderFileList()}</div>
            )}
          </div>
          {uploadError && <div className="w-full text-center text-base text-[#FF6767] mt-2">{uploadError}</div>}
          {/* {(fileList.length !== 0 && deviceType === 'mobile') && (
              <div className="w-full absolute top-0 left-0 right-0 bottom-0 flex justify-center items-center">{renderFileList()}</div>
          )} */}
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
          <div className="flex justify-center tablet:w-[400px] web:w-[400px] py-4 mx-4 rounded-2xl bg-[rgba(235,235,235,0.5)]">
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

  // 处理Continue按钮点击
  const handleContinue = async () => {
    if (activeKey === 'resume') {
      // 简历模式：现在才真正上传和解析文件
      console.log('Current fileList:', fileList)

      if (fileList.length === 0) {
        setUploadError('No file uploaded')
        return
      }

      const selectedFile = fileList[0] // 获取第一个文件
      console.log('Selected file:', selectedFile)

      // 检查文件对象
      const fileToUpload = selectedFile.originFileObj || selectedFile
      console.log('File to upload:', fileToUpload)

      if (fileToUpload && fileToUpload instanceof File) {
        setIsProcessing(true)
        await uploadAndParseFile(fileToUpload)
      } else {
        console.error('No valid file found:', {selectedFile, fileToUpload})
        setUploadError('No valid file found')
      }
    } else if (activeKey === 'linkedin') {
      // LinkedIn模式：验证URL格式
      if (!linkedinUrl.trim() || !linkedinUrl.includes('linkedin.com/in/')) {
        setLinkedinError('The link format is incorrect')
        return
      }
      // TODO: 处理LinkedIn导入逻辑
      console.log('Processing LinkedIn URL:', linkedinUrl)
      setIsProcessing(true)
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
        .ant-tabs-content-holder {
          display: flex;
          justify-content: center;
          align-items: center;
        }
        .ant-tabs-content {
          width: 100%;
          display: flex;
          justify-content: center;
        }
        .ant-tabs-tabpane {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }
      `}</style>
      <div className="welcome-content w-full min-h-screen flex flex-col items-center">
        <Header fixed />
        <div className="flex-1 w-full flex flex-col items-center tablet:justify-center web:justify-center tablet:pt-0 web:pt-0 mobile:pt-40 bg-[]">
          <div className="items-start w-full flex flex-col max-w-[704px] web:flex-0 tablet:flex-0 mobile:flex-1">
            {/* 顶部 */}
            <div className="flex-1 px-6 tablet:px-3 tablet:flex-none text-[18px] tablet:text-[20px] text-[rgba(0,0,0,0.8)] flex flex-col gap-6">
              <p className="font-bold">Welcome</p>
              <p className="text-base">{`I'm Tally, your career wingman. Let's land your dream job together.`} </p>
              <p className="font-bold">Start by sharing your LinkedIn or résumé.</p>
            </div>

            {/* 中间 */}
            <div className="max-w-[704px] flex-3 web:max-h-[100vh] tablet:max-h-[100vh] mobile:h-[480px] justify-between items-center flex flex-col rounded-t-[12px] tablet:flex-none tablet:rounded-3xl bg-[rgba(255,255,255,0.8)] mt-11 tablet:p-9 w-full tablet:shadow-sm mobile:bg-[]">
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
                  className="font-semibold !border-none w-full"
                  items={items}
                  centered
                  onChange={handleTabChange}
                  style={{height: deviceType === 'mobile' ? '400px' : 'auto'}}
                />
              </ConfigProvider>

              <div className="flex tablet:mt-8 w-full justify-center mb-10 tablet:mb-0" style={{gap: activeKey === 'resume' ? 0 : '1rem'}}>
                {((fileList.length !== 0 && (deviceType !== 'mobile' || activeKey !== 'resume')) ||
                  activeKey === 'linkedin' ||
                  (deviceType !== 'mobile' && activeKey === 'resume')) && (
                  <Button
                    className="w-[270px] tablet:w-[180px] rounded-[12px] text-base font-semibold py-[25px] disabled:bg-[rgba(0,0,0,0.2)] disabled:text-white]"
                    onClick={handleContinue}
                  >
                    CONTINUE
                  </Button>
                )}

                {/* 手机端：始终保持Upload组件存在 */}
                {activeKey === 'resume' && deviceType === 'mobile' && (
                  <div className="relative">
                    <Upload {...uploadProps} key="mobile-upload" style={{opacity: canContinue() ? 0 : 1}}>
                      <Button className="w-[270px] rounded-[12px] tablet:hidden text-base font-semibold py-[25px]">
                        <UploadIcon />
                        UPLOAD RESUME
                      </Button>
                    </Upload>

                    {canContinue() && (
                      <Button
                        className="w-[270px] rounded-[12px] tablet:hidden text-base font-semibold py-[25px] absolute top-0 left-0"
                        onClick={handleContinue}
                      >
                        CONTINUE
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 登录蒙层 */}
      {showAuthModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/10 backdrop-blur-[10px]">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 relative">
            <button onClick={() => setShowAuthModal(false)} className="absolute top-4 right-4 text-gray-500 hover:text-gray-700">
              <Image src={IconClose} alt="close" className="w-6 h-6" />
            </button>
            <div className="mt-4">
              <AuthForm onSuccess={() => setShowAuthModal(false)} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
