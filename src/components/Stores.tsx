import { useState } from 'react'
import { useData } from '../data'
import type { Store } from '../types'
import { StoreForm } from './StoreForm'

function slug(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

/** Shops selling MTG singles or sealed product, with address and opening hours. */
export function Stores() {
  const { cards, pickups, stores, isEditor, saveStore } = useData()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)

  return (
    <section className="stores">
      <header className="stats-header">
        <h2>Stores</h2>
        <p className="muted">Where to buy singles and sealed product.</p>
      </header>
      {isEditor &&
        (adding ? (
          <div className="add-card-panel">
            <h3>Add store</h3>
            <StoreForm
              submitLabel="Add"
              onCancel={() => setAdding(false)}
              onSubmit={async (fields) => {
                const base = slug(fields.name) || 'store'
                let id = base
                for (let n = 2; stores.some((s) => s.id === id); n++) id = `${base}-${n}`
                await saveStore({ ...fields, id })
                setAdding(false)
              }}
            />
          </div>
        ) : (
          <button type="button" className="add-card-button" onClick={() => setAdding(true)}>
            + Add store
          </button>
        ))}
      <ul className="store-list">
        {stores.map((s) => {
          const orders = pickups.filter((o) => o.store === s.name).length
          const listed = cards.filter((c) => c.shops?.some((shop) => shop.store === s.name)).length
          if (editingId === s.id) {
            return (
              <li key={s.id} className="store">
                <StoreForm
                  initial={s}
                  submitLabel="Save"
                  onCancel={() => setEditingId(null)}
                  onSubmit={async (fields) => {
                    await saveStore({ ...s, ...fields } satisfies Store)
                    setEditingId(null)
                  }}
                />
              </li>
            )
          }
          return (
            <li key={s.id} className="store">
              <h3>
                {s.url ? (
                  <a href={s.url} target="_blank" rel="noopener noreferrer">
                    {s.name}
                  </a>
                ) : (
                  s.name
                )}
                {isEditor && (
                  <button type="button" className="store-edit" onClick={() => setEditingId(s.id)}>
                    Edit
                  </button>
                )}
              </h3>
              <dl className="store-meta">
                <dt>Address</dt>
                <dd>{s.address || '—'}</dd>
                <dt>Hours</dt>
                <dd>
                  {s.hours.length > 0
                    ? s.hours.map((line) => (
                        <span key={line} className="store-hours-line">
                          {line}
                        </span>
                      ))
                    : '—'}
                </dd>
              </dl>
              {(orders > 0 || listed > 0) && (
                <p className="store-links muted">
                  {orders > 0 && (
                    <a href="#/pickups">
                      {orders} {orders === 1 ? 'order' : 'orders'} to pick up
                    </a>
                  )}
                  {orders > 0 && listed > 0 && ' · '}
                  {listed > 0 && (
                    <a href="#/binder?status=wishlist">
                      {listed} {listed === 1 ? 'card' : 'cards'} listed
                    </a>
                  )}
                </p>
              )}
            </li>
          )
        })}
      </ul>
    </section>
  )
}
