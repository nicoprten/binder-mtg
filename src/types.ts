export type Color = 'W' | 'U' | 'B' | 'R' | 'G'

export type Rarity = 'common' | 'uncommon' | 'rare' | 'mythic'

export interface Card {
  /** Identificador estable: `${set}-${collectorNumber}` en minúsculas. */
  id: string
  name: string
  set: string
  collectorNumber: string
  /** Costo de maná en notación Scryfall, p. ej. "{1}{B}". */
  manaCost: string
  cmc: number
  colors: Color[]
  typeLine: string
  oracleText: string
  power?: string
  toughness?: string
  rarity: Rarity
  artist: string
  /** Ruta relativa a /public. */
  image: string
  /** Cantidad de copias físicas en la binder. */
  quantity: number
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
