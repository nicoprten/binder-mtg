import { useMemo, useState } from 'react'
import { cards } from '../data'
import type { Card, CardStatus, Color, Finish } from '../types'
import { CardTile } from './CardTile'
import { CardRow } from './CardRow'
import { CardModal } from './CardModal'
import { formatUsd } from '../format'
import { STATUSES, STATUS_LABEL } from '../status'

type ColorKey = Color | 'C'

const COLORS: { key: ColorKey; label: string }[] = [
  { key: 'W', label: 'White' },
  { key: 'U', label: 'Blue' },
  { key: 'B', label: 'Black' },
  { key: 'R', label: 'Red' },
  { key: 'G', label: 'Green' },
  { key: 'C', label: 'Colorless' },
]

const MANA_CLASS: Record<ColorKey, string> = {
  W: 'mana-w',
  U: 'mana-u',
  B: 'mana-b',
  R: 'mana-r',
  G: 'mana-g',
  C: 'mana-c',
}

type ViewMode = 'grid' | 'list'

const VIEW_KEY = 'binder-mtg:binder-view'

function loadView(): ViewMode {
  try {
    return localStorage.getItem(VIEW_KEY) === 'list' ? 'list' : 'grid'
  } catch {
    return 'grid'
  }
}

function saveView(view: ViewMode) {
  try {
    localStorage.setItem(VIEW_KEY, view)
  } catch {
    // Storage unavailable: the choice lasts for this page load only.
  }
}

const FINISHES: { key: Finish; label: string }[] = [
  { key: 'nonfoil', label: 'Nonfoil' },
  { key: 'foil', label: 'Foil' },
  { key: 'surge-foil', label: 'Surge Foil' },
]

export function Binder() {
  const [query, setQuery] = useState('')
  const [colors, setColors] = useState<Set<ColorKey>>(() => new Set())

  function toggleColor(key: ColorKey) {
    setColors((prev) => {
      if (prev.has(key)) {
        const next = new Set(prev)
        next.delete(key)
        return next
      }
      // Colorless cannot combine with a color, so it replaces the selection and vice versa.
      if (key === 'C') return new Set<ColorKey>(['C'])
      const next = new Set<ColorKey>(prev)
      next.delete('C')
      next.add(key)
      return next
    })
  }
  const [finish, setFinish] = useState<Finish | ''>('')
  const [status, setStatus] = useState<CardStatus | ''>('')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [view, setView] = useState<ViewMode>(loadView)

  function changeView(next: ViewMode) {
    setView(next)
    saveView(next)
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return cards.filter((c) => {
      if (colors.size > 0) {
        // The card must contain every selected color; colorless means no colors at all.
        const matches = colors.has('C')
          ? c.colors.length === 0
          : [...colors].every((col) => c.colors.includes(col as Color))
        if (!matches) return false
      }
      if (finish && (c.finish ?? 'nonfoil') !== finish) return false
      if (status && c.status !== status) return false
      if (!q) return true
      return (
        c.name.toLowerCase().includes(q) ||
        c.typeLine.toLowerCase().includes(q) ||
        c.oracleText.toLowerCase().includes(q) ||
        c.tags?.some((t) => t.toLowerCase().includes(q))
      )
    })
  }, [query, colors, finish, status])

  const selected: Card | undefined = cards.find((c) => c.id === selectedId)
  const owned = cards.filter((c) => c.status === 'owned')
  const ownedCopies = owned.reduce((n, c) => n + c.quantity, 0)
  const ownedValue = owned.reduce((n, c) => n + (c.priceUsd ?? 0) * c.quantity, 0)

  return (
    <section className="binder">
      <div className="binder-main">
        <div className="toolbar">
          <input
            type="search"
            placeholder="Search by name, type, text or tag…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <div className="color-filter" role="group" aria-label="Colors">
            {COLORS.map((c) => (
              <button
                key={c.key}
                type="button"
                className={`mana ${MANA_CLASS[c.key]}${colors.has(c.key) ? ' active' : ''}`}
                aria-pressed={colors.has(c.key)}
                title={c.label}
                onClick={() => toggleColor(c.key)}
              >
                {c.key}
              </button>
            ))}
          </div>
          <select value={status} onChange={(e) => setStatus(e.target.value as CardStatus | '')}>
            <option value="">All statuses</option>
            {STATUSES.map((st) => (
              <option key={st} value={st}>
                {STATUS_LABEL[st]}
              </option>
            ))}
          </select>
          <select value={finish} onChange={(e) => setFinish(e.target.value as Finish | '')}>
            <option value="">All finishes</option>
            {FINISHES.map((f) => (
              <option key={f.key} value={f.key}>
                {f.label}
              </option>
            ))}
          </select>
          <span className="count">
            {filtered.length} of {cards.length} cards · {ownedCopies} owned ·{' '}
            <span className="price">{formatUsd(ownedValue)}</span>
          </span>
          <div className="view-toggle" role="group" aria-label="View">
            <button
              type="button"
              className={view === 'grid' ? 'active' : ''}
              onClick={() => changeView('grid')}
              title="Grid view"
            >
              Grid
            </button>
            <button
              type="button"
              className={view === 'list' ? 'active' : ''}
              onClick={() => changeView('list')}
              title="List view"
            >
              List
            </button>
          </div>
        </div>
        {filtered.length === 0 ? (
          <p className="empty">No cards match.</p>
        ) : view === 'grid' ? (
          <div className="card-grid">
            {filtered.map((c) => (
              <CardTile
                key={c.id}
                card={c}
                badge={c.quantity > 1 ? `×${c.quantity}` : undefined}
                selected={c.id === selectedId}
                onClick={() => setSelectedId(c.id)}
              />
            ))}
          </div>
        ) : (
          <ul className="card-list">
            {filtered.map((c) => (
              <CardRow key={c.id} card={c} onClick={() => setSelectedId(c.id)} />
            ))}
          </ul>
        )}
      </div>
      {selected && <CardModal card={selected} onClose={() => setSelectedId(null)} />}
    </section>
  )
}
