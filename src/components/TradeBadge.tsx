import type { CardPurpose } from '../types'
import { PURPOSE_LABEL } from '../status'

/** Chip for copies available to sell or trade. Renders nothing for cards kept to use. */
export function TradeBadge({ purpose, size = 'md' }: { purpose: CardPurpose; size?: 'sm' | 'md' }) {
  if (purpose !== 'trade') return null
  return (
    <span className={`trade-badge trade-${size}`} title={PURPOSE_LABEL.trade}>
      {PURPOSE_LABEL.trade}
    </span>
  )
}
