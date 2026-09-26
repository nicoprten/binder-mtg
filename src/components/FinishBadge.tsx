import type { Finish } from '../types'

const LABEL: Record<Exclude<Finish, 'nonfoil'>, string> = {
  foil: 'Foil',
  'surge-foil': 'Surge Foil',
}

/** Shimmering label for foil finishes. Renders nothing for nonfoil cards. */
export function FinishBadge({ finish, size = 'md' }: { finish?: Finish; size?: 'sm' | 'md' }) {
  if (!finish || finish === 'nonfoil') return null
  return (
    <span className={`finish-badge finish-${finish} finish-${size}`} title={`${LABEL[finish]} finish`}>
      {LABEL[finish]}
    </span>
  )
}
