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
    console.log('🔄 Syncing user with backend:', supabaseUser.email)
    
    try {
      // First try to get existing user
      const existingUser = await this.request<{ user: User }>(`/users/by-email/${supabaseUser.email}`)
      console.log('✅ Found existing user:', existingUser.user.email)
      return existingUser.user
    } catch (error: any) {
      // User doesn't exist, this is expected for new users
      console.log('👤 New user detected, will be created on first authenticated request')
      console.log('Sync error:', error)
      
      // The backend will automatically create the user when they make their first authenticated request
      // due to the get_current_user dependency injection
      return {
        id: 0, // Temporary ID
        supabase_id: supabaseUser.id,
        email: supabaseUser.email,
        name: supabaseUser.user_metadata?.full_name || supabaseUser.email,
        role: 'user',
        created_at: new Date().toISOString(),
      }
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