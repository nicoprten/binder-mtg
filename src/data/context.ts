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
  /** Signed in with one of the listed accounts: sees every section and the edit UI. Firestore rules have the final say. */
  isEditor: boolean
  /** Last failed write, for a banner; null when the last write succeeded. */
  error: string | null
  /** Why Firestore could not be read (usually rules not published), for a banner. */
  loadError: string | null
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
