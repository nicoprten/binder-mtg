import { useMemo, useState } from "react";
import { cards, pickups } from "../data";
import { formatUsd } from "../format";
import { usePickupEdits } from "../hooks/usePickupEdits";
import { useScryfallMany } from "../hooks/useScryfallMany";
import { resolveCard } from "../scryfall";
import type { Card } from "../types";
import { CardTile } from "./CardTile";
import { CardRow } from "./CardRow";
import { CardModal } from "./CardModal";
import type { ViewMode } from "../urlState";

const ARS_PER_USD = 1600;
const ars = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});
const dateFmt = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

const VIEW_KEY = "binder-mtg:pickups-view";
const COLLAPSED_KEY = "binder-mtg:pickups-collapsed";

function loadCollapsed(): Set<string> {
  try {
    const raw = localStorage.getItem(COLLAPSED_KEY);
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    return new Set();
  }
}

function loadView(): ViewMode {
  try {
    return localStorage.getItem(VIEW_KEY) === "grid" ? "grid" : "list";
  } catch {
    return "list";
  }
}

function formatDate(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return dateFmt.format(new Date(y, m - 1, d));
}

/** Purchases waiting to be collected, with totals in ARS and USD. */
export function Pickups() {
  const { edits, update } = usePickupEdits();
  const [view, setView] = useState<ViewMode>(loadView);
  const [selected, setSelected] = useState<Card | null>(null);
  const [collapsed, setCollapsed] = useState<Set<string>>(loadCollapsed);

  function toggleCollapsed(id: string) {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      try {
        localStorage.setItem(COLLAPSED_KEY, JSON.stringify([...next]));
      } catch {
        // Storage unavailable: the state lasts for this page load only.
      }
      return next;
    });
  }

  function changeView(next: ViewMode) {
    setView(next);
    try {
      localStorage.setItem(VIEW_KEY, next);
    } catch {
      // Storage unavailable: the choice lasts for this page load only.
    }
  }
  const infos = useScryfallMany(cards);
  const byId = useMemo(
    () => new Map(cards.map((c) => [c.id, resolveCard(c, infos[c.id])])),
    [infos],
  );

  const rows = pickups.map((o) => {
    const items = o.cardIds
      .map((id) => byId.get(id))
      .filter((c) => c !== undefined);
    const usd = items.reduce((n, c) => n + (c.priceUsd ?? 0) * c.quantity, 0);
    const edit = edits[o.id] ?? {};
    return { ...o, items, usd, paid: edit.paid ?? o.paid };
  });
  const totalUsd = rows.reduce((n, r) => n + r.usd, 0);
  const totalArs = rows.reduce(
    (n, r) => n + (r.totalArs ?? r.usd * ARS_PER_USD),
    0,
  );
  const pending = rows.filter((r) => !r.paid);

  return (
    <section className="pickups">
      <header className="pickups-header">
        <div>
          <h2>Purchases to pick up</h2>
          <p className="muted">
            {rows.length} orders ·{" "}
            {rows.reduce((n, r) => n + r.items.length, 0)} cards ·{" "}
            {ars.format(totalArs)} ·{" "}
            <span className="price">{formatUsd(totalUsd)}</span>
            {pending.length > 0 && ` · ${pending.length} unpaid`}
          </p>
        </div>
        <div className="view-toggle" role="group" aria-label="View">
          <button
            type="button"
            className={view === "grid" ? "active" : ""}
            onClick={() => changeView("grid")}
          >
            Grid
          </button>
          <button
            type="button"
            className={view === "list" ? "active" : ""}
            onClick={() => changeView("list")}
          >
            List
          </button>
        </div>
      </header>
      <ul className="pickup-list">
        {rows.map((r) => (
          <li
            key={r.id}
            className={`pickup${r.paid ? " paid" : ""}${collapsed.has(r.id) ? " collapsed" : ""}`}
          >
            <div className="pickup-top">
              <button
                type="button"
                className="pickup-toggle"
                onClick={() => toggleCollapsed(r.id)}
                aria-expanded={!collapsed.has(r.id)}
                aria-label={
                  collapsed.has(r.id) ? "Expand order" : "Collapse order"
                }
              >
                <svg
                  viewBox="0 0 24 24"
                  width="1em"
                  height="1em"
                  aria-hidden="true"
                >
                  <path d="M7 10l5 5 5-5z" fill="currentColor" />
                </svg>
              </button>
              <div className="pickup-summary">
                <h3>
                  {r.url ? (
                    <a href={r.url} target="_blank" rel="noopener noreferrer">
                      {r.store}
                    </a>
                  ) : (
                    r.store
                  )}
                  {r.order && <span className="pickup-order">{r.order}</span>}
                </h3>
                <p className="muted">
                  {formatDate(r.date)} · {r.items.length} cards ·{" "}
                  {r.totalArs !== null
                    ? ars.format(r.totalArs)
                    : `≈ ${ars.format(r.usd * ARS_PER_USD)}`}{" "}
                  · <span className="price">{formatUsd(r.usd)}</span>
                </p>
                {r.note && <p className="pickup-note">{r.note}</p>}
              </div>
              <label className={`pickup-paid${r.paid ? " is-paid" : ""}`}>
                <input
                  type="checkbox"
                  checked={r.paid}
                  onChange={(e) => update(r.id, { paid: e.target.checked })}
                />
                {r.paid ? "Paid" : "Unpaid"}
              </label>
            </div>
            {!collapsed.has(r.id) && (
              <>
                <p className="pickup-address">
                  <span>Address</span>
                  {r.address ? (
                    <strong>{r.address}</strong>
                  ) : (
                    <em className="muted">unknown</em>
                  )}
                </p>
                {view === "grid" ? (
                  <div className="card-grid small">
                    {r.items.map((c) => (
                      <CardTile
                        key={c.id}
                        card={c}
                        badge={c.quantity > 1 ? `×${c.quantity}` : undefined}
                        onClick={() => setSelected(c)}
                      />
                    ))}
                  </div>
                ) : (
                  <ul className="card-list">
                    {r.items.map((c) => (
                      <CardRow
                        key={c.id}
                        card={c}
                        onClick={() => setSelected(c)}
                      />
                    ))}
                  </ul>
                )}
              </>
            )}
          </li>
        ))}
      </ul>
      {selected && (
        <CardModal card={selected} onClose={() => setSelected(null)} />
      )}
    </section>
  );
}
