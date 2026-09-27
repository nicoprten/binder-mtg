import type { Card } from './types'

const usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })

export function formatUsd(value: number): string {
  return usd.format(value)
}

/** The owner's price for a card, times `quantity`, or undefined when no price is set. */
export function formatCardPrice(card: Card, quantity = 1): string | undefined {
  if (card.priceUsd === undefined) return undefined
  return formatUsd(card.priceUsd * quantity)
}
