import type { PickupStatus } from './types'

export const PICKUP_STATUSES: PickupStatus[] = ['preparing', 'ready', 'picked-up', 'cancelled']

export const PICKUP_STATUS_LABEL: Record<PickupStatus, string> = {
  preparing: 'Preparing',
  ready: 'Ready to pick up',
  'picked-up': 'Picked up',
  cancelled: 'Cancelled',
}
