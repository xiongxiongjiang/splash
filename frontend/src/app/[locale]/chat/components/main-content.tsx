import React, { useState, useEffect } from 'react'

import ModernChat from '@/components/ModernChat'
import { Resume, getUserResumes } from '@/lib/api'
import { supabase } from '@/lib/supabase'

const MainContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = props => {
  const [resumes, setResumes] = useState<Resume[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadResumes = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) {
          setIsLoading(false)
          return
        }

        const resumesData = await getUserResumes(session.access_token)
        setResumes(resumesData.resumes)
      } catch (error) {
        console.error('Error loading resumes:', error)
        setResumes([])
      } finally {
        setIsLoading(false)
      }
    }

    loadResumes()
  }, [])

  return (
    <div {...props} className="flex-1 flex flex-col ml-9 my-9 transition-[padding-left] duration-200 ease-linear">
      <div className="flex-1 overflow-y-auto scrollbar-custom">
        <ModernChat resumes={resumes} />
      </div>
    </div>
  )
}

export default MainContent
