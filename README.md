# Binder MTG

Binder virtual de cartas de Magic: The Gathering, con dos secciones:

- **Binder**: todas las cartas de la colección, con búsqueda por nombre, tipo, texto o tag, filtro por color y detalle de cada carta.
- **Mazos**: mazos armados a partir de las cartas de la binder. Se guardan en el `localStorage` del navegador y avisan si un mazo usa más copias de una carta que las que hay en la binder.

## Cómo correrlo

```bash
npm install
npm run dev
```

## Agregar cartas a la binder

1. Guardar la imagen de la carta en `public/cards/` con el nombre `<set>-<número>-<nombre>.jpg` (o `.webp`).
2. Agregar una entrada en `src/data/cards.json` siguiendo el tipo `Card` de `src/types.ts`. El `id` es `<set>-<número>` en minúsculas.
3. Si tenés más de una copia, subir `quantity`.

## Scripts

- `npm run dev`: servidor de desarrollo.
- `npm run build`: chequeo de tipos y build de producción en `dist/`.
- `npm run lint`: lint con oxlint.
