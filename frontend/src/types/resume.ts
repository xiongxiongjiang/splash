export interface Job {
  title: string
  years: string
  company: string
  location: string
  description: string
}

export interface Degree {
  gpa?: string
  years: string
  degree: string
  courses?: string
  location: string
  university: string
}

// Profile数据结构（完整的用户档案）
export interface ProfileData {
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
  career_trajectory?: any
  domain_expertise?: any
  leadership_experience?: any
  achievement_highlights?: any
  source_documents?: {
    original_resume: string
  }
  processing_quality?: number
  last_resume_update?: any
  processing_history?: any
  enhancement_status?: string
  confidence_score?: any
  data_sources?: {
    sources: string[]
  }
  keywords?: any
  completeness_metadata?: any
  misc_data?: any
  notes?: any
  id?: number
  user_id?: number
  created_at?: string
  updated_at?: string
}

// Resume数据结构（简历特定数据）
export interface ResumeData {
  name: string
  email: string
  phone: string
  location?: string | null
  professional_summary?: string
  career_level?: string | null
  years_experience?: number
  primary_domain?: string | null
  seniority_keywords?: string | null
  experience?: any
  education?: {
    degrees: Degree[]
  }
  skills?: {
    raw_skills: string[]
  }
  languages?: any
  career_trajectory?: any
  domain_expertise?: any
  leadership_experience?: any
  achievement_highlights?: any
  source_documents?: any
  misc_data?: any
  file_path?: string | null
  file_type?: string
  version?: number
  is_active?: boolean
  customization_notes?: any
  id?: number
  profile_id?: number
  job_posting_id?: number | null
  created_at?: string
  updated_at?: string
}

// API响应结构
export interface ParseResumeResponse {
  success: boolean
  profile?: ProfileData
  resume?: ResumeData
  error?: string
  message?: string
}

// 向后兼容的ExtractedData类型（基于ProfileData）
export type ExtractedData = ProfileData & {
  // 兼容旧版本字段
  title?: string
  linkedin?: string
  sponsorship?: string
}

export interface PersonalExtra {
  label: string
  value: string
}

export interface EducationExtra {
  university: string
  degreeType: string
  major: string
}
