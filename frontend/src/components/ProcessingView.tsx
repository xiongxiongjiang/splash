'use client'

import {useState, useEffect, useRef} from 'react'

import {Skeleton, Progress} from 'antd'
import {File, Link} from 'lucide-react'
import Image from 'next/image'
import {useTranslations} from 'next-intl'
import {ParsedResume} from '@/lib/types'
import {supabase} from '@/lib/supabase'
import TallyTransition from '@/components/TallyTransition'
import Logo from '@/assets/logos/tally_logo.svg'

const ResumeCardSkeleton = () => {
  return (
    <div className="p-8 w-[353px] flex flex-col gap-2 bg-[rgba(255,255,255,0.5)] rounded-[16px]">
      <Skeleton active avatar paragraph={{rows: 4}} />
    </div>
  )
}

interface ProcessingViewProps {
  linkedinUrl?: string
  resumeFile?: File
  onComplete?: (result: ParsedResume) => void
  onError?: (error: string) => void
}

export default function ProcessingView({linkedinUrl, resumeFile, onComplete, onError}: ProcessingViewProps) {
  const [showSkeleton, setShowSkeleton] = useState(true)
  const [fakeProgress, setFakeProgress] = useState(0)
  const [currentFactIndex, setCurrentFactIndex] = useState(0)
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false)
  const [showTransitionScreen, setShowTransitionScreen] = useState(false)
  const isProcessing = useRef(false)
  const startTime = useRef<number | null>(null)
  const parseResult = useRef<{success: boolean; data?: ParsedResume; error?: string} | null>(null)
  const t = useTranslations('HomePage')

  // Fun job search facts
  const jobSearchFacts = [
    { q: "Did you know?", a: "The average job search takes 3-6 months, but using AI can cut that in half!" },
    { q: "Fun fact:", a: "70% of jobs are never publicly posted - networking is key!" },
    { q: "Interesting:", a: "Recruiters spend only 6 seconds scanning your resume on average." },
    { q: "Pro tip:", a: "Thursday is statistically the best day to apply for jobs." },
    { q: "Did you know?", a: "Companies with diverse teams are 35% more likely to outperform competitors." },
    { q: "Surprise:", a: "The word 'resume' comes from French meaning 'to summarize'." },
    { q: "Fact:", a: "Remote work applications increased 300% since 2020!" },
    { q: "Tip:", a: "Following up after 1 week increases your response rate by 40%." }
  ]

  // 使用ref存储回调函数，避免useEffect重复执行
  const onCompleteRef = useRef(onComplete)
  const onErrorRef = useRef(onError)

  // 更新ref
  onCompleteRef.current = onComplete
  onErrorRef.current = onError

  // Fake progress timer (6 steps, 3s each = 18s total)
  useEffect(() => {
    if (!resumeFile) return

    startTime.current = Date.now()
    
    // 6 steps: ~17%, 33%, 50%, 67%, 83%, 100%
    const timer1 = setTimeout(() => setFakeProgress(1), 3000)   // 17%
    const timer2 = setTimeout(() => setFakeProgress(2), 6000)   // 33%
    const timer3 = setTimeout(() => setFakeProgress(3), 9000)   // 50%
    const timer4 = setTimeout(() => setFakeProgress(4), 12000)  // 67%
    const timer5 = setTimeout(() => setFakeProgress(5), 15000)  // 83%
    // Step 6: 100% only when backend completes (minimum 18s)
    
    return () => {
      clearTimeout(timer1)
      clearTimeout(timer2)
      clearTimeout(timer3)
      clearTimeout(timer4)
      clearTimeout(timer5)
    }
  }, [resumeFile])

  // Cycle through job search facts every 7 seconds with smooth animations
  useEffect(() => {
    const factInterval = setInterval(() => {
      setCurrentFactIndex(prev => (prev + 1) % jobSearchFacts.length)
    }, 7000)

    return () => clearInterval(factInterval)
  }, [jobSearchFacts.length])

  useEffect(() => {
    if (isProcessing.current || !resumeFile) {
      return
    }
    isProcessing.current = true
    parseResumeStream(resumeFile)
      .then(result => {
        parseResult.current = result
        const handleCompletion = () => {
          if (result.success && result.data) {
            setFakeProgress(6) // Complete the final step
            // Show success animation briefly, then transition screen
            setTimeout(() => {
              setShowSuccessAnimation(true)
              setTimeout(() => {
                setShowTransitionScreen(true)
              }, 1000)
            }, 500)
          } else {
            onErrorRef.current?.(result.error || 'Failed to parse resume')
          }
          isProcessing.current = false
        }

        // Ensure minimum 30 seconds have passed
        const elapsed = Date.now() - (startTime.current || 0)
        const remaining = Math.max(0, 30000 - elapsed)
        
        setTimeout(handleCompletion, remaining)
      })
      .catch(error => {
        console.error('Parse error:', error)
        onErrorRef.current?.(error.message || 'Unknown error')
        isProcessing.current = false
      })
  }, [resumeFile])

  // 解析简历的流式处理函数
  const parseResumeStream = async (file: File): Promise<{success: boolean; data?: ParsedResume; error?: string}> => {
    try {
      const formData = new FormData()
      formData.append('file', file)

      // Get the auth token
      const {
        data: {session},
      } = await supabase.auth.getSession()
      if (!session) {
        throw new Error('No authentication session')
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/parse-resume-stream`, {
        method: 'POST',
        body: formData,
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error('No response body')
      }

      const decoder = new TextDecoder()
      let result: {success: boolean; data?: ParsedResume; error?: string} = {
        success: false,
        error: 'No data received',
      }

      while (true) {
        const {done, value} = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const eventData = JSON.parse(line.slice(6))

              if (eventData.event === 'complete') {
                const data = eventData.data
                if (data.success && data.profile) {
                  result = {
                    success: true,
                    data: {
                      name: data.profile.name,
                      email: data.profile.email,
                      phone: data.profile.phone || '',
                      location: data.profile.location || '',
                      professional_summary: data.profile.professional_summary || 'Professional',
                      years_experience: data.profile.years_experience || 0,
                      skills: data.profile.skills || {raw_skills: []},
                      education: data.profile.education || {degrees: []},
                    },
                  }
                }
              } else if (eventData.event === 'error') {
                result = {
                  success: false,
                  error: eventData.data.error || 'Failed to parse resume',
                }
              }
            } catch (e) {
              console.error('Error parsing SSE data:', e)
            }
          }
        }
      }

      return result
    } catch (error) {
      console.error('Resume parsing error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }


  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSkeleton(false)
    }, 2000)

    return () => clearTimeout(timer)
  }, [])

  // Show full-screen transition animation
  if (showTransitionScreen) {
    return (
      <TallyTransition 
        duration={600}
        onComplete={() => {
          if (parseResult.current?.data) {
            onCompleteRef.current?.(parseResult.current.data)
          }
        }}
      />
    )
  }

  return (
    <div className="h-screen onboarding-bg flex gap-6 justify-between p-10">
      <div className="w-[150px]">
        <div className="flex flex-1 justify-center items-center gap-2">
          <Image src={Logo} alt={t('appName')} width={24} height={24} />
          <span className="font-bold text-[20px] text-nowrap">{t('appName')}</span>
        </div>
      </div>

      <div className="transition-all hide-scrollbar flex flex-col gap-8 duration-500 ease-in-out max-h-screen overflow-y-auto mt-36">
        <div className="space-y-6 text-base text-[rgba(0,0,0,0.8)] text-[20px]">
          <h1 className="font-bold">Welcome</h1>
          <p className="font-normal">I&apos;m Tally, your career wingman. Let&apos;s land your dream job together. </p>
          <p className="font-bold">Start by sharing your résumé.</p>
        </div>

        <div className="flex justify-end">
          <div className="bg-white flex gap-2 px-4 py-2 rounded-[8px] justify-center items-center">
            {resumeFile ? (
              <>
                <File size={16} />
                <span>{resumeFile.name}</span>
              </>
            ) : (
              <>
                <Link size={16} />
                <span>{linkedinUrl}</span>
              </>
            )}
          </div>
        </div>

        <p className="text-base font-medium">
          I will extract your resume&apos;s personal background information, education background information, and skills based on the LinkedIn
          link for further analysis.
        </p>

        <div className="space-y-3">
          <div className="flex items-center space-x-[7px]">
            <div className={`w-4 h-4 rounded-full transition-all duration-300 ${
              fakeProgress >= 6 
                ? 'bg-green-500' 
                : resumeFile
                ? 'bg-yellow-400 animate-pulse' 
                : 'bg-[rgba(0,0,0,0.2)]'
            }`} />
            <h2 className={`text-lg font-medium ${
              fakeProgress >= 6 ? 'chroma-animate-once' : ''
            }`}>Processing your resume</h2>
          </div>

          <div className="ml-5 p-4 bg-[rgba(0,0,0,0.06)] rounded-[8px]">
            <div 
              key={currentFactIndex}
              className="flex flex-col gap-2 animate-[fadeInUp_0.6s_ease-out]"
            >
              <div className="text-sm font-medium text-[rgba(0,0,0,0.8)]">
                {jobSearchFacts[currentFactIndex].q}
              </div>
              <div className="text-sm text-[rgba(0,0,0,0.6)]">
                {jobSearchFacts[currentFactIndex].a}
              </div>
            </div>
          </div>
          
          <style jsx>{`
            @keyframes fadeInUp {
              0% {
                opacity: 0;
                transform: translateY(10px);
              }
              100% {
                opacity: 1;
                transform: translateY(0);
              }
            }
          `}</style>
        </div>
      </div>

      <div>
        {showSkeleton ? (
          <ResumeCardSkeleton />
        ) : (
          <div className="p-8 flex flex-col gap-2 bg-[rgba(255,255,255,0.5)] rounded-[16px]">
            <div className="flex items-center px-4 py-[10px] gap-4 bg-white rounded-[16px]">
              <div className="w-[70px] h-[70px] flex items-center justify-center">
                <Progress
                  type="circle"
                  percent={Math.max(0, (fakeProgress / 6) * 100)}
                  size={70}
                  strokeWidth={8}
                  strokeColor="#22c55e"
                  trailColor="rgba(0,0,0,0.08)"
                  format={(percent) => (
                    <span className="text-sm font-bold text-gray-700">
                      {Math.round(percent || 0)}%
                    </span>
                  )}
                />
              </div>
              <div>
                <p className="text-[13px] text-[rgba(0,0,0,0.4)]">Your resume</p>
                <p className="font-bold text-[15px]">
                  {showSuccessAnimation ? (
                    <span className="chroma-animate-once">Complete!</span>
                  ) : (
                    "Processing..."
                  )}
                </p>
                <p className="font-bold text-[15px]">
                  {showSuccessAnimation ? (
                    <span className="chroma-animate-once">Ready for dashboard</span>
                  ) : (
                    "Analysis in progress"
                  )}
                </p>
              </div>
            </div>
            <div className="px-4 text-sm font-medium text-[rgba(0,0,0,0.8)]">
              <div className="flex py-3 items-center justify-between">
                <span className={fakeProgress >= 6 ? 'chroma-animate-once' : ''}>Document Analysis</span>
                <div className={`w-4 h-4 rounded-full transition-all duration-300 ${
                  fakeProgress >= 1 
                    ? 'bg-green-500' 
                    : fakeProgress === 0 && resumeFile
                    ? 'bg-yellow-400 animate-pulse' 
                    : 'bg-gray-300'
                }`} />
              </div>
              <div className="flex py-3 items-center justify-between">
                <span className={fakeProgress >= 6 ? 'chroma-animate-once' : ''}>Personal Information Extraction</span>
                <div className={`w-4 h-4 rounded-full transition-all duration-300 ${
                  fakeProgress >= 2 
                    ? 'bg-green-500' 
                    : fakeProgress === 1 && resumeFile
                    ? 'bg-yellow-400 animate-pulse' 
                    : 'bg-gray-300'
                }`} />
              </div>
              <div className="flex py-3 items-center justify-between">
                <span className={fakeProgress >= 6 ? 'chroma-animate-once' : ''}>Work Experience Analysis</span>
                <div className={`w-4 h-4 rounded-full transition-all duration-300 ${
                  fakeProgress >= 3 
                    ? 'bg-green-500' 
                    : fakeProgress === 2 && resumeFile
                    ? 'bg-yellow-400 animate-pulse' 
                    : 'bg-gray-300'
                }`} />
              </div>
              <div className="flex py-3 items-center justify-between">
                <span className={fakeProgress >= 6 ? 'chroma-animate-once' : ''}>Skills Assessment</span>
                <div className={`w-4 h-4 rounded-full transition-all duration-300 ${
                  fakeProgress >= 4 
                    ? 'bg-green-500' 
                    : fakeProgress === 3 && resumeFile
                    ? 'bg-yellow-400 animate-pulse' 
                    : 'bg-gray-300'
                }`} />
              </div>
              <div className="flex py-3 items-center justify-between">
                <span className={fakeProgress >= 6 ? 'chroma-animate-once' : ''}>Education Verification</span>
                <div className={`w-4 h-4 rounded-full transition-all duration-300 ${
                  fakeProgress >= 5 
                    ? 'bg-green-500' 
                    : fakeProgress === 4 && resumeFile
                    ? 'bg-yellow-400 animate-pulse' 
                    : 'bg-gray-300'
                }`} />
              </div>
              <div className="flex py-3 items-center justify-between">
                <span className={fakeProgress >= 6 ? 'chroma-animate-once' : ''}>Profile Optimization</span>
                <div className={`w-4 h-4 rounded-full transition-all duration-300 ${
                  fakeProgress >= 6 
                    ? 'bg-green-500' 
                    : fakeProgress === 5 && resumeFile
                    ? 'bg-yellow-400 animate-pulse' 
                    : 'bg-gray-300'
                }`} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
