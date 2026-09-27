import { useEffect, useState } from 'react'
import type { Card } from '../types'
import { scryfallImageUrl } from '../images'

declare global {
  interface Window {
    /** Set by builds that cannot reach Scryfall (e.g. the claude.ai artifact) to skip remote images. */
    BINDER_LOCAL_IMAGES?: boolean
  }
}

interface Props {
  card: Card
  className?: string
  loading?: 'lazy' | 'eager'
}

/**
 * Card picture. Shows the bundled local image right away and swaps in the
 * high-resolution Scryfall image once it has loaded; stays local if it fails.
 */
export function CardImage({ card, className, loading }: Props) {
  const remote = typeof window !== 'undefined' && window.BINDER_LOCAL_IMAGES ? undefined : scryfallImageUrl(card)
  const [loadedRemote, setLoadedRemote] = useState<string | null>(null)

  useEffect(() => {
    if (!remote) return
    let cancelled = false
    const img = new Image()
    img.onload = () => {
      if (!cancelled) setLoadedRemote(remote)
    }
    img.src = remote
    return () => {
      cancelled = true
    }
  }, [remote])

  const src = remote && loadedRemote === remote ? remote : card.image
  return <img src={src} alt={card.name} className={className} loading={loading} />
}
