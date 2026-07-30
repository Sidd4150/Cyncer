# Cyncer

Multi-channel inventory management app for CustomUpArts (a real Etsy shop with ~518 listings). Goal: sync stock and orders across Etsy, eBay, and Amazon into one dashboard so an item selling on one platform updates quantity everywhere and prevents overselling. Currently Etsy-only; eBay/Amazon are planned.

**Key reference docs:**
- `TASK.md` — the full 7-phase build plan with checkboxes (source of truth for what's done / what's next)
- `BugFixes.md` — running audit of known bugs and improvements with status markers; check it before touching a file, and update it when fixing something listed there

## Layout & Stack

- `my-app/` — the Next.js app (App Router). **The repo root is NOT the app root.**
- Next.js 16 + React 19 + TypeScript + Tailwind (see `my-app/AGENTS.md` — these versions post-date training data; read `node_modules/next/dist/docs/` before writing Next.js code)
- PostgreSQL + Prisma 7, Docker Compose (app + Postgres containers)
- `TEST_ETSYAPI/` — gitignored scratch code from early Etsy OAuth experiments; ignore it

## Running

```bash
docker compose up --build        # app at localhost:3000
docker compose exec app npx prisma db push
docker compose exec app npx prisma db seed   # WARNING: seed wipes all data first
```

## Database (my-app/prisma/schema.prisma)

- **Product** — name, SKU (unique), desc, images (String[]), category. SKUs are currently synthesized as `ETSY-${listing_id}` — a known open design question, since the same physical product on two platforms would create two Product rows (BugFixes.md #33).
- **Listing** — per-platform listing: platform, platformId, url, price, quantity, status. **Quantity lives here** — there is no separate Inventory model.
- **Order** — flat per-transaction rows: platform, orderId (unique, `ETSY-{receiptId}-{txnId}`), quantity, salePrice, date, status.
- **PlatformToken** — OAuth tokens per (platform, shopId), enabling multiple stores. Routes still read a single `ETSY_SHOP_ID` env var, so multi-shop isn't wired through yet.

## Etsy Integration (my-app/app/api/etsy/)

- `auth/` + `callback/` — OAuth 2.0 PKCE flow; code verifier in an httpOnly cookie; tokens land in `PlatformToken`.
- `sync/` — paginated listings sync (100/page, all ~518). Fetches images only for *new* products (rate limiting: Etsy allows ~5 QPS, so images are fetched once with a 250ms sleep between calls).
- `sync-orders/` — pulls active receipts (paid, not shipped, not canceled), upserts Orders per transaction. Triggered by `SyncOrderButton` on the orders page.
- `lib/etsyHelpers.ts` — `getValidToken()` reads the token from DB and auto-refreshes if expired (Etsy rotates refresh tokens on every refresh).
- Etsy calls send `x-api-key: ${ETSY_API_KEY}:${ETSY_SHARED_SECRET}` plus `Authorization: Bearer`.
- Env vars in `my-app/.env`: `DATABASE_URL`, `ETSY_API_KEY`, `ETSY_SHARED_SECRET`, `ETSY_SHOP_ID`, `ETSY_REDIRECT_URI`.

## Pages

`/dashboard` (stats), `/product` (card grid, paginated), `/product/[id]` (detail + per-platform listings), `/orders` (active orders + sync button). `/` is still a stub.

## Status (as of 2026-07)

Done: Phases 1–2 fully; Phase 3 read-side (dashboard, products, product detail, orders pages); Phase 4 Etsy side (OAuth, full paginated listings sync, orders sync, DB token storage with refresh).

Not done: product add/edit/delete forms, search/filter, eBay + Amazon integrations, cross-platform stock sync, low-stock alerts, analytics (Phase 5), cron/automation (Phase 6), deployment (Phase 7). BugFixes.md lists ~15 known open bugs — several quick wins at the bottom of that file.

## Gotchas

- Prisma 7: needs `@prisma/adapter-pg` + explicit adapter in the client constructor; generator needs an `output` path (generates `.ts` only, into `my-app/app/generated/prisma/`); datasource URL + seed command live in `prisma.config.ts`, not schema.prisma. Shared client helper: `my-app/app/lib/prisma.ts`.
- Docker volume `./my-app:/app` shadows container files — generate the Prisma client locally too. The anonymous `/app/node_modules` volume caches old packages; `docker volume prune` after adding deps.
- `docker-credential-desktop` errors after Docker Desktop restarts — fix by editing `~/.docker/config.json`.
