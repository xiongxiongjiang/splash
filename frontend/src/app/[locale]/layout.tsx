import { Inter } from 'next/font/google';
import { notFound } from 'next/navigation';
import { NextIntlClientProvider, hasLocale } from 'next-intl';

import AntdClientProvider from '../antdClientProvider';

import { routing } from '@/i18n/routing';

const inter = Inter({ subsets: ['latin'] });
import '../globals.css';

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  // Ensure that the incoming `locale` is valid
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  return (
    <html lang={locale}>
      <body className={inter.className}>
        <NextIntlClientProvider>
          <AntdClientProvider>{children}</AntdClientProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
