---
name: testing-dropship-saas
description: Test the Iara Dropship SaaS application end-to-end. Use when verifying API endpoints, frontend PWA UI, or business logic changes.
---

# Testing Dropship SaaS

## Prerequisites

- Node.js installed
- Run `npm install` in the repo root
- No PostgreSQL or Redis required for basic testing (graceful fallback)

## Starting the Server

```bash
cd /home/ubuntu/repos/chanfana-openapi-template
node server.js
```

Server starts on port 3000. Redis warnings are expected and safe to ignore.

## Backend API Tests (curl)

These endpoints work without PostgreSQL:

```bash
# Health check — should return status "online", versao "2.0.0", 5 modules "ativo"
curl -s http://localhost:3000/api/health | python3 -m json.tool

# API docs — should return 9 groups, 34 total endpoints
curl -s http://localhost:3000/api/docs | python3 -m json.tool

# Margin calculator (public, no auth)
# Good margin: margem_percentual 52.63, atende_minimo true
curl -s http://localhost:3000/api/financeiro/margem/95/45
# Bad margin: margem_percentual 10, atende_minimo false
curl -s http://localhost:3000/api/financeiro/margem/50/45

# Auth protection — should return 401
curl -s http://localhost:3000/api/produtos
curl -s -H "Authorization: Bearer invalidtoken" http://localhost:3000/api/financeiro/saldo
```

## Frontend PWA Tests (Browser)

Navigate to `http://localhost:3000` in the browser. The app has 7 tabs:

1. **Inicio** — Dashboard with stats (5 Modulos, 6 Produtos, Status online, Versao 2.0.0)
2. **Vitrine** — 6 products with prices and "Comprar" buttons (shows toast)
3. **Fluxo** — 7 numbered dropshipping steps with checkmarks
4. **Iara** — Negotiation simulator:
   - Price Base 100 → CANCELADO (5% discount = R$5 < minimum R$7)
   - Price Base 200 → CONFIRMADO (5% discount = R$10 >= R$7, margin >= 15%)
5. **Pedidos** — Order simulator: fill client/product/price, click confirm → shows order card
6. **Nexus** — Margin calculator:
   - 95/45 → 52.6% MARGEM OK (green)
   - 50/45 → 10.0% MARGEM BAIXA (red)
7. **API** — Lists all 34 endpoints with color-coded method badges

## Key Business Rules to Verify

- **Iara negotiation**: Automatic 5% discount. Confirmed only if discount >= R$7 AND margin >= 15%
- **Nexus margin**: Margin = ((venda - fornecedor) / venda) * 100. Minimum threshold is 15%
- **JWT auth**: Protected routes return 401 without valid token
- **Redis**: Optional — system works without it (fallback mode)

## Public Deploy

The frontend PWA is deployed at a public URL (check PR description for current URL). The public deploy is static-only — interactive features that call backend API only work with Express server running.

## Database-Dependent Testing

To test full CRUD and persistence, you need PostgreSQL:

```bash
# Configure DATABASE_URL in .env
npm run db:init   # Create 10 tables
npm run db:seed   # Insert test data (1 tenant, 1 admin, 6 products, 3 clients)
```

## Devin Secrets Needed

No secrets required for basic testing. For full integration testing:
- `MERCADOPAGO_ACCESS_TOKEN` — Mercado Pago API token
- `WHATSAPP_TOKEN` — WhatsApp Business API token
- `JWT_SECRET` — JWT signing key (defaults to a dev key if not set)
- `DATABASE_URL` — PostgreSQL connection string
