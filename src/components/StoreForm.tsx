import { useState } from 'react'
import type { Store } from '../types'

interface Props {
  initial?: Store
  submitLabel: string
  onSubmit: (store: Omit<Store, 'id'>) => Promise<void>
  onCancel: () => void
}

/** Name, website, address and opening hours of a store; hours go one range per line. */
export function StoreForm({ initial, submitLabel, onSubmit, onCancel }: Props) {
  const [name, setName] = useState(initial?.name ?? '')
  const [url, setUrl] = useState(initial?.url ?? '')
  const [address, setAddress] = useState(initial?.address ?? '')
  const [hours, setHours] = useState(initial?.hours.join('\n') ?? '')
  const [busy, setBusy] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setBusy(true)
    try {
      await onSubmit({
        name: name.trim(),
        url: url.trim() || undefined,
        address: address.trim(),
        hours: hours
          .split('\n')
          .map((line) => line.trim())
          .filter(Boolean),
      })
    } finally {
      setBusy(false)
    }
  }

  return (
    <form className="card-form store-form" onSubmit={submit}>
      <label className="span-2">
        Name
        <input value={name} onChange={(e) => setName(e.target.value)} required autoFocus={!initial} />
      </label>
      <label className="span-2">
        Website
        <input type="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://" />
      </label>
      <label className="span-2">
        Address
        <input value={address} onChange={(e) => setAddress(e.target.value)} />
      </label>
      <label className="span-2">
        Hours (one line per range)
        <textarea
          rows={3}
          value={hours}
          onChange={(e) => setHours(e.target.value)}
          placeholder={'Monday: 17:00 - 23:00\nTuesday to Friday: 15:00 - 23:00'}
        />
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
