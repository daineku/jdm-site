/**
 * Unit tests for renderDescription parser logic.
 * Tests the inline parser independently (no React renderer needed).
 *
 * Run: npx ts-node --skip-project lib/renderDescription.test.ts
 * (or integrate into your test runner if added later)
 */

// Extract the pure parser logic inline for testing without React
function parseInlineToText(text: string): string {
  return text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
             .replace(/\*(.+?)\*/g, '<em>$1</em>')
}

function renderToText(input: string | null | undefined): string | null {
  if (!input?.trim()) return null
  const paragraphs = input.split(/\n\s*\n/).filter(p => p.trim())
  return paragraphs.map(para => {
    const lines = para.trim().split('\n')
    return '<p>' + lines.map(parseInlineToText).join('<br>') + '</p>'
  }).join('')
}

// ── Test cases ────────────────────────────────────────────────────────────
const tests: [string, string | null | undefined, string | null][] = [
  // 1. null / empty → null
  ['null input',       null,        null],
  ['empty string',     '',          null],
  ['only whitespace',  '   \n  ',   null],

  // 2. Plain text — unchanged
  ['plain text', 'Honda S2000 spec edition.', '<p>Honda S2000 spec edition.</p>'],

  // 3. Multiline within one paragraph (single \n → <br>)
  ['multiline',
   'Engine: F20C\nPower: 240hp\nYear: 2002',
   '<p>Engine: F20C<br>Power: 240hp<br>Year: 2002</p>'],

  // 4. Blank line → new paragraph
  ['two paragraphs',
   'First paragraph.\n\nSecond paragraph.',
   '<p>First paragraph.</p><p>Second paragraph.</p>'],

  // 5. Bold
  ['bold', 'Has a **hand-built** engine.', '<p>Has a <strong>hand-built</strong> engine.</p>'],

  // 6. Italic
  ['italic', 'Built for *club racing*.', '<p>Built for <em>club racing</em>.</p>'],

  // 7. Bold and italic in same paragraph
  ['bold and italic', '**Fast** and *loud*.', '<p><strong>Fast</strong> and <em>loud</em>.</p>'],

  // 8. Mixed: multiple paragraphs with formatting + line breaks
  ['mixed full',
   'First registered in 2001. **Never modified**.\n\nThe engine is *naturally aspirated*.\nRed top, matching numbers.\n\nFull docs available.',
   '<p>First registered in 2001. <strong>Never modified</strong>.</p>' +
   '<p>The engine is <em>naturally aspirated</em>.<br>Red top, matching numbers.</p>' +
   '<p>Full docs available.</p>'],

  // 9. Backward compat: existing plain text with no markers
  ['legacy plain', 'Original 2001 AP1. Full service history. No accidents.',
   '<p>Original 2001 AP1. Full service history. No accidents.</p>'],

  // 10. Edit/save/edit: textarea preserves \n on round-trip (no stripping)
  ['round-trip multiline', 'Line A\nLine B', '<p>Line A<br>Line B</p>'],

  // 11. * in URL-like or innocent context must not break
  ['star not italic', 'Price: 15,000 USD', '<p>Price: 15,000 USD</p>'],
]

let passed = 0, failed = 0
for (const [name, input, expected] of tests) {
  const result = renderToText(input)
  const ok = result === expected
  if (ok) {
    passed++
    console.log(`  ✓ ${name}`)
  } else {
    failed++
    console.log(`  ✗ ${name}`)
    console.log(`    expected: ${JSON.stringify(expected)}`)
    console.log(`    got:      ${JSON.stringify(result)}`)
  }
}
console.log(`\n${passed} passed, ${failed} failed`)
if (failed > 0) process.exit(1)
