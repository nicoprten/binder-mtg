import type { Shop } from './types'

/** The cheapest known listing, or the first when prices are unknown. */
export function bestShop(shops?: Shop[]): Shop | undefined {
  if (!shops || shops.length === 0) return undefined
  return [...shops].sort((a, b) => (a.priceUsd ?? Infinity) - (b.priceUsd ?? Infinity))[0]
}
