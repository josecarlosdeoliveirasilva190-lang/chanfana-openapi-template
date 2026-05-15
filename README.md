# Dropship SaaS

SaaS completo de Dropshipping com módulos inteligentes para negociação, atendimento, controle financeiro e vitrine digital.

## Módulos

### Nexus – Núcleo Técnico
Controle financeiro interno: saldo, margem mínima, registro de operações e cancelamento automático quando a margem não é atingida.

### Iara – Negociação Automática
Negocia automaticamente com fornecedores. Propõe preços abaixo do valor base e só confirma a compra quando o desconto é ≥ R$7, protegendo a margem de lucro.

### Peri – Atendimento ao Cliente
Atendimento automático via WhatsApp (API oficial). Envia promoções, confirma pedidos e gera relatórios de contatos e vendas.

### Lovable – Interface Web e Mobile
Vitrine nacional de produtos com promoções. Interface amigável para web e mobile.

### Integração – APIs e IA
Conexão com APIs externas (pagamentos, catálogo, billing, analytics) e inteligência artificial.

## Instalação

```bash
npm install
```

## Uso

### Iniciar o servidor (API Express)

```bash
npm start
```

O servidor inicia em `http://localhost:3000`.

### Rotas disponíveis

| Rota | Descrição |
|------|-----------|
| `GET /negociar/:precoBase` | Testa negociação da Iara com preço base |
| `GET /pedido/:cliente/:produto/:preco` | Confirma pedido via Peri |
| `GET /vitrine` | Lista produtos da vitrine |
| `GET /saldo` | Consulta saldo do Nexus |

### Executar demo (console)

```bash
npm run demo
```

Roda o `dropship-saas.js` com testes de todos os módulos no terminal.

### Desenvolvimento (backend + frontend)

```bash
npm run dev
```

Roda o backend Express e o frontend React simultaneamente com `concurrently`.

### Frontend React

O arquivo `src/App.js` consome as rotas da API e exibe:
- Vitrine de produtos
- Resultado da negociação (Iara)
- Confirmação de pedido (Peri)
- Saldo do Nexus

### Build para produção

```bash
npm run build
```

Gera o build do React em `/build` e o `server.js` serve os arquivos estáticos automaticamente.

## Deploy (Heroku, Railway, Render)

O `Procfile` executa o build e inicia o servidor:

```
web: npm run build && node server.js
```

## Estrutura

```
├── server.js          # Backend Express (endpoints + serve React build)
├── dropship-saas.js   # Código completo com todos os módulos e testes
├── src/
│   └── App.js         # Frontend React (consome a API)
├── public/
│   └── index.html     # Página base do React
├── Procfile           # Inicialização em nuvem (Heroku, Railway, Render)
├── package.json       # Configuração com concurrently para backend + frontend
└── README.md          # Documentação
```

## Licença

MIT
