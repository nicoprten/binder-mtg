import { useMemo, useState } from 'react'
import { cards } from '../data'
import type { Card, Color } from '../types'
import { CardTile } from './CardTile'
import { CardDetail } from './CardDetail'

const COLORS: { key: Color; label: string }[] = [
  { key: 'W', label: 'Blanco' },
  { key: 'U', label: 'Azul' },
  { key: 'B', label: 'Negro' },
  { key: 'R', label: 'Rojo' },
  { key: 'G', label: 'Verde' },
]

export function Binder() {
  const [query, setQuery] = useState('')
  const [color, setColor] = useState<Color | ''>('')
  const [selectedId, setSelectedId] = useState<string | null>(cards[0]?.id ?? null)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return cards.filter((c) => {
      if (color && !c.colors.includes(color)) return false
      if (!q) return true
      return (
        c.name.toLowerCase().includes(q) ||
        c.typeLine.toLowerCase().includes(q) ||
        c.oracleText.toLowerCase().includes(q) ||
        c.tags?.some((t) => t.toLowerCase().includes(q))
      )
    })
  }, [query, color])

  const selected: Card | undefined = cards.find((c) => c.id === selectedId)
  const total = cards.reduce((n, c) => n + c.quantity, 0)

  return (
    <section className="binder">
      <div className="binder-main">
        <div className="toolbar">
          <input
            type="search"
            placeholder="Buscar por nombre, tipo, texto o tag…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <select value={color} onChange={(e) => setColor(e.target.value as Color | '')}>
            <option value="">Todos los colores</option>
            {COLORS.map((c) => (
              <option key={c.key} value={c.key}>
                {c.label}
              </option>
            ))}
          </select>
          <span className="count">
            {filtered.length} de {cards.length} cartas · {total} copias
          </span>
        </div>
        {filtered.length === 0 ? (
          <p className="empty">No hay cartas que coincidan.</p>
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
