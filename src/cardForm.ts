import type { Card, CardStatus, Finish, Frame, Language } from './types'

export interface CardFormValues {
  name: string
  set: string
  collectorNumber: string
  status: CardStatus
  finish: Finish
  language: Language
  frame: Frame | ''
  quantity: number
  priceUsd: string
  tags: string
}

export function valuesFromCard(card?: Card): CardFormValues {
  const frame = Array.isArray(card?.frame) ? card.frame[0] : card?.frame
  return {
    name: card?.name ?? '',
    set: card?.set ?? '',
    collectorNumber: card?.collectorNumber ?? '',
    status: card?.status ?? 'owned',
    finish: card?.finish ?? 'nonfoil',
    language: card?.language ?? 'en',
    frame: frame ?? '',
    quantity: card?.quantity ?? 1,
    priceUsd: card?.priceUsd !== undefined ? String(card.priceUsd) : '',
    tags: card?.tags?.join(', ') ?? '',
  }
}

/**
 * Turns form values into the fields they control on a card; `base` keeps everything else.
 * With `printing: false` the name, set, collector number and frame are left as they are on `base`
 * (the edit form picks the printing from the Scryfall strip instead).
 */
export function applyValues(base: Partial<Card>, v: CardFormValues, opts: { printing?: boolean } = {}): Omit<Card, 'id'> {
  const price = v.priceUsd.trim() === '' ? undefined : Number(v.priceUsd.replace(',', '.'))
  const tags = v.tags
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean)
  const identity =
    opts.printing === false
      ? { name: base.name ?? v.name.trim(), set: base.set ?? '', collectorNumber: base.collectorNumber, frame: base.frame }
      : {
          name: v.name.trim(),
          set: v.set.trim().toUpperCase(),
          collectorNumber: v.collectorNumber.trim() || undefined,
          frame: v.frame || undefined,
        }
  return {
    ...base,
    ...identity,
    status: v.status,
    finish: v.finish,
    language: v.language,
    quantity: Math.max(1, Math.floor(v.quantity) || 1),
    priceUsd: price !== undefined && Number.isFinite(price) ? price : undefined,
    tags: tags.length > 0 ? tags : undefined,
  }
}

