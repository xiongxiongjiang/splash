'use client';

import { useEffect, useRef, useState } from 'react';

import { gsap } from 'gsap';
import { TextPlugin } from 'gsap/TextPlugin';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

import Header from '@/components/Header';
import InfiniteLogoScroller from '@/components/InfiniteLogoScroller';
import LandingPageBg from '@/components/LandingPageBg';

import BgBubble from '@/assets/images/bg_copilot.svg';
import TallyLogo from '@/assets/logos/tally_logo.svg';
import { supabase } from '@/lib/supabase';
import { useSurveyStore } from '@/store/survey';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(TextPlugin);
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
];

export default function TallyAILanding() {
  const textRef = useRef<HTMLHeadingElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const hasAnimated = useRef(false); // 防止动画重复执行
  const [hasClickedSignUp, setHasClickedSignUp] = useState(false);
  const { isCompleted } = useSurveyStore();
  const chromaTextRef = useRef<HTMLSpanElement>(null);
  // 处理20s一次渐变动画
  useEffect(() => {
    const el = chromaTextRef.current;
    if (!el) return;
    let interval: ReturnType<typeof setInterval> | null = null;
    const timeout = setTimeout(() => {
      interval = setInterval(() => {
        el.style.animation = 'none';
        void el.offsetWidth;
        el.style.animation = 'start-gradient 0s forwards, chroma-scroll 1.2s ease-in-out forwards';
      }, 20000);
    }, 5000);

    return () => {
      clearTimeout(timeout);
      if (interval !== null) clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    if (hasAnimated.current) return;
    hasAnimated.current = true;
    requestAnimationFrame(() => {
      // 入场动画逻辑
      gsap.to(heroRef.current, {
        opacity: 1,
        y: 0,
        duration: 1,
        ease: 'power3.out',
      });

      // 打字动画循环
      const textTimeline = gsap.timeline({ repeat: -1 });
      jobQuestions.forEach((question) => {
        textTimeline
          .to(textRef.current, {
            duration: 0.5,
            opacity: 0,
            ease: 'power1.inOut',
            onComplete: () => {
              if (textRef.current) textRef.current.innerText = '';
            },
          })
          .to(textRef.current, {
            duration: 2,
            text: question,
            ease: 'none',
            opacity: 1,
          })
          .to(textRef.current, {
            duration: 5,
            opacity: 1,
          });
      });
    });
  }, []);

  const toSurvey = () => {
    // 设置点击状态为 true
    setHasClickedSignUp(true);

    // 延迟1秒
    setTimeout(() => {
      router.push('/survey');
    }, 1000);
  };
  return (
    <>
      <LandingPageBg animationSpeed={hasClickedSignUp ? 'fast' : 'slow'} />
      <div className="min-h-screen transparent flex flex-col">
        {/* Header */}
        <Header />
        {/* Hero Section */}
        <main
          ref={heroRef}
          className="w-full max-w-full flex-1 flex flex-col justify-center z-[20] mobile:py-[50px] tablet:p-0"
        >
          <div className="w-full flex-1 flex flex-col justify-center text-center px-[44px]">
            <div className="mt-8">
              <div className="text-[28px] font-semibold tablet:text-[60px] web:text-[60px] tracking-tight">
                <div className="relative flex items-center justify-center">
                  <span className="mr-5 tablet:mr-10">Your career</span>
                  <div className="relative flex items-center justify-center">
                    <span className="absolute tablet:left-[10px]">
                      <Image
                        src={BgBubble}
                        alt="copilot"
                        width={200} // 你可以用固定宽度或 max-w
                        height={0} // 这里给 0，让 height 用自动撑开
                        objectFit="cover"
                        style={{ height: '100%', objectFit: 'cover' }}
                        className="block z-10 scale-190"
                      />
                    </span>
                    <span ref={chromaTextRef} className="chroma-text">
                      Copilot.
                    </span>
                  </div>
                </div>
              </div>

              <p className="text-[21px] font-medium tablet:text-[32px] pt-4 text-[rgba(0,0,0,0.35)] mt-4 tablet:mt-6 web:mt-6">
                Precision guidance from résumé to referral.
              </p>
            </div>
            <div className="py-[76px]">
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
                  disabled:cursor-not-allowed
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
          <div className="w-full">
            <InfiniteLogoScroller />
          </div>
        </main>
      </div>
    </>
  );
}
