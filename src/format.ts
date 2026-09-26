import type { Card } from './types'

const usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })
const ars = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 })

export function formatUsd(value: number): string {
  return usd.format(value)
}

export function formatArs(value: number): string {
  return ars.format(value)
}

/** Price to show for a card: USD when known, otherwise ARS, otherwise nothing. */
export function formatCardPrice(card: Card, quantity = 1): string | undefined {
  if (card.priceUsd !== undefined) return formatUsd(card.priceUsd * quantity)
  if (card.priceArs !== undefined) return formatArs(card.priceArs * quantity)
  return undefined
}
