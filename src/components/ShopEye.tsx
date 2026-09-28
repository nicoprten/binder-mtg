import type { Shop } from '../types'
import { bestShop } from '../shops'

/** Eye icon marking a card whose seller is already known. Links to the cheapest listing. */
export function ShopEye({ shops, size = 'md' }: { shops?: Shop[]; size?: 'sm' | 'md' }) {
  const shop = bestShop(shops)
  if (!shop) return null
  const more = shops!.length > 1 ? ` (+${shops!.length - 1} more)` : ''
  return (
    <a
      className={`shop-eye shop-eye-${size}`}
      href={shop.url}
      target="_blank"
      rel="noopener noreferrer"
      title={`Seen at ${shop.store}${more}`}
      aria-label={`Seen at ${shop.store}${more}`}
      onClick={(e) => e.stopPropagation()}
    >
      <svg viewBox="0 0 24 24" width="1em" height="1em" aria-hidden="true">
        <path
          d="M12 5C6.5 5 2.6 9.2 1.3 11.4a1.2 1.2 0 0 0 0 1.2C2.6 14.8 6.5 19 12 19s9.4-4.2 10.7-6.4a1.2 1.2 0 0 0 0-1.2C21.4 9.2 17.5 5 12 5Zm0 11.5a4.5 4.5 0 1 1 0-9 4.5 4.5 0 0 1 0 9Zm0-7a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5Z"
          fill="currentColor"
        />
      </svg>
    </a>
  )
}
