import type { Card } from '../types'
import { ManaCost } from './ManaCost'

const RARITY_LABEL: Record<Card['rarity'], string> = {
  common: 'Común',
  uncommon: 'Infrecuente',
  rare: 'Rara',
  mythic: 'Mítica',
}

export function CardDetail({ card, children }: { card: Card; children?: React.ReactNode }) {
  return (
    <aside className="card-detail">
      <img src={card.image} alt={card.name} />
      <div className="card-detail-body">
        <header>
          <h2>{card.name}</h2>
          <ManaCost cost={card.manaCost} />
        </header>
        <p className="type-line">{card.typeLine}</p>
        <p className="oracle">
          {card.oracleText.split('\n').map((line, i) => (
            <span key={i}>
              {line}
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
          <dt>Set</dt>
          <dd>
            {card.set} · #{card.collectorNumber}
          </dd>
          <dt>Rareza</dt>
          <dd className={`rarity-${card.rarity}`}>{RARITY_LABEL[card.rarity]}</dd>
          <dt>Artista</dt>
          <dd>{card.artist}</dd>
          <dt>En binder</dt>
          <dd>{card.quantity}</dd>
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
