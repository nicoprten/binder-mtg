import { useMemo, useState } from 'react'
import { useData } from '../data'
import type { Card } from '../types'
import { CardTile } from './CardTile'
import { CardRow } from './CardRow'
import { CardModal } from './CardModal'
import { SearchInput } from './SearchInput'
import { ViewToggle } from './ViewToggle'
import { useScryfallMany } from '../hooks/useScryfallMany'
import { resolveCard } from '../scryfall'
import { ASKING_PRICE_NOTE } from '../pricing'
import type { ViewMode } from '../urlState'
import { compareBySetAndNumber } from '../sortCards'

const VIEW_KEY = 'binder-mtg:trade-view'

function loadView(): ViewMode {
  try {
    return localStorage.getItem(VIEW_KEY) === 'list' ? 'list' : 'grid'
  } catch {
    return 'grid'
  }
}

/** The cards up for trade, with their asking prices. Visible without signing in. */
export function TradeList() {
  const { cards } = useData()
  const tradeCards = useMemo(() => cards.filter((c) => c.status === 'to-trade'), [cards])
  const infos = useScryfallMany(tradeCards)
  const resolved = useMemo(
    () => tradeCards.map((c) => resolveCard(c, infos[c.id])).sort(compareBySetAndNumber),
    [tradeCards, infos],
  )
  const [query, setQuery] = useState('')
  const [view, setView] = useState<ViewMode>(loadView)
  const [selected, setSelected] = useState<Card | null>(null)

  function changeView(next: ViewMode) {
    setView(next)
    try {
      localStorage.setItem(VIEW_KEY, next)
    } catch {
      // Storage unavailable: the choice lasts for this page load only.
    }
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return resolved
    return resolved.filter((c) => c.name.toLowerCase().includes(q) || (c.typeLine ?? '').toLowerCase().includes(q))
  }, [resolved, query])

  return (
    <section className="trade">
      <header className="stats-header">
        <h2>Cards to trade</h2>
        <p className="muted">{ASKING_PRICE_NOTE}</p>
      </header>
      <div className="toolbar">
        <SearchInput className="toolbar-search" placeholder="Search by name or type…" value={query} onChange={setQuery} />
        <span className="count">
          {filtered.length} of {tradeCards.length} cards
        </span>
        <ViewToggle view={view} onChange={changeView} />
      </div>
      {filtered.length === 0 ? (
        <p className="empty">No cards to trade right now.</p>
      ) : view === 'grid' ? (
        <div className="card-grid">
          {filtered.map((c) => (
            <CardTile key={c.id} card={c} badge={c.quantity > 1 ? `×${c.quantity}` : undefined} onClick={() => setSelected(c)} />
          ))}
        </div>
      ) : (
        <ul className="card-list">
          {filtered.map((c) => (
            <CardRow key={c.id} card={c} onClick={() => setSelected(c)} />
          ))}
        </ul>
      )}
      {selected && <CardModal card={selected} onClose={() => setSelected(null)} />}
    </section>
  )
}
