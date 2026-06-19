# Digital Menu SaaS

A multi-tenant platform where any food business can sign up, build a digital
menu, and let customers order and pay for food through a branded URL. The
public menu is designed mobile-first — it should feel like opening a food
delivery app, not a website.

## Stack

- **Client:** React + TypeScript + Tailwind CSS (Vite)
- **Server:** Node.js + Express + TypeScript
- **Database:** PostgreSQL, raw SQL via `pg` (no ORM)
- **Auth:** JWT (vendor register + login)
- **Payments:** Paystack (hosted checkout redirect)
- **QR codes:** `qrcode.react`

## Project layout

```
/client   React app (public menu + vendor dashboard)
/server   Express API + Postgres schema/seed scripts
```

## Live deployment

Deployed as two Vercel projects from this repo, with a Neon Postgres database
(provisioned via Vercel's marketplace integration) attached to the server
project:

- **Client:** https://digital-menu-saas-client.vercel.app
- **Server:** https://digital-menu-saas-server.vercel.app
- **Try it:** https://digital-menu-saas-client.vercel.app/menu/welly-foods

`server/src/app.ts` exports the Express app (no `app.listen`); `server/index.ts`
wraps it with `.listen()` for local dev only, and `server/api/index.ts` is the
Vercel serverless function entrypoint — Vercel auto-detected this as an
"Express" project and runs the whole app as one function, with
`server/vercel.json` rewriting every path to it so Express's own internal
routing (including the raw-body Paystack webhook) works unmodified.
`client/vercel.json` rewrites all paths to `index.html` for client-side
routing (SPA fallback).

This deployment runs in `TENANT_MODE=path` (no wildcard subdomain DNS is set
up for a `*.vercel.app` domain). `PAYSTACK_SECRET_KEY` is not set on this
deployment — see [Ordering & payments](#ordering--payments) below; ordering
will 502 until it's added via `vercel env add PAYSTACK_SECRET_KEY production`
in `server/`.

To redeploy after changes: `vercel deploy --prod --yes` from `client/` or
`server/` respectively (each is its own linked Vercel project).

---

## Environment variables

### `server/.env`

| Variable       | Description                                                                 | Example                                                |
| -------------- | ----------------------------------------------------------------------------- | ------------------------------------------------------- |
| `DATABASE_URL` | Postgres connection string                                                    | `postgres://user:pass@localhost:5432/digital_menu`       |
| `JWT_SECRET`   | Secret used to sign auth tokens                                               | a long random string                                     |
| `TENANT_MODE`  | `path` (dev) or `subdomain` (prod) — controls CORS and the public URL shape   | `path`                                                    |
| `CLIENT_URL`   | Base URL of the client app. In `subdomain` mode this is treated as the **root domain** that vendor slugs are prefixed onto | `http://localhost:5173` (path) / `https://yoursaasapp.com` (subdomain) |
| `PORT`         | Port the API listens on                                                       | `4000`                                                    |
| `PAYSTACK_SECRET_KEY` | Paystack secret key used to initialize/verify transactions and to verify webhook signatures | `sk_test_...` (get one free at [dashboard.paystack.com](https://dashboard.paystack.com) → Settings → API Keys) |

Copy `server/.env.example` to `server/.env` and fill in real values. Order
creation will fail with a 502 until `PAYSTACK_SECRET_KEY` is set to a real
key — everything else in the app works without it.

### `client/.env`

| Variable           | Description                                                              | Example                       |
| ------------------- | ------------------------------------------------------------------------- | ------------------------------ |
| `VITE_API_URL`      | Base URL of the API                                                        | `http://localhost:4000/api`    |
| `VITE_TENANT_MODE`  | `path` or `subdomain` — must match the server's `TENANT_MODE`             | `path`                          |
| `VITE_ROOT_DOMAIN`  | Root domain to strip from `window.location.hostname` in `subdomain` mode  | `yoursaasapp.com`               |

Copy `client/.env.example` to `client/.env` and fill in real values.

---

## Local setup

### 1. Database

Create a Postgres database and point `DATABASE_URL` at it:

```bash
createdb digital_menu
```

### 2. Server

```bash
cd server
cp .env.example .env   # edit DATABASE_URL / JWT_SECRET as needed
npm install
npm run db:init         # creates tables (server/src/db/init.sql)
npm run db:seed         # seeds two demo vendors (server/src/db/seed.ts)
npm run dev              # starts the API on http://localhost:4000
```

Demo logins created by `db:seed`:

| Business     | Slug          | Email                       | Password   |
| ------------ | ------------- | ---------------------------- | ----------- |
| Welly Foods  | `welly-foods`  | `vendor@wellyfoods.com`      | `welly123`  |
| Accra Bites  | `accra-bites`  | `vendor@accrabites.com`      | `accra123`  |

### 3. Client

```bash
cd client
cp .env.example .env   # edit if your API isn't on localhost:4000
npm install
npm run dev              # starts the app on http://localhost:5173
```

Visit:

- `http://localhost:5173/menu/welly-foods` — public menu (mobile-first; resize your browser or open dev tools device mode to see it as intended)
- `http://localhost:5173/login` — vendor login

---

## Multi-tenancy

Each vendor gets a unique `slug` generated from their business name at
registration (collisions are resolved by appending `-2`, `-3`, etc.).

- **Path mode (dev):** public menu lives at `CLIENT_URL/menu/:slug`,
  e.g. `localhost:5173/menu/ghana-restaurant`.
- **Subdomain mode (prod):** public menu lives at `:slug.<root-domain>`,
  e.g. `ghana-restaurant.yoursaasapp.com`. The client reads the slug from
  `window.location.hostname` (see `client/src/lib/auth.ts`,
  `getSlugFromSubdomain`) and the server's CORS config allows any subdomain
  of the configured root domain.

Switch modes by setting `TENANT_MODE` (server) and `VITE_TENANT_MODE` +
`VITE_ROOT_DOMAIN` (client) consistently across both apps.

---

## Ordering & payments

Customers order as guests (name + phone, no account). The flow:

1. Browse → add items to a cart (stored in `localStorage`, scoped per vendor
   slug so two restaurants' carts never mix).
2. Checkout — name, phone, pickup or delivery (delivery requires an address).
3. `POST /api/orders` recomputes the price of every item **server-side**
   (never trusts the cart's stored prices), creates the order, and calls
   Paystack to start a transaction. The browser is redirected to Paystack's
   hosted checkout page.
4. After payment, Paystack redirects back to `/order/:id/confirmation`, which
   polls `GET /api/orders/:id`. That endpoint actively calls Paystack's
   verify-transaction API itself when an order is still `pending_payment` —
   this is what actually confirms payment in this app, and it works from
   `localhost` with no public URL or tunnel needed, since it's an outbound
   call your server makes.
5. `POST /api/orders/webhook/paystack` is also wired up as an async backup
   confirmation path (Paystack signature-verified). It only matters in
   production, since Paystack's servers can't reach `localhost` to deliver
   it during local development.
6. Vendors manage incoming orders from the dashboard's **Orders** tab
   (`paid → preparing → ready → completed`, or `cancelled` at any point
   before completion).

**Known limitations** (intentional scope for this build, not bugs):

- No Paystack subaccount/split-payment — all payments land in one platform
  Paystack account. Paying out individual vendors is a manual, out-of-band
  step. [Paystack Subaccounts](https://paystack.com/docs/payments/multi-split-payments/)
  are the production upgrade path for automatic per-vendor settlement.
- Abandoned carts leave orders stuck at `pending_payment` with no cleanup
  job.
- The guest checkout email Paystack requires is synthesized server-side
  (`order-<id>@guest.invalid`) since customers only provide name + phone —
  it may be visible on Paystack's own hosted checkout/receipt screen.

### Testing the payment flow locally

1. Sign up for a free Paystack account, grab a **test** secret key, and set
   `PAYSTACK_SECRET_KEY` in `server/.env`.
2. Place an order through the UI — you'll be redirected to Paystack's hosted
   test checkout. Use a
   [Paystack test card](https://paystack.com/docs/payments/test-payments/)
   to simulate a successful charge.
3. You'll land back on the confirmation page, which polls and resolves to
   "Order placed!" once Paystack confirms the transaction.

---

## Production: subdomain mode

### 1. Wildcard DNS

Point a wildcard A/CNAME record at your server/load balancer so that any
subdomain resolves:

```
*.yoursaasapp.com.   A      203.0.113.10
yoursaasapp.com.      A      203.0.113.10
```

### 2. Env vars

```
# server
TENANT_MODE=subdomain
CLIENT_URL=https://yoursaasapp.com

# client (build-time)
VITE_TENANT_MODE=subdomain
VITE_ROOT_DOMAIN=yoursaasapp.com
VITE_API_URL=https://api.yoursaasapp.com/api
```

### 3. nginx

Serve the built client (static SPA) for any subdomain, and proxy `/api` to
the Express server. Example for a server that runs both behind nginx:

```nginx
# API
server {
    listen 443 ssl;
    server_name api.yoursaasapp.com;

    ssl_certificate     /etc/letsencrypt/live/yoursaasapp.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yoursaasapp.com/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:4000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# SPA — matches yoursaasapp.com and every *.yoursaasapp.com subdomain
server {
    listen 443 ssl;
    server_name yoursaasapp.com *.yoursaasapp.com;

    ssl_certificate     /etc/letsencrypt/live/yoursaasapp.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yoursaasapp.com/privkey.pem;

    root /var/www/digital-menu-saas/client/dist;
    index index.html;

    location / {
        try_files $uri /index.html;
    }
}
```

A wildcard SSL certificate (e.g. via `certbot --manual --preferred-challenges
dns -d yoursaasapp.com -d *.yoursaasapp.com`) is required to terminate TLS
for arbitrary subdomains.

### 4. Build

```bash
cd client && npm run build   # outputs client/dist
cd ../server && npm run build && npm start
```

---

## API reference

All responses are shaped `{ success: boolean, data: any, error?: string }`.

**Public**

- `GET /api/menu/:slug` — vendor profile + categories + items, nested.
- `POST /api/orders` — `{ vendor_slug, customer_name, customer_phone, fulfillment_type, delivery_address?, items: [{menu_item_id, quantity}] }` → `{ order_id, authorization_url }` (redirect the browser to `authorization_url`).
- `GET /api/orders/:id` — order status + items + vendor branding; also actively verifies payment with Paystack if still `pending_payment`.
- `POST /api/orders/webhook/paystack` — Paystack webhook (signature-verified), async backup confirmation.

**Auth**

- `POST /api/auth/register` — `{ business_name, email, password, location?, hours?, prep_time?, logo_url? }` → `{ token, vendor }`
- `POST /api/auth/login` — `{ email, password }` → `{ token, vendor }`

**Protected** (require `Authorization: Bearer <token>`)

- `GET /api/vendors/me`
- `PUT /api/vendors/me`
- `POST /api/categories`
- `DELETE /api/categories/:id`
- `POST /api/menu-items`
- `DELETE /api/menu-items/:id`
- `PATCH /api/menu-items/:id/toggle`
- `GET /api/orders` — vendor's own orders, newest first.
- `PATCH /api/orders/:id/status` — `{ status }`, one of `preparing`, `ready`, `completed`, `cancelled`.
