import { useEffect, useState } from 'react'
import { Binder } from './components/Binder'
import { Decks } from './components/Decks'

type View = 'binder' | 'decks'

function viewFromHash(): View {
  return window.location.hash === '#/decks' ? 'decks' : 'binder'
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
          <a href="#/binder" className={view === 'binder' ? 'active' : ''}>
            Binder
          </a>
          <a href="#/decks" className={view === 'decks' ? 'active' : ''}>
            Decks
          </a>
        </div>
      </nav>
      <main>{view === 'binder' ? <Binder /> : <Decks />}</main>
    </div>
  )
}
