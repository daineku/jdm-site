import type { StaticImageData } from 'next/image'
import kanjoCover from '@/public/images/projects/thekanjo-hero.jpg'
import kanjoCoverMobile from '@/public/images/projects/thekanjo-hero-mobile.jpg'

/**
 * Studio projects — the portfolio's data model. Typed, in code, with static image imports so
 * next/image knows every master's real dimensions (no layout shift, exact candidate widths,
 * blur placeholders at build time).
 *
 * Adding a project is one entry here plus its artwork under public/images/projects/
 * (prepare it with scripts/prepare-project-media.mjs — see HANDOFF §23). The homepage lays
 * out one featured project as a case study and any further visible projects as a grid, so
 * nothing in the layout needs to change for the second project.
 *
 * Rules: real projects only — no placeholders, no client work that was not delivered, and
 * every technical statement must be true of the current build.
 */

export type ProjectStatus = 'in-development' | 'released'

export type ProjectHighlight = { title: string; body: string }

export type ProjectImage = { src: StaticImageData; alt: string; caption?: string }

export type Project = {
  /** Stable id (used by the Support module's "project" association and the DOM). */
  slug: string
  title: string
  /** One-line positioning statement shown as the case-study headline. */
  tagline: string
  /** Short description: one or two paragraphs. */
  summary: string[]
  /** Disciplines / categories, shown as the project's eyebrow line. */
  disciplines: string[]
  status: ProjectStatus
  /** Shown once at project level, e.g. "In development". */
  statusLabel: string
  cover: {
    /** The full composition, at least 2592 px wide for the 1296 px content column on 2× displays. */
    desktop: StaticImageData
    /** Optional portrait-leaning crop for phones; falls back to the desktop image with `mobilePosition`. */
    mobile?: StaticImageData
    /** object-position for the desktop frame when the frame's aspect differs from the image's. */
    position?: string
    mobilePosition?: string
    alt: string
  }
  /** Carefully selected technical highlights. Four reads best in the 2 × 2 grid. */
  highlights: ProjectHighlight[]
  /** Optional authentic stills; none are rendered when empty. */
  gallery?: ProjectImage[]
  /** Optional video (a direct MP4/WebM URL or a project-site page). Not rendered until a real clip exists. */
  video?: { url: string; label: string }
  /** External or internal destination. */
  link?: { href: string; label: string; external?: boolean }
  featured: boolean
  order: number
  visible: boolean
}

export const KANJO_URL = 'https://www.thekanjo.com/'

const THE_KANJO: Project = {
  slug: 'thekanjo',
  title: 'The Kanjo',
  tagline: 'Highway racing, simulated in real time.',
  summary: [
    'The Kanjo is a night-time driving simulation set on an elevated Japanese expressway. Its driving physics, AI traffic, rival racers and environment run together in a playable world.',
    'The project combines custom vehicle behaviour, steering-wheel feedback, digital instrumentation and a city-scale night scene.',
  ],
  disciplines: ['Original project', 'Racing simulation'],
  status: 'in-development',
  statusLabel: 'In development',
  cover: {
    desktop: kanjoCover,
    mobile: kanjoCoverMobile,
    alt: 'The Kanjo: a red hatchback with a tall rear wing on an elevated expressway at night, two cars ahead under orange street lights.',
  },
  // Each item checked against the game project (October 2026). Do not add hardware, platforms
  // or performance figures without checking the current build again.
  highlights: [
    { title: 'Vehicle Physics', body: 'A Pacejka-based tyre model, suspension and drivetrain calculate grip, weight transfer and vehicle response in real time.' },
    { title: 'Traffic & Racing AI', body: 'AI traffic shares the road, changes lanes and reacts to nearby cars; racing rivals use overtaking behaviour and rolling starts.' },
    { title: 'Wheel & Instrumentation', body: 'Steering-wheel force feedback is derived from simulated tyre forces, with digital cockpit instruments and validated MOZA R3 input.' },
    { title: 'World & Rendering', body: 'A continuous elevated road environment with night lighting, dynamic vehicle lamps, reflections and real-time rendering.' },
  ],
  link: { href: KANJO_URL, label: 'Explore The Kanjo', external: true },
  featured: true,
  order: 1,
  visible: true,
}

export const PROJECTS: readonly Project[] = [THE_KANJO]

/** Visible projects in display order. */
export function getVisibleProjects(): Project[] {
  return PROJECTS.filter(p => p.visible).sort((a, b) => a.order - b.order)
}

/** The case study: the first visible project flagged featured, else the first visible one. */
export function getFeaturedProject(): Project | null {
  const visible = getVisibleProjects()
  return visible.find(p => p.featured) ?? visible[0] ?? null
}

/** Every other visible project, for the secondary grid. Empty while only one project exists. */
export function getOtherProjects(): Project[] {
  const featured = getFeaturedProject()
  return getVisibleProjects().filter(p => p !== featured)
}

export function getProject(slug: string): Project | null {
  return PROJECTS.find(p => p.slug === slug && p.visible) ?? null
}

/** Slug → title, for admin selectors. */
export const PROJECT_INDEX: readonly { slug: string; title: string }[] = PROJECTS.map(p => ({ slug: p.slug, title: p.title }))
