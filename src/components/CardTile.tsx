import type { Card } from '../types'

interface Props {
  card: Card
  badge?: string
  selected?: boolean
  onClick?: () => void
}

export function CardTile({ card, badge, selected, onClick }: Props) {
  return (
    <button
      type="button"
      className={`card-tile${selected ? ' selected' : ''}`}
      onClick={onClick}
      title={card.name}
    >
      <img src={card.image} alt={card.name} loading="lazy" />
      {badge && <span className="card-badge">{badge}</span>}
    </button>
  )
}
