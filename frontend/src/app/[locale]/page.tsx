'use client';

import { useEffect, useRef } from 'react';
import CountUp from 'react-countup';

import { gsap } from 'gsap';
import { TextPlugin } from 'gsap/TextPlugin';
import Image from 'next/image';

import InfiniteLogoScroller from '@/components/InfiniteLogoScroller';
import { Avatar, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import LandingPageBg from '@/components/LandingPageBg';

import BgCopilot from '@/assets/images/bg_copilot.svg';
import { supabase } from '@/lib/supabase';
// 为你的 Logo 数组应用类型
const partnerLogos = [
  {
    src: 'https://wwtyksrhuycqxxbyvqml.supabase.co/storage/v1/object/public/images/logos/logo_airnb.png',
    alt: 'Airbnb Logo',
  },
  {
    src: 'https://wwtyksrhuycqxxbyvqml.supabase.co/storage/v1/object/public/images/logos/logo_goole.png',
    alt: 'Google Logo',
  },
  {
    src: 'https://wwtyksrhuycqxxbyvqml.supabase.co/storage/v1/object/public/images/logos/logo_microsoft.png',
    alt: 'Microsoft Logo',
  },
  {
    src: 'https://wwtyksrhuycqxxbyvqml.supabase.co/storage/v1/object/public/images/logos/logo_netflix.png',
    alt: 'Netflix Logo',
  },
  {
    src: 'https://wwtyksrhuycqxxbyvqml.supabase.co/storage/v1/object/public/images/logos/logo_slack.png',
    alt: 'Slack Logo',
  },
  {
    src: 'https://wwtyksrhuycqxxbyvqml.supabase.co/storage/v1/object/public/images/logos/logo_spotify.png',
    alt: 'Spotify Logo',
  },
];
if (typeof window !== 'undefined') {
  gsap.registerPlugin(TextPlugin);
}

const jobQuestions = [
  'How Do I Get A PM Job At Meta?',
  'Resume A Good Match For The Role?',
  'Prepare For Technical Interviews?',
  'Stand Out From Other Candidates?',
];

export default function TallyAILanding() {
  const textRef = useRef<HTMLHeadingElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const logoRef = useRef<HTMLDivElement>(null);
  const waitlistRef = useRef<HTMLDivElement>(null);

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

      gsap.to(logoRef.current, {
        opacity: 1,
        x: 0,
        duration: 1,
        ease: 'power3.out',
      });

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
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-[rgba(235,235,235,0.7)]">
      <LandingPageBg />
      {/* Header */}
      <header className="container mx-auto px-4 py-6 flex justify-between items-center">
        <div ref={logoRef} className="flex items-center gap-2 opacity-0 -translate-x-5">
          <div className="grid grid-cols-2 gap-0.5">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="w-2 h-2 bg-black rounded-sm"></div>
            ))}
          </div>
          <span className="font-bold text-xl">Tally AI</span>
        </div>
        <button className="border border-gray-300 hover:bg-gray-50 rounded-full px-8 py-2 font-medium transition-colors">
          JOIN
        </button>
      </header>

      {/* Hero Section */}
      <main ref={heroRef} className="w-full max-w-full flex justify-center flex-col">
        <div className="w-full text-center space-y-8 px-4">
          <div className="space-y-4 mt-8">
            <div className="text-6xl font-semibold tracking-tight">
              Your Job Search
              <span className="relative inline-block ml-12">
                <Image
                  height={200}
                  src={BgCopilot}
                  className="absolute top-[-38px] left-2 z-10 scale-[2]"
                  alt="Copilot"
                />

                <div className="relative z-0 inline-block align-middle">
                  <svg viewBox="0 0 450 120" height="60px" width="auto">
                    <defs>
                      <linearGradient id="copilot-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#2294D2" />
                        <stop offset="35%" stopColor="#F972B8" />
                        <stop offset="68%" stopColor="#E58524" />
                        <stop offset="100%" stopColor="#2B9CE7" />
                      </linearGradient>

                      <filter id="copilot-blur-filter">
                        <feGaussianBlur stdDeviation="6" />
                      </filter>

                      <mask id="copilot-text-mask">
                        <rect width="100%" height="100%" fill="black" />
                        <rect
                          id="copilot-mask-rect"
                          width="20%"
                          height="100%"
                          fill="white"
                          filter="url(#copilot-blur-filter)"
                        />
                      </mask>
                    </defs>

                    <text
                      x="50%"
                      y="50%"
                      dy="0.3em"
                      textAnchor="middle"
                      fill="#333"
                      fontSize="120px"
                      fontWeight="600"
                      letterSpacing="-0.025em"
                    >
                      Copilot.
                    </text>

                    <text
                      x="50%"
                      y="50%"
                      dy="0.3em"
                      textAnchor="middle"
                      fill="url(#copilot-grad)"
                      mask="url(#copilot-text-mask)"
                      fontSize="120px"
                      fontWeight="600"
                      letterSpacing="-0.025em"
                    >
                      Copilot.
                    </text>
                  </svg>
                </div>
              </span>
            </div>
            <p className="text-[32px] pt-4  text-[rgba(0,0,0,0.35)]">
              Get tailored advice and referral tips for jobs at your favorite companies
            </p>
          </div>

          <h2 ref={textRef} className="text-3xl md:text-4xl lg:text-5xl font-bold min-h-[60px]">
            How Do I Get A PM Job At Meta?
          </h2>

          <div className="pt-4">
            <Button className="bg-black  rounded-[16px] px-10 py-6 text-lg font-medium transition-colors">
              JOIN WAITLIST
            </Button>
          </div>

          <div ref={waitlistRef} className="flex flex-col items-center space-y-3 opacity-0 translate-y-5">
            <div className="*:data-[slot=avatar]:ring-background flex -space-x-2 *:data-[slot=avatar]:ring-2">
              {avatarData.map(({ src, alt }, index) => (
                <Avatar key={index}>
                  <AvatarImage src={src} alt={alt} />
                </Avatar>
              ))}
            </div>
            <p className="text-gray-600">
              Join <CountUp start={0} end={12200} duration={2.5} separator="," />+ others on the waitlist
            </p>
          </div>
        </div>
        <InfiniteLogoScroller />
      </main>
    </div>
  );
}
