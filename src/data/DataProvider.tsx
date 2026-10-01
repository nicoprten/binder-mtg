import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { onAuthStateChanged, signInWithPopup, signInWithRedirect, signOut as fbSignOut } from 'firebase/auth'
import { collection, deleteDoc, doc, onSnapshot, setDoc, writeBatch } from 'firebase/firestore'
import type { Card, Deck, Pickup, Store } from '../types'
import { EDITOR_EMAILS, firebaseEnabled, getDb, getFirebaseAuth, googleProvider } from '../firebase'
import * as local from './local'
import { DataContext, type DataContextValue, type User } from './context'

const DECKS_KEY = 'binder-mtg:decks'
const PICKUP_EDITS_KEY = 'binder-mtg:pickup-edits'

function loadJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

function saveJson(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // No storage: the change lasts for this page load only.
  }
}

/** Firestore rejects `undefined`, so optional fields that are unset are dropped. */
function stripUndefined<T extends object>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

function describe(e: unknown): string {
  if (e && typeof e === 'object' && 'code' in e && typeof e.code === 'string') {
    if (e.code === 'permission-denied') return 'Permission denied: this account cannot edit the binder.'
    return `Save failed (${e.code}).`
  }
  return 'Save failed.'
}

type PickupEdits = Record<string, Partial<Pick<Pickup, 'paid' | 'status'>>>

