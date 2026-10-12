import Link from 'next/link'
import { getFeaturedProject, getOtherProjects, type Project } from '@/lib/projects'
import type { SupportConfig } from '@/lib/support'
import { Arrow, ArtDirectedCover, delay } from './primitives'
import SupportModule from './SupportModule'

/**
 * Projects — one featured project laid out as a case study (cinematic cover across the full
 * content column, then copy beside its technical highlights) and, once more than one project
 * exists, the others as a grid below. With a single project the grid is simply not rendered,
 * so the section is designed around one flagship rather than looking like an empty grid.
 *
 * `support`: the Support module when its placement is "project" — shown under the case study
 * when it is associated with the featured project (or with no project in particular).
 */
export default function ProjectsSection({ support = null }: { support?: SupportConfig | null }) {
  const featured = getFeaturedProject()
  if (!featured) return null
  const others = getOtherProjects()
  const showSupport = support?.placement === 'project' && (!support.project || support.project === featured.slug)

  return (
    <section id="work" className="st-section st-work" aria-labelledby="work-title">
      <div className="st-container">
        <FeaturedProject project={featured} />
        {showSupport && <SupportModule config={support} variant="project" />}
        {others.length > 0 && (
          <ul className="st-projects__grid" aria-label="More projects">
            {others.map((p, i) => <ProjectCard key={p.slug} project={p} index={i} />)}
          </ul>
        )}
      </div>
    </section>
  )
}

function ProjectLink({ project, className = 'st-btn st-btn--gold' }: { project: Project; className?: string }) {
  const link = project.link
  if (!link) return null
  if (link.external) {
    const host = new URL(link.href).hostname.replace(/^www\./, '')
    return (
      <a href={link.href} target="_blank" rel="noopener noreferrer" className={className}>
        {link.label} <Arrow diagonal /><span className="st-visually-hidden"> (opens {host} in a new tab)</span>
      </a>
    )
  }
  return <Link href={link.href} className={className}>{link.label} <Arrow /></Link>
}

function FeaturedProject({ project }: { project: Project }) {
  return (
    <article className="st-project" aria-labelledby="work-title" data-project={project.slug}>
      <header className="st-project__head" data-reveal="">
        <div>
          <p className="st-label st-label--rule" style={{ margin: 0 }}>Selected work</p>
          <h2 id="work-title" className="st-h2 st-project__title">{project.title}</h2>
        </div>
        <p className="st-lead st-project__tagline">{project.tagline}</p>
      </header>

      <figure className="st-project__media st-hover" style={{ margin: 0 }}>
        <ArtDirectedCover
          desktop={project.cover.desktop}
          mobile={project.cover.mobile}
          alt={project.cover.alt}
          position={project.cover.position}
          mobilePosition={project.cover.mobilePosition}
          className="st-project__frame st-ticks"
          sizes="(max-width: 899px) 100vw, min(90vw, 1296px)"
        >
          <span className="st-frame-tag st-frame-tag--tl">{project.title}</span>
          <span className="st-frame-tag st-frame-tag--br">{project.statusLabel}</span>
        </ArtDirectedCover>
      </figure>

      <div className="st-project__body">
        <div className="st-project__copy" data-reveal="">
          <p className="st-label st-project__eyebrow" style={{ margin: 0 }}>{project.disciplines.join(' · ')}</p>
          {project.summary.map(p => <p key={p.slice(0, 24)} className="st-body">{p}</p>)}
          <ProjectLink project={project} />
        </div>

        {project.highlights.length > 0 && (
          <div className="st-project__systems" aria-labelledby="systems-title">
            <h3 id="systems-title" className="st-label st-label--rule st-project__systems-title">Inside the simulation</h3>
            <ol className="st-systems__list">
              {project.highlights.map((item, i) => (
                <li key={item.title} data-reveal="" style={delay(i * 70)}>
                  <div className="st-systems__title">
                    <span className="st-num">{String(i + 1).padStart(2, '0')}</span>
                    <h4 className="st-h3">{item.title}</h4>
                  </div>
                  <p className="st-body">{item.body}</p>
                </li>
              ))}
            </ol>
          </div>
        )}
      </div>
    </article>
  )
}

/** Secondary project card — only rendered once a second project exists. */
function ProjectCard({ project, index }: { project: Project; index: number }) {
  return (
    <li className="st-project-card st-hover" data-reveal="" style={delay(index * 90)}>
      <ArtDirectedCover
        desktop={project.cover.desktop}
        mobile={project.cover.mobile}
        alt={project.cover.alt}
        position={project.cover.position}
        mobilePosition={project.cover.mobilePosition}
        className="st-project-card__media st-ticks"
        sizes="(max-width: 899px) 100vw, min(44vw, 634px)"
      >
        <span className="st-frame-tag st-frame-tag--br">{project.statusLabel}</span>
      </ArtDirectedCover>
      <div className="st-project-card__copy">
        <p className="st-label" style={{ margin: 0 }}>{project.disciplines.join(' · ')}</p>
        <h3 className="st-h3">{project.title}</h3>
        <p className="st-body">{project.tagline}</p>
        <ProjectLink project={project} className="st-btn st-btn--ghost st-btn--sm" />
      </div>
    </li>
  )
}
