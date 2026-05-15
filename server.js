// server.js
// Iara Dropship SaaS — Servidor principal

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');

const { connectRedis } = require('./src/config/redis');

// Rotas
const authRoutes = require('./src/routes/auth');
const produtosRoutes = require('./src/routes/produtos');
const pedidosRoutes = require('./src/routes/pedidos');
const negociacaoRoutes = require('./src/routes/negociacao');
const financeiroRoutes = require('./src/routes/financeiro');
const clientesRoutes = require('./src/routes/clientes');
const webhooksRoutes = require('./src/routes/webhooks');

const app = express();
const PORT = process.env.PORT || 3000;

// =======================
// MIDDLEWARE
// =======================

// Segurança
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100,
  message: { erro: 'Muitas requisições. Tente novamente em 15 minutos.' }
});
app.use('/api/', limiter);

// Parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Logging
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Arquivos estáticos
app.use(express.static(path.join(__dirname, 'public')));

// =======================
// ROTAS DA API
// =======================
app.use('/api/auth', authRoutes);
app.use('/api/produtos', produtosRoutes);
app.use('/api/pedidos', pedidosRoutes);
app.use('/api/negociar', negociacaoRoutes);
app.use('/api/financeiro', financeiroRoutes);
app.use('/api/clientes', clientesRoutes);
app.use('/api/webhooks', webhooksRoutes);

// =======================
// ROTA DE SAÚDE
// =======================
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    versao: '2.0.0',
    modulos: {
      nexus: 'ativo',
      iara: 'ativo',
      peri: 'ativo',
      lovable: 'ativo',
      integracao: 'ativo'
    },
    timestamp: new Date().toISOString()
  });
});

// =======================
// DOCUMENTAÇÃO DA API
// =======================
app.get('/api/docs', (req, res) => {
  res.json({
    nome: 'Iara Dropship SaaS API',
    versao: '2.0.0',
    base_url: '/api',
    autenticacao: 'Bearer JWT Token',
    endpoints: {
      auth: {
        'POST /api/auth/login': 'Login com email e senha → retorna JWT token',
        'POST /api/auth/registrar': 'Registrar nova loja (tenant) + usuário admin'
      },
      vitrine: {
        'GET /api/produtos/vitrine/:slug': 'Vitrine pública da loja (sem autenticação)'
      },
      produtos: {
        'GET /api/produtos': 'Listar produtos do tenant [JWT]',
        'POST /api/produtos': 'Criar produto [JWT]',
        'PUT /api/produtos/:id': 'Atualizar produto [JWT]',
        'DELETE /api/produtos/:id': 'Desativar produto [JWT]'
      },
      pedidos: {
        'POST /api/pedidos': 'Criar pedido (checkout) [JWT]',
        'POST /api/pedidos/:id/checkout': 'Gerar checkout Mercado Pago [JWT]',
        'POST /api/pedidos/:id/pix': 'Gerar Pix [JWT]',
        'GET /api/pedidos': 'Listar pedidos [JWT]',
        'GET /api/pedidos/:id': 'Detalhes do pedido [JWT]',
        'PATCH /api/pedidos/:id/status': 'Atualizar status do pedido [JWT]'
      },
      negociacao: {
        'POST /api/negociar': 'Negociar preço com Iara [JWT]',
        'POST /api/negociar/contraproposta': 'Contra-proposta [JWT]',
        'GET /api/negociar/historico': 'Histórico de negociações [JWT]',
        'GET /api/negociar/estatisticas': 'Estatísticas de negociação [JWT]'
      },
      financeiro: {
        'GET /api/financeiro/saldo': 'Saldo do Nexus [JWT]',
        'GET /api/financeiro/relatorio': 'Relatório financeiro [JWT]',
        'GET /api/financeiro/produtos': 'Relatório por produto [JWT]',
        'GET /api/financeiro/clientes': 'Relatório por cliente [JWT]',
        'GET /api/financeiro/margem/:precoVenda/:precoFornecedor': 'Verificar margem',
        'GET /api/financeiro/exportar': 'Exportar dados para BI [JWT]'
      },
      clientes: {
        'GET /api/clientes': 'Listar clientes [JWT]',
        'POST /api/clientes': 'Criar cliente [JWT]',
        'GET /api/clientes/:id': 'Detalhes + pedidos do cliente [JWT]',
        'POST /api/clientes/:id/mensagem': 'Enviar WhatsApp [JWT]',
        'GET /api/clientes/:id/mensagens': 'Histórico de mensagens [JWT]'
      },
      webhooks: {
        'POST /api/webhooks/mercadopago': 'Webhook Mercado Pago (automático)',
        'GET /api/webhooks/whatsapp': 'Verificação WhatsApp (automático)',
        'POST /api/webhooks/whatsapp': 'Receber mensagens WhatsApp (automático)',
        'POST /api/webhooks/fornecedor': 'Webhook do fornecedor (automático)'
      },
      sistema: {
        'GET /api/health': 'Status do sistema',
        'GET /api/docs': 'Esta documentação'
      }
    }
  });
});

// =======================
// FRONTEND (SPA)
// =======================
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// =======================
// ERROR HANDLER
// =======================
app.use((err, req, res, next) => {
  console.error('Erro não tratado:', err);
  res.status(500).json({ erro: 'Erro interno do servidor' });
});

// =======================
// INICIALIZAÇÃO
// =======================
async function iniciar() {
  // Tentar conectar Redis (opcional)
  await connectRedis();

  app.listen(PORT, () => {
    console.log(`
╔══════════════════════════════════════════╗
║   🛒 Iara Dropship SaaS v2.0.0         ║
║   Servidor rodando em :${PORT}              ║
║                                          ║
║   Módulos:                               ║
║   🧠 Nexus    — Financeiro        ✅     ║
║   🤝 Iara     — Negociação        ✅     ║
║   💬 Peri     — Atendimento       ✅     ║
║   🎨 Lovable  — Interface         ✅     ║
║   🔗 Integração — APIs/IA         ✅     ║
║                                          ║
║   📄 Docs: http://localhost:${PORT}/api/docs ║
╚══════════════════════════════════════════╝
    `);
  });
}

iniciar();

module.exports = app;
