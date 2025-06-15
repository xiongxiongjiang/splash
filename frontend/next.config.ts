import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';
const withNextIntl = createNextIntlPlugin();
const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'wwtyksrhuycqxxbyvqml.supabase.co',
        pathname: '/storage/v1/object/public/images/**',
      },
    ],
  },
};

export default withNextIntl(nextConfig);
