'use client'

import { useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { apiClient } from '@/lib/api'

export default function SignOutPage() {
  const router = useRouter()
  const params = useParams()
  const locale = params.locale as string

  useEffect(() => {
    const handleSignOut = async () => {
      try {
        // Clear Supabase auth
        await supabase.auth.signOut()
        
        // Clear API client token
        apiClient.clearToken()
        
        // Redirect to login page
        router.push(`/${locale}/login`)
      } catch (error) {
        console.error('Sign out error:', error)
        // Even if there's an error, redirect to login
        router.push(`/${locale}/login`)
      }
    }

    handleSignOut()
  }, [router, locale])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Signing you out...</p>
      </div>
    </div>
  )
}