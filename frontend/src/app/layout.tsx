import {ReactNode} from 'react'
import './globals.css'
import {Metadata} from 'next'

type Props = {
  children: ReactNode
}

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

// Root layout must include html and body tags
export default function RootLayout({children}: Props) {
  return (
    <html lang="zh">
      <head>
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
      </head>
      <body>{children}</body>
    </html>
  )
}
