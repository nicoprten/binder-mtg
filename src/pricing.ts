import type { Card } from './types'
import { marketPrice, type ScryfallInfo } from './scryfall'

export const MIN_ASKING_PRICE = 0.5

export const ASKING_PRICE_NOTE =
  'Cards to trade show an asking price instead of what was paid: the Scryfall market price rounded up to the next $0.50, never under $0.50.'

/** Rounds up to the next half dollar. */
function ceilHalf(value: number): number {
  return Math.ceil(value * 2) / 2
}

/**
 * The price a card to trade is offered at. Based on the market price when Scryfall has one,
 * otherwise on what was paid; either way rounded up to the next $0.50 with a $0.50 floor.
 * Undefined for cards that are not to trade.
 */
export function askingPrice(card: Card, info: ScryfallInfo | null | undefined): number | undefined {
  if (card.status !== 'to-trade') return undefined
  const base = marketPrice(card, info) ?? card.priceUsd ?? 0
  return Math.max(MIN_ASKING_PRICE, ceilHalf(base))
}
