import { notFound } from 'next/navigation';
import { NextIntlClientProvider, hasLocale } from 'next-intl';

import AntdClientProvider from '../antdClientProvider';

import { routing } from '@/i18n/routing';

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
    <NextIntlClientProvider>
      <AntdClientProvider>{children}</AntdClientProvider>
    </NextIntlClientProvider>
  );
}
