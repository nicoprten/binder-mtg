import type { Card, Pickup } from '../types'
import raw from './cards.json'
import rawPickups from './pickups.json'

export const cards: Card[] = raw as Card[]

export const cardsById: Record<string, Card> = Object.fromEntries(
  cards.map((c) => [c.id, c]),
)

export const pickups: Pickup[] = rawPickups as Pickup[]
