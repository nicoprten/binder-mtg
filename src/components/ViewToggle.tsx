import type { ViewMode } from '../urlState'

interface Props {
  view: ViewMode
  onChange: (view: ViewMode) => void
}

/** Icon buttons switching between the card grid and the list. */
export function ViewToggle({ view, onChange }: Props) {
  return (
    <div className="view-toggle" role="group" aria-label="View">
      <button
        type="button"
        className={view === 'grid' ? 'active' : ''}
        aria-pressed={view === 'grid'}
        aria-label="Grid view"
        title="Grid view"
        onClick={() => onChange('grid')}
      >
        <svg viewBox="0 0 24 24" width="1.1em" height="1.1em" aria-hidden="true">
          {/* Two cards fanned side by side. */}
          <rect x="3" y="4" width="8" height="16" rx="1.5" fill="none" stroke="currentColor" strokeWidth="2" />
          <rect x="13" y="4" width="8" height="16" rx="1.5" fill="none" stroke="currentColor" strokeWidth="2" />
        </svg>
      </button>
      <button
        type="button"
        className={view === 'list' ? 'active' : ''}
        aria-pressed={view === 'list'}
        aria-label="List view"
        title="List view"
        onClick={() => onChange('list')}
      >
        <svg viewBox="0 0 24 24" width="1.1em" height="1.1em" aria-hidden="true">
          <path
            d="M4 6h2v2H4zM8 6h12v2H8zM4 11h2v2H4zM8 11h12v2H8zM4 16h2v2H4zM8 16h12v2H8z"
            fill="currentColor"
          />
        </svg>
      </button>
    </div>
  )
}
