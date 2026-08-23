# Cyncer Feature Roadmap

High-impact features and enhancements designed to improve daily multi-channel inventory and order management for marketplace sellers.

---

## 1. Daily Workflow & Inventory Management

- [ ] Instant Product Search & Filter
  - Search bar on `/product` to search listings instantly by product name or SKU across 500+ items.
  - Quick filter tabs: "All", "Low Stock (< 3 left)", "Out of Stock (0)", "Etsy Only", "Amazon Only".
  - Preserves pagination and active store filters during search.

- [ ] Low-Stock & Reorder Alert Center
  - Dashboard widget highlighting items with stock below a configurable threshold (e.g. 3 units).
  - Dedicated "Restock Needed" view showing exact items to craft or order before running out.

- [ ] Quick Inline Stock Editor
  - Editable quantity inputs or quick increment/decrement buttons on `/product/[id]` and product table rows.
  - Allows instant stock adjustments directly in Cyncer when crafting new batches.

- [ ] "Sync Listings" UI Button
  - Add a one-click "Sync Listings" action on the Products page header with loading spinners and status toasts, matching the orders sync UX.

---

## 2. Business Analytics & Financial Insights

- [ ] Sales & Revenue Summary Cards
  - Dashboard metrics for "Today's Revenue", "This Week's Revenue", and "This Month's Revenue".
  - Channel revenue breakdown comparing Etsy vs Amazon sales performance.

- [ ] Top Selling Products Widget
  - Ranked list of best-performing products by total volume sold and total revenue generated over the last 30 days.

- [ ] Inventory Valuation Calculator
  - Total retail value of all active inventory across connected stores.

---

## 3. Automation & Background Jobs

- [ ] Automated Background Sync (Cron)
  - Scheduled background worker running every 15–30 minutes to fetch new orders and adjust stock levels automatically.
  - Dual-auth support accepting internal CRON_SECRET bearer tokens for serverless/cron runners.

- [ ] Low-Stock Notifications
  - Email or push notification when any high-velocity product hits zero stock to prevent overselling.

---

## 4. Multi-Channel Stock Synchronization

- [ ] Master SKU / Merchant Product Linking
  - Link corresponding Etsy listings and Amazon ASINs/SKUs to a single parent Product record.
  - Automatic cross-channel deduction: When an item sells on Etsy, automatically reduce the available quantity on Amazon (and vice versa).
