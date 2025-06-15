'use client';
import React from 'react';

import Image, { StaticImageData } from 'next/image';

import AuthForm from '@/components/AuthForm';

import bgRegister from '@/assets/images/bg_register.png';
interface CompanyLogoProps {
  logo: StaticImageData | string;
  alt?: string;
}
const RegisterPage: React.FC = () => {
  // 定义数据源
  const logos = [
    {
      id: 1,
      src: 'https://wwtyksrhuycqxxbyvqml.supabase.co/storage/v1/object/public/images/logos/logo_airnb.png',
      alt: 'Airbnb Logo',
    },
    {
      id: 2,
      src: 'https://wwtyksrhuycqxxbyvqml.supabase.co/storage/v1/object/public/images/logos/logo_goole.png',
      alt: 'Google Logo',
    },
    {
      id: 3,
      src: 'https://wwtyksrhuycqxxbyvqml.supabase.co/storage/v1/object/public/images/logos/logo_microsoft.png',
      alt: 'Microsoft Logo',
    },
    {
      id: 4,
      src: 'https://wwtyksrhuycqxxbyvqml.supabase.co/storage/v1/object/public/images/logos/logo_netflix.png',
      alt: 'Netflix Logo',
    },
    {
      id: 5,
      src: 'https://wwtyksrhuycqxxbyvqml.supabase.co/storage/v1/object/public/images/logos/logo_slack.png',
      alt: 'Slack Logo',
    },
    {
      id: 6,
      src: 'https://wwtyksrhuycqxxbyvqml.supabase.co/storage/v1/object/public/images/logos/logo_spotify.png',
      alt: 'Spotify Logo',
    },
  ];
  const CompanyLogo = ({ logo, alt = 'Company Logo' }: CompanyLogoProps) => (
    <div className="bg-white rounded-xl flex justify-center p-6 shadow-sm items-center gap-3 min-w-[160px]">
      <Image src={logo} width={128} height={48} alt={alt} />
    </div>
  );

  return (
    // bg-gradient-to-br from-green-100 via-blue-50 to-purple-100
    <div
      className="min-h-screen gap-6 p-10 flex justify-around bg-no-repeat bg-cover bg-center"
      style={{ backgroundImage: `url(${bgRegister.src})` }}
    >
      {/* Left Side - Marketing Content */}
      <div className="flex justify-center items-center">
        <div className="max-w-3xl">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-12">
            <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
            </div>
            <span className="text-[42px] font-bold text-black">Tally AI</span>
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
