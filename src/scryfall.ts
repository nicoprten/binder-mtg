import type { Card } from './types'

/** The subset of a Scryfall card object this app reads. */
export interface ScryfallInfo {
  /** `image_uris.normal`, or the front face's for double-faced cards. */
  image?: string
  /** `prices.usd` (nonfoil), as a number. */
  usd?: number
  /** `prices.usd_foil`. */
  usdFoil?: number
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

/** Scryfall identifies a printing by set code and collector number (no leading zeros). */
export function scryfallPath(card: Card): string | undefined {
  const number = card.collectorNumber.replace(/^0+(?=\d)/, '')
  if (!card.set || !number) return undefined
  return `${card.set.toLowerCase()}/${encodeURIComponent(number)}`
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

interface ScryfallCardJson {
  image_uris?: { normal?: string }
  card_faces?: { image_uris?: { normal?: string } }[]
  prices?: { usd?: string | null; usd_foil?: string | null }
}

function parse(json: ScryfallCardJson): ScryfallInfo {
  const image = json.image_uris?.normal ?? json.card_faces?.[0]?.image_uris?.normal
  const toNumber = (v: string | null | undefined) => (v ? Number(v) : undefined)
  return {
    image,
    usd: toNumber(json.prices?.usd),
    usdFoil: toNumber(json.prices?.usd_foil),
    fetchedAt: Date.now(),
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
  const promise = enqueue(async () => {
    try {
      const res = await fetch(`https://api.scryfall.com/cards/${path}`, {
        headers: { Accept: 'application/json' },
      })
      if (!res.ok) return null
      const info = parse((await res.json()) as ScryfallCardJson)
      writeCache(path, info)
      return info
    } catch {
      return null
    }
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
