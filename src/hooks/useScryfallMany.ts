import { useEffect, useState } from 'react'
import type { Card } from '../types'
import { fetchScryfall, type ScryfallInfo } from '../scryfall'

/** Scryfall data for many cards, keyed by card id, filled in as lookups resolve. */
export function useScryfallMany(cards: Card[]): Record<string, ScryfallInfo | null> {
  const [infos, setInfos] = useState<Record<string, ScryfallInfo | null>>({})
  useEffect(() => {
    let cancelled = false
    for (const card of cards) {
      fetchScryfall(card).then((info) => {
        if (cancelled) return
        setInfos((prev) => (prev[card.id] === info ? prev : { ...prev, [card.id]: info }))
      })
    }
    return () => {
      cancelled = true
    }
  }, [cards])
  return infos
}
