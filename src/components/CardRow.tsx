import type { Card } from '../types'
import { formatCardPrice } from '../format'
import { FinishBadge } from './FinishBadge'
import { ManaCost } from './ManaCost'
import { StatusBadge } from './StatusBadge'
import { MarketPrice } from './MarketPrice'

interface Props {
  card: Card
  onClick?: () => void
}

export function CardRow({ card, onClick }: Props) {
  return (
    <li>
      <button type="button" className="card-row" onClick={onClick}>
        <span className="card-row-name">
          {card.name}
          {card.quantity > 1 && <span className="muted"> ×{card.quantity}</span>}
        </span>
        <span className="card-row-meta">
          <ManaCost cost={card.manaCost} />
          <span className="card-row-type muted">{card.typeLine}</span>
          <span className="card-row-set muted">
            {card.set} #{card.collectorNumber}
          </span>
          <FinishBadge finish={card.finish} size="sm" />
          <StatusBadge status={card.status} size="sm" />
        </span>
        <span className="card-row-price">
          <span className="price">{formatCardPrice(card) ?? ''}</span>
          <MarketPrice card={card} />
        </span>
      </button>
    </li>
  )
}
