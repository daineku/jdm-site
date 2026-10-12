import { getProject } from '@/lib/projects'
import type { SupportConfig } from '@/lib/support'
import { ArtDirectedCover, Arrow } from './primitives'

/**
 * Support module (Patreon). A native block: artwork (the owner's upload, or the associated
 * project's own cover), title, what supporters are funding, and one CTA to the verified
 * patreon.com page. No third-party script or frame is ever loaded — see lib/support.ts.
 *
 *   variant 'project' — rendered inside the project case study (same green band)
 *   variant 'home'    — its own section between the Journal and Contact
 */
export default function SupportModule({ config, variant }: { config: SupportConfig; variant: 'project' | 'home' }) {
  const project = config.project ? getProject(config.project) : null
  const Title = variant === 'home' ? 'h2' : 'h3'
  const hasMedia = !!config.imageUrl || !!project
  const host = new URL(config.url).hostname.replace(/^www\./, '')

  const block = (
    <aside
      id="support"
      className={`st-support st-support--${variant}${hasMedia ? '' : ' st-support--text'}`}
      aria-labelledby="support-title"
      data-provider={config.provider}
      {...(project ? { 'data-project': project.slug } : {})}
    >
      {config.imageUrl ? (
        <div className="st-crop st-support__media">
          {/* eslint-disable-next-line @next/next/no-img-element -- uploaded to the R2 media origin, which may be a custom host */}
          <img src={config.imageUrl} alt={config.imageAlt} loading="lazy" decoding="async"
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
      ) : project ? (
        <ArtDirectedCover
          desktop={project.cover.mobile ?? project.cover.desktop}
          mobile={project.cover.mobile}
          alt={project.cover.alt}
          position={project.cover.mobilePosition ?? project.cover.position}
          mobilePosition={project.cover.mobilePosition}
          className="st-support__media"
          sizes="(max-width: 899px) 100vw, min(37vw, 540px)"
          quality={80}
        />
      ) : null}

      <div className="st-support__copy">
        <p className="st-label st-label--rule" style={{ margin: 0 }}>
          {project ? `Support ${project.title}` : 'Support the studio'}
        </p>
        <Title id="support-title" className="st-support__title">{config.title}</Title>
        <p className="st-body st-support__body">{config.body}</p>
        <a href={config.url} target="_blank" rel="noopener noreferrer" className="st-btn st-btn--gold">
          {config.cta} <Arrow diagonal /><span className="st-visually-hidden"> (opens {host} in a new tab)</span>
        </a>
        <p className="st-support__note">Opens on {host}. The studio does not load any third-party scripts for this.</p>
      </div>
    </aside>
  )

  if (variant === 'project') return block
  return (
    <section className="st-section st-section--tight-top" aria-label="Support">
      <div className="st-container">{block}</div>
    </section>
  )
}
