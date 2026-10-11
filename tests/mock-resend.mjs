/**
 * Minimal stand-in for the Resend "send email" endpoint, used only by the smoke suite
 * (the app is pointed at it through RESEND_API_URL). It records what the app sent so
 * tests can assert on recipient, Reply-To and subject. Nothing is ever emailed.
 *
 *   POST /emails          → 200 { id }   (500 when the subject contains "PROVIDER-FAIL")
 *   GET  /__find?q=<text> → the recorded request whose subject contains <text>, or 404
 */
import { createServer } from 'node:http'

const PORT = Number(process.env.MOCK_RESEND_PORT || 3499)
const received = []

createServer((req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`)
  const send = (status, body) => {
    res.writeHead(status, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify(body))
  }

  if (req.method === 'GET' && url.pathname === '/__health') return send(200, { ok: true })
  if (req.method === 'GET' && url.pathname === '/__find') {
    const q = url.searchParams.get('q') || ''
    const hit = received.find(r => r.body.subject?.includes(q))
    return hit ? send(200, hit) : send(404, { error: 'not found' })
  }
  if (req.method === 'POST' && url.pathname === '/emails') {
    let raw = ''
    req.on('data', c => { raw += c })
    req.on('end', () => {
      let body
      try { body = JSON.parse(raw) } catch { return send(400, { message: 'invalid json' }) }
      received.push({ authorized: req.headers.authorization === 'Bearer smoke-test-key', body })
      if (String(body.subject).includes('PROVIDER-FAIL')) return send(500, { message: 'simulated provider failure' })
      send(200, { id: `mock-${received.length}` })
    })
    return
  }
  send(404, { error: 'not found' })
}).listen(PORT, '127.0.0.1')
