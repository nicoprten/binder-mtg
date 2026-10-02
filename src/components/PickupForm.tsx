import { useMemo, useState } from 'react'
import type { Card, Pickup, PickupStatus } from '../types'
import { useData } from '../data'
import { PICKUP_STATUSES, PICKUP_STATUS_LABEL } from '../pickupStatus'
import { formatUsd } from '../format'
import { compareBySetAndNumber } from '../sortCards'

interface Props {
  initial?: Pickup
  submitLabel: string
  onSubmit: (order: Omit<Pickup, 'id'>) => Promise<void>
  onCancel: () => void
}

const OTHER = '__other__'

function today(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** New or edited order: store, number, total, address, note, status, paid, and the cards to pick up. */
export function PickupForm({ initial, submitLabel, onSubmit, onCancel }: Props) {
  const { cards, pickups, stores } = useData()
  const knownStore = stores.find((s) => s.name === initial?.store)
  const [storeChoice, setStoreChoice] = useState(initial ? (knownStore ? knownStore.id : OTHER) : (stores[0]?.id ?? OTHER))
  const [storeName, setStoreName] = useState(initial?.store ?? '')
  const [order, setOrder] = useState(initial?.order ?? '')
  const [date, setDate] = useState(initial?.date ?? today())
  const [address, setAddress] = useState(initial?.address ?? stores[0]?.address ?? '')
  const [currency, setCurrency] = useState<'ARS' | 'USD'>(initial?.totalUsd != null && initial.totalArs == null ? 'USD' : 'ARS')
  const [amount, setAmount] = useState(
    initial?.totalArs != null ? String(initial.totalArs) : initial?.totalUsd != null ? String(initial.totalUsd) : '',
  )
  const [note, setNote] = useState(initial?.note ?? '')
  const [status, setStatus] = useState<PickupStatus>(initial?.status ?? 'preparing')
  const [paid, setPaid] = useState(initial?.paid ?? false)
  const [cardIds, setCardIds] = useState<Set<string>>(() => new Set(initial?.cardIds ?? []))
  const [busy, setBusy] = useState(false)

  // Cards marked "to pick up" are the candidates; ones already in another order are shown but locked.
  const candidates = useMemo(() => {
    const elsewhere = new Map<string, string>()
    for (const p of pickups) if (p.id !== initial?.id) for (const id of p.cardIds) elsewhere.set(id, p.store)
    return cards
      .filter((c) => c.status === 'to-pick-up' || cardIds.has(c.id))
      .sort(compareBySetAndNumber)
      .map((c) => ({ card: c, elsewhere: elsewhere.get(c.id) }))
  }, [cards, pickups, initial?.id, cardIds])

  function chooseStore(value: string) {
    setStoreChoice(value)
    const s = stores.find((st) => st.id === value)
    if (s) {
      setStoreName(s.name)
      if (s.address) setAddress(s.address)
    }
  }

  function toggleCard(card: Card) {
    setCardIds((prev) => {
      const next = new Set(prev)
      if (next.has(card.id)) next.delete(card.id)
      else next.add(card.id)
      return next
    })
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    const store = storeChoice === OTHER ? storeName.trim() : (stores.find((s) => s.id === storeChoice)?.name ?? '')
    if (!store) return
    const value = amount.trim() === '' ? null : Number(amount.replace(/\./g, '').replace(',', '.'))
    const total = value !== null && Number.isFinite(value) ? value : null
    setBusy(true)
    try {
      await onSubmit({
        store,
        url: stores.find((s) => s.name === store)?.url ?? initial?.url,
        order: order.trim() ? (order.trim().startsWith('#') ? order.trim() : `#${order.trim()}`) : undefined,
        date,
        address: address.trim(),
        paid,
        status,
        totalArs: currency === 'ARS' ? total : null,
        totalUsd: currency === 'USD' ? total : null,
        note: note.trim() || undefined,
        cardIds: [...cardIds],
      })
    } finally {
      setBusy(false)
    }
  }

  const selectedUsd = candidates
    .filter((c) => cardIds.has(c.card.id))
    .reduce((n, c) => n + (c.card.priceUsd ?? 0) * c.card.quantity, 0)

  return (
    <form className="card-form pickup-form" onSubmit={submit}>
      <label>
        Store
        <select value={storeChoice} onChange={(e) => chooseStore(e.target.value)}>
          {stores.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
          <option value={OTHER}>Other…</option>
        </select>
      </label>
      {storeChoice === OTHER ? (
        <label>
          Store name
          <input value={storeName} onChange={(e) => setStoreName(e.target.value)} required />
        </label>
      ) : (
        <label>
          Order number
          <input value={order} onChange={(e) => setOrder(e.target.value)} placeholder="#1234" />
        </label>
      )}
      {storeChoice === OTHER && (
        <label>
          Order number
          <input value={order} onChange={(e) => setOrder(e.target.value)} placeholder="#1234" />
        </label>
      )}
      <label>
        Date
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
      </label>
      <label className="span-2">
        Pickup address
        <input value={address} onChange={(e) => setAddress(e.target.value)} />
      </label>
      <label>
        Currency
        <select value={currency} onChange={(e) => setCurrency(e.target.value as 'ARS' | 'USD')}>
          <option value="ARS">ARS</option>
          <option value="USD">USD</option>
        </select>
      </label>
      <label>
        Total ({currency})
        <input inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder={currency === 'ARS' ? 'e.g. 163650' : 'e.g. 7.5'} />
      </label>
      <label className="span-2">
        Description (optional)
        <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="10% off paying cash…" />
      </label>
      <label>
        Status
        <select value={status} onChange={(e) => setStatus(e.target.value as PickupStatus)}>
          {PICKUP_STATUSES.map((st) => (
            <option key={st} value={st}>
              {PICKUP_STATUS_LABEL[st]}
            </option>
          ))}
        </select>
      </label>
      <label className="pickup-form-paid">
        <input type="checkbox" checked={paid} onChange={(e) => setPaid(e.target.checked)} />
        Paid
      </label>
      <fieldset className="span-2 pickup-form-cards">
        <legend>
          Cards · {cardIds.size} selected · <span className="price">{formatUsd(selectedUsd)}</span>
        </legend>
        {candidates.length === 0 ? (
          <p className="muted">No cards marked "To pick up" yet. Add them to the binder with that status first.</p>
        ) : (
          <ul>
            {candidates.map(({ card, elsewhere }) => (
              <li key={card.id} className={elsewhere ? 'locked' : ''}>
                <label>
                  <input
                    type="checkbox"
                    checked={cardIds.has(card.id)}
                    disabled={!!elsewhere}
                    onChange={() => toggleCard(card)}
                  />
                  <span className="pickup-form-card-name">{card.name}</span>
                  <span className="muted">
                    {card.set}
                    {card.collectorNumber && ` #${card.collectorNumber}`}
                    {card.quantity > 1 && ` ×${card.quantity}`}
                  </span>
                  {card.priceUsd !== undefined && <span className="price">{formatUsd(card.priceUsd * card.quantity)}</span>}
                  {elsewhere && <span className="muted">in {elsewhere}</span>}
                </label>
              </li>
            ))}
          </ul>
        )}
      </fieldset>
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
