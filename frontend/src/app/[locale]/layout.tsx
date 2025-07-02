import {notFound} from 'next/navigation'
import {NextIntlClientProvider, hasLocale} from 'next-intl'

import AntdClientProvider from '../antdClientProvider'

import {routing} from '@/i18n/routing'
import {Metadata} from 'next'

export const metadata: Metadata = {
  title: 'Tally.ai - Your career copilot',
  description: 'Precision guidance from résumé to referral.',
  openGraph: {
    title: 'Tally.ai - Your career copilot',
    description: 'Precision guidance from résumé to referral.',
    url: 'https://get-tally.ai',
    siteName: 'Tally.ai',
    images: [
      {
        url: '/og-image.jpg', // 使用相对路径指向public目录中的图片
        width: 1200,
        height: 630,
        alt: 'Tally.ai - Your career copilot',
      },
    ],
    locale: 'zh_CN',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Tally.ai - Your career copilot',
    description: 'Precision guidance from résumé to referral.',
    images: ['/og-image.jpg'], // 使用相对路径指向public目录中的图片
  },
}

export default async function LocaleLayout({children, params}: {children: React.ReactNode; params: Promise<{locale: string}>}) {
  // Ensure that the incoming `locale` is valid
  const {locale} = await params
  if (!hasLocale(routing.locales, locale)) {
    notFound()
  }

  return (
    <NextIntlClientProvider>
      <AntdClientProvider>{children}</AntdClientProvider>
    </NextIntlClientProvider>
  )
}
