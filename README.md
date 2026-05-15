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

### Frontend React

O arquivo `src/App.js` consome as rotas da API e exibe:
- Vitrine de produtos
- Resultado da negociação (Iara)
- Confirmação de pedido (Peri)
- Saldo do Nexus

## Processos (Procfile)

```
web: node server.js
frontend: npm start
```

## Estrutura

```
├── server.js          # Servidor Express com rotas da API
├── dropship-saas.js   # Código completo com todos os módulos e testes
├── src/
│   └── App.js         # Frontend React (consome a API)
├── Procfile           # Configuração de processos (web + frontend)
├── package.json       # Dependências e scripts
└── README.md          # Documentação
```

## Licença

MIT
