import type { CardStatus, Finish } from './types'

export type ColorKey = 'W' | 'U' | 'B' | 'R' | 'G' | 'C'
export type ViewMode = 'grid' | 'list'

/** Binder state that lives in the URL hash, e.g. `#/binder?q=krenko&c=BR&status=owned&view=list`. */
export interface BinderParams {
  query: string
  colors: ColorKey[]
  status: CardStatus | ''
  finish: Finish | ''
  view: ViewMode | ''
  card: string
}

const BINDER_HASH_KEY = 'binder-mtg:binder-hash'
const COLOR_KEYS: ColorKey[] = ['W', 'U', 'B', 'R', 'G', 'C']
const STATUSES: CardStatus[] = ['owned', 'to-pick-up', 'wishlist', 'to-trade']
const FINISHES: Finish[] = ['nonfoil', 'foil', 'surge-foil']

/** The route part of the hash, without the query string: `#/binder?q=x` -> `/binder`. */
export function hashRoute(hash = window.location.hash): string {
  return hash.replace(/^#/, '').split('?')[0]
}

function hashSearch(hash = window.location.hash): URLSearchParams {
  const i = hash.indexOf('?')
  return new URLSearchParams(i >= 0 ? hash.slice(i + 1) : '')
}

export function readBinderParams(): BinderParams {
  const p = hashSearch()
  const status = p.get('status') ?? ''
  const finish = p.get('finish') ?? ''
  const view = p.get('view') ?? ''
  return {
    query: p.get('q') ?? '',
    colors: (p.get('c') ?? '').split('').filter((k): k is ColorKey => COLOR_KEYS.includes(k as ColorKey)),
    status: STATUSES.includes(status as CardStatus) ? (status as CardStatus) : '',
    finish: FINISHES.includes(finish as Finish) ? (finish as Finish) : '',
    view: view === 'grid' || view === 'list' ? view : '',
    card: p.get('card') ?? '',
  }
}

export function binderHash(params: BinderParams): string {
  const p = new URLSearchParams()
  if (params.query) p.set('q', params.query)
  if (params.colors.length) p.set('c', params.colors.join(''))
  if (params.status) p.set('status', params.status)
  if (params.finish) p.set('finish', params.finish)
  if (params.view) p.set('view', params.view)
  if (params.card) p.set('card', params.card)
  const qs = p.toString()
  return `#/binder${qs ? `?${qs}` : ''}`
}

/** Replaces the current hash without adding a history entry, and remembers it for the Binder tab. */
export function writeBinderParams(params: BinderParams) {
  const hash = binderHash(params)
  if (window.location.hash !== hash) {
    window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}${hash}`)
  }
  try {
    sessionStorage.setItem(BINDER_HASH_KEY, hash)
  } catch {
    // No storage: the tab link falls back to a clean binder.
  }
}

/** The binder link that restores the last filters used in this tab. */
export function lastBinderHash(): string {
  try {
    return sessionStorage.getItem(BINDER_HASH_KEY) || '#/binder'
  } catch {
    return '#/binder'
  }
}
