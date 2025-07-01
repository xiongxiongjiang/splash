/**
 * API Client for Backend Communication
 * Handles user sync and resume management
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export interface User {
  id: number
  supabase_id: string
  email: string
  name?: string
  role: string
  created_at: string
  last_seen?: string
}

export interface Resume {
  id: number
  name: string
  email: string
  phone?: string
  title: string
  experience_years: number
  skills: string[]
  education?: string
  summary?: string
  user_id?: number
  created_at: string
}

export interface ApiResponse<T> {
  success?: boolean
  data?: T
  message?: string
  error?: string
}

class ApiClient {
  private baseUrl: string
  private token: string | null = null

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl
  }

  /**
   * Set the Supabase JWT token for authenticated requests
   */
  setToken(token: string) {
    this.token = token
  }

  /**
   * Clear the authentication token
   */
  clearToken() {
    this.token = null
  }

  /**
   * Make authenticated API request
   */
  private async request<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    }

    // Add auth header if token is available
    if (this.token) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${this.token}`
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`API Error ${response.status}: ${errorText}`)
      }

      return await response.json()
    } catch (error) {
      console.error(`API request failed for ${endpoint}:`, error)
      throw error
    }
  }

  /**
   * Sync user data with backend after OAuth login
   * This will create or update the user in the backend database
   */
  async syncUser(supabaseUser: Record<string, any>): Promise<User> {
    try {
      // First try to get existing user
      const existingUser = await this.request<{ user: User }>(`/users/by-email/${supabaseUser.email}`)
      return existingUser.user
    } catch (error: any) {
      console.error('❌ User sync failed:', error)
      // Re-throw the error instead of returning fake data
      throw new Error(`Backend sync failed: ${error.message}`)
    }
  }

  /**
   * Get current user profile
   */
  async getCurrentUser(): Promise<{ user: User; message: string }> {
    return this.request('/me')
  }

  /**
   * Get user's resumes
   */
  async getUserResumes(): Promise<{ resumes: Resume[]; count: number; user_email: string }> {
    return this.request('/my-resumes')
  }

  /**
   * Get all resumes (public endpoint)
   */
  async getAllResumes(params?: {
    limit?: number
    skill?: string
    min_experience?: number
  }): Promise<{
    resumes: Resume[]
    total_in_db: number
    returned: number
    filters_applied: any
    user_authenticated: boolean
  }> {
    const searchParams = new URLSearchParams()
    if (params?.limit) searchParams.append('limit', params.limit.toString())
    if (params?.skill) searchParams.append('skill', params.skill)
    if (params?.min_experience) searchParams.append('min_experience', params.min_experience.toString())
    
    const endpoint = `/resumes${searchParams.toString() ? `?${searchParams}` : ''}`
    return this.request(endpoint)
  }

  /**
   * Get specific resume by ID
   */
  async getResume(id: number): Promise<{ success: boolean; resume: Resume; user_authenticated: boolean }> {
    return this.request(`/resumes/${id}`)
  }

  /**
   * Create new resume
   */
  async createResume(resumeData: Omit<Resume, 'id' | 'created_at' | 'user_id'>): Promise<{
    success: boolean
    resume: Resume
    message: string
  }> {
    return this.request('/resumes', {
      method: 'POST',
      body: JSON.stringify(resumeData),
    })
  }

  /**
   * Search resumes by skill
   */
  async searchResumesBySkill(skill: string): Promise<{
    skill_searched: string
    resumes: Resume[]
    count: number
    user_authenticated: boolean
  }> {
    return this.request(`/resumes/search/skills?skill=${encodeURIComponent(skill)}`)
  }

  /**
   * Get database statistics
   */
  async getStats(): Promise<{
    total_resumes: number
    total_users: number
    average_experience_years: number
  }> {
    return this.request('/stats')
  }

  /**
   * Test backend connection
   */
  async healthCheck(): Promise<{ status: string }> {
    return this.request('/health')
  }

  /**
   * Add email to waitlist
   */
  async addToWaitlist(email: string, info?: Record<string, any>): Promise<{
    email: string
    info: Record<string, any>
    created_at: string | null
    updated_at: string | null
  }> {
    return this.request('/waitlist', {
      method: 'POST',
      body: JSON.stringify({ email, info: info || {} })
    })
  }

  /**
   * Update waitlist info for an email
   */
  async updateWaitlistInfo(email: string, info: Record<string, any>): Promise<{
    email: string
    info: Record<string, any>
    created_at: string | null
    updated_at: string | null
  }> {
    return this.request(`/waitlist/${encodeURIComponent(email)}`, {
      method: 'PATCH',
      body: JSON.stringify({ info })
    })
  }

  /**
   * Get available chat models
   */
  async getChatModels(): Promise<{
    object: string
    data: Array<{
      id: string
      object: string
      created: number
      owned_by: string
      permission: any[]
      root: string
      parent: string | null
    }>
  }> {
    return this.request('/chat/models')
  }

  /**
   * Create chat completion
   */
  async createChatCompletion(messages: Array<{
    role: 'user' | 'assistant' | 'system'
    content: string
  }>, options?: {
    model?: string
    temperature?: number
    max_tokens?: number
    stream?: boolean
  }): Promise<{
    id: string
    object: string
    created: number
    model: string
    choices: Array<{
      finish_reason: string
      index: number
      message: {
        content: string
        role: string
        tool_calls: any
        function_call: any
      }
    }>
    usage: {
      completion_tokens: number
      prompt_tokens: number
      total_tokens: number
    }
  }> {
    return this.request('/chat/completions', {
      method: 'POST',
      body: JSON.stringify({
        messages,
        model: options?.model || 'gemini/gemini-1.5-flash',
        temperature: options?.temperature || 0.7,
        max_tokens: options?.max_tokens || 1000,
        stream: options?.stream || false,
      })
    })
  }

  /**
   * Upload file to S3
   */
  async uploadFile(file: File): Promise<{
    success: boolean
    file_url: string
    s3_key: string
    bucket: string
    original_name: string
    uploaded_name: string
    content_type: string
    file_size: number
    folder: string
  }> {
    const formData = new FormData()
    formData.append('file', file)

    const response = await fetch(`${this.baseUrl}/upload`, {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.detail || `Upload failed with status ${response.status}`)
    }

    return response.json()
  }

  /**
   * Parse resume from URL using streaming response
   */
  async parseResume(fileUrl: string): Promise<ReadableStream<Uint8Array>> {
    const response = await fetch(`${this.baseUrl}/resume-parse`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ file_url: fileUrl })
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.detail || `Resume parsing failed with status ${response.status}`)
    }

    if (!response.body) {
      throw new Error('No response body received')
    }

    return response.body
  }

  /**
   * Parse resume with callback for streaming data
   */
  async parseResumeWithCallback(
    fileUrl: string, 
    onData: (data: string) => void,
    onComplete?: () => void,
    onError?: (error: Error) => void
  ): Promise<void> {
    try {
      const stream = await this.parseResume(fileUrl)
      const reader = stream.getReader()
      const decoder = new TextDecoder()

      while (true) {
        const { done, value } = await reader.read()
        
        if (done) {
          onComplete?.()
          break
        }

        const chunk = decoder.decode(value, { stream: true })
        const lines = chunk.split('\n')
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim()
            if (data && data !== '[DONE]') {
              try {
                const parsed = JSON.parse(data)
                if (parsed.answer) {
                  onData(parsed.answer)
                }
              } catch (e) {
                // Ignore JSON parse errors for partial data
              }
            }
          }
        }
      }
    } catch (error) {
      onError?.(error as Error)
    }
  }
}

// Export singleton instance
export const apiClient = new ApiClient()

// Helper function to sync user after Supabase auth
export async function syncUserWithBackend(supabaseUser: Record<string, any>, accessToken: string): Promise<User> {
  apiClient.setToken(accessToken)
  return await apiClient.syncUser(supabaseUser)
}

// Helper function to get user resumes
export async function getUserResumes(accessToken: string) {
  apiClient.setToken(accessToken)
  return await apiClient.getUserResumes()
} 