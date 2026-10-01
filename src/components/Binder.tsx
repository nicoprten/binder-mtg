import { useEffect, useMemo, useState } from 'react'
import { useData } from '../data'
import type { Card, CardStatus, Finish } from '../types'
import { CardTile } from './CardTile'
import { CardRow } from './CardRow'
import { SearchInput } from './SearchInput'
import { CardModal } from './CardModal'
import { ViewToggle } from './ViewToggle'
import { AddCard } from './AddCard'
import { Pagination } from './Pagination'
import { useScryfallMany } from '../hooks/useScryfallMany'
import { resolveCard } from '../scryfall'
import { readBinderParams, writeBinderParams, type ColorKey, type ViewMode } from '../urlState'
import { STATUSES, STATUS_LABEL } from '../status'
import { ASKING_PRICE_NOTE } from '../pricing'
import { FINISH_OPTIONS } from '../options'
import { compareBySetAndNumber } from '../sortCards'

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
const PAGE_SIZE = 28

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

export function Binder() {
  const { cards, isEditor } = useData()
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
  const [page, setPage] = useState(initial.page)

  // Changing a filter starts again from the first page.
  const filterKey = `${query}|${[...colors].join('')}|${status}|${finish}`
  const [lastFilterKey, setLastFilterKey] = useState(filterKey)
  if (filterKey !== lastFilterKey) {
    setLastFilterKey(filterKey)
    setPage(1)
  }
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
      page,
    })
  }, [query, colors, status, finish, view, selectedId, page])

  function changeView(next: ViewMode) {
    setView(next)
    saveView(next)
  }

  const infos = useScryfallMany(cards)
  const resolved = useMemo(
    () => cards.map((c) => resolveCard(c, infos[c.id])).sort(compareBySetAndNumber),
    [cards, infos],
  )

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

  // A page past the end (after filtering, or from a stale link) clamps to the last one.
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const currentPage = Math.min(page, pageCount)
  const pageCards = useMemo(
    () => filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE),
    [filtered, currentPage],
  )

  function changePage(next: number) {
    setPage(next)
    window.scrollTo({ top: 0 })
  }

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
            {FINISH_OPTIONS.map((f) => (
              <option key={f.key} value={f.key}>
                {f.label}
              </option>
            ))}
          </select>
          <span className="count">
            {filtered.length} of {cards.length} cards
            {pageCount > 1 ? ` · page ${currentPage} of ${pageCount}` : ''}
          </span>
          <ViewToggle view={view} onChange={changeView} />
        </div>
        {isEditor && <AddCard />}
        {pageCards.some((c) => c.status === 'to-trade') && <p className="binder-note">{ASKING_PRICE_NOTE}</p>}
        {filtered.length === 0 ? (
          <p className="empty">No cards match.</p>
        ) : view === 'grid' ? (
          <div className="card-grid">
            {pageCards.map((c) => (
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
            {pageCards.map((c) => (
              <CardRow key={c.id} card={c} onClick={() => setSelectedId(c.id)} />
            ))}
          </ul>
        )}
        <Pagination page={currentPage} pageCount={pageCount} onChange={changePage} />
      </div>
      {selected && <CardModal card={selected} onClose={() => setSelectedId(null)} />}
    </section>
  )
}
