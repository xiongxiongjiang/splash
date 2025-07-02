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
        url: 'https://get-tally.ai/og-image.jpg', // 请确保此图片存在于您的公共目录中
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
    images: ['https://get-tally.ai/og-image.jpg'], // 请确保此图片存在于您的公共目录中
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
