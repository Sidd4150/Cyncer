# Cyncer Audit — Bugs, Improvements, Suggestions

Running list of issues found in repo audits. Last full audit: **2026-07-07**.
Status legend: 🔴 open bug · 🟡 improvement/design decision · ✅ fixed since last audit.

`npx tsc --noEmit` passes clean — no type errors in app code.

---

## Bugs / Correctness

1. ✅ **`SyncOrderButton` missing `'use client'`** — fixed. Has the directive now.

2. ✅ **`api/etsy/auth/route.ts:2` — `crpyto` typo.** Fixed 2026-08-04: renamed the import and both usages to `crypto`.

3. 🔴 **OAuth `state` never verified (CSRF).** `auth/route.ts:11` generates `state` but nothing stores it, and `callback/route.ts` never checks it. Also `state` is made with `Math.random()` — use `crypto.randomBytes(16).toString('base64url')`, store it in a cookie alongside the verifier, and compare in the callback.

4. 🔴 **PKCE cookie flags.** `etsy_code_verifier` is set with only `httpOnly` + `maxAge`. Add `sameSite: "lax"`, `path: "/api/etsy"`, and `secure` (in prod) so the cookie reliably survives the redirect round-trip to etsy.com.

5. ✅ **`etsyHelpers.ts` — `getValidToken` returns a `NextResponse` on refresh failure.** Fixed 2026-08-04: `catch` now `console.error`s and returns `null`, so the `if (!token)` guards in both sync routes work correctly. Removed the now-unused `NextResponse` import.

6. ✅ **`sync/route.ts` — `price` can be `NaN`.** Fixed 2026-08-04 (multi-store rework): `const price = item.price ? item.price.amount / item.price.divisor : 0`.

7. 🔴 **`product/[id]/page.tsx:7` — non-numeric id crashes.** `parseInt(id)` on `/product/abc` gives `NaN`, Prisma throws, user gets a 500 instead of the "not found" branch. Check `Number.isNaN` first and call Next's `notFound()`.

8. 🔴 **Sync routes mutate via GET.** `/api/etsy/sync` and `/api/etsy/sync-orders` are `GET` handlers that write to the DB. Browsers, prefetchers, and crawlers can trigger them. Make them `POST` (update `SyncOrderButton` to `fetch(..., { method: "POST" })`).

9. ✅ **`sync/route.ts` pagination fragility.** Fixed 2026-08-04: breaks when `!data.results?.length` and treats `data.count` defensively (`?? 0`). Same guard applied to `sync-orders`.

10. 🔴 **`sync/route.ts:60-88` — update branch is incomplete.** For an existing SKU only matching listings get `updateMany`; a new platform listing on an existing product is silently dropped, and `desc`/`images` never refresh. Fine while Etsy-only; will lose data once eBay/Amazon land.

11. ✅ **`sync-orders/route.ts` — unpaginated.** Fixed 2026-08-04: now uses the same `limit`/`offset` loop as the listings sync.

12. ✅ **`sync-orders/route.ts` — redundant N+1 API call.** Fixed 2026-08-04: removed the `checkReceiptStatus` call and deleted the helper (data was already on the `receipt` object).

13. 🔴 **No Prisma singleton in `lib/prisma.ts`.** Every hot reload in `next dev` creates a new client and pool connection until Postgres runs out. Use the standard `globalThis` caching pattern.

14. 🔴 **`Listing` has no `@@unique([platform, platformId])`.** Nothing prevents duplicate listing rows for the same Etsy `listing_id` (e.g., if the create branch ever re-runs). Add the constraint + migration before sync runs get frequent.

39. ✅ **Orders sync never reconciled — shipped orders lingered forever.** Found & fixed 2026-08-04. `sync-orders` only upserts the *active* feed (`was_shipped=false`), so once an order shipped it dropped out of the feed and its DB row stayed frozen at `Paid`; the "Active Orders" page (`findMany`, no filter) kept showing it. Now the sync collects the active `orderId`s and, after a fully successful fetch, `deleteMany({ storeId, platform: "etsy", orderId: { notIn: activeOrderIds } })` — deletion runs inside the `try` so a mid-sync error never wipes live orders. (Chosen over a soft `active` flag; revisit if Phase 5 analytics need shipped-order history.)

15. 🔴 **Token refresh race.** Etsy rotates refresh tokens on every refresh. If listings-sync and orders-sync run concurrently while the token is expired, both refresh, and the loser writes a dead refresh token to the DB — auth silently breaks until you reconnect. Low likelihood now; worth serializing (e.g., a small in-process lock) before cron jobs in Phase 6.

---

## Security

