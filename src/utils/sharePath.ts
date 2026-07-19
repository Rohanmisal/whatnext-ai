import type { Path, Session } from '../types'

export function formatPathSummary(session: Session, path?: Path): string {
  const lines: string[] = [
    'WhatNext AI — Path Summary',
    '─'.repeat(28),
    `Situation: ${session.situation}`,
    `Blocker: ${session.blockage}`,
    `Category: ${session.category}`,
    '',
    session.result.summary,
    '',
  ]

  const paths = path ? [path] : session.result.paths

  for (const p of paths) {
    lines.push(`${p.difficulty.toUpperCase()} · ${p.title} (${p.timeEstimate})`)
    lines.push(p.description)
    lines.push('')
    lines.push('Steps:')
    p.steps.forEach((step, i) => lines.push(`  ${i + 1}. ${step}`))
    lines.push('')
    lines.push(`Why it works: ${p.whyItWorks}`)
    lines.push(`Watch out for: ${p.commonMistake}`)
    if (p.tools.length) lines.push(`Tools: ${p.tools.join(', ')}`)
    lines.push('')
  }

  lines.push('Generated with WhatNext AI')
  return lines.join('\n').trim()
}

export async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text)
      return true
    }
  } catch {
    // fall through to legacy path
  }

  try {
    const ta = document.createElement('textarea')
    ta.value = text
    ta.setAttribute('readonly', '')
    ta.style.position = 'fixed'
    ta.style.left = '-9999px'
    document.body.appendChild(ta)
    ta.select()
    const ok = document.execCommand('copy')
    document.body.removeChild(ta)
    return ok
  } catch {
    return false
  }
}

/** Prefer native share sheet when available; otherwise copy to clipboard. */
export async function shareOrCopyText(
  text: string,
  title = 'WhatNext AI path'
): Promise<'shared' | 'copied' | 'failed'> {
  if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
    try {
      await navigator.share({ title, text })
      return 'shared'
    } catch (err) {
      // User cancelled share — don't treat as failure to copy
      if (err instanceof DOMException && err.name === 'AbortError') return 'failed'
    }
  }

  const copied = await copyText(text)
  return copied ? 'copied' : 'failed'
}
