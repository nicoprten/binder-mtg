import { useEffect, useRef, useState } from 'react'
import type { Card } from '../types'
import { fullCardName } from '../cardName'

interface Props {
  card: Card
  className?: string
}

/** Three-dot button opening a small menu of copy actions. Never opens the card it sits on. */
export function CardMenu({ card, className }: Props) {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState<string | null>(null)
  const root = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (root.current && !root.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey, true)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey, true)
    }
  }, [open])

  useEffect(() => {
    if (!copied) return
    const t = setTimeout(() => {
      setCopied(null)
      setOpen(false)
    }, 900)
    return () => clearTimeout(t)
  }, [copied])

  async function copy(e: React.MouseEvent, key: string, text: string) {
    e.stopPropagation()
    try {
      await navigator.clipboard.writeText(text)
      setCopied(key)
    } catch {
      window.prompt('Copy:', text)
      setOpen(false)
    }
  }

  const items = [
    { key: 'name', label: 'Copy name', text: card.name },
    { key: 'full', label: 'Copy full name', text: fullCardName(card) },
  ]

  return (
    <span ref={root} className={`card-menu${className ? ` ${className}` : ''}`}>
      <button
        type="button"
        className="card-menu-button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Card actions"
        title="Card actions"
        onClick={(e) => {
          e.stopPropagation()
          setOpen((v) => !v)
        }}
      >
        <svg viewBox="0 0 24 24" width="1em" height="1em" aria-hidden="true">
          <circle cx="5" cy="12" r="2" fill="currentColor" />
          <circle cx="12" cy="12" r="2" fill="currentColor" />
          <circle cx="19" cy="12" r="2" fill="currentColor" />
        </svg>
      </button>
      {open && (
        <ul className="card-menu-list" role="menu" onClick={(e) => e.stopPropagation()}>
          {items.map((it) => (
            <li key={it.key} role="none">
              <button type="button" role="menuitem" onClick={(e) => copy(e, it.key, it.text)}>
                {copied === it.key ? 'Copied ✓' : it.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </span>
  )
}
