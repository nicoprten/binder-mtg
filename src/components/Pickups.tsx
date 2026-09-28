import { useMemo } from 'react'
import { cards, pickups } from '../data'
import { formatUsd } from '../format'
import { usePickupEdits } from '../hooks/usePickupEdits'
import { useScryfallMany } from '../hooks/useScryfallMany'
import { resolveCard } from '../scryfall'

const ARS_PER_USD = 1600
const ars = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 })

/** Purchases waiting to be collected, with totals in ARS and USD. */
export function Pickups() {
  const { edits, update } = usePickupEdits()
  const infos = useScryfallMany(cards)
  const byId = useMemo(() => new Map(cards.map((c) => [c.id, resolveCard(c, infos[c.id])])), [infos])

  const rows = pickups.map((o) => {
    const items = o.cardIds.map((id) => byId.get(id)).filter((c) => c !== undefined)
    const usd = items.reduce((n, c) => n + (c.priceUsd ?? 0) * c.quantity, 0)
    const edit = edits[o.id] ?? {}
    return { ...o, items, usd, address: edit.address ?? o.address, paid: edit.paid ?? o.paid }
  })
  const totalUsd = rows.reduce((n, r) => n + r.usd, 0)
  const totalArs = rows.reduce((n, r) => n + (r.totalArs ?? r.usd * ARS_PER_USD), 0)
  const pending = rows.filter((r) => !r.paid)

  return (
    <section className="pickups">
      <header className="pickups-header">
        <h2>Purchases to pick up</h2>
        <p className="muted">
          {rows.length} orders · {rows.reduce((n, r) => n + r.items.length, 0)} cards · {ars.format(totalArs)} ·{' '}
          <span className="price">{formatUsd(totalUsd)}</span>
          {pending.length > 0 && ` · ${pending.length} unpaid`}
        </p>
      </header>
      <ul className="pickup-list">
        {rows.map((r) => (
          <li key={r.id} className={`pickup${r.paid ? ' paid' : ''}`}>
            <div className="pickup-top">
              <div>
                <h3>
                  {r.url ? (
                    <a href={r.url} target="_blank" rel="noopener noreferrer">
                      {r.store}
                    </a>
                  ) : (
                    r.store
                  )}
                  {r.order && <span className="pickup-order">{r.order}</span>}
                </h3>
                <p className="muted">
                  {r.items.length} cards · {r.totalArs !== null ? ars.format(r.totalArs) : `≈ ${ars.format(r.usd * ARS_PER_USD)}`} ·{' '}
                  <span className="price">{formatUsd(r.usd)}</span>
                </p>
                {r.note && <p className="pickup-note">{r.note}</p>}
              </div>
              <label className={`pickup-paid${r.paid ? ' is-paid' : ''}`}>
                <input type="checkbox" checked={r.paid} onChange={(e) => update(r.id, { paid: e.target.checked })} />
                {r.paid ? 'Paid' : 'Unpaid'}
              </label>
            </div>
            <label className="pickup-address">
              <span>Address</span>
              <input
                type="text"
                placeholder="Where to pick it up…"
                value={r.address}
                onChange={(e) => update(r.id, { address: e.target.value })}
              />
            </label>
            <ul className="pickup-cards">
              {r.items.map((c) => (
                <li key={c.id}>
                  <a href={`#/binder?card=${c.id}`}>{c.name}</a>
                  {c.quantity > 1 && <span className="muted"> ×{c.quantity}</span>}
                  <span className="price">{c.priceUsd !== undefined ? formatUsd(c.priceUsd * c.quantity) : '—'}</span>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </section>
  )
}
