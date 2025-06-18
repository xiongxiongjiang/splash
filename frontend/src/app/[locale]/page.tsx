'use client';

import { useEffect, useRef } from 'react';
import CountUp from 'react-countup';

import { gsap } from 'gsap';
import { TextPlugin } from 'gsap/TextPlugin';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

import Header from '@/components/Header';
import InfiniteLogoScroller from '@/components/InfiniteLogoScroller';
import LandingPageBg from '@/components/LandingPageBg';
import { Avatar, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';

import BgBubble from '@/assets/images/bg_bubble.svg';
import { supabase } from '@/lib/supabase';

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
  const waitlistRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const hasAnimated = useRef(false); // 防止动画重复执行

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      console.log('data', data);
    });
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

      // gsap.to(logoRef.current, {
      //   opacity: 1,
      //   x: 0,
      //   duration: 1,
      //   ease: 'power3.out',
      // });

      gsap.to(waitlistRef.current, {
        opacity: 1,
        y: 0,
        duration: 1,
        delay: 0.5,
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
            duration: 2,
            opacity: 1,
          });
      });

      // Copilot 文字扫描动画 (保持不变)
      const copilotScanTl = gsap.timeline({
        delay: 0.5,
      });

      copilotScanTl.fromTo(
        '#copilot-mask-rect',
        { attr: { x: -30 } },
        {
          duration: 0.8,
          attr: { x: 450 },
          ease: 'none',
        },
      );
    });
  }, []);

  const avatarData = [
    {
      src: 'https://wwtyksrhuycqxxbyvqml.supabase.co/storage/v1/object/public/images//jimmy-fermin-bqe0J0b26RQ-unsplash.jpg',
      alt: '@1',
    },
    {
      src: 'https://wwtyksrhuycqxxbyvqml.supabase.co/storage/v1/object/public/images//slav-romanov-BrEAp01_m5w-unsplash.jpg',
      alt: '@2',
    },
    {
      src: 'https://wwtyksrhuycqxxbyvqml.supabase.co/storage/v1/object/public/images//jack-finnigan-rriAI0nhcbc-unsplash.jpg',
      alt: '@3',
    },
    {
      src: 'https://wwtyksrhuycqxxbyvqml.supabase.co/storage/v1/object/public/images//jeffery-erhunse-vp9mRauo68c-unsplash.jpg',
      alt: '@4',
    },
    {
      src: 'https://wwtyksrhuycqxxbyvqml.supabase.co/storage/v1/object/public/images//aiony-haust-owp8uQgoK8U-unsplash.jpg',
      alt: '@5',
    },
  ];
  const toSurvey = () => {
    router.push('/survey');
  };
  return (
    <>
      <LandingPageBg />
      <div className="min-h-screen transparent flex flex-col">
        {/* Header */}
        <Header />
        {/* Hero Section */}
        <main ref={heroRef} className="w-full max-w-full flex-1 flex flex-col justify-center z-[20]">
          <div className="w-full flex-1 text-center space-y-8 px-4">
            <div className="space-y-4 mt-8">
              <div className="md:text-[60px] text-[28px] font-semibold tracking-tight">
                <div className="relative flex items-center justify-center md:flex-row flex-col">
                  <div className="relative flex items-center justify-center">
                    <span className="absolute md:left-[-30px] left-[-10px]">
                      <Image
                        src={BgBubble}
                        alt="Hello"
                        width={200} // 你可以用固定宽度或 max-w
                        height={0} // 这里给 0，让 height 用自动撑开
                        objectFit="cover"
                        style={{ height: '100%', objectFit: 'cover' }}
                        className="block z-10 scale-190"
                      />
                    </span>
                    <span className="chroma-text chroma-hidden chroma-gradient  chroma-reveal">Hello,</span>
                  </div>
                  <span className="md:ml-8">Career Wingman</span>
                </div>
              </div>

              <p className="text-[14px] md:text-[32px] pt-4 text-[rgba(0,0,0,0.35)]">
                Tally answers your questions, tailors your résumés, and gets you referrals.
              </p>
            </div>

            <h2 ref={textRef} className="text-[18px] md:text-[40px] font-bold min-h-[60px]">
              How Do I Get A PM Job At Meta?
            </h2>

            <div className="pt-4">
              <Button
                onClick={toSurvey}
                className="bg-black rounded-[16px] px-10 py-6 text-lg font-medium transition-colors
                hover:bg-[rgba(0,0,0,0.8)]
                "
              >
                SIGN UP FOR FREE
              </Button>
            </div>

            <div ref={waitlistRef} className="flex flex-col items-center space-y-3 opacity-0 translate-y-5">
              <div className="*:data-[slot=avatar]:ring-background -space-x-2 *:data-[slot=avatar]:ring-2 hidden md:flex">
                {avatarData.map(({ src, alt }, index) => (
                  <Avatar key={index}>
                    <AvatarImage src={src} alt={alt} />
                  </Avatar>
                ))}
              </div>
              <p className="text-gray-600 hidden md:flex">
                Join <CountUp start={0} end={12200} duration={2.5} separator="," />+ others on the waitlist
              </p>
            </div>
          </div>
          <div className="w-full pb-10">
            <InfiniteLogoScroller />
          </div>
        </main>
      </div>
    </>
  );
}
