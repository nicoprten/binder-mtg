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
  /** When this entry was fetched, in ms since epoch. */
  fetchedAt: number
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
}

/** Exact-name lookup within the set, ignoring any frame preference. */
function namedPath(card: Card): string | undefined {
  if (!card.set) return undefined
  const front = card.name.split(' // ')[0].trim()
  if (!front) return undefined
  return `named?exact=${encodeURIComponent(front)}&set=${encodeURIComponent(card.set.toLowerCase())}`
}

/**
 * Scryfall identifies a printing by set code and collector number (no leading zeros).
 * Without a number the card is looked up by exact name within the set; with a `frame`
 * the lookup becomes a search restricted to that frame, so the right variant is picked.
 */
export function scryfallPath(card: Card): string | undefined {
  if (!card.set) return undefined
  const number = (card.collectorNumber ?? '').replace(/^0+(?=\d)/, '')
  if (number) return `${card.set.toLowerCase()}/${encodeURIComponent(number)}`
  const front = card.name.split(' // ')[0].trim()
  if (!front) return undefined
  if (card.frame) {
    const frames = Array.isArray(card.frame) ? card.frame : [card.frame]
    const filter =
      frames.length === 1
        ? FRAME_FILTER[frames[0]]
        : `(${frames.map((f) => FRAME_FILTER[f]).join(' or ')})`
    const q = `!"${front}" e:${card.set.toLowerCase()} ${filter}`
    return `search?q=${encodeURIComponent(q)}&unique=prints&order=set`
  }
  return namedPath(card)
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
  image_uris?: { normal?: string }
  mana_cost?: string
  oracle_text?: string
  power?: string
  toughness?: string
}

interface ScryfallCardJson extends ScryfallFace {
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
    fetchedAt: Date.now(),
  }
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
  // A frame-restricted search that finds nothing falls back to the plain named lookup,
  // so a card whose special printing Scryfall does not list still resolves.
  const fallback = path.startsWith('search?') ? namedPath(card) : undefined
  const promise = enqueue(async () => {
    for (const p of [path, fallback]) {
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
