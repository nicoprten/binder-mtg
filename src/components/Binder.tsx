import { useMemo, useState } from 'react'
import { cards } from '../data'
import type { Card, CardStatus, Color, Finish } from '../types'
import { CardTile } from './CardTile'
import { CardDetail } from './CardDetail'
import { formatUsd } from '../format'
import { STATUSES, STATUS_LABEL } from '../status'

const COLORS: { key: Color; label: string }[] = [
  { key: 'W', label: 'White' },
  { key: 'U', label: 'Blue' },
  { key: 'B', label: 'Black' },
  { key: 'R', label: 'Red' },
  { key: 'G', label: 'Green' },
]

const FINISHES: { key: Finish; label: string }[] = [
  { key: 'nonfoil', label: 'Nonfoil' },
  { key: 'foil', label: 'Foil' },
  { key: 'surge-foil', label: 'Surge Foil' },
]

export function Binder() {
  const [query, setQuery] = useState('')
  const [color, setColor] = useState<Color | ''>('')
  const [finish, setFinish] = useState<Finish | ''>('')
  const [status, setStatus] = useState<CardStatus | ''>('')
  const [selectedId, setSelectedId] = useState<string | null>(cards[0]?.id ?? null)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return cards.filter((c) => {
      if (color && !c.colors.includes(color)) return false
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
  }, [query, color, finish, status])

  const selected: Card | undefined = cards.find((c) => c.id === selectedId)
  const owned = cards.filter((c) => c.status === 'in-stock')
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
          <select value={color} onChange={(e) => setColor(e.target.value as Color | '')}>
            <option value="">All colors</option>
            {COLORS.map((c) => (
              <option key={c.key} value={c.key}>
                {c.label}
              </option>
            ))}
          </select>
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
            {filtered.length} of {cards.length} cards · {ownedCopies} in stock ·{' '}
            <span className="price">{formatUsd(ownedValue)}</span>
          </span>
        </div>
        {filtered.length === 0 ? (
          <p className="empty">No cards match.</p>
        ) : (
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
        )}
      </div>
      {selected && <CardDetail card={selected} />}
    </section>
  )
}
