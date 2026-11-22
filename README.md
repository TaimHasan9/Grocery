# Gromuse — Fresh Organic Grocery E-Commerce Platform

Full-stack Next.js (App Router), TypeScript, Tailwind CSS, Framer Motion (`motion/react`), Drizzle ORM, PostgreSQL, and Firebase Auth grocery storefront and admin operations suite.

## Features

- **Storefront & Discovery (`/`, `/shop`, `/categories/[slug]`, `/products/[slug]`)**:
  - 8 curated grocery departments and 32 seeded organic grocery products.
  - Real-time search bar with product autocomplete suggestions, category filters, price range filtering, discount filter, and sorting.
  - Interactive inline `+` / lime-green quantity steppers on every product card, wishlist heart toggles, and multi-image Product Details Pages.
- **Persistent Cart, Coupons & Checkout (`/cart`, `/checkout`)**:
  - Slide-over animated Cart Drawer + full `/cart` view persisted across reloads and backed by PostgreSQL `/api/cart`.
  - Server-validated promo codes (`FRESH15`, `GROMUSE10`, `SAVE5`, `HEALTH5`) and automatic $50.00 free delivery threshold calculation.
  - React Hook Form + Zod validated checkout supporting Cash on Delivery (COD) and server-verified Stripe Checkout Sessions + signed webhooks (`/api/payments/stripe/webhook`).
- **Customer Account & Order Tracking (`/account`, `/orders`, `/orders/[orderNumber]`)**:
  - Google Sign-In via Firebase Auth, saved delivery addresses CRUD, order history, and guest order tracking lookup.
- **Admin Dashboard (`/admin`)**:
  - Role-gated via Firebase Auth + server verification (`ADMIN_EMAILS`).
  - Overview KPIs, Products & Inventory CRUD, Categories CRUD, Live Order Status & Payment Status updates, Coupons management, and Customers list.

## Environment Variables

See `.env.example`:

- `SQL_HOST`, `SQL_DB_NAME`, `SQL_USER`, `SQL_PASSWORD`, `SQL_ADMIN_USER`, `SQL_ADMIN_PASSWORD` — PostgreSQL connection credentials (provisioned automatically in AI Studio Cloud SQL runtime).
- `ADMIN_EMAILS` — Comma-separated list of admin email addresses permitted to access `/api/admin/*` and `/admin`.
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` — Optional Stripe keys for live card checkout and webhook verification.
- `RESEND_API_KEY` — Optional Resend key for live support email forwarding via `/api/contact`.

## Commands

```bash
npm run dev       # Start Next.js development server
npm run build     # Production build
npm run lint      # ESLint check
npx tsx --test src/lib/pricing.test.ts  # Run pricing & coupon unit tests
```
