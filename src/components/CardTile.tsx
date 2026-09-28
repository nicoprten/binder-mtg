import type { Card } from '../types'
import { FinishBadge } from './FinishBadge'
import { formatCardPrice } from '../format'
import { StatusBadge } from './StatusBadge'
import { CardImage } from './CardImage'
import { MarketPrice } from './MarketPrice'
import { ShopEye } from './ShopEye'
import { CopyButton } from './CopyButton'

interface Props {
  card: Card
  badge?: string
  selected?: boolean
  onClick?: () => void
}

export function CardTile({ card, badge, selected, onClick }: Props) {
  return (
    <div className="card-slot">
      <div className="card-tile-wrap">
        <button
          type="button"
          className={`card-tile${selected ? ' selected' : ''}`}
          onClick={onClick}
          title={card.name}
        >
          <CardImage card={card} loading="lazy" />
          <span className="card-status">
            <StatusBadge status={card.status} size="sm" />
          </span>
          {badge && <span className="card-badge">{badge}</span>}
        </button>
        <span className="card-shop">
          <ShopEye shops={card.shops} />
        </span>
        <span className="card-copy">
          <CopyButton text={card.name} label="Copy card name" className="copy-overlay" />
        </span>
      </div>
      <div className="card-slot-meta">
        <FinishBadge finish={card.finish} />
        {formatCardPrice(card) && <span className="price">{formatCardPrice(card)}</span>}
        <MarketPrice card={card} />
      </div>
    </div>
  )
}
