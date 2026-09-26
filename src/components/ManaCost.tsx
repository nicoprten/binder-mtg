const SYMBOL_CLASS: Record<string, string> = {
  W: 'mana mana-w',
  U: 'mana mana-u',
  B: 'mana mana-b',
  R: 'mana mana-r',
  G: 'mana mana-g',
  C: 'mana mana-c',
}

/** Renderiza un costo tipo "{1}{B}{R}" como fichas de maná. */
export function ManaCost({ cost }: { cost: string }) {
  const symbols = cost.match(/\{([^}]+)\}/g)?.map((s) => s.slice(1, -1)) ?? []
  if (symbols.length === 0) return null
  return (
    <span className="mana-cost" aria-label={cost}>
      {symbols.map((s, i) => (
        <span key={i} className={SYMBOL_CLASS[s] ?? 'mana mana-generic'}>
          {s}
        </span>
      ))}
    </span>
  )
}
