import type { Card, Color, Frame, Rarity } from './types'

/** The subset of a Scryfall card object this app reads. */
export interface ScryfallInfo {
  /** `image_uris.normal`, or the front face's for double-faced cards. */
  image?: string
  /** `prices.usd` (nonfoil), as a number. */
  usd?: number
  /** `prices.usd_foil`. */
  usdFoil?: number
  collectorNumber?: string
  manaCost?: string
  cmc?: number
  colors?: Color[]
  typeLine?: string
  oracleText?: string
  power?: string
  toughness?: string
  rarity?: Rarity
  artist?: string
  /** Scryfall search URL listing every printing of this card. */
  printsSearchUri?: string
  /** When this entry was fetched, in ms since epoch. */
  fetchedAt: number
}

/** One printing of a card, from the prints search. */
export interface Printing {
  id: string
  set: string
  setName: string
  collectorNumber: string
  /** `image_uris.small`, or the front face's. */
  image?: string
  /** `image_uris.normal`, for previewing the printing at full size. */
  imageLarge?: string
  usd?: number
  usdFoil?: number
  /** Scryfall frame effects (showcase, extendedart…) and border, to describe the version. */
  frameEffects: string[]
  borderColor?: string
  promo: boolean
  releasedAt?: string
}

declare global {
  interface Window {
    /** Set by builds that cannot reach Scryfall (e.g. the claude.ai artifact) to skip every remote call. */
    BINDER_LOCAL_IMAGES?: boolean
  }
}

const TTL_MS = 24 * 60 * 60 * 1000
const GAP_MS = 100 // Scryfall asks for 50–100 ms between requests.

export function isOffline(): boolean {
  return typeof window !== 'undefined' && window.BINDER_LOCAL_IMAGES === true
}

const FRAME_FILTER: Record<Frame, string> = {
  borderless: 'is:borderless',
  showcase: 'is:showcase',
  'extended-art': 'is:extended',
  promo: 'is:promo',
}

/** Exact-name lookup, within the set when `withSet` is true, ignoring any frame preference. */
function namedPath(card: Card, withSet = true): string | undefined {
  const front = card.name.split(' // ')[0].trim()
  if (!front) return undefined
  const base = `named?exact=${encodeURIComponent(front)}`
  if (!withSet) return base
  if (!card.set) return undefined
  return `${base}&set=${encodeURIComponent(card.set.toLowerCase())}`
}

/**
 * Scryfall identifies a printing by set code and collector number (no leading zeros).
 * Without a number the card is looked up by exact name within the set; with a `frame`
 * the lookup becomes a search restricted to that frame, so the right variant is picked.
 */
export function scryfallPath(card: Card): string | undefined {
  const number = (card.collectorNumber ?? '').replace(/^0+(?=\d)/, '')
  if (card.set && number) return `${card.set.toLowerCase()}/${encodeURIComponent(number)}`
  const front = card.name.split(' // ')[0].trim()
  if (!front) return undefined
  if (card.frame) {
    const frames = Array.isArray(card.frame) ? card.frame : [card.frame]
    const filter =
      frames.length === 1
        ? FRAME_FILTER[frames[0]]
        : `(${frames.map((f) => FRAME_FILTER[f]).join(' or ')})`
    const q = `!"${front}"${card.set ? ` e:${card.set.toLowerCase()}` : ''} ${filter}`
    return `search?q=${encodeURIComponent(q)}&unique=prints&order=set`
  }
  // No set: the card is whatever printing Scryfall returns for the exact name.
  return namedPath(card, !!card.set)
}

const memory = new Map<string, Promise<ScryfallInfo | null>>()

function cacheKey(path: string) {
  return `binder-mtg:scryfall:${path}`
}

function readCache(path: string): ScryfallInfo | null {
  try {
    const raw = localStorage.getItem(cacheKey(path))
    if (!raw) return null
    const info = JSON.parse(raw) as ScryfallInfo
    return Date.now() - info.fetchedAt < TTL_MS ? info : null
  } catch {
    return null
  }
}

function writeCache(path: string, info: ScryfallInfo) {
  try {
    localStorage.setItem(cacheKey(path), JSON.stringify(info))
  } catch {
    // No storage: the in-memory cache still covers this page load.
  }
}

interface ScryfallFace {
  image_uris?: { normal?: string; small?: string }
  mana_cost?: string
  oracle_text?: string
  power?: string
  toughness?: string
}

interface ScryfallCardJson extends ScryfallFace {
  id?: string
  name?: string
  set?: string
  set_name?: string
  prints_search_uri?: string
  frame_effects?: string[]
  border_color?: string
  promo?: boolean
  released_at?: string
  card_faces?: ScryfallFace[]
  prices?: { usd?: string | null; usd_foil?: string | null }
  collector_number?: string
  cmc?: number
  colors?: string[]
  color_identity?: string[]
  type_line?: string
  rarity?: string
  artist?: string
}

