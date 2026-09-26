export type Color = 'W' | 'U' | 'B' | 'R' | 'G'

export type Rarity = 'common' | 'uncommon' | 'rare' | 'mythic'

/**
 * Where the card stands in the collection:
 * - `in-stock`: owned, physically in the binder.
 * - `to-pick-up`: found and reserved, still needs to be bought and collected.
 * - `wishlist`: wanted, not found yet.
 */
export type CardStatus = 'in-stock' | 'to-pick-up' | 'wishlist'

/** Physical finish of the card. Defaults to `nonfoil` when omitted. */
export type Finish = 'nonfoil' | 'foil' | 'surge-foil'

export interface Card {
  /** Stable identifier: `${set}-${collectorNumber}` in lowercase. */
  id: string
  name: string
  set: string
  collectorNumber: string
  /** Mana cost in Scryfall notation, e.g. "{1}{B}". */
  manaCost: string
  cmc: number
  colors: Color[]
  typeLine: string
  oracleText: string
  power?: string
  toughness?: string
  rarity: Rarity
  artist: string
  /** Image path relative to the site root, without a leading slash (files live in /public). */
  image: string
  /** Number of copies (owned, reserved or wanted, depending on `status`). */
  quantity: number
  status: CardStatus
  finish?: Finish
  /** Market price of one copy, in USD. */
  priceUsd?: number
  tags?: string[]
}

export interface DeckEntry {
  cardId: string
  quantity: number
}

export interface Deck {
  id: string
  name: string
  description?: string
  cards: DeckEntry[]
  createdAt: string
  updatedAt: string
}
