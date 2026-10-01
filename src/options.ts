import type { Finish, Frame, Language } from './types'
import { LANGUAGE_LABEL } from './language'

export const FINISH_OPTIONS: { key: Finish; label: string }[] = [
  { key: 'nonfoil', label: 'Nonfoil' },
  { key: 'foil', label: 'Foil' },
  { key: 'surge-foil', label: 'Surge Foil' },
]

export const FRAME_OPTIONS: { key: Frame; label: string }[] = [
  { key: 'borderless', label: 'Borderless' },
  { key: 'showcase', label: 'Showcase' },
  { key: 'extended-art', label: 'Extended art' },
  { key: 'promo', label: 'Promo' },
]

export const LANGUAGE_OPTIONS = (Object.keys(LANGUAGE_LABEL) as Language[]).map((key) => ({
  key,
  label: LANGUAGE_LABEL[key],
}))
