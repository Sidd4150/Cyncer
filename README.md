# Cyncer

A unified dashboard for multi-platform sellers. View and manage orders from Etsy, Faire, eBay, and Amazon in one place — with real-time sync and a single interface for inventory management.

## Features

**V1 (current)**
- Unified order view across all connected platforms
- Filter by platform and order status
- Total orders + revenue summary
- Per-platform order counts
- Etsy OAuth integration with live order sync
- Auth via Clerk

**Planned**
- Faire, eBay, Amazon sync
- Inventory management — update stock from the dashboard and push to all platforms
- Order detail view
- Date range filtering
- Scheduled auto-sync

## Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | Next.js 16 (App Router) + TypeScript |
| Styling | Tailwind CSS 4 |
| Database | PostgreSQL (Neon) |
| ORM | Prisma 7 |
| Auth | Clerk |
| Hosting | Vercel |

## Getting Started

### 1. Install dependencies
```bash
cd marketplace-aggregator
npm install
```

### 2. Set up environment variables
Copy `.env` and fill in your values:
```env
DATABASE_URL=...

NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=...
CLERK_SECRET_KEY=...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard

NEXT_PUBLIC_BASE_URL=http://localhost:3000
ETSY_CLIENT_ID=...
ETSY_CLIENT_SECRET=...
```

### 3. Run migrations
```bash
npm run db:migrate
```

### 4. Seed sample data (optional)
```bash
npm run db:seed
```

### 5. Start dev server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Connecting Platforms

### Etsy
1. Register an app at [etsy.com/developers](https://www.etsy.com/developers)
2. Add callback URL: `http://localhost:3000/api/auth/etsy/callback`
3. Add your `ETSY_CLIENT_ID` and `ETSY_CLIENT_SECRET` to `.env`
4. Click "Connect Etsy" on the dashboard and approve the connection
5. Hit "Sync now" to pull your orders

## Project Structure

```
marketplace-aggregator/
├── prisma/
│   ├── schema.prisma        # DB models
│   ├── seed.ts              # Sample data
│   └── migrations/
├── src/
│   ├── app/
│   │   ├── dashboard/       # Main orders dashboard
│   │   ├── api/
│   │   │   ├── auth/etsy/   # Etsy OAuth flow
│   │   │   └── sync/etsy/   # Etsy order sync
│   │   ├── sign-in/
│   │   └── sign-up/
│   ├── lib/
│   │   ├── prisma.ts        # DB client
│   │   └── etsy.ts          # Etsy API helpers
│   └── generated/prisma/    # Auto-generated Prisma client
└── prisma.config.ts
```
