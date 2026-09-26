import type { CardPurpose, CardStatus } from './types'

export const STATUS_LABEL: Record<CardStatus, string> = {
  'in-stock': 'In stock',
  'to-pick-up': 'To pick up',
  wishlist: 'Wishlist',
}

export const STATUSES: CardStatus[] = ['in-stock', 'to-pick-up', 'wishlist']

export const PURPOSE_LABEL: Record<CardPurpose, string> = {
  use: 'To use',
  trade: 'For trade',
}

export const PURPOSES: CardPurpose[] = ['use', 'trade']
