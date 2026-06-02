Dad's Inventory Tracker — Build Plan

  Goal

  Multi-channel inventory management app that syncs stock across eBay, Etsy, and Amazon in one dashboard.

  ---
  Phase 1 — Project Setup ✅

  - [x] Create Next.js app with TypeScript + Tailwind
  - [x] Add Dockerfile and docker-compose.yml (app + Postgres)
  - [x] Set up Prisma with PostgreSQL
  - [x] Create CLAUDE.md with project rules
  - [x] Push to GitHub

  Phase 2 — Database Schema ✅

  - [x] Product model (name, SKU, description, images, category)
  - [x] Platform listing model (eBay/Etsy/Amazon link, platform-specific ID, price, status)
  - [x] Inventory — quantity lives on Listing (no separate model)
  - [x] Order model (platform, order ID, quantity, sale price, date, status)
  - [x] Seed database with sample products

  Phase 3 — Core CRUD (partial)

  - [x] Products page — list all products with card UI and images
  - [x] Product detail page showing stock levels + listings per platform
  - [x] Dashboard — total products, total stock, listings breakdown
  - [x] Orders page — list active orders with product info
  - [ ] Search/filter on products page
  - [ ] Add/edit/delete product form
  - [ ] Revenue summary on dashboard

  Phase 4 — Multi-Channel Sync (partial)

  - [x] Etsy OAuth PKCE flow (auth + callback routes)
  - [x] Etsy listings sync — paginated, all 518 listings
  - [x] Etsy orders sync — active orders (paid, not shipped, not canceled)
  - [ ] eBay API integration — pull active listings and orders
  - [ ] Amazon SP-API integration — pull active listings and orders
  - [ ] Stock sync — when an item sells on one platform, update quantity everywhere
  - [ ] Alert when stock is low (configurable threshold)

  Phase 5 — Analytics Dashboard

  - Revenue by platform (bar chart)
  - Sales over time (line chart)
  - Top selling products
  - Inventory value calculator
  - Profit margins per product (sale price - cost)

  Phase 6 — Automation

  - Cron job to sync orders/inventory every X minutes
  - Email/notification when stock hits zero
  - Bulk CSV import for products
  - Bulk price update across platforms

  Phase 7 — Deploy

  - Dockerize everything (app + db + nginx)
  - Deploy on home server (Ubuntu VM)
  - Set up domain with DuckDNS
  - Nginx reverse proxy with HTTPS (Let's Encrypt)

  ---
  Resume Line When Done

  Multi-Channel Inventory Manager | Next.js, TypeScript, PostgreSQL, Docker
  - Built an inventory management system that synchronizes stock
    levels across eBay, Etsy, and Amazon, preventing overselling
    and automating listing updates across 3 marketplace APIs.
  - Deployed on a self-hosted Linux server with Docker, Nginx,
    and automated SSL — full infrastructure ownership.

  ---
  Stack

  - Frontend: Next.js, React, TypeScript, Tailwind, Recharts
  - Backend: Next.js API routes or FastAPI
  - Database: PostgreSQL + Prisma
  - APIs: eBay, Etsy, Amazon SP-API
  - Infra: Docker, Nginx, Let's Encrypt
  - Hosting: Home server (Ubuntu VM on VirtualBox)

  Start with Phase 1-3. Get CRUD working first, then add the API integrations.
