import createNextIntlPlugin from 'next-intl/plugin';

import type { NextConfig } from 'next';
const withNextIntl = createNextIntlPlugin();
const nextConfig: NextConfig = {
    experimental: {
      serverComponentsExternalPackages: ['gsap']
    },
    // 启用静态优化
    output: 'standalone'
  };

export default withNextIntl(nextConfig);
