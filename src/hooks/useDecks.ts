import { useCallback } from 'react'
import type { Deck, DeckEntry } from '../types'
import { useData } from '../data'

function newId() {
  return `deck-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`
}

/** Decks from the data layer (Firestore, or this browser in local mode). */
export function useDecks() {
  const { decks, saveDeck, deleteDeck: remove } = useData()

  const createDeck = useCallback(
    (name: string): Deck => {
      const now = new Date().toISOString()
      const deck: Deck = { id: newId(), name, cards: [], createdAt: now, updatedAt: now }
      void saveDeck(deck)
      return deck
    },
    [saveDeck],
  )

  const updateDeck = useCallback(
    (id: string, patch: Partial<Omit<Deck, 'id'>>) => {
      const deck = decks.find((d) => d.id === id)
      if (deck) void saveDeck({ ...deck, ...patch, updatedAt: new Date().toISOString() })
    },
    [decks, saveDeck],
  )

  const deleteDeck = useCallback((id: string) => void remove(id), [remove])

  const setCardQuantity = useCallback(
    (deckId: string, cardId: string, quantity: number) => {
      const deck = decks.find((d) => d.id === deckId)
      if (!deck) return
      const others = deck.cards.filter((e) => e.cardId !== cardId)
      const cards: DeckEntry[] = quantity > 0 ? [...others, { cardId, quantity }] : others
      void saveDeck({ ...deck, cards, updatedAt: new Date().toISOString() })
    },
    [decks, saveDeck],
  )

  return { decks, createDeck, updateDeck, deleteDeck, setCardQuantity }
}
