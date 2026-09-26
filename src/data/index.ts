import type { Card } from '../types'
import raw from './cards.json'

export const cards: Card[] = raw as Card[]

export const cardsById: Record<string, Card> = Object.fromEntries(
  cards.map((c) => [c.id, c]),
)
