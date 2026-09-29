import { useCallback, useEffect, useState } from 'react'
import type { PickupStatus } from '../types'

export interface PickupEdit {
  paid?: boolean
  status?: PickupStatus
}

const KEY = 'binder-mtg:pickup-edits'

function load(): Record<string, PickupEdit> {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as Record<string, PickupEdit>) : {}
  } catch {
    return {}
  }
}

/** Paid state and status changed on the page, kept in this browser on top of the data file. */
export function usePickupEdits() {
  const [edits, setEdits] = useState<Record<string, PickupEdit>>(load)
  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(edits))
    } catch {
      // No storage: edits last for this page load only.
    }
  }, [edits])
  const update = useCallback((id: string, patch: PickupEdit) => {
    setEdits((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }))
  }, [])
  return { edits, update }
}
