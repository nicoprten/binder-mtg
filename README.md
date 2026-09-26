# Binder MTG

A virtual binder for a Magic: The Gathering collection, with two sections:

- **Binder**: every card in the collection, searchable by name, type, oracle text or tag, with filters by status, color and finish, and a detail panel for each card. Each card is tagged as in stock (gold), to pick up (orange) or wishlist (purple).
- **Decks**: decks built from the cards in the binder. They are stored in the browser's `localStorage`, and a deck row is flagged when it uses more copies of a card than the binder holds.

Foil and surge foil cards get a shimmering label under the card.

## Running it

```bash
npm install
npm run dev
```

## Adding cards to the binder

1. Save the card image in `public/cards/` as `<set>-<number>-<name>.jpg` (or `.webp`) and reference it as `cards/<file>` without a leading slash.
2. Add an entry to `src/data/cards.json` following the `Card` type in `src/types.ts`. The `id` is `<set>-<number>` in lowercase.
3. Set `status` to `in-stock` (owned), `to-pick-up` (found, still to buy and collect) or `wishlist` (wanted); `language` to the printed language code (`en`, `es`, `ja`, …); `finish` to `nonfoil`, `foil` or `surge-foil`; and `priceUsd` to the market price of one copy.
4. If you own more than one copy, raise `quantity`.

## Scripts

- `npm run dev`: development server.
- `npm run build`: type check and production build into `dist/`.
- `npm run lint`: lint with oxlint.
