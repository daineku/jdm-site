/**
 * Unit tests for project-enquiry validation (shared by the form and /api/contact).
 * Run: npm run test:contact   (Node's built-in test runner; Node strips the TS types)
 */
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { PROJECT_TYPE_VALUES, enquirySubject, enquiryText, isEmail, validateEnquiry } from './contact.ts'

const valid = {
  name: 'Ada Lovelace',
  email: 'ada@example.org',
  projectType: 'Simulation & Interactive Development',
  timeline: '',
  message: 'A driving simulation prototype for a trade show stand.',
}

test('accepts a complete enquiry and trims it', () => {
  const { errors, value } = validateEnquiry({ ...valid, name: '  Ada Lovelace  ', message: `  ${valid.message}\r\n` })
  assert.deepEqual(errors, {})
  assert.equal(value?.name, 'Ada Lovelace')
  assert.equal(value?.message, valid.message)
})

test('timeline is optional; budget is not a field', () => {
  assert.ok(validateEnquiry({ ...valid, timeline: undefined }).value)
  assert.ok(validateEnquiry({ ...valid, timeline: 'Q2 2027' }).value)
})

test('reports every missing required field', () => {
  const { errors, value } = validateEnquiry({})
  assert.equal(value, undefined)
  assert.deepEqual(Object.keys(errors).sort(), ['email', 'message', 'name', 'projectType'])
})

test('rejects project types outside the fixed list', () => {
  assert.ok(validateEnquiry({ ...valid, projectType: 'Hacking' }).errors.projectType)
  for (const t of PROJECT_TYPE_VALUES) {
    assert.ok(validateEnquiry({ ...valid, projectType: t }).value, t)
  }
})

test('rejects line breaks in single-line fields (subject/header shaping)', () => {
  assert.ok(validateEnquiry({ ...valid, name: 'Ada\r\nBcc: victim@example.org' }).errors.name)
  assert.ok(validateEnquiry({ ...valid, timeline: 'soon\nX-Header: 1' }).errors.timeline)
})

test('rejects non-strings and oversize input', () => {
  assert.ok(validateEnquiry({ ...valid, name: ['Ada'] }).errors.name)
  assert.ok(validateEnquiry({ ...valid, message: 'x'.repeat(5001) }).errors.message)
  assert.ok(validateEnquiry({ ...valid, message: 'too short' }).errors.message)
})

test('email check', () => {
  for (const ok of ['a@b.co', 'first.last+tag@sub.example.org']) assert.ok(isEmail(ok), ok)
  for (const bad of ['', 'a@b', 'a b@c.com', 'a@b.c', '<a@b.com>', 'a@b.com, c@d.com']) assert.ok(!isEmail(bad), bad)
})

test('subject carries the category; body carries every field', () => {
  const v = validateEnquiry({ ...valid, projectType: 'Cinematic & Video Production', timeline: 'Summer' }).value!
  assert.equal(enquirySubject(v), 'Project enquiry — Cinematic & Video Production — Ada Lovelace')
  const text = enquiryText(v)
  for (const s of ['Ada Lovelace', 'ada@example.org', 'Cinematic & Video Production', 'Summer', valid.message]) assert.ok(text.includes(s), s)
})
