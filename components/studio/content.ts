/**
 * Studio homepage copy. Kept in one place so wording can be edited without
 * touching layout. Nothing here may claim clients, awards, metrics or
 * finished commercial work — The Kanjo is the studio's own project in development,
 * and every technical statement about it must be true of the current game.
 *
 * Each section has one job; avoid restating another section's message:
 *   Hero — who we are · What We Build — what a client can commission · Why Daineku — the
 *   integrated advantage, with evidence · Selected Work — The Kanjo · Technical Production —
 *   systems the game demonstrates · Journal — articles (CMS) · Studio — the business ·
 *   Process — how a commission runs · Contact.
 */

/** Verified public destination for The Kanjo (states "Published by Daineku"). Linked once, from Selected Work. */
export const KANJO_URL = 'https://www.thekanjo.com/'

/** `href` overrides the default `/#id` anchor for entries that are their own route. */
export const STUDIO_NAV: readonly { id: string; label: string; href?: string }[] = [
  { id: 'services', label: 'Services' },
  { id: 'work',     label: 'Work' },
  { id: 'journal',  label: 'Journal', href: '/journal' },
  { id: 'studio',   label: 'Studio' },
]

export const HERO = {
  eyebrow: 'Independent development studio',
  headline: 'We build worlds that feel real.',
  body: 'DAINEKU builds real-time simulations, navigable 3D environments and cinematic video — for our own games, starting with The Kanjo, and for selected commissions.',
  disciplines: ['Real-time simulation', 'Spatial design', 'Cinematic production'],
  primaryCta: 'Explore our work',
  secondaryCta: 'Discuss a project',
}

export const SERVICES = {
  title: 'What We Build',
  intro: 'Three kinds of commission, delivered by one team.',
  items: [
    {
      n: '01',
      title: 'Interactive Simulation & Prototyping',
      body: 'Playable, testable software for ideas that depend on movement and physical behaviour.',
      deliverables: [
        'Vehicle and driving prototypes',
        'Interactive 3D product demonstrations',
        'Traffic and movement systems',
        'Technical gameplay prototypes',
      ],
      need: 'We need to see how it moves before committing to full production.',
    },
    {
      n: '02',
      title: 'Digital Environments & Spatial Visualisation',
      body: 'Real-time 3D spaces that people can move through, not only view as still renders.',
      deliverables: [
        'Navigable urban and architectural scenes',
        'Modular environment asset kits',
        'Material and lighting studies',
        'Optimisation for real-time rendering',
      ],
      need: 'We need a large scene that stays detailed and still runs smoothly.',
    },
    {
      n: '03',
      title: 'Cinematic & Video Production',
      body: 'Films and sequences, from engine-rendered shots to edited live action.',
      deliverables: [
        'Project trailers and product films',
        'Real-time engine cinematics',
        'Camera direction, editing and colour grading',
        'Live action combined with rendered visuals',
      ],
      need: 'We want our interactive scene turned into a trailer.',
    },
  ],
}

export const WHY = {
  label: 'Why Daineku',
  title: 'Built to Work. Designed to Feel Real.',
  body: 'DAINEKU develops the space, the systems inside it and the way the experience is presented. Visual direction, interaction and real-time performance are considered together from the beginning — not handed between separate 3D, software and video suppliers.',
  items: [
    {
      title: 'Functional Worlds, Not Just Rendered Scenes',
      body: 'Environments are built to be driven, walked or explored, with scale, collision and sightlines worked out — not only composed for a single frame.',
      evidence: 'The Kanjo is a drivable night expressway shared with traffic.',
    },
    {
      title: 'Prototype and Validate in Real Time',
      body: 'Systems are tested inside the environment while it is still being built, so issues with handling, behaviour or readability show up early.',
      evidence: 'In The Kanjo, handling, traffic, opponents and cameras are tuned in the running game.',
    },
    {
      title: 'One Environment, Multiple Outputs',
      body: 'A single scene can serve an interactive build, a technical demonstration and cinematic footage, instead of being rebuilt for each.',
      evidence: null,
    },
  ],
}

