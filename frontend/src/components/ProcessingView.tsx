'use client'

import {useState, useEffect} from 'react'

import {Skeleton} from 'antd'
import {ChevronDown, File, Link} from 'lucide-react'
import Image from 'next/image'
import {useTranslations} from 'next-intl'

import Logo from '@/assets/logos/tally_logo.svg'

interface PersonalExtra {
  label: string
  value: string
}

interface EducationExtra {
  university: string
  degreeType: string
  major: string
}

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

interface Job {
  title: string
  years: string
  company: string
  location: string
  description: string
}

interface Degree {
  gpa?: string
  years: string
  degree: string
  courses?: string
  location: string
  university: string
}

interface ExtractedData {
  name: string
  email: string
  phone: string
  location: string
  open_to_relocate?: boolean
  professional_summary?: string
  career_level?: string | null
  years_experience?: number
  primary_domain?: string | null
  seniority_keywords?: string | null
  experience?: {
    jobs: Job[]
  }
  education?: {
    degrees: Degree[]
  }
  skills?: {
    raw_skills: string[]
  }
  languages?: {
    spoken: string[]
  }
  // 兼容旧版本字段
  title?: string
  linkedin?: string
  sponsorship?: string
}

const ResumeCardSkeleton = () => {
  return (
    <div className="p-8 w-[353px] flex flex-col gap-2 bg-[rgba(255,255,255,0.5)] rounded-[16px]">
      <Skeleton active avatar paragraph={{rows: 4}} />
    </div>
  )
}

interface ProcessingViewProps {
  linkedinUrl?: string
  parseResult?: string
  extractedData?: Partial<ExtractedData>
  resumeFile?: {
    name: string
    size?: number
  }
}

export default function ProcessingView({linkedinUrl, parseResult = '', extractedData, resumeFile}: ProcessingViewProps) {
  const [showSkeleton, setShowSkeleton] = useState(true)
  const [showAnalysis, setShowAnalysis] = useState(false)
  const t = useTranslations('HomePage')

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
                  {label: 'Name', value: extractedData?.name || 'N/A'},
                  {label: 'Title', value: extractedData?.title || 'N/A'},
                  {label: 'Email', value: extractedData?.email || 'N/A'},
                  {label: 'Phone', value: extractedData?.phone || 'N/A'},
                  {label: 'Location', value: extractedData?.location || 'N/A'},
                  {label: 'LinkedIn', value: extractedData?.linkedin || 'N/A'},
                  {label: 'Sponsorship', value: extractedData?.sponsorship || 'N/A'},
                ]}
                extraType="personal"
              />
              <AnalysisBlock
                title="Your Education background information"
                description="Extracting education details from resume"
                detail="Education Section"
                extra={
                  extractedData?.education?.degrees?.[0]
                    ? {
                        university: extractedData.education.degrees[0].university,
                        degreeType: extractedData.education.degrees[0].degree,
                        major: extractedData.education.degrees[0].degree,
                      }
                    : undefined
                }
                extraType="education"
              />
              <AnalysisBlock
                title={`Your skills list (${extractedData?.skills?.raw_skills?.length || 0})`}
                description="Extracting technical and soft skills"
                detail="Skills Section"
                extra={extractedData?.skills?.raw_skills || []}
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
