import { useEffect, useState } from 'react'
import { Binder } from './components/Binder'
import { Decks } from './components/Decks'
import { Pickups } from './components/Pickups'
import { hashRoute, lastBinderHash } from './urlState'

type View = 'binder' | 'decks' | 'pickups'

function viewFromHash(): View {
  const route = hashRoute()
  if (route === '/decks') return 'decks'
  if (route === '/pickups') return 'pickups'
  return 'binder'
}

export default function App() {
  const [view, setView] = useState<View>(viewFromHash)

  useEffect(() => {
    const onHashChange = () => setView(viewFromHash())
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  return (
    <div className="app">
      <nav className="topbar">
        <h1>Binder MTG</h1>
        <div className="tabs">
          <a href={view === 'binder' ? '#/binder' : lastBinderHash()} className={view === 'binder' ? 'active' : ''}>
            Binder
          </a>
          <a href="#/decks" className={view === 'decks' ? 'active' : ''}>
            Decks
          </a>
          <a href="#/pickups" className={view === 'pickups' ? 'active' : ''}>
            Pickups
          </a>
        </div>
      </nav>
      <main>{view === 'binder' ? <Binder /> : view === 'decks' ? <Decks /> : <Pickups />}</main>
    </div>
  )
}