export const WORK = {
  title: 'Selected Work',
  subtitle: 'Our own game — where the methods we offer are tested in practice.',
  kanjo: {
    name: 'The Kanjo',
    category: 'Original IP / Racing game in development',
    headline: 'A Night Expressway, Built to Drive.',
    body: [
      'The Kanjo is a racing game set on a single elevated expressway loop at night — a fictionalised Japanese circuit inspired by late-1990s highway racing culture.',
      'It is where we develop vehicle handling, traffic that shares the road, opponent racers, camera systems and night lighting, all running together in real time.',
    ],
    facts: [
      { label: 'Type', value: 'Original IP, owned by the studio' },
      { label: 'Status', value: 'In development' },
      { label: 'Engine', value: 'Unity 6' },
    ],
    image: {
      alt: 'The Kanjo: a red hatchback with a tall rear wing on an elevated expressway at night, two cars ahead under orange street lights.',
    },
    cta: 'Explore The Kanjo',
  },
}

export const TECHNICAL = {
  label: 'Technical Production',
  title: 'What The Kanjo Demonstrates.',
  body: 'Systems we have built and tuned in our own game — the same work a simulation, environment or cinematic commission draws on.',
  items: [
    { n: '01', title: 'Vehicle Handling', body: 'Drivable cars with tuned handling, chase cameras, and engine, tyre and road audio.' },
    { n: '02', title: 'Traffic & Opponents', body: 'Ambient traffic that keeps to its lanes on a shared carriageway, and AI opponents that race through it.' },
    { n: '03', title: 'Environment at Scale', body: 'A continuous elevated loop with junctions and connecting roads, assembled from modular real-time geometry.' },
    { n: '04', title: 'Night Lighting & Materials', body: 'Street lighting, reflective car paint, lamps and bloom balanced for a night scene seen in motion.' },
  ],
}

export const JOURNAL = {
  label: 'Journal',
  title: 'Inside the Process.',
  lead: 'Development notes, technical experiments and the decisions behind our work.',
  cta: 'All articles',
}

export const ABOUT = {
  label: 'Studio',
  title: 'Independent by Design.',
  body: [
    'DAINEKU is an independent development studio. Most of our time goes into our own products, starting with The Kanjo.',
    'We also take on selected commissioned projects. Each is scoped individually, and the people who build our own work build yours.',
  ],
}

export const PROCESS = {
  label: 'How a commission runs',
  title: 'From Idea to Delivery.',
  steps: [
    { n: '01', title: 'Define', body: 'Agree the goal, audience, scope and exactly what will be handed over.' },
    { n: '02', title: 'Prototype', body: 'Build the core interaction or look first, and review it running.' },
    { n: '03', title: 'Produce', body: 'Develop the agreed environments, systems or footage.' },
    { n: '04', title: 'Deliver', body: 'Test, refine and hand over builds, source files or final masters.' },
  ],
}

/** Enquiry categories. Must match PROJECT_TYPE_VALUES in lib/contact.ts — the server accepts only these. */
export const PROJECT_TYPES = [
  { value: 'Simulation & Interactive Development', label: 'Simulation & interactive development' },
  { value: 'Digital Environment / Spatial Design', label: 'Digital environment / spatial design' },
  { value: 'Cinematic & Video Production', label: 'Cinematic & video production' },
  { value: 'Other', label: 'Other' },
] as const

export const CONTACT = {
  label: 'Work with Daineku',
  title: "Let's Build Something.",
  body: 'Tell us what you are making, who it is for and what you need delivered — a prototype, an environment, a film, or a combination.',
  cta: 'Discuss a project',
  scope: 'Commissioned simulations, real-time environments and cinematic production — each scoped individually.',
}