const RARITIES: Rarity[] = ['common', 'uncommon', 'rare', 'mythic']

function parse(json: ScryfallCardJson): ScryfallInfo {
  const front = json.card_faces?.[0]
  const toNumber = (v: string | null | undefined) => (v ? Number(v) : undefined)
  const rarity = RARITIES.includes(json.rarity as Rarity) ? (json.rarity as Rarity) : undefined
  const colors = (json.colors ?? json.color_identity ?? []).filter((c): c is Color =>
    ['W', 'U', 'B', 'R', 'G'].includes(c),
  )
  const oracle =
    json.oracle_text ??
    json.card_faces?.map((f) => f.oracle_text ?? '').filter(Boolean).join('\n—\n')
  return {
    image: json.image_uris?.normal ?? front?.image_uris?.normal,
    usd: toNumber(json.prices?.usd),
    usdFoil: toNumber(json.prices?.usd_foil),
    collectorNumber: json.collector_number,
    manaCost: json.mana_cost ?? front?.mana_cost,
    cmc: json.cmc,
    colors,
    typeLine: json.type_line,
    oracleText: oracle,
    power: json.power ?? front?.power,
    toughness: json.toughness ?? front?.toughness,
    rarity,
    artist: json.artist,
    printsSearchUri: json.prints_search_uri,
    fetchedAt: Date.now(),
  }
}

function parsePrinting(json: ScryfallCardJson): Printing | null {
  if (!json.id || !json.set || !json.collector_number) return null
  const front = json.card_faces?.[0]
  const toNumber = (v: string | null | undefined) => (v ? Number(v) : undefined)
  return {
    id: json.id,
    set: json.set.toUpperCase(),
    setName: json.set_name ?? json.set.toUpperCase(),
    collectorNumber: json.collector_number,
    image: json.image_uris?.small ?? front?.image_uris?.small,
    imageLarge: json.image_uris?.normal ?? front?.image_uris?.normal,
    usd: toNumber(json.prices?.usd),
    usdFoil: toNumber(json.prices?.usd_foil),
    frameEffects: json.frame_effects ?? [],
    borderColor: json.border_color,
    promo: json.promo ?? false,
    releasedAt: json.released_at,
  }
}

interface PrintingsCache {
  printings: Printing[]
  fetchedAt: number
}

const printingsMemory = new Map<string, Promise<Printing[]>>()

/** The search listing every printing: Scryfall's own URL when known, else an exact-name search. */
function printsUri(card: Card, info: ScryfallInfo | null | undefined): string {
  if (info?.printsSearchUri) return info.printsSearchUri
  const front = card.name.split(' // ')[0].trim()
  const q = encodeURIComponent(`!"${front}"`)
  return `https://api.scryfall.com/cards/search?q=${q}&unique=prints&order=released`
}

/** Every printing of the card (up to two pages, 350 printings), newest first. Empty when unavailable. */
export function fetchPrintings(card: Card, info: ScryfallInfo | null | undefined): Promise<Printing[]> {
  if (isOffline()) return Promise.resolve([])
  const uri = printsUri(card, info)
  const key = `binder-mtg:scryfall-prints:${uri}`
  try {
    const raw = localStorage.getItem(key)
    if (raw) {
      const cached = JSON.parse(raw) as PrintingsCache
      if (Date.now() - cached.fetchedAt < TTL_MS) return Promise.resolve(cached.printings)
    }
  } catch {
    // No cache: fetch below.
  }
  const pending = printingsMemory.get(uri)
  if (pending) return pending
  const promise = enqueue(async () => {
    const printings: Printing[] = []
    let next: string | undefined = uri
    for (let page = 0; next && page < 2; page++) {
      try {
        const res = await fetch(next, { headers: { Accept: 'application/json' } })
        if (!res.ok) break
        const json = (await res.json()) as { data?: ScryfallCardJson[]; has_more?: boolean; next_page?: string }
        for (const item of json.data ?? []) {
          const p = parsePrinting(item)
          if (p) printings.push(p)
        }
        next = json.has_more ? json.next_page : undefined
        if (next) await new Promise((r) => setTimeout(r, GAP_MS))
      } catch {
        break
      }
    }
    try {
      localStorage.setItem(key, JSON.stringify({ printings, fetchedAt: Date.now() } satisfies PrintingsCache))
    } catch {
      // No storage: the in-memory cache still covers this page load.
    }
    return printings
  })
  printingsMemory.set(uri, promise)
  return promise
}

