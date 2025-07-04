'use client'

import {useEffect, useRef, useState} from 'react'

import {gsap} from 'gsap'
import {TextPlugin} from 'gsap/TextPlugin'
import Image from 'next/image'
import {useRouter} from 'next/navigation'

import Header from '@/components/Header'
import InfiniteLogoScroller from '@/components/InfiniteLogoScroller'
import BgBubble from '@/assets/images/bg_copilot.png'
import {supabase} from '@/lib/supabase'
import {useSurveyStore} from '@/store/survey'

if (typeof window !== 'undefined') {
  gsap.registerPlugin(TextPlugin)
}

const jobQuestions = [
  'How do I get this PM job at Meta? ',
  'Make my résumé ATS-proof.',
  'Does my resume fit this OpenAI software engineer role?',
  'What résumé bullets will wow Tesla for this data science job?',
  'Can you rewrite my cover letter for Airbnb?',
  'Who can intro me to the hiring manager for this Google Cloud job?',
  'Will these portfolio projects help me with this Apple designer role?',
  'Summarize my GitHub projects into my résumé.',
  'Which of these five startups is my best fit?',
  'Draft a friendly referral request to a Netflix engineer.',
]

export default function TallyAILanding() {
  const textRef = useRef<HTMLHeadingElement>(null)
  const router = useRouter()
  const hasAnimated = useRef(false) // 防止动画重复执行

  // Redirect logged-in users to dashboard
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        router.push('/en/dashboard');
      }
    };
    checkAuth();
  }, [router]);
  const {isCompleted} = useSurveyStore()
  const chromaTextRef = useRef<HTMLSpanElement>(null)
  const [locale, setLocale] = useState('en')

  // Dashboard redirect functionality - checking for authenticated users
  useEffect(() => {
    // Get locale from URL path
    const pathSegments = window.location.pathname.split('/')
    const currentLocale = pathSegments[1] || 'en'
    setLocale(currentLocale)
    // supabase.auth.getSession().then(({data}) => {
    //   console.log('session data', data)
    //   // If user is already logged in, redirect to dashboard
    //   if (data.session?.user) {
    //     console.log('User already authenticated, redirecting to dashboard')
    //     router.push(`/${currentLocale}/dashboard`)
    //   }
    // })
  }, [router])

  useEffect(() => {
    if (hasAnimated.current) return
    hasAnimated.current = true

    const ctx = gsap.context(() => {
      const textTimeline = gsap.timeline({repeat: -1})

      jobQuestions.forEach(question => {
        textTimeline
          .to(textRef.current, {
            duration: 0.5,
            opacity: 0,
            ease: 'power1.inOut',
            onComplete: () => {
              if (textRef.current) {
                textRef.current.innerText = ''
              }
            },
          })
          .to(textRef.current, {
            duration: 2,
            text: question,
            ease: 'none',
            opacity: 1,
          })
          .to({}, {duration: 5})
      })
    })

    return () => ctx.revert()
  }, [])

  const toSurvey = () => {
    setTimeout(() => {
      router.push(`/${locale}/survey`)
    }, 300)
  }
  return (
    <>
      <div className="min-h-screen transparent flex flex-col">
        {/* Header */}
        <Header />
        {/* Hero Section */}
        <main className="w-full max-w-full flex-1 flex flex-col justify-center z-[20]">
          <div className="w-full flex-1 flex flex-col justify-start tablet:justify-center text-center px-[44px]">
            <div className="pt-15 tablet:pt-8">
              <div className="text-[28px] font-semibold tablet:text-[60px] web:text-[60px] tracking-tight">
                <div className="relative flex items-center justify-center">
                  <span className="mr-4 tablet:mr-7">Your career</span>
                  <div className="relative flex items-center justify-center">
                    <span className="absolute">
                      <Image
                        src={BgBubble}
                        alt="copilot"
                        // width={200} // 你可以用固定宽度或 max-w
                        height={0} // 这里给 0，让 height 用自动撑开
                        style={{ objectFit: 'cover' }}
                        className="block z-10 scale-220"
                        priority
                      />
                    </span>
                    <span ref={chromaTextRef} className="chroma-text ml-2.5 tablet:ml-4">
                      Copilot.
                    </span>
                  </div>
                </div>
              </div>

              <p className="text-[21px] font-medium tablet:text-[32px] pt-4 text-[rgba(0,0,0,0.35)] mt-4 tablet:mt-6 web:mt-6">
                Precision guidance from résumé to referral.
              </p>
            </div>
            <div className="py-15 tablet:py-18">
              <button
                onClick={toSurvey}
                disabled={isCompleted}
                className="
                  text-sm rounded-[16px] !font-[800] px-12 py-4 tablet:px-20 table:py-5 tablet:text-xl web:px-20 web:py-5 web:text-[16px] transition-colors
                  bg-black text-white
                  hover:bg-[rgba(0,0,0,0.8)]
                  active:bg-black
                  disabled:bg-[rgba(0,0,0,0.05)]
                  disabled:text-[rgba(0,0,0,0.6)]
                  disabled:hover:bg-[rgba(0,0,0,0.05)]
                  disabled:active:bg-[rgba(0,0,0,0.05)]
                "
              >
                {isCompleted ? `WE'LL BE IN TOUCH` : 'SIGN UP FOR EARLY ACCESS'}
              </button>
            </div>

            <h2
              ref={textRef}
              className="text-[18px] typing-text font-medium h-15 tablet:h-30 tablet:text-[40px] min-h-[60px] max-w-[305px] tablet:max-w-[720px] mx-auto"
            >
              How Do I Get A PM Job At Meta?
            </h2>
          </div>
          <div className="w-full mobile:mb-10 tablet:mb-0">
            <InfiniteLogoScroller />
          </div>
        </main>
      </div>
    </>
  )
}
