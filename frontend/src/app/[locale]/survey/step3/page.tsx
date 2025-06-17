'use client';

import type React from 'react';

import Header from '@/components/Header';
import LandingPageBg from '@/components/LandingPageBg';

export default function SurveyPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center transparent">
      <LandingPageBg />
      <div className="w-full">
        <Header />
      </div>
      <div className="w-full flex flex-1 flex-col justify-center max-w-xl p-6">
        <div className="space-y-2 flex flex-col items-center">
          <h2 className="text-[32px] font-semibold text-[rgba(0,0,0,0.8)]">Thank you for your attention.</h2>
          <p className="text-[rgba(0,0,0,0.3)] text-[20px]">{`We'll be in touch as soon as we're ready`}</p>
        </div>
      </div>
    </div>
  );
}
