# Marketplace Nacional

Plataforma de marketplace com IA integrada para negociacao de precos, multi-tenancy e pagamentos.

## Arquitetura Modular

| Modulo | Funcao | Descricao |
|--------|--------|-----------|
| **Nexus** | Nucleo financeiro | Controle de saldo, margem minima R$7, relatorios por cidade/produto, multi-tenancy |
| **Iara** | Negociacao IA | Propostas de preco dinamicas, protecao de margem, cancelamento automatico |
| **Peri** | Atendimento | Confirmacao de pedidos, mensagens automaticas, notificacoes |
| **Lovable Web** | Interface | Vitrine nacional, catalogo com busca/filtros, carrinho, checkout |

## Stack Tecnica

- **Frontend + API:** Next.js 16 (App Router, Turbopack)
- **Banco de dados:** PostgreSQL + Prisma ORM 7
- **Autenticacao:** JWT
- **Pagamentos:** Stripe
- **Estilo:** Tailwind CSS
- **Cache:** In-memory (preparado para Redis)

## Regras de Negocio (Iara)

1. **Preco base** - Fornecedor anuncia produto com valor inicial
2. **Proposta IA** - Iara sugere desconto (sempre abaixo do fornecedor)
3. **Desconto minimo** - Se margem >= R$7, compra confirmada
4. **Cancelamento** - Se margem < R$7, cancela automaticamente
5. **Entrega** - Compra fechada, entrega confirmada ao cliente

## Configuracao

```bash
# 1. Instalar dependencias
npm install

# 2. Configurar variaveis de ambiente
cp .env.example .env
# Editar .env com suas credenciais

# 3. Gerar Prisma Client
npx prisma generate

# 4. Criar banco de dados (requer PostgreSQL)
npx prisma migrate dev

# 5. Iniciar servidor de desenvolvimento
npm run dev
```

## Estrutura de Pastas

```
src/
  app/
    (auth)/           # Login, Registro
    (storefront)/     # Produtos, Carrinho, Checkout
    dashboard/
      seller/         # Painel do vendedor
      admin/          # Painel administrativo
      nexus/          # Painel financeiro Nexus
    api/
      auth/           # Endpoints de autenticacao
      products/       # CRUD de produtos
      orders/         # Gestao de pedidos
      cart/            # Carrinho
      nexus/          # Balance + Reports
      iara/           # Negociacao IA
      peri/           # Mensagens
      stripe/         # Webhook pagamentos
      admin/          # Tenants + Stats
  modules/
    nexus/            # Logica financeira
    iara/             # Logica de negociacao
    peri/             # Logica de mensagens
  components/
    layout/           # Header, Footer
    ui/               # ProductCard, etc.
  lib/
    prisma.ts         # Cliente Prisma
    auth.ts           # JWT helpers
    stripe.ts         # Stripe helpers
    cache.ts          # Cache layer
```

## API Endpoints

### Autenticacao
- `POST /api/auth/register` - Cadastro
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Usuario atual

### Produtos
- `GET /api/products` - Listar (com busca, filtros, paginacao)
- `POST /api/products` - Criar (vendedor/admin)

### Carrinho & Pedidos
- `GET/POST/DELETE /api/cart` - Gerenciar carrinho
- `GET/POST /api/orders` - Pedidos (com verificacao de margem)

### Nexus (Financeiro)
- `GET /api/nexus/balance` - Saldo do tenant
- `GET /api/nexus/reports` - Relatorios por cidade/produto

### Iara (IA)
- `POST /api/iara/negotiate` - Negociar preco
- `GET /api/iara/negotiate?productId=X` - Sugestao de preco

### Peri (Mensagens)
- `GET /api/peri/messages` - Mensagens do usuario
- `PATCH /api/peri/messages` - Marcar como lida

### Admin
- `GET/POST /api/admin/tenants` - Gerenciar comercios
- `GET /api/admin/stats` - Estatisticas globais

### Stripe
- `POST /api/stripe/webhook` - Webhook de pagamentos

## Variaveis de Ambiente

```
DATABASE_URL=postgresql://...
JWT_SECRET=sua-chave-secreta
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
REDIS_URL=redis://localhost:6379
NEXT_PUBLIC_APP_URL=http://localhost:3000
PLATFORM_FEE_PERCENT=10
MIN_MARGIN_BRL=7
```

## Roadmap

- [x] Mes 1: Banco de dados, API REST, Autenticacao JWT
- [ ] Mes 2: Integracao Stripe real, WhatsApp API (Peri), Lovable Mobile
- [ ] Mes 3: IA com GPT (Iara), Chatbot Peri, Redis cache, Relatorios IA
- [ ] Mes 4: Multi-tenancy completo, Cobranca recorrente, BI/Analytics, Cloud scaling
