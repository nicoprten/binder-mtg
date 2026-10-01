import type { Card, Pickup, Store } from '../types'
import raw from './cards.json'
import rawPickups from './pickups.json'
import rawStores from './stores.json'

export const cards: Card[] = raw as Card[]

export const cardsById: Record<string, Card> = Object.fromEntries(
  cards.map((c) => [c.id, c]),
)

export const pickups: Pickup[] = rawPickups as Pickup[]

export const stores: Store[] = rawStores as Store[]
