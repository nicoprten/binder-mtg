import type { Card } from '../types'
import { useScryfall } from '../hooks/useScryfall'
import { usePrintings } from '../hooks/usePrintings'
import { printingVersion, type Printing } from '../scryfall'
import { formatUsd } from '../format'
import { isOffline } from '../scryfall'

interface Props {
  card: Card
  /** The printing being previewed in the big art, if any. */
  previewId: string | null
  onPreview: (printing: Printing | null) => void
}

function isOwn(card: Card, p: Printing): boolean {
  if (!card.set || !card.collectorNumber) return false
  return (
    p.set.toLowerCase() === card.set.toLowerCase() &&
    p.collectorNumber.replace(/^0+/, '') === card.collectorNumber.replace(/^0+/, '')
  )
}

/** Every printing of the card from Scryfall, newest first; tap one to preview it in the big art. */
export function Printings({ card, previewId, onPreview }: Props) {
  const info = useScryfall(card)
  const printings = usePrintings(card, info)
  if (isOffline()) return null

  return (
    <section className="printings">
      <h3>
        Printings
        {printings && printings.length > 0 && <span className="muted"> · {printings.length}</span>}
      </h3>
      {printings === null ? (
        <p className="muted printings-note">Loading…</p>
      ) : printings.length === 0 ? (
        <p className="muted printings-note">No other printings found.</p>
      ) : (
        <ul className="printings-strip">
          {printings.map((p) => {
            const own = isOwn(card, p)
            const active = previewId === p.id || (previewId === null && own)
            const version = printingVersion(p)
            const foil = card.finish === 'foil' || card.finish === 'surge-foil'
            const price = foil ? (p.usdFoil ?? p.usd) : (p.usd ?? p.usdFoil)
            return (
              <li key={p.id} className={`printing${own ? ' own' : ''}${active ? ' active' : ''}`}>
                <button
                  type="button"
                  onClick={() => onPreview(own || previewId === p.id ? null : p)}
                  title={`${p.setName} #${p.collectorNumber}${version ? ` · ${version}` : ''}`}
                >
                  {p.image ? <img src={p.image} alt="" loading="lazy" /> : <span className="printing-blank" />}
                  <span className="printing-set">
                    {p.set} #{p.collectorNumber}
                  </span>
                  {version && <span className="printing-version">{version}</span>}
                  <span className="printing-price">{price !== undefined ? `~${formatUsd(price)}` : '—'}</span>
                  {own && <span className="printing-own">Yours</span>}
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
