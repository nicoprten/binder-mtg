import type { Card } from '../types'
import { formatUsd } from '../format'
import { useScryfall } from '../hooks/useScryfall'
import { askingPrice, ASKING_PRICE_NOTE } from '../pricing'

/** The asking price of a card to trade, labelled so it is not read as what was paid. Renders nothing for other cards. */
export function AskingPrice({ card, quantity = 1, label = 'Sell' }: { card: Card; quantity?: number; label?: string }) {
  const price = askingPrice(card, useScryfall(card))
  if (price === undefined) return null
  return (
    <span className="price asking" title={ASKING_PRICE_NOTE}>
      <span className="asking-label">{label}</span> {formatUsd(price * quantity)}
    </span>
  )
}
