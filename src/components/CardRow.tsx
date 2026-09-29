import type { Card } from '../types'
import { formatCardPrice } from '../format'
import { FinishBadge } from './FinishBadge'
import { ManaCost } from './ManaCost'
import { StatusBadge } from './StatusBadge'
import { MarketPrice } from './MarketPrice'
import { ShopEye } from './ShopEye'
import { CopyChip } from './CopyChip'
import { fullCardName } from '../cardName'

interface Props {
  card: Card
  onClick?: () => void
}

export function CardRow({ card, onClick }: Props) {
  return (
    <li className="card-row-item">
      {/* A div, not a button, so the copy buttons can sit inside the row. */}
      <div
        className="card-row"
        role="button"
        tabIndex={0}
        onClick={onClick}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            onClick?.()
          }
        }}
      >
        <span className="card-row-head">
          <span className="card-row-title">
            <span className="card-row-name">
              {card.name}
              {card.quantity > 1 && <span className="muted"> ×{card.quantity}</span>}
            </span>
            <span className="card-row-set muted">
              {card.set}
              {card.collectorNumber && ` #${card.collectorNumber}`}
            </span>
          </span>
          <span className="card-row-actions">
            <CopyChip text={card.name} label="Copy name" />
            <CopyChip text={fullCardName(card)} label="Copy name and set" />
          </span>
        </span>
        <span className="card-row-meta">
          <ManaCost cost={card.manaCost ?? ''} />
          <span className="card-row-type muted">{card.typeLine}</span>
          <FinishBadge finish={card.finish} size="sm" />
          <StatusBadge status={card.status} size="sm" />
          <ShopEye shops={card.shops} size="sm" />
        </span>
        <span className="card-row-price">
          <span className="price">{formatCardPrice(card) ?? ''}</span>
          <MarketPrice card={card} />
        </span>
      </div>
    </li>
  )
}
