import { useState } from 'react'
import type { Card } from '../types'
import { useData } from '../data'
import { printingFrame, type Printing } from '../scryfall'
import { CardForm } from './CardForm'
import { applyValues } from '../cardForm'

interface Props {
  card: Card
  editing: boolean
  onEditingChange: (editing: boolean) => void
  /** Printing picked in the strip while editing; null keeps the card's own. */
  printing: Printing | null
  onDeleted?: () => void
}

/** Edit and delete controls for one card, shown to editors inside the detail view. */
export function CardEditor({ card, editing, onEditingChange, printing, onDeleted }: Props) {
  const { cards, saveCard, deleteCard } = useData()
  const [confirming, setConfirming] = useState(false)

  // The detail shows the card merged with Scryfall data; edits go on top of the stored document.
  const stored = cards.find((c) => c.id === card.id) ?? card

  if (editing) {
    return (
      <CardForm
        initial={stored}
        printingFields={false}
        submitLabel="Save"
        onCancel={() => onEditingChange(false)}
        onSubmit={async (values) => {
          const next = applyValues(stored, values, { printing: false })
          if (printing) {
            // Switching printing: set, number and frame follow it; the bundled picture no longer applies.
            next.set = printing.set
            next.collectorNumber = printing.collectorNumber
            next.frame = printingFrame(printing)
            next.image = undefined
          }
          await saveCard({ ...next, id: stored.id })
          onEditingChange(false)
        }}
      />
    )
  }

  return (
    <div className="card-editor-actions">
      <button type="button" onClick={() => onEditingChange(true)}>
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
