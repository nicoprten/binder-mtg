import { useState } from 'react'
import type { Card, CardStatus, Finish, Frame, Language } from '../types'
import { valuesFromCard, type CardFormValues } from '../cardForm'
import { STATUSES, STATUS_LABEL } from '../status'
import { FINISH_OPTIONS, FRAME_OPTIONS, LANGUAGE_OPTIONS } from '../options'

interface Props {
  initial?: Card
  /** Show the name, set, collector number and frame inputs (off when editing: the printing is picked from the strip). */
  printingFields?: boolean
  submitLabel: string
  onSubmit: (values: CardFormValues) => Promise<void>
  onCancel: () => void
}

/** Fields of a card the owner maintains by hand; Scryfall fills in the rest. */
export function CardForm({ initial, printingFields = true, submitLabel, onSubmit, onCancel }: Props) {
  const [v, setV] = useState<CardFormValues>(() => valuesFromCard(initial))
  const [busy, setBusy] = useState(false)
  const set = <K extends keyof CardFormValues>(key: K, value: CardFormValues[K]) =>
    setV((prev) => ({ ...prev, [key]: value }))

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!v.name.trim()) return
    setBusy(true)
    try {
      await onSubmit(v)
    } finally {
      setBusy(false)
    }
  }

  return (
    <form className="card-form" onSubmit={submit}>
      {printingFields && (
        <label className="span-2">
          Name
          <input value={v.name} onChange={(e) => set('name', e.target.value)} required autoFocus={!initial} />
        </label>
      )}
      {printingFields && (
        <>
          <label>
            Set
            <input value={v.set} onChange={(e) => set('set', e.target.value)} placeholder="e.g. LTR" />
          </label>
          <label>
            Number
            <input value={v.collectorNumber} onChange={(e) => set('collectorNumber', e.target.value)} placeholder="e.g. 0086" />
          </label>
        </>
      )}
      <label>
        Status
        <select value={v.status} onChange={(e) => set('status', e.target.value as CardStatus)}>
          {STATUSES.map((st) => (
            <option key={st} value={st}>
              {STATUS_LABEL[st]}
            </option>
          ))}
        </select>
      </label>
      <label>
        Finish
        <select value={v.finish} onChange={(e) => set('finish', e.target.value as Finish)}>
          {FINISH_OPTIONS.map((f) => (
            <option key={f.key} value={f.key}>
              {f.label}
            </option>
          ))}
        </select>
      </label>
      <label>
        Language
        <select value={v.language} onChange={(e) => set('language', e.target.value as Language)}>
          {LANGUAGE_OPTIONS.map((l) => (
            <option key={l.key} value={l.key}>
              {l.label}
            </option>
          ))}
        </select>
      </label>
      {printingFields && (
        <label>
          Frame
          <select value={v.frame} onChange={(e) => set('frame', e.target.value as Frame | '')}>
            <option value="">Regular</option>
            {FRAME_OPTIONS.map((f) => (
              <option key={f.key} value={f.key}>
                {f.label}
              </option>
            ))}
          </select>
        </label>
      )}
      <label>
        Copies
        <input type="number" min={1} step={1} value={v.quantity} onChange={(e) => set('quantity', Number(e.target.value))} />
      </label>
      <label>
        Price (USD)
        <input inputMode="decimal" value={v.priceUsd} onChange={(e) => set('priceUsd', e.target.value)} placeholder="e.g. 0.5" />
      </label>
      <label className="span-2">
        Tags
        <input value={v.tags} onChange={(e) => set('tags', e.target.value)} placeholder="goblins, tokens" />
      </label>
      <div className="card-form-actions span-2">
        <button type="submit" disabled={busy}>
          {busy ? 'Saving…' : submitLabel}
        </button>
        <button type="button" onClick={onCancel} disabled={busy}>
          Cancel
        </button>
      </div>
    </form>
  )
}
