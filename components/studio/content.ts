/**
 * Studio homepage copy. Kept in one place so wording can be edited without
 * touching layout. Nothing here may claim clients, awards, metrics or
 * finished commercial work — The Kanjo is the studio's own project in development.
 */

export const STUDIO_NAV = [
  { id: 'work',      label: 'Work' },
  { id: 'expertise', label: 'Expertise' },
  { id: 'process',   label: 'Process' },
  { id: 'studio',    label: 'Studio' },
] as const

export const HERO = {
  eyebrow: 'Independent creative technology studio',
  headline: 'We build worlds that feel real.',
  body: 'Real-time simulations, digital environments and interactive experiences — crafted at the intersection of technology and visual design.',
  disciplines: ['Real-time simulation', 'Spatial design', 'Technical art'],
}

export const WORLDS = {
  title: 'Real-Time Worlds',
  intro: 'Digital spaces designed to be explored, experienced and believed.',
  items: [
    {
      n: '01',
      title: 'Urban Environments',
      body: 'From dense city streets to expansive metropolitan landscapes, we create digital environments with a strong sense of place, scale and atmosphere.',
    },
    {
      n: '02',
      title: 'Dynamic Simulations',
      body: 'Interactive systems where movement, physics and responsive behaviour bring digital worlds to life.',
    },
    {
      n: '03',
      title: 'Visual Realism',
      body: 'Lighting, materials, reflections and environmental details developed to make virtual experiences feel tangible.',
    },
  ],
}

export const DESIGN = {
  label: 'Craft',
  title: 'Designed to Be Experienced.',
  body: 'We combine spatial thinking, visual precision and real-time engineering to create experiences that go beyond static imagery.',
  items: [
    {
      title: 'Spatial Composition',
      body: 'Environments shaped through architecture, scale, atmosphere and visual storytelling.',
    },
    {
      title: 'Technical Art',
      body: 'Materials, shaders, lighting and rendering refined for visual consistency and real-time performance.',
    },
    {
      title: 'Interactive Design',
      body: 'Thoughtful systems that connect people with digital environments through movement, exploration and interaction.',
    },
  ],
}

export const WORK = {
  title: 'Selected Work',
  subtitle: 'A closer look at the worlds, systems and experiences we create.',
  kanjo: {
    name: 'The Kanjo',
    category: 'Real-time driving simulation / Digital environment',
    headline: 'A City Built to Move.',
    body: [
      'An ongoing real-time driving simulation project exploring urban environments, vehicle dynamics, traffic behaviour and immersive visual design.',
      'From detailed cityscapes to responsive driving systems, The Kanjo brings together spatial design, technical art and interactive engineering in one evolving experience.',
    ],
    facts: [
      { label: 'Status', value: 'In development' },
      { label: 'Type', value: 'Own project' },
      { label: 'Focus', value: 'City · Vehicles · Traffic · Light' },
    ],
  },
  research: [
    {
      label: 'Research 01',
      title: 'Urban Environment Development',
      body: 'Digital city construction, urban scale, road networks and environmental composition.',
    },
    {
      label: 'Research 02',
      title: 'Lighting & Material Studies',
      body: 'Research into surface response, automotive materials, nighttime illumination and real-time rendering.',
    },
  ],
}

export const EXPERTISE = {
  title: 'Our Expertise',
  subtitle: 'Creative direction and technical engineering, working together to build convincing digital experiences.',
  items: [
    { n: '01', title: 'Real-Time Simulation', body: 'Interactive simulation environments designed around believable behaviour, movement and real-time responsiveness.' },
    { n: '02', title: 'Spatial Design', body: 'Digital environments, architectural spaces and urban landscapes shaped with attention to scale, composition and atmosphere.' },
    { n: '03', title: 'Technical Art & Rendering', body: 'Shaders, materials, lighting, cameras and rendering workflows balancing visual quality with performance.' },
    { n: '04', title: 'Interactive Experiences', body: 'Immersive applications and digital experiences built around intuitive interaction and engaging visual feedback.' },
    { n: '05', title: 'Physics & Dynamic Systems', body: 'Vehicle behaviour, movement, environmental interaction and simulation-oriented systems development.' },
    { n: '06', title: 'Prototyping & R&D', body: 'Exploring new visual techniques, interaction models and emerging technologies through practical experimentation.' },
  ],
}

export const BEHIND = {
  label: 'Behind the Simulation',
  title: 'The Details Make the Difference.',
  body: [
    'Believable digital worlds are built through hundreds of connected decisions — from the way a vehicle responds to the road, to the way light interacts with its surface.',
    'Our work brings these details together into coherent, real-time experiences.',
  ],
  items: [
    { n: '01', title: 'Environment Construction', body: 'Building convincing urban spaces through spatial composition, architecture, road layouts, objects and environmental detail.' },
    { n: '02', title: 'Real-Time Physics', body: 'Developing responsive simulation systems where movement and interaction feel natural and consistent.' },
    { n: '03', title: 'Materials & Lighting', body: 'Refining paint, glass, reflective surfaces, headlights, shadows and atmosphere.' },
    { n: '04', title: 'Audio & Immersion', body: 'Integrating sound and environmental feedback to strengthen the sense of presence within a digital world.' },
  ],
}

export const PROCESS = {
  label: 'Our Approach',
  title: 'From Concept to Experience.',
  body: 'Every project begins with an understanding of space, interaction and visual intent. We bring creative exploration and technical development together in a deliberate process.',
  steps: [
    { n: '01', title: 'Explore', body: 'Understanding the concept, defining the experience and researching creative and technical possibilities.' },
    { n: '02', title: 'Design', body: 'Developing environments, visual direction, interactions and the systems that support them.' },
    { n: '03', title: 'Simulate', body: 'Building and integrating real-time systems, rendering techniques and interactive behaviour.' },
    { n: '04', title: 'Refine', body: 'Testing, optimising and polishing the experience until its visual and technical elements work as one.' },
  ],
}

export const ABOUT = {
  label: 'About Daineku',
  title: 'Independent by Design.',
  body: [
    'Daineku is an independent creative technology studio focused on real-time simulation, digital environments and spatial experiences.',
    'We work where visual design meets technical engineering — transforming ideas into interactive worlds through research, experimentation and careful execution.',
    'Our practice brings together environmental design, rendering, simulation and interactive development, with a focus on detail and visual authenticity.',
  ],
}

export const CONTACT = {
  label: "Let's Create",
  title: 'Have a World in Mind?',
  body: "Whether you're exploring a new simulation, digital environment or interactive experience, we'd be interested to hear what you're building.",
  cta: 'Start a conversation',
}
