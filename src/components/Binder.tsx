import { useEffect, useMemo, useState } from 'react'
import { cards } from '../data'
import type { Card, CardStatus, Finish } from '../types'
import { CardTile } from './CardTile'
import { CardRow } from './CardRow'
import { SearchInput } from './SearchInput'
import { CardModal } from './CardModal'
import { CollectionSummary } from './CollectionSummary'
import { useScryfallMany } from '../hooks/useScryfallMany'
import { resolveCard } from '../scryfall'
import { readBinderParams, writeBinderParams, type ColorKey, type ViewMode } from '../urlState'
import { STATUSES, STATUS_LABEL } from '../status'

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
  // Read the URL once per mount, so a link into the binder from another tab applies.
  const [initial] = useState(readBinderParams)
  const [query, setQuery] = useState(initial.query)
  const [colors, setColors] = useState<Set<ColorKey>>(() => new Set(initial.colors))

  function toggleColor(key: ColorKey) {
    setColors((prev) => {
      if (prev.has(key)) {
        const next = new Set(prev)
        next.delete(key)
        return next
      }
      // A card cannot be colorless and colored at once, so colorless clears the colors and vice versa.
      if (key === 'C') return new Set<ColorKey>(['C'])
      const next = new Set<ColorKey>(prev)
      next.delete('C')
      next.add(key)
      return next
    })
  }
  const [finish, setFinish] = useState<Finish | ''>(initial.finish)
  const [status, setStatus] = useState<CardStatus | ''>(initial.status)
  const [selectedId, setSelectedId] = useState<string | null>(initial.card || null)
  const [view, setView] = useState<ViewMode>(() => initial.view || loadView())

  // Keep the URL in sync so filters survive a reload and can be shared.
  useEffect(() => {
    writeBinderParams({
      query,
      colors: [...colors],
      status,
      finish,
      view: view === 'grid' ? '' : view,
      card: selectedId ?? '',
    })
  }, [query, colors, status, finish, view, selectedId])

  function changeView(next: ViewMode) {
    setView(next)
    saveView(next)
  }

  const infos = useScryfallMany(cards)
  const resolved = useMemo(() => cards.map((c) => resolveCard(c, infos[c.id])), [infos])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return resolved.filter((c) => {
      if (colors.size > 0) {
        // The card must have every selected color. A card with no colors counts as colorless.
        const own: ColorKey[] = (c.colors ?? []).length > 0 ? (c.colors as ColorKey[]) : ['C']
        if (![...colors].every((col) => own.includes(col))) return false
      }
      if (finish && (c.finish ?? 'nonfoil') !== finish) return false
      if (status && c.status !== status) return false
      if (!q) return true
      return (
        c.name.toLowerCase().includes(q) ||
        (c.typeLine ?? '').toLowerCase().includes(q) ||
        (c.oracleText ?? '').toLowerCase().includes(q) ||
        c.tags?.some((t) => t.toLowerCase().includes(q))
      )
    })
  }, [resolved, query, colors, finish, status])

  const selected: Card | undefined = resolved.find((c) => c.id === selectedId)

  return (
    <section className="binder">
      <div className="binder-main">
        <div className="toolbar">
          <SearchInput
            className="toolbar-search"
            placeholder="Search by name, type, text or tag…"
            value={query}
            onChange={setQuery}
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
            {filtered.length} of {cards.length} cards
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
        <CollectionSummary cards={resolved} />
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
