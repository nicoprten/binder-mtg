import { useState } from 'react'
import type { Card } from '../types'
import { useData } from '../data'
import { CardForm } from './CardForm'
import { applyValues } from '../cardForm'

/** Edit and delete controls for one card, shown to editors inside the detail view. */
export function CardEditor({ card, onDeleted }: { card: Card; onDeleted?: () => void }) {
  const { cards, saveCard, deleteCard } = useData()
  const [editing, setEditing] = useState(false)
  const [confirming, setConfirming] = useState(false)

  // The detail shows the card merged with Scryfall data; edits go on top of the stored document.
  const stored = cards.find((c) => c.id === card.id) ?? card

  if (editing) {
    return (
      <CardForm
        initial={stored}
        submitLabel="Save"
        onCancel={() => setEditing(false)}
        onSubmit={async (values) => {
          await saveCard({ ...applyValues(stored, values), id: stored.id })
          setEditing(false)
        }}
      />
    )
  }

  return (
    <div className="card-editor-actions">
      <button type="button" onClick={() => setEditing(true)}>
        Edit
      </button>
      {confirming ? (
        <span className="confirm-delete">
          <span>Remove from the binder?</span>
          <button
            type="button"
            className="danger"
            onClick={async () => {
              await deleteCard(stored.id)
              onDeleted?.()
            }}
          >
            Yes, remove
          </button>
          <button type="button" onClick={() => setConfirming(false)}>
            Cancel
          </button>
        </span>
      ) : (
        <button type="button" className="danger" onClick={() => setConfirming(true)}>
          Remove
        </button>
      )}
    </div>
  )
}
