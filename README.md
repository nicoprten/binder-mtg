# Binder MTG

A virtual binder for a Magic: The Gathering collection, with two sections:

- **Binder**: every card in the collection, ordered by set and collector number, searchable by name, type, oracle text or tag, with filters by status, color (cards having every selected color; colorless is exclusive) and finish, a grid or list view (icon toggle) paged 28 cards at a time, copy buttons for the name and for name + set on every list row, and a detail modal for each card that also lists every printing of it from Scryfall (tap one to preview it; two cards per row on phones). Filters, view, page and the open card are kept in the URL hash (for example `#/binder?q=krenko&c=BR&status=owned&view=list&page=2`), so a reload or a shared link restores them. Each card is tagged as owned (blue), to pick up (orange), wishlist (purple) or to trade (gold). Cards to trade show an asking price instead of what was paid: the Scryfall market price rounded up to the next $0.50, never under $0.50 (the paid price still appears in the detail and in Stats).
- **Pickups**: purchases waiting to be collected, from `src/data/pickups.json`, with order date, address, totals in ARS and USD and a status (Preparing, Ready to pick up, Picked up, Cancelled); the paid flag and the status can be changed on the page and are kept in the browser. Cancelled orders stay listed but are left out of the totals.
- **Stats**: a summary comparing what you paid with the Scryfall market value, for owned and to-trade cards together and for cards to pick up, plus the market value of the wishlist.
- **Stores**: the shops from `src/data/stores.json`, with website, address and opening hours, plus how many pickup orders and listed cards each one has.
- **Decks**: decks built from the cards in the binder. They are stored in the browser's `localStorage`, and a deck row is flagged when it uses more copies of a card than the binder holds.

Foil and surge foil cards get a shimmering label under the card.

Each card is looked up on Scryfall by set code and collector number (one request per card, spaced 100 ms apart, cached in the browser for a day). From that lookup the app shows the high-resolution picture, swapping it in over the local image from `public/cards/`, and the market price in USD for the card's finish (`usd` or `usd_foil`), displayed with a `~` next to your own price. Cards without a collector number keep the local image and show no market price. Set `window.BINDER_LOCAL_IMAGES = true` before the app script to use only the local images.


## Backend (Firebase)

The app can run from the JSON files in `src/data` alone, or from Cloud Firestore when a Firebase web config is present:

1. Copy `.env.example` to `.env.local` and fill in the `VITE_FIREBASE_*` values from Firebase Console → Project settings → Your apps → Web app. On Vercel, add the same variables under Settings → Environment Variables and redeploy. They identify the project and are not secrets.
2. In Firebase Console enable Firestore (production mode) and Authentication → Google, and add the Vercel domain under Authentication → Settings → Authorized domains.
3. Paste `firestore.rules` into Firestore → Rules, replacing the email with the Google account that may edit. Anyone can read; only that account can write.
4. Open the site, sign in with that account and press **Import bundled data**: the JSON files are copied into the `cards`, `pickups` and `stores` collections once.

With Firebase configured the site opens on a Google sign-in screen. Only the accounts in `VITE_EDITOR_EMAILS` get the full binder; anyone else, signed in or not, can only browse **Cards to trade** (`#/trade`). Signed in as an editor you can add cards from the Binder toolbar, edit or remove a card from its detail, change an order's status and paid flag, and add or edit stores. Decks are stored in Firestore too. Without a Firebase config, decks and order flags stay in the browser's `localStorage` as before. `VITE_EDITOR_EMAILS` (comma-separated) is required for that: with it empty nobody gets past the trade list. The rules still decide who can write.

## Running it

```bash
npm install
npm run dev
```

## Adding cards to the binder

Basic lands are not tracked.

A card you already know where to buy can carry `shops`, a list of `{store, url, priceUsd?}`: the tile shows an eye icon linking to the cheapest listing and the detail lists them all.

The quick way: add an entry to `src/data/cards.json` with just `id`, `name`, `set` (may be empty when unknown), `quantity`, `status`, `language`, plus `finish` and `priceUsd` if known. Add `frame` (`borderless`, `showcase`, `extended-art` or `promo`, or a list of them when any would do) when the copy is a special-frame version, so the right printing is chosen. The app looks the card up on Scryfall by exact name within that set (restricted to that frame when given) and fills in the collector number, cost, type, text, rarity, artist and picture at runtime. Until that lookup completes (or when Scryfall is unreachable) the card shows a placeholder with its name.

The full way, for a card you want stored offline too:

1. Save the card image in `public/cards/` as `<set>-<number>-<name>.jpg` (or `.webp`) and reference it as `cards/<file>` without a leading slash.
2. Add an entry to `src/data/cards.json` following the `Card` type in `src/types.ts`. The `id` is `<set>-<number>` in lowercase.
3. Set `status` to `owned` (in your possession), `to-pick-up` (found, still to buy and collect), `wishlist` (wanted) or `to-trade` (owned, available to sell or trade); `language` to the printed language code (`en`, `es`, `ja`, …); `finish` to `nonfoil`, `foil` or `surge-foil`; and `priceUsd` to the market price of one copy.
4. If you own more than one copy, raise `quantity`.

## Scripts

- `npm run dev`: development server.
- `npm run build`: type check and production build into `dist/`.
- `npm run lint`: lint with oxlint.
