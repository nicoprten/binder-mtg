import { useEffect, useState } from 'react'
import type { Card } from '../types'
import { fetchPrintings, type Printing, type ScryfallInfo } from '../scryfall'

interface Loaded {
  card: Card
  printings: Printing[]
}

/** Every printing of a card, fetched when first asked for. Null while loading. */
export function usePrintings(card: Card, info: ScryfallInfo | null): Printing[] | null {
  const [loaded, setLoaded] = useState<Loaded | null>(null)
  useEffect(() => {
    let cancelled = false
    fetchPrintings(card, info).then((printings) => {
      if (!cancelled) setLoaded({ card, printings })
    })
    return () => {
      cancelled = true
    }
  }, [card, info])
  // A result for another card is stale: report loading until this card's arrives.
  return loaded && loaded.card === card ? loaded.printings : null
}
