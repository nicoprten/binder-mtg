import { useEffect, useState } from 'react'

/** Small labelled button that copies `text` and confirms for a moment. */
export function CopyChip({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!copied) return
    const t = setTimeout(() => setCopied(false), 1500)
    return () => clearTimeout(t)
  }, [copied])

  async function copy(e: React.MouseEvent) {
    e.stopPropagation()
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
    } catch {
      window.prompt('Copy:', text)
    }
  }

  return (
    <button type="button" className={`copy-chip${copied ? ' copied' : ''}`} onClick={copy} title={text}>
      <svg viewBox="0 0 24 24" width="1em" height="1em" aria-hidden="true">
        {copied ? (
          <path d="M9 16.2 4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2Z" fill="currentColor" />
        ) : (
          <path
            d="M16 1H4a2 2 0 0 0-2 2v14h2V3h12V1Zm3 4H8a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2Zm0 16H8V7h11v14Z"
            fill="currentColor"
          />
        )}
      </svg>
      {copied ? 'Copied' : label}
    </button>
  )
}
