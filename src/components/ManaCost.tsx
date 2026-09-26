import { Fragment } from 'react'

const SYMBOL_CLASS: Record<string, string> = {
  W: 'mana mana-w',
  U: 'mana mana-u',
  B: 'mana mana-b',
  R: 'mana mana-r',
  G: 'mana mana-g',
  C: 'mana mana-c',
  T: 'mana mana-tap',
}

const SYMBOL_TEXT: Record<string, string> = {
  T: '⤵',
}

function Symbol({ symbol }: { symbol: string }) {
  return (
    <span className={SYMBOL_CLASS[symbol] ?? 'mana mana-generic'} aria-label={`{${symbol}}`}>
      {SYMBOL_TEXT[symbol] ?? symbol}
    </span>
  )
}

/** Renders a cost like "{1}{B}{R}" as mana symbols. */
export function ManaCost({ cost }: { cost: string }) {
  const symbols = cost.match(/\{([^}]+)\}/g)?.map((s) => s.slice(1, -1)) ?? []
  if (symbols.length === 0) return null
  return (
    <span className="mana-cost" aria-label={cost}>
      {symbols.map((s, i) => (
        <Symbol key={i} symbol={s} />
      ))}
    </span>
  )
}

/** Renders a line of oracle text, replacing {X} tokens with mana symbols. */
export function OracleLine({ text }: { text: string }) {
  const parts = text.split(/(\{[^}]+\})/g)
  return (
    <>
      {parts.map((part, i) =>
        part.startsWith('{') && part.endsWith('}') ? (
          <Symbol key={i} symbol={part.slice(1, -1)} />
        ) : (
          <Fragment key={i}>{part}</Fragment>
        ),
      )}
    </>
  )
}
