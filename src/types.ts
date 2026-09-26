export type Color = 'W' | 'U' | 'B' | 'R' | 'G'

export type Rarity = 'common' | 'uncommon' | 'rare' | 'mythic'

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
  /** Number of physical copies in the binder. */
  quantity: number
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
