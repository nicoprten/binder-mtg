import { initializeApp, type FirebaseApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider, type Auth } from 'firebase/auth'
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  type Firestore,
} from 'firebase/firestore'

declare global {
  interface Window {
    /** Set by static builds (the claude.ai artifact) to run from the bundled JSON only. */
    BINDER_STATIC_DATA?: boolean
  }
}

const env = import.meta.env
const config = {
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID,
}

/** True when the Firebase config is present and this is not a static build. */
export const firebaseEnabled: boolean =
  Boolean(config.apiKey && config.projectId && config.appId) &&
  !(typeof window !== 'undefined' && window.BINDER_STATIC_DATA === true)

/** Google accounts that get the edit UI. Empty means any signed-in account (rules still decide). */
export const EDITOR_EMAILS: string[] = (env.VITE_EDITOR_EMAILS ?? '')
  .split(',')
  .map((s) => s.trim().toLowerCase())
  .filter(Boolean)

let app: FirebaseApp | undefined
let db: Firestore | undefined
let auth: Auth | undefined

function getApp(): FirebaseApp {
  if (!app) app = initializeApp(config)
  return app
}

/** Firestore with an IndexedDB cache, so the binder loads instantly and works offline. */
export function getDb(): Firestore {
  if (!db) {
    db = initializeFirestore(getApp(), {
      localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
    })
  }
  return db
}

export function getFirebaseAuth(): Auth {
  if (!auth) auth = getAuth(getApp())
  return auth
}

export const googleProvider = new GoogleAuthProvider()
