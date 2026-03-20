import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
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
  // Increase body size limit for API routes (upload route safety net)
  experimental: {
    serverActions: {
      bodySizeLimit: '5mb',
    },
  },
}

export default nextConfig
