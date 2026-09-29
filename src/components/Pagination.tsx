interface Props {
  page: number
  pageCount: number
  onChange: (page: number) => void
}

/** The pages to show as buttons: first, last, and a window around the current one. */
function visiblePages(page: number, pageCount: number): (number | '…')[] {
  if (pageCount <= 7) return Array.from({ length: pageCount }, (_, i) => i + 1)
  const pages = new Set<number>([1, pageCount, page - 1, page, page + 1])
  const sorted = [...pages].filter((p) => p >= 1 && p <= pageCount).sort((a, b) => a - b)
  const out: (number | '…')[] = []
  for (const p of sorted) {
    const prev = out[out.length - 1]
    if (typeof prev === 'number' && p - prev > 1) out.push('…')
    out.push(p)
  }
  return out
}

export function Pagination({ page, pageCount, onChange }: Props) {
  if (pageCount <= 1) return null
  return (
    <nav className="pagination" aria-label="Pages">
      <button type="button" disabled={page <= 1} onClick={() => onChange(page - 1)} aria-label="Previous page">
        ‹
      </button>
      {visiblePages(page, pageCount).map((p, i) =>
        p === '…' ? (
          <span key={`gap-${i}`} className="pagination-gap">
            …
          </span>
        ) : (
          <button
            key={p}
            type="button"
            className={p === page ? 'active' : ''}
            aria-current={p === page ? 'page' : undefined}
            onClick={() => onChange(p)}
          >
            {p}
          </button>
        ),
      )}
      <button
        type="button"
        disabled={page >= pageCount}
        onClick={() => onChange(page + 1)}
        aria-label="Next page"
      >
        ›
      </button>
    </nav>
  )
}
