export type Color = 'W' | 'U' | 'B' | 'R' | 'G'

export type Rarity = 'common' | 'uncommon' | 'rare' | 'mythic'

/**
 * Where the card stands in the collection:
 * - `owned`: in your possession, kept in the binder.
 * - `to-pick-up`: found and reserved, still needs to be bought and collected.
 * - `wishlist`: wanted, not found yet.
 * - `to-trade`: owned, but available to sell or trade away.
 */
export type CardStatus = 'owned' | 'to-pick-up' | 'wishlist' | 'to-trade'

/** Printed language, using the codes Magic prints on the card (e.g. `EN`, `ES`, `JA`). */
export type Language = 'en' | 'es' | 'pt' | 'fr' | 'de' | 'it' | 'ja' | 'ko' | 'ru' | 'zhs' | 'zht'

/** Special frame of a printing, used to pick the right version when resolving a card by name. */
export type Frame = 'borderless' | 'showcase' | 'extended-art'

/** Physical finish of the card. Defaults to `nonfoil` when omitted. */
export type Finish = 'nonfoil' | 'foil' | 'surge-foil'

/**
 * A card in the binder. Only `id`, `name`, `set`, `quantity`, `status` and `language`
 * are required: a card entered with just those is resolved at runtime from Scryfall
 * by name and set, which fills in every optional field below (and the picture).
 */
export interface Card {
  /** Stable identifier: `${set}-${collectorNumber}` in lowercase, or a slug when the number is unknown. */
  id: string
  name: string
  set: string
  collectorNumber?: string
  /** Mana cost in Scryfall notation, e.g. "{1}{B}". */
  manaCost?: string
  cmc?: number
  colors?: Color[]
  typeLine?: string
  oracleText?: string
  power?: string
  toughness?: string
  rarity?: Rarity
  artist?: string
  /** Image path relative to the site root, without a leading slash (files live in /public). */
  image?: string
  /** Number of copies (owned, reserved or wanted, depending on `status`). */
  quantity: number
  status: CardStatus
  language: Language
  finish?: Finish
  frame?: Frame
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
