'use client';
import React from 'react';

import Image, { StaticImageData } from 'next/image';
import { useTranslations } from 'next-intl';

import AuthForm from '@/components/AuthForm';
import LandingPageBg from '@/components/LandingPageBg';

import Airbnb from '@/assets/logos/Airbnb.svg';
import Google from '@/assets/logos/Google.svg';
import Microsoft from '@/assets/logos/Microsoft.svg';
import Netflix from '@/assets/logos/Netflix.svg';
import Slack from '@/assets/logos/Slack.svg';
import Spotify from '@/assets/logos/Spotify.svg';
import logo from '@/assets/logos/tally_logo.svg';
interface CompanyLogoProps {
  logo: StaticImageData | string;
  alt?: string;
}

const RegisterPage: React.FC = () => {
  const t = useTranslations('HomePage');
  // 定义数据源
  const logos = [
    {
      id: 1,
      src: Airbnb,
      alt: 'Airbnb Logo',
    },
    {
      id: 2,
      src: Google,
      alt: 'Google Logo',
    },
    {
      id: 3,
      src: Microsoft,
      alt: 'Microsoft Logo',
    },
    {
      id: 4,
      src: Netflix,
      alt: 'Netflix Logo',
    },
    {
      id: 5,
      src: Slack,
      alt: 'Slack Logo',
    },
    {
      id: 6,
      src: Spotify,
      alt: 'Spotify Logo',
    },
  ];
  const CompanyLogo = ({ logo, alt = 'Company Logo' }: CompanyLogoProps) => (
    <div className="bg-white rounded-[16px] flex justify-center shadow-sm items-center gap-3 min-w-[160px]">
      <Image src={logo} width={190} height={80} alt={alt} />
    </div>
  );

  return (
    // bg-gradient-to-br from-green-100 via-blue-50 to-purple-100
    <div className="min-h-screen gap-6 p-10 flex justify-around bg-no-repeat bg-cover bg-center">
      <LandingPageBg />
      {/* Left Side - Marketing Content */}
      <div className="flex justify-center items-center">
        <div className="max-w-3xl">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-12">
            <Image src={logo} alt={t('appName')} width={32} height={32} />
            <span className="text-[42px] font-bold text-black">{t('appName')}</span>
          </div>

          {/* Main Content */}
          <div className="mb-16">
            <h1 className="text-[32px] font-bold text-[rgba(0,0,0,0.8)] mb-8 leading-tight">
              Your next job is just one ask away{' '}
              <span className="block">— powered by AI that actually gets you there.</span>
            </h1>
            <p className="text-2xl font-semibold text-[rgba(0,0,0,0.6)] leading-relaxed">
              Get tailored advice and referral tips for jobs at your favourite companies
            </p>
          </div>

          {/* Company Logos */}
          <div className="grid grid-cols-3 gap-6">
            {logos.map(({ id, src, alt }) => (
              <CompanyLogo key={id} logo={src} alt={alt} />
            ))}
          </div>
        </div>
      </div>

      {/* Right Side - Auth Form */}
      <div className="flex items-center justify-start">
        <div className="w-full max-w-md bg-white rounded-[30px] shadow-lg">
          <AuthForm />
        </div>
      </div>
    </div>
  );
};
export default RegisterPage;
