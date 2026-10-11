/**
 * Studio homepage copy. Kept in one place so wording can be edited without
 * touching layout. Nothing here may claim clients, awards, metrics or
 * finished commercial work — The Kanjo is the studio's own project in development.
 *
 * Each section has one job; avoid restating another section's message:
 *   Hero — who we are · What We Make — the three services · How We Think — the philosophy ·
 *   Selected Work — proof · Capabilities — practical skills · Inside the Work — how The Kanjo
 *   is layered · Process — how a commission runs · Studio — who we are as a business · Contact.
 */

/** Verified public destination for The Kanjo (states "Published by Daineku"). */
export const KANJO_URL = 'https://www.thekanjo.com/'

export const STUDIO_NAV = [
  { id: 'work',      label: 'Work' },
  { id: 'expertise', label: 'Capabilities' },
  { id: 'process',   label: 'Process' },
  { id: 'studio',    label: 'Studio' },
] as const

export const HERO = {
  eyebrow: 'Independent development & creative technology studio',
  headline: 'We build worlds that feel real.',
  body: 'DAINEKU creates interactive simulations, digital environments and cinematic content — bringing design, real-time technology and visual storytelling into one production workflow.',
  disciplines: ['Real-time simulation', 'Spatial design', 'Cinematic production'],
  primaryCta: 'Explore our work',
  secondaryCta: 'Discuss a project',
}

export const WORLDS = {
  title: 'What We Make',
  intro: 'Three disciplines. One integrated production approach.',
  items: [
    {
      n: '01',
      title: 'Interactive Simulations',
      body: 'Playable environments and responsive systems built around movement, physics and interaction.',
    },
    {
      n: '02',
      title: 'Digital Environments',
      body: 'Cities, spaces and real-time scenes developed with deliberate scale, materials and atmosphere.',
    },
    {
      n: '03',
      title: 'Cinematic & Video Production',
      body: 'Filming, editing and cinematic direction, combining real-world footage with CGI and real-time rendered imagery where appropriate.',
    },
  ],
}

export const DESIGN = {
  label: 'Our philosophy',
  title: 'Designed as One Experience.',
  body: 'Space, behaviour and visual storytelling are developed together — rather than treated as separate production stages.',
  items: [
    {
      title: 'Build the World',
      body: 'Environments are designed for movement, perspective and exploration — not a single static frame.',
    },
    {
      title: 'Make It Respond',
      body: 'Interaction and physical behaviour are part of the experience from the beginning.',
    },
    {
      title: 'Capture the Experience',
      body: 'The same digital world can support playable content, prototypes and cinematic storytelling.',
    },
  ],
}

export const WORK = {
  title: 'Selected Work',
  subtitle: 'Original development is where our methods are tested in practice.',
  kanjo: {
    name: 'The Kanjo',
    category: 'Original IP / Real-time driving simulation',
    headline: 'A City Built to Move.',
    body: [
      'The Kanjo is our ongoing independent driving simulation, bringing urban worldbuilding, vehicle physics, traffic systems and real-time rendering into one playable environment.',
      'Rather than creating a static representation of a city, the project explores what makes a digital environment feel alive when the player moves through it.',
    ],
    facts: [
      { label: 'Type', value: 'Original IP' },
      { label: 'Status', value: 'In development' },
      { label: 'Disciplines', value: 'Simulation · Environment · Technical art' },
    ],
    cta: 'View The Kanjo',
  },
  research: [
    {
      label: 'Research 01',
      title: 'City as a System',
      body: 'Road networks, traffic behaviour and environmental structure developed as interconnected parts of a playable city.',
    },
    {
      label: 'Research 02',
      title: 'Light in Motion',
      body: 'Headlights, reflections, materials and atmosphere evaluated from both driving and cinematic perspectives.',
    },
  ],
}

export const EXPERTISE = {
  title: 'Production Capabilities',
  subtitle: 'Creative and technical capabilities applied across our simulation, environment and cinematic projects.',
  items: [
    { n: '01', title: 'Environment & Asset Production', body: 'Building detailed digital spaces, modular environments and production-ready visual assets.' },
    { n: '02', title: 'Physics & Interactive Systems', body: 'Developing responsive movement, vehicle behaviour and simulation-driven interactions.' },
    { n: '03', title: 'Lighting & Material Development', body: 'Creating convincing surface response, reflections and atmosphere for real-time scenes.' },
    { n: '04', title: 'Interactive Prototyping', body: 'Turning concepts into testable experiences before committing to full-scale production.' },
    { n: '05', title: 'Cinematography & Post-Production', body: 'Camera direction, filming, editing, colour grading and the creation of cinematic sequences.' },
    { n: '06', title: 'Real-Time Integration & Optimisation', body: 'Bringing visual and interactive components together with attention to performance and consistency.' },
  ],
}

export const BEHIND = {
  label: 'Inside the Work',
  title: 'One World. Many Systems.',
  body: [
    'The Kanjo brings multiple disciplines into the same environment. Each affects how the world looks, moves and responds.',
  ],
  cta: 'View The Kanjo',
  items: [
    { n: '01', title: 'Environment', body: 'The structure, landmarks and details that establish a coherent sense of place.' },
    { n: '02', title: 'Behaviour', body: 'Vehicle dynamics, traffic movement and interaction within the digital environment.' },
    { n: '03', title: 'Light & Materials', body: 'How surfaces, weather, headlights and reflections shape the visual experience.' },
    { n: '04', title: 'Camera & Sound', body: 'How the world is presented through composition, motion, audio and cinematic framing.' },
  ],
}

export const PROCESS = {
  label: 'How we work',
  title: 'From Idea to Delivery.',
  body: 'A clear production process connecting creative direction, technical development and measurable project deliverables.',
  steps: [
    { n: '01', title: 'Define', body: 'Establish the objective, audience, scope and expected deliverables.' },
    { n: '02', title: 'Prototype', body: 'Validate the essential interaction or visual direction before expanding production.' },
    { n: '03', title: 'Produce', body: 'Develop the approved environments, systems, assets or cinematic content.' },
    { n: '04', title: 'Deliver', body: 'Refine, test and hand over the agreed files, builds and production assets.' },
  ],
}

export const ABOUT = {
  label: 'About Daineku',
  title: 'Independent by Design.',
  body: [
    'DAINEKU is an independent development studio working across real-time simulation, spatial design and cinematic production.',
    'We develop original interactive projects and take on selected commercial collaborations. Our work brings creative direction and technical execution together, from the first concept to the finished experience.',
  ],
}

/** Enquiry categories. The value is what the server accepts and what appears in the email subject. */
export const PROJECT_TYPES = [
  { value: 'Simulation', label: 'Real-time simulation' },
  { value: 'Spatial Design', label: 'Spatial design' },
  { value: 'Cinematic & Video', label: 'Cinematic & video' },
  { value: 'Other', label: 'Other' },
] as const

export const CONTACT = {
  label: 'Work with Daineku',
  title: "Let's Build Something.",
  body: "Tell us what you're creating, who it's for and what you need delivered. We'll explore the right approach for your project.",
  cta: 'Discuss a project',
  scope: 'Commissioned simulations, digital environments and cinematic production — scoped individually.',
}
