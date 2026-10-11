/**
 * Project-enquiry validation, shared by the contact form (instant feedback) and
 * POST /api/contact (the authority). Pure — safe to import on client and server.
 */

export const PROJECT_TYPE_VALUES = [
  'Simulation & Interactive Development',
  'Digital Environment / Spatial Design',
  'Cinematic & Video Production',
  'Other',
] as const
export type ProjectType = (typeof PROJECT_TYPE_VALUES)[number]

export type EnquiryFields = {
  name: string
  email: string
  projectType: string
  timeline: string
  message: string
}
export type Enquiry = Omit<EnquiryFields, 'projectType'> & { projectType: ProjectType }
export type EnquiryErrors = Partial<Record<keyof EnquiryFields, string>>

export const LIMITS = { name: 100, email: 254, timeline: 100, message: 5000 } as const
const MESSAGE_MIN = 20

const EMAIL_RE = /^[^\s@<>()",;:]+@[^\s@<>()",;:]+\.[^\s@<>()",;:]{2,}$/
// Control characters (incl. CR/LF) are never valid in single-line fields — they would
// let a visitor shape the email subject.
const CONTROL_RE = /[\u0000-\u001f\u007f]/

export function isEmail(value: string): boolean {
  return value.length <= LIMITS.email && EMAIL_RE.test(value)
}

function isProjectType(v: string): v is ProjectType {
  return (PROJECT_TYPE_VALUES as readonly string[]).includes(v)
}

/** Validates and normalises an enquiry. `value` is only set when there are no errors. */
export function validateEnquiry(input: Partial<Record<keyof EnquiryFields, unknown>>): {
  errors: EnquiryErrors
  value?: Enquiry
} {
  const str = (v: unknown) => (typeof v === 'string' ? v.trim() : '')
  const name = str(input.name)
  const email = str(input.email)
  const projectType = str(input.projectType)
  const timeline = str(input.timeline)
  const message = str(input.message).replace(/\r\n?/g, '\n')

  const errors: EnquiryErrors = {}
  if (name.length < 2 || name.length > LIMITS.name || CONTROL_RE.test(name)) errors.name = 'Please enter your name.'
  if (!isEmail(email)) errors.email = 'Please enter a valid email address.'
  if (!isProjectType(projectType)) errors.projectType = 'Please choose a project type.'
  if (timeline.length > LIMITS.timeline || CONTROL_RE.test(timeline)) errors.timeline = `Please keep the timeline under ${LIMITS.timeline} characters.`
  if (message.length < MESSAGE_MIN) errors.message = `Tell us a little more about the project (at least ${MESSAGE_MIN} characters).`
  else if (message.length > LIMITS.message) errors.message = `Please keep the description under ${LIMITS.message} characters.`

  if (Object.keys(errors).length || !isProjectType(projectType)) return { errors }
  return { errors, value: { name, email, projectType, timeline, message } }
}

export function enquirySubject(e: Pick<Enquiry, 'projectType' | 'name'>): string {
  return `Project enquiry — ${e.projectType} — ${e.name}`
}

export function enquiryText(e: Enquiry): string {
  return [
    `Name: ${e.name}`,
    `Email: ${e.email}`,
    `Project type: ${e.projectType}`,
    `Timeline: ${e.timeline || 'Not specified'}`,
    '',
    e.message,
    '',
    '— Sent from the project enquiry form on daineku.com',
  ].join('\n')
}
