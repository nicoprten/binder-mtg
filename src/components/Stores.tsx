import { useData } from '../data'

/** Shops selling MTG singles or sealed product, with address and opening hours. */
export function Stores() {
  const { cards, pickups, stores } = useData()
  return (
    <section className="stores">
      <header className="stats-header">
        <h2>Stores</h2>
        <p className="muted">Where to buy singles and sealed product.</p>
      </header>
      <ul className="store-list">
        {stores.map((s) => {
          const orders = pickups.filter((o) => o.store === s.name).length
          const listed = cards.filter((c) => c.shops?.some((shop) => shop.store === s.name)).length
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
