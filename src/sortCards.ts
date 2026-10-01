import type { Card } from './types'

/** Collector numbers compare numerically ("85" before "0100"), with any letter suffix after. */
function numberKey(value: string | undefined): [number, string] {
  const m = /^0*(\d+)(.*)$/.exec((value ?? '').trim())
  return m ? [Number(m[1]), m[2]] : [Number.POSITIVE_INFINITY, value ?? '']
}

/** Orders cards by set code, then collector number, then name. Cards without a set go last. */
export function compareBySetAndNumber(a: Card, b: Card): number {
  const setA = a.set || '￿'
  const setB = b.set || '￿'
  if (setA !== setB) return setA.localeCompare(setB)
  const [na, sa] = numberKey(a.collectorNumber)
  const [nb, sb] = numberKey(b.collectorNumber)
  if (na !== nb) return na - nb
  if (sa !== sb) return sa.localeCompare(sb)
  return a.name.localeCompare(b.name)
}
