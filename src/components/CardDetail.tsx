import type { Card } from '../types'
import { FinishBadge } from './FinishBadge'
import { CardImage } from './CardImage'
import { ManaCost, OracleLine } from './ManaCost'
import { formatArs, formatUsd } from '../format'
import { StatusBadge } from './StatusBadge'
import { LANGUAGE_LABEL } from '../language'

const RARITY_LABEL: Record<Card['rarity'], string> = {
  common: 'Common',
  uncommon: 'Uncommon',
  rare: 'Rare',
  mythic: 'Mythic',
}

export function CardDetail({ card, children }: { card: Card; children?: React.ReactNode }) {
  return (
    <aside className="card-detail">
      <CardImage card={card} />
      <div className="card-detail-body">
        <header>
          <h2>{card.name}</h2>
          <ManaCost cost={card.manaCost} />
        </header>
        <p className="type-line">{card.typeLine}</p>
        <p className="oracle">
          {card.oracleText.split('\n').map((line, i) => (
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
            {card.set} · #{card.collectorNumber}
          </dd>
          <dt>Language</dt>
          <dd>
            {LANGUAGE_LABEL[card.language]} <span className="muted">({card.language.toUpperCase()})</span>
          </dd>
          <dt>Rarity</dt>
          <dd className={`rarity-${card.rarity}`}>{RARITY_LABEL[card.rarity]}</dd>
          <dt>Finish</dt>
          <dd>{card.finish && card.finish !== 'nonfoil' ? <FinishBadge finish={card.finish} size="sm" /> : 'Nonfoil'}</dd>
          <dt>Artist</dt>
          <dd>{card.artist}</dd>
          <dt>Price</dt>
          <dd className="price">
            {card.priceUsd === undefined && card.priceArs === undefined && '—'}
            {card.priceUsd !== undefined && formatUsd(card.priceUsd)}
            {card.priceUsd !== undefined && card.priceArs !== undefined && ' · '}
            {card.priceArs !== undefined && formatArs(card.priceArs)}
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
        {children}
      </div>
    </aside>
  )
}
