import { useCallback, useEffect, useState } from 'react'
import type { Deck, DeckEntry } from '../types'

const STORAGE_KEY = 'binder-mtg:decks'

function load(): Deck[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as Deck[]) : []
  } catch {
    return []
  }
}

function save(decks: Deck[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(decks))
  } catch {
    // No storage available: decks live in memory only.
  }
}

function newId() {
  return `deck-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`
}

export function useDecks() {
  const [decks, setDecks] = useState<Deck[]>(load)

  useEffect(() => {
    save(decks)
  }, [decks])

  const createDeck = useCallback((name: string): Deck => {
    const now = new Date().toISOString()
    const deck: Deck = { id: newId(), name, cards: [], createdAt: now, updatedAt: now }
    setDecks((prev) => [...prev, deck])
    return deck
  }, [])

  const updateDeck = useCallback((id: string, patch: Partial<Omit<Deck, 'id'>>) => {
    setDecks((prev) =>
      prev.map((d) =>
        d.id === id ? { ...d, ...patch, updatedAt: new Date().toISOString() } : d,
      ),
    )
  }, [])

  const deleteDeck = useCallback((id: string) => {
    setDecks((prev) => prev.filter((d) => d.id !== id))
  }, [])

  const setCardQuantity = useCallback((deckId: string, cardId: string, quantity: number) => {
    setDecks((prev) =>
      prev.map((d) => {
        if (d.id !== deckId) return d
        const others = d.cards.filter((e) => e.cardId !== cardId)
        const cards: DeckEntry[] =
          quantity > 0 ? [...others, { cardId, quantity }] : others
        return { ...d, cards, updatedAt: new Date().toISOString() }
      }),
    )
  }, [])

  return { decks, createDeck, updateDeck, deleteDeck, setCardQuantity }
}
