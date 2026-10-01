import { useState } from 'react'
import type { Card, Rarity } from '../types'
import type { Printing } from '../scryfall'
import { Printings } from './Printings'
import { FinishBadge } from './FinishBadge'
import { CardImage } from './CardImage'
import { MarketPrice } from './MarketPrice'
import { CopyChip } from './CopyChip'
import { fullCardName } from '../cardName'
import { ManaCost, OracleLine } from './ManaCost'
import { formatUsd } from '../format'
import { StatusBadge } from './StatusBadge'
import { LANGUAGE_LABEL } from '../language'
import { AskingPrice } from './AskingPrice'
import { ASKING_PRICE_NOTE } from '../pricing'
import { useData } from '../data'
import { CardEditor } from './CardEditor'

const RARITY_LABEL: Record<Rarity, string> = {
  common: 'Common',
  uncommon: 'Uncommon',
  rare: 'Rare',
  mythic: 'Mythic',
}

interface Props {
  card: Card
  children?: React.ReactNode
  /** Called after an editor removes the card, so the view holding it can close. */
  onDeleted?: () => void
}

export function CardDetail({ card, children, onDeleted }: Props) {
  const { isEditor } = useData()
  // Another printing picked from the strip, shown in place of the owner's copy.
  const [preview, setPreview] = useState<Printing | null>(null)
  return (
    <aside className="card-detail">
      <div className="card-detail-art">
        {preview?.imageLarge ? (
          <>
            <img src={preview.imageLarge} alt={`${card.name}, ${preview.setName}`} />
            <button type="button" className="preview-chip" onClick={() => setPreview(null)}>
              {preview.set} #{preview.collectorNumber} · back to yours
            </button>
          </>
        ) : (
          <CardImage card={card} />
        )}
      </div>
      <div className="card-detail-body">
        <header>
          <h2>{card.name}</h2>
          <ManaCost cost={card.manaCost ?? ''} />
        </header>
        <div className="card-detail-actions">
          <CopyChip text={card.name} label="Copy name" />
          <CopyChip text={fullCardName(card)} label="Copy name and set" />
        </div>
        <p className="type-line">{card.typeLine}</p>
        <p className="oracle">
          {(card.oracleText ?? '').split('\n').map((line, i) => (
            <span key={i}>
              <OracleLine text={line} />
              <br />
            </span>
          ))}
        </p>
        {card.power !== undefined && (
          <p className="pt">
            {card.power}/{card.toughness}
          </p>
        )}
        <dl className="meta">
          <dt>Status</dt>
          <dd>
            <StatusBadge status={card.status} size="sm" />
          </dd>
          <dt>Set</dt>
          <dd>
            {card.set}
            {card.collectorNumber && ` · #${card.collectorNumber}`}
          </dd>
          <dt>Language</dt>
          <dd>
            {LANGUAGE_LABEL[card.language]} <span className="muted">({card.language.toUpperCase()})</span>
          </dd>
          <dt>Rarity</dt>
          <dd className={card.rarity ? `rarity-${card.rarity}` : 'muted'}>
            {card.rarity ? RARITY_LABEL[card.rarity] : '—'}
          </dd>
          <dt>Finish</dt>
          <dd>{card.finish && card.finish !== 'nonfoil' ? <FinishBadge finish={card.finish} size="sm" /> : 'Nonfoil'}</dd>
          <dt>Artist</dt>
          <dd>{card.artist ?? '—'}</dd>
          {card.status === 'to-trade' && (
            <>
              <dt>Asking</dt>
              <dd>
                <AskingPrice card={card} label="" />
                <p className="meta-note">{ASKING_PRICE_NOTE}</p>
              </dd>
            </>
          )}
          <dt>Paid</dt>
          <dd className="price">{card.priceUsd !== undefined ? formatUsd(card.priceUsd) : '—'}</dd>
          {card.shops && card.shops.length > 0 && (
            <>
              <dt>Where to buy</dt>
              <dd>
                <ul className="shop-list">
                  {[...card.shops]
                    .sort((a, b) => (a.priceUsd ?? Infinity) - (b.priceUsd ?? Infinity))
                    .map((shop) => (
                      <li key={shop.url + shop.store}>
                        <a href={shop.url} target="_blank" rel="noopener noreferrer" className="shop-link">
                          {shop.store}
                        </a>
                        {shop.priceUsd !== undefined && (
                          <span className="muted"> · {formatUsd(shop.priceUsd)}</span>
                        )}
                      </li>
                    ))}
                </ul>
              </dd>
            </>
          )}
          <dt>Market</dt>
          <dd>
            <MarketPrice card={card} />
          </dd>
          <dt>Copies</dt>
          <dd>
            {card.quantity}
            {card.priceUsd !== undefined && card.quantity > 1 && (
              <span className="muted"> · {formatUsd(card.priceUsd * card.quantity)} total</span>
            )}
          </dd>
        </dl>
        {card.tags && card.tags.length > 0 && (
          <ul className="tags">
            {card.tags.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        )}
        <Printings card={card} previewId={preview?.id ?? null} onPreview={setPreview} />
        {isEditor && <CardEditor card={card} onDeleted={onDeleted} />}
        {children}
      </div>
    </aside>
  )
}
