# Cyncer

Multi-channel inventory management app that syncs stock across eBay, Etsy, and Amazon in one dashboard.

## Stack

- Next.js 16, TypeScript, Tailwind
- PostgreSQL + Prisma 7
- Docker
- Etsy Open API v3

## Setup

```bash
docker compose up --build
docker compose exec app npx prisma db push
docker compose exec app npx prisma db seed
```

App runs at `http://localhost:3000`.

## Etsy Sync

1. Visit `/api/etsy/auth` to connect your Etsy shop
2. Approve access on Etsy
3. Visit `/api/etsy/sync` to pull listings into the database

## Pages

- `/dashboard` — overview stats
- `/product` — browse all products
- `/product/[id]` — product detail with platform listings
