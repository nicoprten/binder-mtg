import type { CardStatus } from './types'

export const STATUS_LABEL: Record<CardStatus, string> = {
  'in-stock': 'In stock',
  'to-pick-up': 'To pick up',
  wishlist: 'Wishlist',
}

export const STATUSES: CardStatus[] = ['in-stock', 'to-pick-up', 'wishlist']
