/**
 * Studio homepage copy. Kept in one place so wording can be edited without
 * touching layout. Nothing here may claim clients, awards, metrics or
 * finished commercial work — The Kanjo is the studio's own project in development,
 * and every technical statement about it must be true of the current game.
 *
 * Each section has one job; do not restate another section's message:
 *   Hero — what the studio builds · What We Build — what a client can commission ·
 *   Selected Work — The Kanjo and the systems developed for it (the technical proof) ·
 *   Journal — articles (CMS) · Process — how a commission runs · Contact.
 * Describe what is built and how it behaves. No organisational slogans, no generic talk of
 * realism or immersion.
 */

/** Verified public destination for The Kanjo (states "Published by Daineku"). Linked once, from Selected Work. */
export const KANJO_URL = 'https://www.thekanjo.com/'

/** `href` overrides the default `/#id` anchor for entries that are their own route. */
export const STUDIO_NAV: readonly { id: string; label: string; href?: string }[] = [
  { id: 'services', label: 'Services' },
  { id: 'work',     label: 'Work' },
  { id: 'journal',  label: 'Journal', href: '/journal' },
  { id: 'process',  label: 'Process' },
]

export const HERO = {
  headline: 'Real-time simulation, interactive 3D environments, cinematic visuals.',
  body: 'We develop vehicle and traffic simulation, build environments people can drive or walk through, and produce video and stills from them. Our own racing game, The Kanjo, is where these systems are built and tested.',
  disciplines: ['Vehicle dynamics · AI traffic', 'Worldbuilding · lighting', 'Trailers · in-engine film'],
  primaryCta: 'Explore our work',
  secondaryCta: 'Discuss a project',
}

export const SERVICES = {
  title: 'What We Build',
  intro: 'Three services, each scoped per project.',
  items: [
    {
      n: '01',
      title: 'Real-Time Simulation',
      body: 'Software that models how vehicles and road users behave, responding to input as it runs.',
      deliverables: [
        'Vehicle dynamics and handling models',
        'AI traffic and driver behaviour',
        'Interactive simulation software',
        'Playable simulation prototypes',
      ],
    },
    {
      n: '02',
      title: 'Spatial Design',
      body: 'Digital environments built to be navigated in real time, not only presented as still renders.',
      deliverables: [
        'Navigable digital environments',
        'Worldbuilding and scene construction',
        'Lighting and look development',
        'Real-time rendering set-up',
      ],
    },
    {
      n: '03',
      title: 'Cinematic Production',
      body: 'Video and visual material produced from real-time scenes.',
      deliverables: [
        'Trailers and teasers',
        'In-engine cinematics and camera sequences',
        'Key art and still renders',
        'Editing and colour grading to final master',
      ],
    },
  ],
}

/** `implemented`: runs in the current internal build. `progress`: runs, but has open defects still being fixed. */
export type SystemStatus = 'implemented' | 'progress'

export const WORK = {
  title: 'Selected Work',
  subtitle: 'The studio’s own racing game, in development, and the systems built for it.',
  kanjo: {
    name: 'The Kanjo',
    category: 'Original IP / Racing game in development',
    headline: 'A Night Expressway, Built to Drive.',
    body: [
      'The Kanjo is a racing game set on a single elevated expressway loop at night — a fictionalised Japanese circuit inspired by late-1990s highway racing culture.',
      'Everything listed below runs together in the current internal Windows build.',
    ],
    facts: [
      { label: 'Type', value: 'Original IP, owned by the studio' },
      { label: 'Status', value: 'In development' },
      { label: 'Core System', value: 'Real Car Simulation' },
    ],
    image: {
      alt: 'The Kanjo: a red hatchback with a tall rear wing on an elevated expressway at night, two cars ahead under orange street lights.',
    },
    cta: 'Explore The Kanjo',
    // Each item checked against the game project (October 2026). Do not upgrade a status, add hardware
    // or claim a feature without checking the current build again.
    systems: {
      title: 'Developed systems',
      intro: 'What has been built for The Kanjo and how it behaves. “In progress” marks systems that run in the game but still have open defects.',
      items: [
        {
          title: 'Vehicle Simulation',
          status: 'implemented' as SystemStatus,
          body: 'The car is driven by a physically-based model. Wheel suspension provides ground contact; our own tyre and drivetrain code computes the force at each contact patch, so grip, slides and weight transfer come out of the model rather than scripted rules.',
          built: [
            'Pacejka tyre model with combined slip and load sensitivity',
            'Engine torque curve, clutch and gearbox with real shift time',
            'Biased differential, anti-roll bars, Ackermann steering, aerodynamic drag',
            'Engine sound from RPM-mapped recordings; tyre and road sound driven by the tyre model',
          ],
        },
        {
          title: 'AI Traffic',
          status: 'progress' as SystemStatus,
          body: 'Up to 42 vehicles share the expressway with the player. Each follows a route around the loop, keeps a time gap to the car ahead, moves across lanes with indicators and goes around blocked vehicles. The player’s car is one of the vehicles they react to.',
          built: [
            'Pooled fleet: no vehicles created or destroyed while driving',
            'Per-car following distance and cruising lane',
            'Level of detail by distance from the player',
            'Crash handling: impact, physical recovery, rejoining the road',
          ],
        },
        {
          title: 'Rival Racing & Rolling Starts',
          status: 'progress' as SystemStatus,
          body: 'A race starts from a parking area, or by flashing the headlights at a passing racer. Both cars are placed into a rolling start at 50 km/h, then a countdown. The rival plans overtakes through traffic and defends its position; winnings are paid into the player’s in-game economy. One race route exists so far.',
          built: [
            'Race sequence: selection, staging, countdown, race, result, reward',
            'Rolling-start placement for player and rival',
            'Rival tactics: overtake, escape, defend',
            'Each result pays out once',
          ],
        },
        {
          title: 'Steering Wheel & Instrumentation',
          status: 'implemented' as SystemStatus,
          body: 'Wheel input and force feedback on Windows run through a native DirectInput layer, because Unity’s input system cannot create force-feedback effects. The force is computed from the front tyres’ aligning moment in the vehicle model, so what the driver feels follows what the tyres are doing.',
          built: [
            'Force feedback faded in with speed, with a safety cap',
            'Per-device calibration; validated on a MOZA R3 wheel and pedals',
            'Paddle shifting through the same gearbox',
            'Digital cluster — tachometer, speed, gear, fuel — in the cockpit and as a HUD',
          ],
        },
        {
          title: 'Environment & Lighting',
          status: 'implemented' as SystemStatus,
          body: 'A closed night expressway loop assembled from 91 track sections. The road is lit by 738 baked street lights; car lamps, reflections and post-processing run in real time on top of that.',
          built: [
            'Brake, tail and indicator lamps driven by the car’s state',
            'Reflection probes, night-sky and wet-road reflections',
            'Bloom, halation, volumetric fog and colour grading',
            'NVIDIA DLSS on supported hardware',
          ],
        },
      ],
    },
  },
}

export const JOURNAL = {
  label: 'Journal',
  title: 'Inside the Process.',
  lead: 'Development notes, technical experiments and the decisions behind our work.',
  cta: 'All articles',
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
  scope: 'Useful to include: target platform or hardware, deadline, and whether you need a build, source files or rendered video.',
}