16. 🔴 **No auth on `/api/etsy/sync*`.** Anyone who can reach the server can trigger syncs (and, combined with #8, even by accident). Gate with a shared-secret header at minimum before deploying (Phase 7).

17. ✅ **`x-api-key` sends `${KEY}:${SECRET}`.** Resolved 2026-08-04 — false alarm. Etsy's v3 authentication docs explicitly require `x-api-key` to contain _keystring_ and _shared secret_ separated by a colon, so the current form is correct. Now centralized in `etsyHeaders()`.

18. ✅ **Shop ID hardcoded via `ETSY_SHOP_ID`.** Fixed 2026-08-04 (Phase 4.5 multi-store): sync routes now iterate `platformToken.findMany({ where: { platform: "etsy" } })`, and the OAuth callback resolves the real shop from the token (`getShopForToken`) instead of the env var, so multiple Etsy stores no longer overwrite each other. See new `Store` model + per-listing/order `storeId`.

19. 🟡 **Docker Postgres exposed with default creds.** `5432:5432` published to the host with `postgres/postgres`. Fine on your laptop; for the Phase 7 home-server deploy, remove the port mapping (app talks over the compose network) and set a real password.

---

## Improvements / UX

20. ✅ **`dashboard/page.tsx` loads everything into memory.** Fixed 2026-08-04: replaced the two `findMany` calls and the 518-row `<li>` list with three aggregate/count queries (`product.count`, `order.count`, `listing.aggregate({ _sum: { quantity: true } })`) rendered as Products / Total Stock / Current Orders stat cards. Per-platform `groupBy` breakdown still open for Phase 5.

21. 🟡 **`SyncOrderButton` has no error/loading state.** Partially addressed 2026-08-04: it now sums `synced` across the new `{ stores: [...] }` response (no more "Synced undefined orders"). Still open: `res.ok` handling, a disabled/spinner state while syncing, and `router.refresh()` over `window.location.reload()` + `alert()`.

22. 🟡 **No UI to trigger the listings sync.** Orders have a button; `/api/etsy/sync` must be hit by hand in the URL bar. Add a "Sync Listings" button (with the caveat below).

23. 🟡 **Full listings sync is a multi-minute request.** ~518 new products = 6 listing pages + 518 image fetches × 250ms sleep ≈ 2.5+ min inside one HTTP request — a button click will look frozen and may hit timeouts. Options: (a) return after each page and let the client loop, (b) move to a background job (Phase 6 cron anyway), or (c) fix #24 to kill the image N+1 entirely.

24. 🟡 **Dead `includes=images` param / avoidable image N+1.** `sync/route.ts:21` passes `includes=images` but never reads images off the listing response — then does a separate images request per new product. Etsy's `getListingsByShop` supports `includes=Images` (capital I); if that returns `item.images`, you can drop the per-listing fetch and the 250ms sleeps entirely.

25. 🟡 **`orders/page.tsx` — no `orderBy`, no pagination.** `orderBy: { date: "desc" }` added 2026-08-04. Pagination still open for when order volume grows.

26. ✅ **OAuth callback ends on raw JSON.** Fixed 2026-08-04: the callback now `redirect`s to `/dashboard?connected=etsy` after saving the token/store. (Banner on the dashboard still TODO.)

27. 🟡 **`seed.ts` wipes all data unconditionally.** `deleteMany()` on orders/listings/products — one accidental `prisma db seed` after real Etsy syncs erases everything. Guard it: refuse to run unless `NODE_ENV !== "production"` or an explicit `SEED_CONFIRM=1` is set.

28. 🟡 **Dead code:** `totalStock` in `product/page.tsx:27-29` is computed but never rendered (and would be per-page only). Delete or display it. Same for the unused `request` params in the sync route handlers.

29. ✅ **`app/page.tsx` is a stub** (`<h1>Hello</h1>`). Fixed 2026-08-04: replaced with a real public landing page (hero, features, how-it-works, supported marketplaces) with `metadata` for title/description — also satisfies the Amazon SP-API public-website requirement. Design overhaul tracked as TASK.md Phase 8.

30. 🟡 **Use `next/image` instead of `<img>`.** 570px Etsy images at ~24 per products page, unoptimized and layout-shifting. `next/image` needs `images.remotePatterns` for `i.etsystatic.com` in `next.config.ts`.

31. 🟡 **No `loading.tsx` / `error.tsx` boundaries.** Every page is a server component doing DB work with no fallback; a Prisma hiccup gives the default Next error screen. Add simple boundaries at the app root.

32. 🟡 **No `metadata` export in `layout.tsx`.** Tab still says nothing/default. `export const metadata = { title: "Cyncer" }`.

---

## Architecture / Hygiene

33. 🟡 **SKU strategy decision pending.** SKU is synthesized as `ETSY-${listing_id}`, so the *same physical product* listed on Etsy and eBay will become two `Product` rows — defeating the core cross-platform stock-sync goal. Decide the matching key (real merchant SKU, manual linking UI, or title matching) **before** the eBay/Amazon phase; it's a migration either way.

34. 🟡 **`Dockerfile` runs `npm run dev`.** Fine for now; Phase 7 needs a multi-stage prod target (`next build` + `next start`, no source volume mount).

35. 🟡 **`docker-compose.yml` only passes `DATABASE_URL`.** The ETSY_* vars work only because `./my-app:/app` mounts `.env` into the container. If you ever drop the source mount (prod image), the Etsy env vars silently vanish — add an `env_file:` entry.

36. 🟡 **Add a React 19 note to `AGENTS.md`.** The Next.js warning exists; Server Actions / `use()` are equally off training data and Phase 3 forms will hit them.

37. ✅ **Stray `node_modules/` at repo root** — gone; resolved.

38. `TEST_ETSYAPI/` is gitignored scratch — consider deleting once the OAuth flow is stable, or keep as reference.

---

## Quick wins (do first, ~30 min total)

- ✅ Fix `getValidToken` returning `NextResponse` → return `null` (#5) — done 2026-08-04
- ✅ Fix `crpyto` typo (#2) — done 2026-08-04
- Prisma `globalThis` singleton (#13)
- ✅ Guard `NaN` price (#6) — done 2026-08-04; `NaN` product id (#7) still open
- ✅ Delete redundant `checkReceiptStatus` call (#12) and unused `orders` query in dashboard (#20) — done 2026-08-04
- `@@unique([platform, platformId])` on `Listing` (#14)
- `redirect("/dashboard")` in `app/page.tsx` (#29)
- Seed script guard (#27)
