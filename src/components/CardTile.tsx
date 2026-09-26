import type { Card } from '../types'
import { FinishBadge } from './FinishBadge'
import { formatUsd } from '../format'
import { StatusBadge } from './StatusBadge'

interface Props {
  card: Card
  badge?: string
  selected?: boolean
  onClick?: () => void
}

export function CardTile({ card, badge, selected, onClick }: Props) {
  return (
    <div className="card-slot">
      <button
        type="button"
        className={`card-tile${selected ? ' selected' : ''}`}
        onClick={onClick}
        title={card.name}
      >
        <img src={card.image} alt={card.name} loading="lazy" />
        <span className="card-status">
          <StatusBadge status={card.status} size="sm" />
        </span>
        {badge && <span className="card-badge">{badge}</span>}
      </button>
      <div className="card-slot-meta">
        <FinishBadge finish={card.finish} />
        {card.priceUsd !== undefined && <span className="price">{formatUsd(card.priceUsd)}</span>}
      </div>
    </div>
  )
}
