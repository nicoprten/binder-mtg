import type { CardStatus } from '../types'
import { STATUS_LABEL } from '../status'

export function StatusBadge({ status, size = 'md' }: { status: CardStatus; size?: 'sm' | 'md' }) {
  return (
    <span className={`status-badge status-${status} status-${size}`} title={STATUS_LABEL[status]}>
      {STATUS_LABEL[status]}
    </span>
  )
}
