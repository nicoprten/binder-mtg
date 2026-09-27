import { useEffect, useState } from 'react'
import type { Card } from '../types'
import { useScryfall } from '../hooks/useScryfall'

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
  const remote = useScryfall(card)?.image
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
  if (!src) {
    return (
      <div className={`card-placeholder${className ? ` ${className}` : ''}`} role="img" aria-label={card.name}>
        <span>{card.name}</span>
        <small>{card.set}</small>
      </div>
    )
  }
  return <img src={src} alt={card.name} className={className} loading={loading} />
}
