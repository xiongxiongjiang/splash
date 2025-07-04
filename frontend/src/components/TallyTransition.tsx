'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { useTranslations } from 'next-intl'
import Logo from '@/assets/logos/tally_logo.svg'

interface TallyTransitionProps {
  duration?: number
  onComplete?: () => void
  showBackground?: boolean
  className?: string
  persistUntilComplete?: boolean
}

export default function TallyTransition({ 
  duration = 2000, 
  onComplete, 
  showBackground = true,
  className = '',
  persistUntilComplete = true
}: TallyTransitionProps) {
  const t = useTranslations('HomePage')
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!persistUntilComplete) {
        setIsVisible(false)
      }
      onComplete?.()
    }, duration)

    return () => clearTimeout(timer)
  }, [duration, onComplete, persistUntilComplete])

  if (!isVisible) return null

  const baseClasses = "flex items-center justify-center"
  const backgroundClasses = showBackground 
    ? "h-screen onboarding-bg" 
    : "h-full"

  return (
    <div className={`${baseClasses} ${backgroundClasses} ${className}`}>
      <div className="flex items-center gap-2">
        <Image src={Logo} alt={t('appName')} width={24} height={24} />
        <span className="font-bold text-[28px] chroma-animate-once">{t('appName')}</span>
      </div>
    </div>
  )
}