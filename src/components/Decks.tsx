import { useMemo, useState } from 'react'
import { cards } from '../data'
import type { Card, Deck } from '../types'
import { useDecks } from '../hooks/useDecks'
import { CardTile } from './CardTile'
import { SearchInput } from './SearchInput'
import { FinishBadge } from './FinishBadge'
import { ManaCost } from './ManaCost'
import { formatCardPrice, formatUsd } from '../format'
import { StatusBadge } from './StatusBadge'
import { MarketPrice } from './MarketPrice'
import { useScryfallMany } from '../hooks/useScryfallMany'
import { resolveCard } from '../scryfall'

export function Decks() {
  const { decks, createDeck, updateDeck, deleteDeck, setCardQuantity } = useDecks()
  const infos = useScryfallMany(cards)
  const resolved = useMemo(() => cards.map((c) => resolveCard(c, infos[c.id])), [infos])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [newName, setNewName] = useState('')

  const selected = decks.find((d) => d.id === selectedId) ?? null

  function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    const name = newName.trim()
    if (!name) return
    const deck = createDeck(name)
    setSelectedId(deck.id)
    setNewName('')
  }

  function handleDelete(deck: Deck) {
    deleteDeck(deck.id)
    if (selectedId === deck.id) setSelectedId(null)
  }

  return (
    <section className="decks">
      <aside className="deck-list">
        <form onSubmit={handleCreate} className="deck-create">
          <input
            placeholder="New deck name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />
          <button type="submit">Create</button>
        </form>
        {decks.length === 0 ? (
          <p className="empty">You haven't built any decks yet.</p>
        ) : (
          <ul>
            {decks.map((d) => {
              const n = d.cards.reduce((s, e) => s + e.quantity, 0)
              return (
                <li key={d.id}>
                  <button
                    type="button"
                    className={d.id === selectedId ? 'selected' : ''}
                    onClick={() => setSelectedId(d.id)}
                  >
                    <span>{d.name}</span>
                    <span className="count">{n}</span>
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </aside>
      {selected ? (
        <DeckEditor
          deck={selected}
          allCards={resolved}
          onRename={(name) => updateDeck(selected.id, { name })}
          onDelete={() => handleDelete(selected)}
          onSetQuantity={(cardId, q) => setCardQuantity(selected.id, cardId, q)}
        />
      ) : (
        <div className="deck-editor empty">
          <p>Pick a deck from the list or create a new one.</p>
        </div>
      )}
    </section>
  )
}

interface EditorProps {
  deck: Deck
  allCards: Card[]
  onRename: (name: string) => void
  onDelete: () => void
  onSetQuantity: (cardId: string, quantity: number) => void
}

function DeckEditor({ deck, allCards, onRename, onDelete, onSetQuantity }: EditorProps) {
  const [query, setQuery] = useState('')
  const [confirmingDelete, setConfirmingDelete] = useState(false)

  const byId = useMemo(() => new Map(allCards.map((c) => [c.id, c])), [allCards])
  const entries = useMemo(
    () =>
      deck.cards
        .map((e) => ({ ...e, card: byId.get(e.cardId) }))
        .filter((e): e is typeof e & { card: Card } => e.card !== undefined)
        .sort((a, b) => (a.card.cmc ?? 0) - (b.card.cmc ?? 0) || a.card.name.localeCompare(b.card.name)),
    [deck.cards, byId],
  )
  const total = entries.reduce((s, e) => s + e.quantity, 0)
  const value = entries.reduce((s, e) => s + (e.card.priceUsd ?? 0) * e.quantity, 0)
  const inDeck = new Map(deck.cards.map((e) => [e.cardId, e.quantity]))

  const available = useMemo(() => {
    const q = query.trim().toLowerCase()
    return allCards.filter((c) => !q || c.name.toLowerCase().includes(q))
  }, [allCards, query])

  function exportText() {
    const text = entries.map((e) => `${e.quantity} ${e.card.name}`).join('\n')
    navigator.clipboard?.writeText(text).catch(() => {})
  }

  return (
    <div className="deck-editor">
      <header className="deck-header">
        <input
          className="deck-name"
          value={deck.name}
          onChange={(e) => onRename(e.target.value)}
        />
        <span className="count">
          {total} cards · <span className="price">{formatUsd(value)}</span>
        </span>
        <button type="button" onClick={exportText} disabled={entries.length === 0}>
          Copy list
        </button>
        {confirmingDelete ? (
          <span className="confirm-delete">
            <span>Delete this deck?</span>
            <button type="button" className="danger" onClick={onDelete}>
              Yes, delete
            </button>
            <button type="button" onClick={() => setConfirmingDelete(false)}>
              Cancel
            </button>
          </span>
        ) : (
          <button type="button" className="danger" onClick={() => setConfirmingDelete(true)}>
            Delete deck
          </button>
        )}
      </header>

      <div className="deck-body">
        <div className="deck-cards">
          <h3>Deck cards</h3>
          {entries.length === 0 ? (
            <p className="empty">This deck is empty. Add cards from the binder on the right.</p>
          ) : (
            <ul className="deck-entries">
              {entries.map(({ card, quantity }) => {
                const over = quantity > card.quantity
                return (
                  <li key={card.id} className={over ? 'over' : ''}>
                    <span className="qty">
                      <button type="button" onClick={() => onSetQuantity(card.id, quantity - 1)}>
                        −
                      </button>
                      {quantity}
                      <button type="button" onClick={() => onSetQuantity(card.id, quantity + 1)}>
                        +
                      </button>
                    </span>
                    <span className="name">{card.name}</span>
                    <ManaCost cost={card.manaCost ?? ''} />
                    <FinishBadge finish={card.finish} size="sm" />
                    {card.status !== 'owned' && <StatusBadge status={card.status} size="sm" />}
                    {formatCardPrice(card, quantity) && (
                      <span className="price">{formatCardPrice(card, quantity)}</span>
                    )}
                    <MarketPrice card={card} quantity={quantity} />
                    {over && (
                      <span className="warn" title="Fewer copies in the binder">
                        binder: {card.quantity}
                      </span>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        <div className="deck-picker">
          <h3>Add from binder</h3>
          <SearchInput
            className="picker-search"
            placeholder="Search card…"
            value={query}
            onChange={setQuery}
          />
          <div className="card-grid small">
            {available.map((c) => {
              const q = inDeck.get(c.id) ?? 0
              return (
                <CardTile
                  key={c.id}
                  card={c}
                  badge={q > 0 ? `${q} in deck` : undefined}
                  onClick={() => onSetQuantity(c.id, q + 1)}
                />
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
