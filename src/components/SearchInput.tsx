interface Props {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

/** Text search box with a clear button that appears once there is something to clear. */
export function SearchInput({ value, onChange, placeholder, className }: Props) {
  return (
    <span className={`search-box${className ? ` ${className}` : ''}`}>
      <input
        type="search"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {value && (
        <button type="button" className="search-clear" onClick={() => onChange('')} aria-label="Clear search">
          ×
        </button>
      )}
    </span>
  )
}
