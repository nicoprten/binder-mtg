import { useEffect, useState } from 'react'
import type { Card } from '../types'
import { fetchScryfall, type ScryfallInfo } from '../scryfall'

/** Scryfall data for a card, or null while loading or when unavailable. */
export function useScryfall(card: Card): ScryfallInfo | null {
  const [info, setInfo] = useState<ScryfallInfo | null>(null)
  useEffect(() => {
    let cancelled = false
    fetchScryfall(card).then((result) => {
      if (!cancelled) setInfo(result)
    })
    return () => {
      cancelled = true
    }
  }, [card])
  return info
}
