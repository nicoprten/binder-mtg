import { useMemo, useState } from 'react'
import { cards, cardsById } from '../data'
import type { Deck } from '../types'
import { useDecks } from '../hooks/useDecks'
import { CardTile } from './CardTile'
import { ManaCost } from './ManaCost'

export function Decks() {
  const { decks, createDeck, updateDeck, deleteDeck, setCardQuantity } = useDecks()
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
    if (!window.confirm(`¿Borrar el mazo "${deck.name}"?`)) return
    deleteDeck(deck.id)
    if (selectedId === deck.id) setSelectedId(null)
  }

  return (
    <section className="decks">
      <aside className="deck-list">
        <form onSubmit={handleCreate} className="deck-create">
          <input
            placeholder="Nombre del mazo nuevo"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />
          <button type="submit">Crear</button>
        </form>
        {decks.length === 0 ? (
          <p className="empty">Todavía no armaste ningún mazo.</p>
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
          onRename={(name) => updateDeck(selected.id, { name })}
          onDelete={() => handleDelete(selected)}
          onSetQuantity={(cardId, q) => setCardQuantity(selected.id, cardId, q)}
        />
      ) : (
        <div className="deck-editor empty">
          <p>Elegí un mazo de la lista o creá uno nuevo.</p>
        </div>
      )}
    </section>
  )
}

interface EditorProps {
  deck: Deck
  onRename: (name: string) => void
  onDelete: () => void
  onSetQuantity: (cardId: string, quantity: number) => void
}

function DeckEditor({ deck, onRename, onDelete, onSetQuantity }: EditorProps) {
  const [query, setQuery] = useState('')

  const entries = useMemo(
    () =>
      deck.cards
        .map((e) => ({ ...e, card: cardsById[e.cardId] }))
        .filter((e) => e.card !== undefined)
        .sort((a, b) => a.card.cmc - b.card.cmc || a.card.name.localeCompare(b.card.name)),
    [deck.cards],
  )
  const total = entries.reduce((s, e) => s + e.quantity, 0)
  const inDeck = new Map(deck.cards.map((e) => [e.cardId, e.quantity]))

  const available = useMemo(() => {
    const q = query.trim().toLowerCase()
    return cards.filter((c) => !q || c.name.toLowerCase().includes(q))
  }, [query])

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
        <span className="count">{total} cartas</span>
        <button type="button" onClick={exportText} disabled={entries.length === 0}>
          Copiar lista
        </button>
        <button type="button" className="danger" onClick={onDelete}>
          Borrar mazo
        </button>
      </header>

      <div className="deck-body">
        <div className="deck-cards">
          <h3>Cartas del mazo</h3>
          {entries.length === 0 ? (
            <p className="empty">El mazo está vacío. Agregá cartas desde la binder de la derecha.</p>
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
                    <ManaCost cost={card.manaCost} />
                    {over && (
                      <span className="warn" title="Tenés menos copias en la binder">
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
          <h3>Agregar desde la binder</h3>
          <input
            type="search"
            placeholder="Buscar carta…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <div className="card-grid small">
            {available.map((c) => {
              const q = inDeck.get(c.id) ?? 0
              return (
                <CardTile
                  key={c.id}
                  card={c}
                  badge={q > 0 ? `${q} en mazo` : undefined}
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
