import { useMemo, useState } from "react";
import { useData } from "../data";
import { formatUsd } from "../format";
import { useScryfallMany } from "../hooks/useScryfallMany";
import { resolveCard } from "../scryfall";
import type { Card, PickupStatus } from "../types";
import { PICKUP_STATUSES, PICKUP_STATUS_LABEL } from "../pickupStatus";
import { CardTile } from "./CardTile";
import { CardRow } from "./CardRow";
import { CardModal } from "./CardModal";
import type { ViewMode } from "../urlState";
import { ViewToggle } from "./ViewToggle";
import { PickupForm } from "./PickupForm";

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
  const { cards, pickups, updatePickup, savePickup, deletePickup, source, isEditor } = useData();
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  // In local mode anyone can flip the flags (they stay in this browser); on Firestore only editors can.
  const canEdit = source === "local" || isEditor;
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
    [cards, infos],
  );

  const rows = pickups.map((o) => {
    const items = o.cardIds
      .map((id) => byId.get(id))
      .filter((c) => c !== undefined);
    // A total in USD from the store wins over the sum of the cards' prices.
    const usd = o.totalUsd ?? items.reduce((n, c) => n + (c.priceUsd ?? 0) * c.quantity, 0);
    return { ...o, items, usd };
  });
  // Cancelled orders stay listed but do not count towards the totals.
  const active = rows.filter((r) => r.status !== "cancelled");
  const totalUsd = active.reduce((n, r) => n + r.usd, 0);
  const totalArs = active.reduce(
    (n, r) => n + (r.totalArs ?? r.usd * ARS_PER_USD),
    0,
  );
  const pending = active.filter((r) => !r.paid);
  const cancelled = rows.length - active.length;

  return (
    <section className="pickups">
      <header className="pickups-header">
        <div>
          <h2>Purchases to pick up</h2>
          <p className="muted">
            {active.length} orders ·{" "}
            {active.reduce((n, r) => n + r.items.length, 0)} cards ·{" "}
            {ars.format(totalArs)} ·{" "}
            <span className="price">{formatUsd(totalUsd)}</span>
            {pending.length > 0 && ` · ${pending.length} unpaid`}
            {cancelled > 0 && ` · ${cancelled} cancelled`}
          </p>
        </div>
        <ViewToggle view={view} onChange={changeView} />
      </header>
      {isEditor &&
        (adding ? (
          <div className="add-card-panel pickup-new">
            <h3>New order</h3>
            <PickupForm
              submitLabel="Add order"
              onCancel={() => setAdding(false)}
              onSubmit={async (fields) => {
                const id = `order-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
                await savePickup({ ...fields, id });
                setAdding(false);
              }}
            />
          </div>
        ) : (
          <button type="button" className="add-card-button" onClick={() => setAdding(true)}>
            + New order
          </button>
        ))}
      <ul className="pickup-list">
        {rows.map((r) =>
          editingId === r.id ? (
            <li key={r.id} className="pickup">
              <h3 className="pickup-edit-title">Edit order</h3>
              <PickupForm
                initial={r}
                submitLabel="Save"
                onCancel={() => setEditingId(null)}
                onSubmit={async (fields) => {
                  await savePickup({ ...fields, id: r.id });
                  setEditingId(null);
                }}
              />
            </li>
          ) : (
          <li
            key={r.id}
            className={`pickup status-${r.status}${r.paid ? " paid" : ""}${collapsed.has(r.id) ? " collapsed" : ""}`}
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
              <div className="pickup-controls">
                <label className={`pickup-status is-${r.status}`}>
                  <span className="visually-hidden">Status</span>
                  <select
                    value={r.status}
                    disabled={!canEdit}
                    onChange={(e) =>
                      void updatePickup(r.id, { status: e.target.value as PickupStatus })
                    }
                  >
                    {PICKUP_STATUSES.map((st) => (
                      <option key={st} value={st}>
                        {PICKUP_STATUS_LABEL[st]}
                      </option>
                    ))}
                  </select>
                </label>
                <label className={`pickup-paid${r.paid ? " is-paid" : ""}`}>
                  <input
                    type="checkbox"
                    checked={r.paid}
                    disabled={!canEdit}
                    onChange={(e) => void updatePickup(r.id, { paid: e.target.checked })}
                  />
                  {r.paid ? "Paid" : "Unpaid"}
                </label>
                {isEditor &&
                  (deletingId === r.id ? (
                    <span className="confirm-delete">
                      <span>Delete order?</span>
                      <button
                        type="button"
                        className="danger"
                        onClick={async () => {
                          await deletePickup(r.id);
                          setDeletingId(null);
                        }}
                      >
                        Yes, delete
                      </button>
                      <button type="button" onClick={() => setDeletingId(null)}>
                        Cancel
                      </button>
                    </span>
                  ) : (
                    <>
                      <button type="button" className="pickup-edit" onClick={() => setEditingId(r.id)}>
                        Edit
                      </button>
                      <button type="button" className="pickup-edit danger" onClick={() => setDeletingId(r.id)}>
                        Delete
                      </button>
                    </>
                  ))}
              </div>
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
          ),
        )}
      </ul>
      {selected && (
        <CardModal card={selected} onClose={() => setSelected(null)} />
      )}
    </section>
  );
}
