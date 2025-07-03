'use client'

import {useState, useEffect, useRef} from 'react'

import {Skeleton} from 'antd'
import {ChevronDown, File, Link} from 'lucide-react'
import Image from 'next/image'
import {useTranslations} from 'next-intl'

import type {ExtractedData, PersonalExtra, EducationExtra, ParseResumeResponse} from '@/types/resume'
import {ParsedResume} from '@/lib/types'
import {supabase} from '@/lib/supabase'
import Logo from '@/assets/logos/tally_logo.svg'

interface AnalysisBlockProps {
  title: string
  description: string
  detail: string
  extra?: PersonalExtra[] | string[] | EducationExtra
  extraType?: 'personal' | 'skills' | 'education'
}

const AnalysisBlock = ({title, description, detail, extra, extraType}: AnalysisBlockProps) => {
  return (
    <div className="flex flex-col gap-3">
      <div className="text-sm">{title}</div>
      <div className="font-[12px] flex flex-col gap-2">
        <div className="flex">
          <div className="bg-[rgba(0,0,0,0.06)] px-4 py-2 rounded-[8px] flex gap-2">
            <span>{description}</span>
            <span className="text-[rgba(0,0,0,0.4)]">{detail}</span>
          </div>
        </div>

        {extra && extraType === 'personal' && (
          <div className="flex">
            <div className="flex gap-2 flex-col bg-[rgba(0,0,0,0.06)] px-4 py-2 rounded-[8px]">
              {(extra as PersonalExtra[]).map(item => (
                <p key={item.label}>
                  <span>{item.label}:</span>
                  <span className="text-[rgba(0,0,0,0.4)]">{item.value}</span>
                </p>
              ))}
            </div>
          </div>
        )}
        {extra && extraType === 'education' && (
          <div className="flex">
            <div className="flex gap-2 flex-col bg-[rgba(0,0,0,0.06)] px-4 py-2 rounded-[8px]">
              <span>{(extra as EducationExtra).university}</span>
              <p>
                {(extra as EducationExtra).degreeType},{(extra as EducationExtra).major}
              </p>
            </div>
          </div>
        )}
        {extra && extraType === 'skills' && (
          <div className="flex flex-wrap gap-2">
            {(extra as string[]).map(item => (
              <div className="bg-[rgba(0,0,0,0.06)] px-4 py-2 rounded-[8px]" key={item}>
                <span className="text-[12px] text-[rgba(0,0,0,0.8)]">{item}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

const ResumeCardSkeleton = () => {
  return (
    <div className="p-8 w-[353px] flex flex-col gap-2 bg-[rgba(255,255,255,0.5)] rounded-[16px]">
      <Skeleton active avatar paragraph={{rows: 4}} />
    </div>
  )
}

interface ProgressEvent {
  step: string
  progress: number
  message: string
  timestamp: string
}

interface ProcessingViewProps {
  linkedinUrl?: string
  resumeFile?: File
  onComplete?: (result: ParsedResume) => void
  onError?: (error: string) => void
}

export default function ProcessingView({linkedinUrl, resumeFile, onComplete, onError}: ProcessingViewProps) {
  const [showSkeleton, setShowSkeleton] = useState(true)
  const [showAnalysis, setShowAnalysis] = useState(false)
  const [progress, setProgress] = useState<ProgressEvent | null>(null)
  const [parseResult, setParseResult] = useState<ParsedResume | null>(null)
  const isProcessing = useRef(false)
  const t = useTranslations('HomePage')

  // 使用ref存储回调函数，避免useEffect重复执行
  const onCompleteRef = useRef(onComplete)
  const onErrorRef = useRef(onError)

  // 更新ref
  onCompleteRef.current = onComplete
  onErrorRef.current = onError

  useEffect(() => {
    if (isProcessing.current || !resumeFile) {
      return
    }
    isProcessing.current = true
    parseResumeStream(resumeFile)
      .then(result => {
        if (result.success && result.data) {
          setParseResult(result.data)
          onCompleteRef.current?.(result.data)
        } else {
          onErrorRef.current?.(result.error || 'Failed to parse resume')
        }
        isProcessing.current = false
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

              if (eventData.event === 'progress') {
                setProgress(eventData.data)
              } else if (eventData.event === 'complete') {
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

  // 从parseResult中提取profile数据
  const profileData = parseResult

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSkeleton(false)
    }, 2000)

    return () => clearTimeout(timer)
  }, [])

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
          <p className="font-normal">I'm Tally, your career wingman. Let's land your dream job together. </p>
          <p className="font-bold">Start by sharing your LinkedIn or résumé.</p>
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
          I will extract your resume's personal background information, education background information, and skills based on the LinkedIn
          link for further analysis.
        </p>

        <div className="space-y-3">
          <div className="flex items-center space-x-[7px]">
            <div className="w-4 h-4 bg-[rgba(0,0,0,0.2)] rounded-full animate-pulse" />
            <h2 className="text-lg font-medium">Extracting resume information</h2>
            <ChevronDown
              strokeWidth={1.5}
              onClick={() => setShowAnalysis(v => !v)}
              className={`w-4 h-4 cursor-pointer text-[rgba(0,0,0,0.5)] transition-transform duration-200 ${
                showAnalysis ? 'rotate-180' : ''
              }`}
            />
          </div>

          {showAnalysis && (
            <div className="space-y-3 ml-5 text-[rgba(0,0,0,0.8)] font-medium">
              <AnalysisBlock title="Processing resume file" description="Analyzing document structure" detail="PDF/DOC" />
              <AnalysisBlock
                title="Researching your background"
                description="Extracting personal information from resume"
                detail="Personal Details"
                extra={[
                  {label: 'Name', value: profileData?.name || 'N/A'},
                  {label: 'Title', value: (profileData as any)?.title || 'N/A'},
                  {label: 'Email', value: profileData?.email || 'N/A'},
                  {label: 'Phone', value: profileData?.phone || 'N/A'},
                  {label: 'Location', value: profileData?.location || 'N/A'},
                  {label: 'LinkedIn', value: (profileData as any)?.linkedin || 'N/A'},
                  {label: 'Sponsorship', value: (profileData as any)?.sponsorship || 'N/A'},
                ]}
                extraType="personal"
              />
              <AnalysisBlock
                title="Your Education background information"
                description="Extracting education details from resume"
                detail="Education Section"
                extra={
                  profileData?.education?.degrees?.[0]
                    ? {
                        university: profileData.education.degrees[0].university,
                        degreeType: profileData.education.degrees[0].degree,
                        major: profileData.education.degrees[0].degree,
                      }
                    : undefined
                }
                extraType="education"
              />
              <AnalysisBlock
                title={`Your skills list (${profileData?.skills?.raw_skills?.length || 0})`}
                description="Extracting technical and soft skills"
                detail="Skills Section"
                extra={profileData?.skills?.raw_skills || []}
                extraType="skills"
              />
            </div>
          )}
        </div>
      </div>

      <div>
        {showSkeleton ? (
          <ResumeCardSkeleton />
        ) : (
          <div className="p-8 flex flex-col gap-2 bg-[rgba(255,255,255,0.5)] rounded-[16px]">
            <div className="flex items-center px-4 py-[10px] gap-4 bg-white rounded-[16px]">
              <div className="w-[70px] h-[70px] border-6  border-[rgba(0,0,0,0.08)] rounded-full flex items-center justify-center"></div>
              <div>
                <p className="text-[13px] text-[rgba(0,0,0,0.4)]">Your resume</p>
                <p className="font-bold text-[15px]">Processing...</p>
                <p className="font-bold text-[15px]">Analysis in progress</p>
              </div>
            </div>
            <div className="px-4 text-sm font-medium text-[rgba(0,0,0,0.8)]">
              <div className="flex py-3 items-center justify-between">
                <span>Background Matching</span>
                <div className="w-4 h-4 bg-gray-300 rounded-full animate-pulse" />
              </div>
              <div className="flex py-3 items-center justify-between">
                <span>Industry Experience</span>
                <div className="w-4 h-4 bg-gray-300 rounded-full animate-pulse" />
              </div>
              <div className="flex py-3 items-center justify-between">
                <span>Skills Analysis</span>
                <div className="w-4 h-4 bg-gray-300 rounded-full animate-pulse" />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
