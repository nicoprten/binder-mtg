import type { Card } from '../types'
import { formatUsd } from '../format'
import { useScryfall } from '../hooks/useScryfall'
import { marketPrice } from '../scryfall'

/** Scryfall market price for the card's finish, shown next to the owner's price. Renders nothing when unknown. */
export function MarketPrice({ card, quantity = 1 }: { card: Card; quantity?: number }) {
  const price = marketPrice(card, useScryfall(card))
  if (price === undefined) return null
  const foil = card.finish === 'foil' || card.finish === 'surge-foil'
  return (
    <span className="market-price" title={`Scryfall market price (${foil ? 'foil' : 'nonfoil'})`}>
      ~{formatUsd(price * quantity)}
    </span>
  )
}
