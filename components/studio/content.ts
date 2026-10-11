/**
 * DAINEKU homepage copy. This is a short commercial introduction, not a
 * development changelog or a list of fixed-price packages.
 * The Kanjo is the studio's original project in development, not client work.
 */

export const KANJO_URL = 'https://www.thekanjo.com/'

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

export const WORK = {
  title: 'The Kanjo',
  kanjo: {
    category: 'Original project · Racing simulation',
    headline: 'Highway racing, simulated in real time.',
    body: [
      'The Kanjo is a night-time driving simulation set on an elevated Japanese expressway. Its driving physics, AI traffic, rival racers and environment run together in a playable world.',
      'The project combines custom vehicle behaviour, steering-wheel feedback, digital instrumentation and a city-scale night scene.',
    ],
    image: {
      alt: 'The Kanjo: a red hatchback with a tall rear wing on an elevated expressway at night, two cars ahead under orange street lights.',
    },
    cta: 'Explore The Kanjo',
    systems: {
      title: 'Inside the simulation',
      items: [
        {
          title: 'Vehicle Physics',
          body: 'A Pacejka-based tyre model, suspension and drivetrain calculate grip, weight transfer and vehicle response in real time.',
        },
        {
          title: 'Traffic & Racing AI',
          body: 'AI traffic shares the road, changes lanes and reacts to nearby cars; racing rivals use overtaking behaviour and rolling starts.',
        },
        {
          title: 'Wheel & Instrumentation',
          body: 'Steering-wheel force feedback is derived from simulated tyre forces, with digital cockpit instruments and validated MOZA R3 input.',
        },
        {
          title: 'World & Rendering',
          body: 'A continuous elevated road environment with night lighting, dynamic vehicle lamps, reflections and real-time rendering.',
        },
      ],
    },
  },
}

export const JOURNAL = {
  label: 'Journal',
  title: 'Inside the Process.',
  lead: 'Development notes, technical experiments and decisions behind the work.',
  cta: 'All articles',
}

/** Retained for the legacy ProcessSection module, which is not part of this homepage. */
export const PROCESS = {
  label: 'How a commission runs',
  title: 'From Idea to Delivery.',
  steps: [
    { n: '01', title: 'Define', body: 'Agree on objectives, scope and deliverables.' },
    { n: '02', title: 'Prototype', body: 'Validate the core interaction or visual direction.' },
    { n: '03', title: 'Produce', body: 'Develop the agreed systems, environments or footage.' },
    { n: '04', title: 'Deliver', body: 'Test, refine and hand over the agreed result.' },
  ],
}

export const PROJECT_TYPES = [
  { value: 'Simulation & Interactive Development', label: 'Simulation & interactive development' },
  { value: 'Digital Environment / Spatial Design', label: 'Digital environment / spatial design' },
  { value: 'Cinematic & Video Production', label: 'Cinematic & video production' },
  { value: 'Other', label: 'Other' },
] as const

export const CONTACT = {
  label: 'Work with Daineku',
  title: "Let's Build Something.",
  body: 'Tell us what you want to create, who it is for and what you need delivered.',
  cta: 'Discuss a project',
  scope: 'A brief can cover software, environments, visuals or a combination.',
}
