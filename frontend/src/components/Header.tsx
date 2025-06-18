'use client';
import React from 'react';

import Image from 'next/image';
import { useTranslations } from 'next-intl';

import Logo from '@/assets/logos/tally_logo.svg';

const Header = () => {
  const t = useTranslations('HomePage');
  return (
    <header className={`mx-auto px-[97px] py-6 flex justify-center items-center z-10 opacity-40 bg-transparent`}>
      <div className="flex items-center gap-2">
        <Image src={Logo} alt={t('appName')} width={24} height={24} />
        <span className="font-bold text-[28px]">{t('appName')}</span>
      </div>
    </header>
  );
};

export default Header;