/** Whether a printing is the one the owner's card records (set and collector number). */
export function isOwnPrinting(card: Card, p: Printing): boolean {
  if (!card.set || !card.collectorNumber) return false
  return (
    p.set.toLowerCase() === card.set.toLowerCase() &&
    p.collectorNumber.replace(/^0+/, '') === card.collectorNumber.replace(/^0+/, '')
  )
}

/** The app's frame value for a printing, when it is a special version. */
export function printingFrame(p: Printing): Frame | undefined {
  if (p.borderColor === 'borderless') return 'borderless'
  if (p.frameEffects.includes('showcase')) return 'showcase'
  if (p.frameEffects.includes('extendedart')) return 'extended-art'
  if (p.promo) return 'promo'
  return undefined
}

/** Short label for how a printing differs from the regular version. */
export function printingVersion(p: Printing): string | undefined {
  const parts: string[] = []
  if (p.borderColor === 'borderless') parts.push('Borderless')
  if (p.frameEffects.includes('showcase')) parts.push('Showcase')
  if (p.frameEffects.includes('extendedart')) parts.push('Extended art')
  if (p.frameEffects.includes('etched')) parts.push('Etched')
  if (p.promo) parts.push('Promo')
  return parts.length > 0 ? parts.join(' · ') : undefined
}

/** The card with every field it lacks filled in from Scryfall, when that data is available. */
export function resolveCard(card: Card, info: ScryfallInfo | null | undefined): Card {
  if (!info) return card
  return {
    ...card,
    collectorNumber: card.collectorNumber ?? info.collectorNumber,
    manaCost: card.manaCost ?? info.manaCost,
    cmc: card.cmc ?? info.cmc,
    colors: card.colors ?? info.colors,
    typeLine: card.typeLine ?? info.typeLine,
    oracleText: card.oracleText ?? info.oracleText,
    power: card.power ?? info.power,
    toughness: card.toughness ?? info.toughness,
    rarity: card.rarity ?? info.rarity,
    artist: card.artist ?? info.artist,
  }
}

// Requests go out one at a time, spaced by GAP_MS.
let chain: Promise<unknown> = Promise.resolve()

function enqueue<T>(job: () => Promise<T>): Promise<T> {
  const run = chain.then(job, job)
  chain = run.then(
    () => new Promise((r) => setTimeout(r, GAP_MS)),
    () => new Promise((r) => setTimeout(r, GAP_MS)),
  )
  return run
}

/** Fetches (or reads from cache) the Scryfall data for a card. Resolves null when unavailable. */
export function fetchScryfall(card: Card): Promise<ScryfallInfo | null> {
  const path = scryfallPath(card)
  if (!path || isOffline()) return Promise.resolve(null)
  const cached = readCache(path)
  if (cached) return Promise.resolve(cached)
  const pending = memory.get(path)
  if (pending) return pending
  // Fallbacks, in order: a frame-restricted search that finds nothing tries the plain
  // named lookup in the set; a name unknown in that set (e.g. a wrong set code) tries
  // the name in any set. Lookups by collector number have no fallback.
  const fallbacks: (string | undefined)[] = []
  if (path.startsWith('search?')) fallbacks.push(namedPath(card))
  fallbacks.push(namedPath(card, false))
  const byNumber = !path.startsWith('search?') && !path.startsWith('named?')
  if (byNumber) fallbacks.unshift(namedPath(card))
  const front = card.name.split(' // ')[0].trim().toLowerCase()
  const promise = enqueue(async () => {
    for (const p of [path, ...fallbacks]) {
      if (!p) continue
      try {
        const res = await fetch(`https://api.scryfall.com/cards/${p}`, {
          headers: { Accept: 'application/json' },
        })
        if (!res.ok) continue
        const json = (await res.json()) as ScryfallCardJson & { data?: ScryfallCardJson[] }
        // A search returns a list; the first printing is the one wanted.
        const found = Array.isArray(json.data) ? json.data[0] : json
        if (!found) continue
        // A wrong collector number returns a different card: ignore it and try by name.
        const foundName = (found.name ?? '').split(' // ')[0].trim().toLowerCase()
        if (foundName && foundName !== front) continue
        const info = parse(found)
        writeCache(path, info)
        return info
      } catch {
        // Try the next lookup, if any.
      }
    }
    return null
  })
  memory.set(path, promise)
  return promise
}

/** Market price in USD for the card's finish: foil finishes use `usd_foil`. */
export function marketPrice(card: Card, info: ScryfallInfo | null | undefined): number | undefined {
  if (!info) return undefined
  const foil = card.finish === 'foil' || card.finish === 'surge-foil'
  return foil ? info.usdFoil : info.usd
}
