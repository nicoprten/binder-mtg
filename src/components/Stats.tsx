import { cards } from '../data'
import { CollectionSummary } from './CollectionSummary'

/** Paid vs. market value of the collection, by status group. */
export function Stats() {
  return (
    <section className="stats">
      <header className="stats-header">
        <h2>Stats</h2>
        <p className="muted">What you paid for the collection against its Scryfall market value.</p>
      </header>
      <CollectionSummary cards={cards} />
    </section>
  )
}
