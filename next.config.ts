import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Type and lint errors fail the build (both pass as of v10 — keep it that way).
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.supabase.co' },
      { protocol: 'https', hostname: '**.cloudflare.com' },
      { protocol: 'https', hostname: '**.r2.dev' },
      { protocol: 'https', hostname: 'pub-*.r2.dev' },
    ],
    // Prevent image optimization crashes on broken URLs
    dangerouslyAllowSVG: false,
  },
  // The JDM feed moved from "/" to "/archive". Keep old brand-filter links working;
  // a bare "/" is the studio homepage and is not affected. Query string is carried over.
  async redirects() {
    return [
      {
        source: '/',
        has: [{ type: 'query', key: 'brand' }],
        destination: '/archive',
        permanent: false,
      },
    ]
  },
  // Increase body size limit for API routes (upload route safety net)
  experimental: {
    serverActions: {
      bodySizeLimit: '5mb',
    },
  },
}

export default nextConfig
