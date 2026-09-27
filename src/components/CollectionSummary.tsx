import { useMemo } from 'react'
import type { Card, CardStatus } from '../types'
import { formatUsd } from '../format'
import { useScryfallMany } from '../hooks/useScryfallMany'
import { marketPrice } from '../scryfall'

interface Group {
  label: string
  statuses: CardStatus[]
}

const GROUPS: Group[] = [
  { label: 'Owned & to trade', statuses: ['owned', 'to-trade'] },
  { label: 'To pick up', statuses: ['to-pick-up'] },
]

/** Paid vs. market value per status group. */
export function CollectionSummary({ cards }: { cards: Card[] }) {
  const infos = useScryfallMany(cards)

  const rows = useMemo(
    () =>
      GROUPS.map((g) => {
        const group = cards.filter((c) => g.statuses.includes(c.status))
        const copies = group.reduce((n, c) => n + c.quantity, 0)
        const paid = group.reduce((n, c) => n + (c.priceUsd ?? 0) * c.quantity, 0)
        const unpriced = group.filter((c) => c.priceUsd === undefined).length
        let market = 0
        let withMarket = 0
        for (const c of group) {
          const p = marketPrice(c, infos[c.id])
          if (p !== undefined) {
            market += p * c.quantity
            withMarket++
          }
        }
        return { ...g, cards: group.length, copies, paid, unpriced, market, withMarket }
      }),
    [cards, infos],
  )

  return (
    <section className="summary">
      {rows.map((r) => {
        const hasMarket = r.withMarket > 0
        const diff = r.market - r.paid
        return (
          <div key={r.label} className="summary-tile">
            <h3>{r.label}</h3>
            <p className="summary-count">
              {r.cards} cards · {r.copies} copies
            </p>
            <dl>
              <dt>Paid</dt>
              <dd className="price">{formatUsd(r.paid)}</dd>
              <dt>Market</dt>
              <dd className="market-price">{hasMarket ? `~${formatUsd(r.market)}` : '—'}</dd>
              <dt>Difference</dt>
              <dd className={hasMarket ? (diff >= 0 ? 'gain' : 'loss') : 'muted'}>
                {hasMarket ? `${diff >= 0 ? '+' : '−'}${formatUsd(Math.abs(diff))}` : '—'}
              </dd>
            </dl>
            {(r.unpriced > 0 || (hasMarket && r.withMarket < r.cards)) && (
              <p className="summary-note">
                {r.unpriced > 0 && `${r.unpriced} without a price`}
                {r.unpriced > 0 && hasMarket && r.withMarket < r.cards && ' · '}
                {hasMarket && r.withMarket < r.cards && `${r.cards - r.withMarket} without market data`}
              </p>
            )}
          </div>
        )
      })}
    </section>
  )
}
