import { createContext } from 'react'
import type { Card, Deck, Pickup, Store } from '../types'

export interface User {
  uid: string
  email: string | null
  displayName: string | null
  photoURL: string | null
}

export interface DataContextValue {
  cards: Card[]
  pickups: Pickup[]
  stores: Store[]
  decks: Deck[]
  /** Where the data comes from: Firestore, or the JSON files bundled with the app. */
  source: 'firestore' | 'local'
  /** True once Firestore has answered (or immediately in local mode). */
  ready: boolean
  /** Firestore is reachable but holds no cards yet: offer to import the bundled data. */
  needsSeed: boolean
  user: User | null
  /** False until Firebase has reported whether someone is signed in (true at once without Firebase). */
  authReady: boolean
  /** Why the last sign-in was rejected (an account outside the allowed list), for the landing screen. */
  authError: string | null
  /** Signed in with an account that gets the edit UI. Firestore rules have the final say. */
  isEditor: boolean
  /** Last failed write, for a banner; null when the last write succeeded. */
  error: string | null
  clearError: () => void
  signIn: () => Promise<void>
  signOut: () => Promise<void>
  saveCard: (card: Card) => Promise<void>
  deleteCard: (id: string) => Promise<void>
  savePickup: (pickup: Pickup) => Promise<void>
  updatePickup: (id: string, patch: Partial<Pickup>) => Promise<void>
  deletePickup: (id: string) => Promise<void>
  saveStore: (store: Store) => Promise<void>
  saveDeck: (deck: Deck) => Promise<void>
  deleteDeck: (id: string) => Promise<void>
  seed: () => Promise<void>
}

export const DataContext = createContext<DataContextValue | null>(null)
