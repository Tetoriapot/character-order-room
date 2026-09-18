import type { NextConfig } from 'next';

const robotsHeader = 'noindex, nofollow, noarchive, nosnippet, noimageindex';

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [{ key: 'X-Robots-Tag', value: robotsHeader }],
      },
    ];
  },
};

export default nextConfig;
