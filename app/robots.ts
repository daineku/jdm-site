import { MetadataRoute } from 'next'
import { getBaseUrl } from '@/lib/seo'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = getBaseUrl()
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        // Query-param filter pages are crawlable but not in sitemap.
        // Admin path is unguessable but explicitly disallowed as defence-in-depth.
        disallow: ['/api/', '/_next/'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
