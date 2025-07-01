'use client'
import React, {useEffect} from 'react'

import {ChevronLeft} from 'lucide-react'
import Image from 'next/image'
import {useRouter} from 'next/navigation'
import {useTranslations} from 'next-intl'

import Logo from '@/assets/logos/tally_logo.svg'
// import { useSurveyStore } from '@/store/survey';

const Header = ({showBackButton = false, fixed = false}: {showBackButton?: boolean; fixed?: boolean}) => {
  const t = useTranslations('HomePage')
  const router = useRouter()
  // const { reset } = useSurveyStore();
  // ESC key handler
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        handleExit()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [])
  // Handle exit functionality
  const handleExit = () => {
    // reset();
    router.back()
  }
  return (
    <header
      className={`mx-auto h-[136px] px-[1.3vh] tablet:px-[3vh] flex items-center z-10 opacity-40 bg-transparent ${
        fixed ? 'fixed top-0 left-0 right-0' : ''
      }`}
    >
      {showBackButton && (
        <button onClick={handleExit} className="p-2 tablet:p-4" aria-label="Exit survey">
          <ChevronLeft strokeWidth={2} size={24} className="text-[rgba(0,0,0,1)]" />
        </button>
      )}
      <div className={`flex-1 flex justify-center items-center gap-2 ${showBackButton ? 'pr-10 tablet:pr-14' : ''}`}>
        <Image src={Logo} alt={t('appName')} width={24} height={24} className="w-4 h-4 tablet:w-6 tablet:h-6" />
        <span className="font-bold text-[18px] tablet:text-[28px]">{t('appName')}</span>
      </div>
    </header>
  )
}

export default Header
