# Cyncer

Multi-channel inventory and order management system that synchronizes product stock and active orders across Etsy, Amazon, and eBay from a single unified dashboard.

Built to prevent overselling, eliminate manual spreadsheet reconciliation, and provide real-time visibility across multiple online stores.

---

## Tech Stack

- Framework: Next.js 16 (App Router), React 19, TypeScript
- Styling: Tailwind CSS v4
- Database & ORM: PostgreSQL 16 + Prisma 7 (with `@prisma/adapter-pg`)
- Authentication: Auth.js / NextAuth v5 (Google OAuth 2.0 with email whitelist + Edge Middleware route guards)
- Marketplace APIs: 
  - Etsy Open API v3 (OAuth 2.0 PKCE flow, paginated listing & receipt sync)
  - Amazon Selling Partner API (SP-API) (Login with Amazon / LWA token exchange, listings & unshipped orders sync)
- Infrastructure: Docker & Docker Compose

---

## Features

- Unified Product Catalog: Centralizes listings across multiple shops and marketplaces into one searchable catalog with live stock counts and platform badges.
- Multi-Store Support: Connect multiple shops on the same marketplace (e.g. two separate Etsy stores) with individual store tagging and filtering.
- Real-Time Order Tracking: Aggregates active, unfulfilled orders across Etsy and Amazon with direct links to products and customer receipts.
- Resilient Multi-Channel Sync: Parallel synchronization with `Promise.allSettled` and error-safe reconciliation (protects database records from transient marketplace API drops).
- Google OAuth Authentication: Secure whitelist-gated access with Next.js Edge Middleware protecting all dashboard routes and API sync handlers.

---

## Getting Started

### 1. Prerequisites
- Docker & Docker Compose
- Node.js 20+ (for local development)

### 2. Environment Configuration
Create a `.env` file in the `cyncer-dash/` directory:

```bash
# Database
DATABASE_URL="postgresql://postgres:postgres@db:5432/cyncer"

# Auth.js / Google OAuth
AUTH_SECRET="your-random-32-character-secret"
GOOGLE_ID="your-google-oauth-client-id.apps.googleusercontent.com"
GOOGLE_SECRET="your-google-oauth-client-secret"
ALLOWED_EMAIL="authorized-store-owner@gmail.com"

# Etsy API
ETSY_API_KEY="your-etsy-keystring"
ETSY_SHARED_SECRET="your-etsy-shared-secret"
ETSY_REDIRECT_URI="http://localhost:3000/api/etsy/callback"

# Amazon SP-API (Optional / Live or Sandbox)
AMAZON_LWA_CLIENT_ID="your-amazon-lwa-client-id"
AMAZON_LWA_CLIENT_SECRET="your-amazon-lwa-client-secret"
AMAZON_LWA_REFRESH_TOKEN="your-amazon-refresh-token"
AMAZON_SELLER_ID="your-amazon-seller-id"
AMAZON_MARKETPLACE_ID="your-marketplace-id" # e.g. ATVPDKIKX0DER for US
AMAZON_USE_SANDBOX="false"
```

### 3. Run with Docker Compose

```bash
# Build and start containers (app on :3000, postgres on :5432)
docker compose up --build

# In a separate terminal, push the Prisma schema to PostgreSQL
docker compose exec app npx prisma db push
```

Open `http://localhost:3000` in your browser.

---

## Connecting Marketplaces

1. Log In: Sign in using your authorized Google account at `/login`.
2. Connect Etsy: Click "Connect Etsy" in the top navbar to authorize your Etsy shop via OAuth 2.0 PKCE.
3. Sync Listings: Visit `/api/etsy/sync` to pull active listings and product images into the database.
4. Sync Orders: Click "Refresh Orders" on the `/orders` page to fetch live unshipped orders across all connected stores.

---

## Project Structure

```
Cyncer/
├── docker-compose.yml              # App + PostgreSQL container definitions
├── Dockerfile                      # Production / development Node.js container
├── cyncer-dash/                    # Next.js App Root
│   ├── auth.ts                     # Auth.js configuration & Google whitelist
│   ├── middleware.ts               # Next.js Edge Middleware route guards
│   ├── prisma/
│   │   └── schema.prisma           # Database models (Product, Store, Listing, Order, Token)
│   ├── app/
│   │   ├── layout.tsx              # Navbar with session profile & sign-out
│   │   ├── page.tsx                # Public landing page
│   │   ├── login/                  # Google OAuth sign-in page
│   │   ├── dashboard/              # Metrics & inventory overview
│   │   ├── product/                # Product catalog & [id] detail views
│   │   ├── orders/                 # Live orders table & Refresh Orders button
│   │   ├── api/
│   │   │   ├── auth/[...nextauth]/ # Auth.js API route handlers
│   │   │   ├── etsy/               # OAuth connect, callback, listing & order sync
│   │   │   └── amazon/             # SP-API listing & order sync
│   │   └── lib/                    # Prisma client singleton, Etsy & Amazon API helpers
```

---

## Security & Best Practices

- Edge Middleware: Blocks unauthorized page visits and unauthenticated API calls before reaching database queries.
- PKCE OAuth 2.0: Implements code verifier / challenge exchange for third-party marketplace connections.
- Error-Resilient Reconciliation: Sync routes only reconcile (delete shipped orders) when the upstream API run completes with 0 errors.
