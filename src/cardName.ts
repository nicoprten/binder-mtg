import type { Card } from './types'

/** `{name} - {SET} {number}`, leaving out the parts a card lacks. */
export function fullCardName(card: Card): string {
  const printing = [card.set, card.collectorNumber].filter(Boolean).join(' ')
  return printing ? `${card.name} - ${printing}` : card.name
}
