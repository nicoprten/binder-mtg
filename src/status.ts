import type { CardStatus } from './types'

export const STATUS_LABEL: Record<CardStatus, string> = {
  owned: 'Owned',
  'to-pick-up': 'To pick up',
  wishlist: 'Wishlist',
  'to-trade': 'To trade',
}

export const STATUSES: CardStatus[] = ['owned', 'to-pick-up', 'wishlist', 'to-trade']