export function DataProvider({ children }: { children: ReactNode }) {
  const enabled = firebaseEnabled

  // Remote collections; null until the first snapshot arrives.
  const [remoteCards, setRemoteCards] = useState<Card[] | null>(null)
  const [remotePickups, setRemotePickups] = useState<Pickup[] | null>(null)
  const [remoteStores, setRemoteStores] = useState<Store[] | null>(null)
  const [remoteDecks, setRemoteDecks] = useState<Deck[] | null>(null)

  // Local mode state: decks and pickup edits live in this browser.
  const [localDecks, setLocalDecks] = useState<Deck[]>(() => loadJson<Deck[]>(DECKS_KEY, []))
  const [pickupEdits, setPickupEdits] = useState<PickupEdits>(() => loadJson<PickupEdits>(PICKUP_EDITS_KEY, {}))

  const [user, setUser] = useState<User | null>(null)
  const [authReady, setAuthReady] = useState(!enabled)
  const [authError, setAuthError] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!enabled) return
    const db = getDb()
    const subs = [
      onSnapshot(collection(db, 'cards'), (snap) => setRemoteCards(snap.docs.map((d) => d.data() as Card))),
      onSnapshot(collection(db, 'pickups'), (snap) => setRemotePickups(snap.docs.map((d) => d.data() as Pickup))),
      onSnapshot(collection(db, 'stores'), (snap) => setRemoteStores(snap.docs.map((d) => d.data() as Store))),
      onSnapshot(collection(db, 'decks'), (snap) => setRemoteDecks(snap.docs.map((d) => d.data() as Deck))),
    ]
    const unsubAuth = onAuthStateChanged(getFirebaseAuth(), (u) => {
      const email = u?.email?.toLowerCase() ?? null
      if (u && EDITOR_EMAILS.length > 0 && (email === null || !EDITOR_EMAILS.includes(email))) {
        // Only the listed accounts may enter: anyone else is signed straight back out.
        setAuthError(`${u.email ?? 'This account'} has no access to this binder.`)
        void fbSignOut(getFirebaseAuth())
        setUser(null)
        setAuthReady(true)
        return
      }
      setUser(u ? { uid: u.uid, email: u.email, displayName: u.displayName, photoURL: u.photoURL } : null)
      if (u) setAuthError(null)
      setAuthReady(true)
    })
    return () => {
      subs.forEach((unsub) => unsub())
      unsubAuth()
    }
  }, [enabled])

  const useRemote = enabled && remoteCards !== null && remoteCards.length > 0

  // Until Firestore holds data, the bundled JSON keeps the binder readable.
  const cards = useRemote ? remoteCards : local.cards
  const stores = useRemote && remoteStores && remoteStores.length > 0 ? remoteStores : local.stores
  const pickups = useMemo<Pickup[]>(() => {
    if (useRemote && remotePickups && remotePickups.length > 0) {
      return [...remotePickups].sort((a, b) => a.date.localeCompare(b.date))
    }
    return local.pickups.map((p) => ({ ...p, ...pickupEdits[p.id] }))
  }, [useRemote, remotePickups, pickupEdits])
  const decks = useRemote ? (remoteDecks ?? []) : localDecks

  const isEditor =
    !!user && (EDITOR_EMAILS.length === 0 || (user.email !== null && EDITOR_EMAILS.includes(user.email.toLowerCase())))

  const run = useCallback(async (op: () => Promise<void>) => {
    try {
      await op()
      setError(null)
    } catch (e) {
      setError(describe(e))
      throw e
    }
  }, [])

  const signIn = useCallback(async () => {
    const auth = getFirebaseAuth()
    try {
      await signInWithPopup(auth, googleProvider)
    } catch {
      // Popups are blocked on some mobile browsers: fall back to a full-page redirect.
      await signInWithRedirect(auth, googleProvider)
    }
  }, [])

  const signOut = useCallback(async () => {
    await fbSignOut(getFirebaseAuth())
  }, [])

  const saveCard = useCallback(
    (card: Card) => run(() => setDoc(doc(getDb(), 'cards', card.id), stripUndefined(card))),
    [run],
  )
  const deleteCard = useCallback((id: string) => run(() => deleteDoc(doc(getDb(), 'cards', id))), [run])

  const savePickup = useCallback(
    (pickup: Pickup) => run(() => setDoc(doc(getDb(), 'pickups', pickup.id), stripUndefined(pickup))),
    [run],
  )
  const deletePickup = useCallback((id: string) => run(() => deleteDoc(doc(getDb(), 'pickups', id))), [run])

  const updatePickup = useCallback(
    async (id: string, patch: Partial<Pickup>) => {
      if (useRemote) {
        await run(() => setDoc(doc(getDb(), 'pickups', id), stripUndefined(patch), { merge: true }))
        return
      }
      setPickupEdits((prev) => {
        const next = { ...prev, [id]: { ...prev[id], ...patch } }
        saveJson(PICKUP_EDITS_KEY, next)
        return next
      })
    },
    [useRemote, run],
  )

  const saveStore = useCallback(
    (store: Store) => run(() => setDoc(doc(getDb(), 'stores', store.id), stripUndefined(store))),
    [run],
  )

  const saveDeck = useCallback(
    async (deck: Deck) => {
      if (useRemote) {
        await run(() => setDoc(doc(getDb(), 'decks', deck.id), stripUndefined(deck)))
        return
      }
      setLocalDecks((prev) => {
        const next = prev.some((d) => d.id === deck.id) ? prev.map((d) => (d.id === deck.id ? deck : d)) : [...prev, deck]
        saveJson(DECKS_KEY, next)
        return next
      })
    },
    [useRemote, run],
  )

  const deleteDeck = useCallback(
    async (id: string) => {
      if (useRemote) {
        await run(() => deleteDoc(doc(getDb(), 'decks', id)))
        return
      }
      setLocalDecks((prev) => {
        const next = prev.filter((d) => d.id !== id)
        saveJson(DECKS_KEY, next)
        return next
      })
    },
    [useRemote, run],
  )

  /** Copies the bundled JSON into Firestore. Only offered while the cards collection is empty. */
  const seed = useCallback(
    () =>
      run(async () => {
        const db = getDb()
        const groups: [string, { id: string }[]][] = [
          ['cards', local.cards],
          ['pickups', local.pickups],
          ['stores', local.stores],
        ]
        for (const [name, items] of groups) {
          // A batch takes at most 500 writes.
          for (let i = 0; i < items.length; i += 450) {
            const batch = writeBatch(db)
            for (const item of items.slice(i, i + 450)) batch.set(doc(db, name, item.id), stripUndefined(item))
            await batch.commit()
          }
        }
      }),
    [run],
  )

  const value: DataContextValue = {
    cards,
    pickups,
    stores,
    decks,
    source: useRemote ? 'firestore' : 'local',
    ready: !enabled || remoteCards !== null,
    needsSeed: enabled && remoteCards !== null && remoteCards.length === 0,
    user,
    authReady,
    authError,
    isEditor,
    error,
    clearError: () => setError(null),
    signIn,
    signOut,
    saveCard,
    deleteCard,
    savePickup,
    updatePickup,
    deletePickup,
    saveStore,
    saveDeck,
    deleteDeck,
    seed,
  }

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}
