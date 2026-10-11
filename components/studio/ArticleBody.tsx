import Markdown, { defaultUrlTransform, type Components } from 'react-markdown'
import remarkGfm from 'remark-gfm'

/**
 * Article Markdown → React elements. Shared by the public article page and the admin
 * preview so both render identically.
 *
 * Safety: react-markdown never uses innerHTML. Raw HTML in the source is dropped
 * (skipHtml), so `<script>`, `<iframe>` and inline event handlers cannot be embedded.
 * URLs pass through the default transform, which removes `javascript:`, `data:` and other
 * unsafe protocols. Images are limited to HTTPS.
 */

// Headings in the body start at h2: the article title is the page's only h1.
const shift = { h1: 'h2', h2: 'h2', h3: 'h3', h4: 'h4', h5: 'h4', h6: 'h4' } as const

const components: Components = {
  ...Object.fromEntries(
    Object.entries(shift).map(([from, to]) => {
      const Tag = to
      const Heading: Components['h1'] = ({ children }) => <Tag>{children}</Tag>
      return [from, Heading]
    }),
  ),
  a: ({ href, children }) => {
    const external = !!href && /^https?:\/\//.test(href)
    return (
      <a href={href} {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>
        {children}
      </a>
    )
  },
  img: ({ src, alt }) =>
    typeof src === 'string' && src.startsWith('https://')
      // eslint-disable-next-line @next/next/no-img-element -- article images live on the media origin, sizes unknown
      ? <img src={src} alt={alt ?? ''} loading="lazy" decoding="async" />
      : null,
}

export default function ArticleBody({ source }: { source: string }) {
  return (
    <div className="st-prose">
      <Markdown remarkPlugins={[remarkGfm]} skipHtml urlTransform={defaultUrlTransform} components={components}>
        {source}
      </Markdown>
    </div>
  )
}
