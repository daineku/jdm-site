/**
 * DAINEKU homepage copy. This is a short commercial introduction, not a
 * development changelog or a list of fixed-price packages.
 * The Kanjo is the studio's original project in development, not client work.
 */

/** Only actual routes and sections. Contact already has its own header CTA. */
export const STUDIO_NAV: readonly { id: string; label: string; href?: string }[] = [
  { id: 'services', label: 'Capabilities' },
  { id: 'work', label: 'The Kanjo' },
  { id: 'journal', label: 'Journal', href: '/journal' },
]

export const HERO = {
  headline: 'Real-time simulation, interactive 3D environments, cinematic visuals.',
  body: 'DAINEKU develops driving simulations, interactive software and navigable 3D worlds. Our work spans vehicle dynamics, intelligent traffic, environment design and cinematic production — brought together in The Kanjo, our original racing project.',
  disciplines: ['Simulation & interaction', 'Worldbuilding & rendering', 'Video & visual production'],
  primaryCta: 'Explore The Kanjo',
  secondaryCta: 'Discuss a project',
}

export const SERVICES = {
  title: 'What We Build',
  intro: 'From simulation software and AI behaviour to real-time worlds, visual content and the tools connecting them.',
  items: [
    {
      n: '01',
      title: 'Simulation & Interactive Systems',
      body: 'Responsive software built around movement, behaviour, user input and physical interaction.',
      deliverables: [
        'Vehicle dynamics and driving systems',
        'AI traffic and autonomous behaviour',
        'Gameplay systems and interactive prototypes',
        'Hardware input and force-feedback integration',
      ],
    },
    {
      n: '02',
      title: '3D Worlds & Spatial Design',
      body: 'Navigable digital environments developed for interaction, scale and real-time performance.',
      deliverables: [
        'Urban environments and road networks',
        'Worldbuilding and modular scene production',
        'Materials, lighting and rendering',
        'Real-time scene optimisation',
      ],
    },
    {
      n: '03',
      title: 'Cinematic & Visual Production',
      body: 'Film, imagery and post-production, including sequences captured from real-time environments.',
      deliverables: [
        'In-engine cinematics and camera direction',
        'Trailers, teasers and short-form video',
        'Key art and rendered imagery',
        'Editing and colour grading',
      ],
    },
  ],
}

/* Projects (The Kanjo's copy, artwork and highlights) live in lib/projects.ts — the portfolio data model. */

export const JOURNAL = {
  label: 'Journal',
  title: 'Inside the Process.',
  lead: 'Development notes, technical experiments and decisions behind the work.',
  cta: 'All articles',
  featuredLabel: 'Featured story',
  latestLabel: 'Latest updates',
  readCta: 'Read the story',
}

export const PROJECT_TYPES = [
  { value: 'Simulation & Interactive Development', label: 'Simulation & interactive development' },
  { value: 'Digital Environment / Spatial Design', label: 'Digital environment / spatial design' },
  { value: 'Cinematic & Video Production', label: 'Cinematic & video production' },
  { value: 'Other', label: 'Other' },
] as const

export const CONTACT = {
  label: 'Start a Project',
  title: 'Bring Your Next Project to Life.',
  body: 'From an early concept to a production-ready experience, tell us what you have in mind. We can help define the right technical and creative approach.',
  cta: 'Send Project Enquiry',
  scope: 'Simulation, interactive development, digital environments, visual production — and projects combining several disciplines.',
}
