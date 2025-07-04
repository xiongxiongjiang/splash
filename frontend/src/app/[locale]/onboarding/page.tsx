'use client'

import {useState, useEffect} from 'react'
import {useRouter, useParams} from 'next/navigation'

import {Tabs, ConfigProvider, Upload} from 'antd'
import {Upload as UploadIcon} from 'lucide-react'
import Image from 'next/image'

import Header from '@/components/Header'
import AuthForm from '@/components/AuthForm'
import {Button} from '@/components/ui/button'

import ProcessingView from '@/components/ProcessingView'

import IconClose from '@/assets/images/icon_close.svg'
import IconFiles from '@/assets/images/icon_files.png'
import IconTick from '@/assets/images/icon_tick.svg'
import useBreakpoint from '@/hooks/useBreakpoint'
import useUserStore from '@/store/user'
import {supabase} from '@/lib/supabase'

import type {TabsProps, UploadProps} from 'antd'
import type {UploadFile} from 'antd/es/upload/interface'
import type {UploadRequestOption} from 'rc-upload/lib/interface'

export default function WelcomePage() {
  const router = useRouter()
  const params = useParams()
  const locale = params.locale as string
  const [activeKey, setActiveKey] = useState('resume')
  const deviceType = useBreakpoint() // 获取设备类型
  const [uploadError, setUploadError] = useState('')
  const [fileList, setFileList] = useState<UploadFile[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const {userInfo, updateUserInfo, updateToken} = useUserStore()
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)

  // Check auth and profile status
  useEffect(() => {
    const checkAuthAndProfile = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        
        // If not authenticated, redirect to login
        if (!session) {
          router.push(`/${locale}/login`)
          return
        }
        
        // Update store if needed
        if (session.user && !userInfo) {
          updateUserInfo(session.user)
          updateToken({
            access_token: session.access_token,
            refresh_token: session.refresh_token,
            expires_at: session.expires_at as number,
          })
        }
        
        // Check if user has profile/resumes
        try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/me/resumes`, {
            headers: {
              'Authorization': `Bearer ${session.access_token}`,
            },
          })
          
          if (response.ok) {
            const data = await response.json()
            if (data.resumes && data.resumes.length > 0) {
              // User has profile, redirect to dashboard
              router.push(`/${locale}/dashboard`)
              return
            }
          }
        } catch (error) {
          console.error('Error checking profile:', error)
        }
        
        setIsCheckingAuth(false)
      } catch (error) {
        console.error('Auth check failed:', error)
        router.push(`/${locale}/login`)
      }
    }

    checkAuthAndProfile()
  }, [router, locale, userInfo, updateUserInfo, updateToken])


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

  const handleDesktopUploadClick = (e: React.MouseEvent) => {
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
  }

  // 渲染文件列表的函数
  const renderFileList = () => {
    if (fileList.length === 0) return null

    return fileList.map(file => {
      return (
        <div key={file.uid} className="flex w-full items-center py-2 relative group rounded px-2">
          <div className="flex w-full items-center justify-center">
            <Image src={IconTick} alt="icon_check" className="w-5 h-5 mr-2" />
            <span className="text-center truncate">{file.name}</span>
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

  const canContinue = () => {
    return fileList.some(file => file.status === 'done')
  }

  const items: TabsProps['items'] = [
    {
      key: 'resume',
      label: 'Résumé File',
      children: (
        <div className="flex flex-col items-center">
          <div className="h-[128px] flex flex-col justify-center items-center">
            <Image src={IconFiles} alt="icon_files" width={128} height={128} />
            <p className="text-xs text-[rgba(0,0,0,0.5)]">.doc, .docx or .pdf, up to 20 MB.</p>
          </div>

          <div className="mobile:hidden tablet:w-[400px] web:w-[400px] tablet:flex justify-center py-6 rounded-2xl bg-[rgba(235,235,235,0.5)] relative mt-6">
            <Upload {...uploadProps} style={{opacity: fileList.length === 0 ? 1 : 0}} openFileDialogOnClick={false}>
              <Button variant="outline" className="bg-transparent" onClick={e => handleDesktopUploadClick(e)}>
                <UploadIcon />
                Upload resume
              </Button>
            </Upload>
            {fileList.length !== 0 && (
              <div className="w-full absolute top-0 left-0 right-0 bottom-0 flex justify-center items-center">{renderFileList()}</div>
            )}
          </div>
          {uploadError && <div className="w-full text-center text-base text-[#FF6767] mt-2">{uploadError}</div>}
        </div>
      ),
    },
  ]

  const handleTabChange = (key: string) => {
    setActiveKey(key)
  }

  // 处理Continue按钮点击
  const handleContinue = () => {
    // 验证文件
    if (fileList.length === 0) {
      setUploadError('No file uploaded')
      return
    }

    const selectedFile = fileList[0]
    const fileToUpload = selectedFile.originFileObj || selectedFile

    if (fileToUpload && fileToUpload instanceof File) {
      setIsProcessing(true)
    } else {
      console.error('No valid file found:', {selectedFile, fileToUpload})
      setUploadError('No valid file found')
    }
  }

  // Show loading state while checking auth
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  // 如果正在处理，显示ProcessingView
  if (isProcessing) {
    const getFileToProcess = (): File | undefined => {
      if (fileList.length > 0) {
        const selectedFile = fileList[0]
        const file = selectedFile.originFileObj || selectedFile
        // 确保返回的是File对象
        return file instanceof File ? file : undefined
      }
      return undefined
    }

    return (
      <ProcessingView
        resumeFile={getFileToProcess()}
        onComplete={() => {
          // Navigate to dashboard after successful parsing, skip transition
          router.push(`/${locale}/dashboard?from=processing`)
        }}
        onError={(error: string) => {
          console.error('Processing error:', error)
          setIsProcessing(false)
          setUploadError(error)
        }}
      />
    )
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
              <p className="font-bold">Start by sharing your résumé.</p>
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
