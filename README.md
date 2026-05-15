# 🛒 Iara Dropship SaaS v2.0

Plataforma completa de Dropshipping Nacional com módulos integrados.

## Módulos

| Módulo | Função | Tecnologia |
|--------|--------|------------|
| 🧠 **Nexus** | Controle financeiro, margem, relatórios | PostgreSQL, Redis |
| 🤝 **Iara** | Negociação automática com fornecedores | Regras + IA local |
| 💬 **Peri** | Atendimento via WhatsApp | WhatsApp Business API |
| 🎨 **Lovable** | Interface web/mobile (PWA) | HTML5, CSS3, JS |
| 🔗 **Integração** | APIs e IA | Mercado Pago, Stripe, Copilot |

## Stack Técnico

- **Backend**: Node.js + Express
- **Banco de dados**: PostgreSQL
- **Cache**: Redis
- **Pagamentos**: Mercado Pago (Pix, Boleto, Cartão)
- **Atendimento**: WhatsApp Business API
- **Autenticação**: JWT
- **Arquitetura**: Multi-tenant SaaS
- **Frontend**: PWA (Progressive Web App)

## Fluxo Completo

1. **Configurar Loja** → Plataforma + domínio + banco de dados
2. **Conectar Fornecedores** → APIs + estoque + regras de preço
3. **Automatizar Pagamentos** → Mercado Pago + webhooks
4. **Gerenciar Pedidos** → Auto-envio ao fornecedor
5. **Logística e Entrega** → Rastreio + notificações
6. **Atendimento** → WhatsApp API + Peri
7. **Relatórios e Escala** → Dashboards BI + IA

## Instalação

```bash
# Clonar repositório
git clone https://github.com/josecarlosdeoliveirasilva190-lang/chanfana-openapi-template.git
cd chanfana-openapi-template

# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp .env.example .env
# Editar .env com suas credenciais

# Inicializar banco de dados
npm run db:init

# Inserir dados de teste
npm run db:seed

# Iniciar servidor
npm start
```

## API Endpoints

### Autenticação
- `POST /api/auth/login` — Login → JWT token
- `POST /api/auth/registrar` — Registrar nova loja

### Vitrine (pública)
- `GET /api/produtos/vitrine/:slug` — Vitrine da loja

### Produtos [JWT]
- `GET /api/produtos` — Listar
- `POST /api/produtos` — Criar
- `PUT /api/produtos/:id` — Atualizar
- `DELETE /api/produtos/:id` — Desativar

### Pedidos [JWT]
- `POST /api/pedidos` — Criar pedido
- `POST /api/pedidos/:id/checkout` — Checkout Mercado Pago
- `POST /api/pedidos/:id/pix` — Gerar Pix
- `GET /api/pedidos` — Listar
- `PATCH /api/pedidos/:id/status` — Atualizar status

### Negociação (Iara) [JWT]
- `POST /api/negociar` — Negociar preço
- `POST /api/negociar/contraproposta` — Contra-proposta
- `GET /api/negociar/historico` — Histórico
- `GET /api/negociar/estatisticas` — Estatísticas

### Financeiro (Nexus) [JWT]
- `GET /api/financeiro/saldo` — Saldo
- `GET /api/financeiro/relatorio` — Relatório por período
- `GET /api/financeiro/produtos` — Relatório por produto
- `GET /api/financeiro/clientes` — Relatório por cliente
- `GET /api/financeiro/exportar` — Exportar para BI

### Clientes [JWT]
- `GET /api/clientes` — Listar
- `POST /api/clientes` — Criar
- `POST /api/clientes/:id/mensagem` — Enviar WhatsApp

### Webhooks
- `POST /api/webhooks/mercadopago` — Mercado Pago
- `POST /api/webhooks/whatsapp` — WhatsApp
- `POST /api/webhooks/fornecedor` — Fornecedor

### Sistema
- `GET /api/health` — Status
- `GET /api/docs` — Documentação

## Variáveis de Ambiente

| Variável | Descrição |
|----------|-----------|
| `PORT` | Porta do servidor (padrão: 3000) |
| `DATABASE_URL` | URL do PostgreSQL |
| `REDIS_URL` | URL do Redis |
| `JWT_SECRET` | Chave secreta para JWT |
| `MERCADOPAGO_ACCESS_TOKEN` | Token do Mercado Pago |
| `WHATSAPP_TOKEN` | Token WhatsApp Business |
| `WHATSAPP_PHONE_ID` | ID do telefone WhatsApp |
| `APP_URL` | URL pública da aplicação |

## Deploy

### Railway / Render / Heroku
O projeto inclui `Procfile` configurado. Basta conectar o repositório e definir as variáveis de ambiente.

### Docker (em breve)
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
EXPOSE 3000
CMD ["node", "server.js"]
```

## Estrutura do Projeto

```
├── server.js                    # Servidor principal Express
├── package.json                 # Dependências e scripts
├── Procfile                     # Deploy em nuvem
├── .env.example                 # Variáveis de ambiente
├── dropship-saas.js             # Demo console
├── public/
│   ├── index.html               # Frontend PWA
│   ├── manifest.json            # PWA manifest
│   ├── sw.js                    # Service Worker
│   └── icon-*.png               # Ícones do app
├── src/
│   ├── config/
│   │   ├── database.js          # PostgreSQL pool
│   │   └── redis.js             # Redis cache
│   ├── middleware/
│   │   └── auth.js              # JWT + autorização
│   ├── models/
│   │   ├── init.js              # Criação das tabelas
│   │   └── seed.js              # Dados iniciais
│   ├── modules/
│   │   ├── nexus.js             # Módulo financeiro
│   │   ├── iara.js              # Módulo negociação
│   │   └── peri.js              # Módulo atendimento
│   ├── routes/
│   │   ├── auth.js              # Autenticação
│   │   ├── produtos.js          # Vitrine e produtos
│   │   ├── pedidos.js           # Pedidos e checkout
│   │   ├── negociacao.js        # Negociação Iara
│   │   ├── financeiro.js        # Financeiro Nexus
│   │   ├── clientes.js          # Clientes e WhatsApp
│   │   └── webhooks.js          # Webhooks MP/WA
│   └── services/
│       └── mercadopago.js       # Integração Mercado Pago
```

## Licença

MIT — Carlos Oliveira © 2026
