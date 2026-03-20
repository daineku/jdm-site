/**
 * renderDescription — safe lightweight formatter for model description text.
 *
 * Supported syntax (stored as plain text in DB, rendered to React elements):
 *   **bold**     → <strong>
 *   *italic*     → <em>
 *   blank line   → paragraph break
 *   single \n    → line break within paragraph
 *
 * No dangerouslySetInnerHTML. All output is React elements.
 * No external library required.
 *
 * Usage:
 *   import { renderDescription } from '@/lib/renderDescription'
 *   {renderDescription(model.description)}
 */

import React from 'react'

/** Parse inline **bold** and *italic* within a single line of text. */
function parseInline(text: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = []
  // Pattern: **bold** or *italic*
  const re = /(\*\*(.+?)\*\*|\*(.+?)\*)/g
  let last = 0
  let match: RegExpExecArray | null

  while ((match = re.exec(text)) !== null) {
    if (match.index > last) {
      nodes.push(text.slice(last, match.index))
    }
    if (match[0].startsWith('**')) {
      nodes.push(<strong key={match.index}>{match[2]}</strong>)
    } else {
      nodes.push(<em key={match.index}>{match[3]}</em>)
    }
    last = match.index + match[0].length
  }

  if (last < text.length) {
    nodes.push(text.slice(last))
  }
  return nodes
}

/** Split text into paragraphs (blank lines) then lines within each paragraph. */
export function renderDescription(
  text: string | null | undefined,
  className?: string,
): React.ReactNode | null {
  if (!text?.trim()) return null

  // Split on one or more blank lines to get paragraphs
  const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim())

  return (
    <>
      {paragraphs.map((para, pi) => {
        const lines = para.trim().split('\n')
        const content: React.ReactNode[] = []
        lines.forEach((line, li) => {
          content.push(...parseInline(line))
          if (li < lines.length - 1) content.push(<br key={`br-${pi}-${li}`} />)
        })
        return (
          <p
            key={pi}
            className={className}
            style={{ margin: pi > 0 ? '12px 0 0' : '0' }}
          >
            {content}
          </p>
        )
      })}
    </>
  )
}
