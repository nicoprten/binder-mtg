import { useEffect, useRef, useState } from 'react'
import { Binder } from './components/Binder'
import { Decks } from './components/Decks'
import { Pickups } from './components/Pickups'
import { Stats } from './components/Stats'
import { Stores } from './components/Stores'
import { AuthButton } from './components/AuthButton'
import { useData } from './data'
import { hashRoute, lastBinderHash } from './urlState'

type View = 'binder' | 'decks' | 'pickups' | 'stats' | 'stores'

function viewFromHash(): View {
  const route = hashRoute()
  if (route === '/decks') return 'decks'
  if (route === '/pickups') return 'pickups'
  if (route === '/stats') return 'stats'
  if (route === '/stores') return 'stores'
  return 'binder'
}

export default function App() {
  const [view, setView] = useState<View>(viewFromHash)
  // On narrow screens the tabs collapse behind a three-dot button.
  const [menuOpen, setMenuOpen] = useState(false)
  const nav = useRef<HTMLElement>(null)
  const { needsSeed, isEditor, seed, error, clearError, source } = useData()

  useEffect(() => {
    const onHashChange = () => {
      setView(viewFromHash())
      setMenuOpen(false)
    }
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  useEffect(() => {
    if (!menuOpen) return
    const onDown = (e: MouseEvent) => {
      if (nav.current && !nav.current.contains(e.target as Node)) setMenuOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [menuOpen])

  return (
    <div className="app">
      <nav className={`topbar${menuOpen ? ' menu-open' : ''}`} ref={nav}>
        <h1>Binder MTG</h1>
        <button
          type="button"
          className="tabs-menu-button"
          aria-label="Menu"
          aria-expanded={menuOpen}
          aria-controls="main-tabs"
          onClick={() => setMenuOpen((o) => !o)}
        >
          ⋯
        </button>
        <div className="tabs" id="main-tabs" onClick={() => setMenuOpen(false)}>
          <a href={view === 'binder' ? '#/binder' : lastBinderHash()} className={view === 'binder' ? 'active' : ''}>
            Binder
          </a>
          <a href="#/decks" className={view === 'decks' ? 'active' : ''}>
            Decks
          </a>
          <a href="#/pickups" className={view === 'pickups' ? 'active' : ''}>
            Pickups
          </a>
          <a href="#/stats" className={view === 'stats' ? 'active' : ''}>
            Stats
          </a>
          <a href="#/stores" className={view === 'stores' ? 'active' : ''}>
            Stores
          </a>
          <AuthButton />
        </div>
      </nav>
      {needsSeed && isEditor && (
        <div className="banner">
          <span>Firestore is empty. Import the data bundled with the app to get started.</span>
          <button type="button" onClick={() => void seed().catch(() => {})}>
            Import bundled data
          </button>
        </div>
      )}
      {needsSeed && !isEditor && source === 'local' && (
        <div className="banner muted-banner">Showing the bundled data: sign in as an editor to import it into Firestore.</div>
      )}
      {error && (
        <div className="banner error-banner">
          <span>{error}</span>
          <button type="button" onClick={clearError}>
            Dismiss
          </button>
        </div>
      )}
      <main>
        {view === 'binder' ? (
          <Binder />
        ) : view === 'decks' ? (
          <Decks />
        ) : view === 'pickups' ? (
          <Pickups />
        ) : view === 'stores' ? (
          <Stores />
        ) : (
          <Stats />
        )}
      </main>
    </div>
  )
}
