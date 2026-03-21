# paste.trade MVP

Receipts for trade calls.

## Stack

- Next.js 15 (App Router)
- TypeScript + Tailwind
- shadcn/ui
- Local JSON DB abstraction in `lib/db.ts` (easy swap to Supabase)

## Local run

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

## API routes

- `GET /api/scrape?secret=CRON_SECRET` runs full scrape cycle
- `POST /api/extract` extracts trade thesis from text
- `GET /api/prices` refreshes open trade prices and P&L

## Data + schema

- Runtime data: `data/db.json`
- Supabase schema: `supabase-schema.sql`

## Sources

- Reddit hot posts from selected subreddits
- Polymarket markets
- Crypto news RSS feeds
- DeFiLlama TVL change signals
- CoinGecko prices

## Deploy

```bash
gh repo create nikkaroraa/paste-trade --public --source=. --push
```

Then import into Vercel and set env vars from `.env.example`.
