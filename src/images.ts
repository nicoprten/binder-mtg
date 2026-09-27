import type { Card } from './types'

/**
 * High-resolution image from Scryfall, addressed by set code and collector number.
 * Returns undefined when the card lacks a collector number.
 */
export function scryfallImageUrl(card: Card): string | undefined {
  const number = card.collectorNumber.replace(/^0+(?=\d)/, '')
  if (!card.set || !number) return undefined
  return `https://api.scryfall.com/cards/${card.set.toLowerCase()}/${encodeURIComponent(number)}?format=image&version=normal`
}
