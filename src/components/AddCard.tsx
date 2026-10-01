import { useState } from 'react'
import { useData } from '../data'
import { CardForm } from './CardForm'
import { applyValues } from '../cardForm'

function slug(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

/** "Add card" button with the form in a small panel, for editors. */
export function AddCard() {
  const { cards, saveCard } = useData()
  const [open, setOpen] = useState(false)

  if (!open) {
    return (
      <button type="button" className="add-card-button" onClick={() => setOpen(true)}>
        + Add card
      </button>
    )
  }

  return (
    <div className="add-card-panel">
      <h3>Add card</h3>
      <CardForm
        submitLabel="Add"
        onCancel={() => setOpen(false)}
        onSubmit={async (values) => {
          const fields = applyValues({}, values)
          // Ids follow the data file: set and collector number, or set and name; suffixed when taken.
          const base = `${slug(fields.set || 'card')}-${slug(fields.collectorNumber ?? '') || slug(fields.name)}`
          let id = base
          for (let n = 2; cards.some((c) => c.id === id); n++) id = `${base}-${n}`
          await saveCard({ ...fields, id })
          setOpen(false)
        }}
      />
    </div>
  )
}
