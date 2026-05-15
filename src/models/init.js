// src/models/init.js
// Inicialização do banco de dados PostgreSQL — cria todas as tabelas

require('dotenv').config();
const { pool } = require('../config/database');

const SQL = `
-- =======================
-- TENANTS (Multi-tenant)
-- =======================
CREATE TABLE IF NOT EXISTS tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  email VARCHAR(255) NOT NULL,
  plano VARCHAR(50) DEFAULT 'basico',
  ativo BOOLEAN DEFAULT true,
  config JSONB DEFAULT '{}',
  criado_em TIMESTAMP DEFAULT NOW(),
  atualizado_em TIMESTAMP DEFAULT NOW()
);

-- =======================
-- USUÁRIOS
-- =======================
CREATE TABLE IF NOT EXISTS usuarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  nome VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  senha_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'admin',
  ativo BOOLEAN DEFAULT true,
  criado_em TIMESTAMP DEFAULT NOW(),
  UNIQUE(tenant_id, email)
);

-- =======================
-- PRODUTOS
-- =======================
CREATE TABLE IF NOT EXISTS produtos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  nome VARCHAR(255) NOT NULL,
  descricao TEXT,
  preco DECIMAL(10,2) NOT NULL,
  preco_fornecedor DECIMAL(10,2),
  estoque INTEGER DEFAULT 0,
  categoria VARCHAR(100),
  imagem_url TEXT,
  fornecedor_id UUID,
  ativo BOOLEAN DEFAULT true,
  criado_em TIMESTAMP DEFAULT NOW(),
  atualizado_em TIMESTAMP DEFAULT NOW()
);

-- =======================
-- CLIENTES
-- =======================
CREATE TABLE IF NOT EXISTS clientes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  nome VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  telefone VARCHAR(20),
  whatsapp VARCHAR(20),
  endereco JSONB DEFAULT '{}',
  criado_em TIMESTAMP DEFAULT NOW()
);

-- =======================
-- PEDIDOS
-- =======================
CREATE TABLE IF NOT EXISTS pedidos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  cliente_id UUID REFERENCES clientes(id),
  numero_pedido SERIAL,
  status VARCHAR(50) DEFAULT 'pendente',
  subtotal DECIMAL(10,2) NOT NULL,
  desconto DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(10,2) NOT NULL,
  metodo_pagamento VARCHAR(50),
  pagamento_id VARCHAR(255),
  pagamento_status VARCHAR(50) DEFAULT 'pendente',
  fornecedor_status VARCHAR(50) DEFAULT 'aguardando',
  rastreio VARCHAR(255),
  notas TEXT,
  criado_em TIMESTAMP DEFAULT NOW(),
  atualizado_em TIMESTAMP DEFAULT NOW()
);

-- =======================
-- ITENS DO PEDIDO
-- =======================
CREATE TABLE IF NOT EXISTS pedido_itens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pedido_id UUID REFERENCES pedidos(id) ON DELETE CASCADE,
  produto_id UUID REFERENCES produtos(id),
  nome_produto VARCHAR(255) NOT NULL,
  quantidade INTEGER NOT NULL DEFAULT 1,
  preco_unitario DECIMAL(10,2) NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL
);

-- =======================
-- TRANSAÇÕES FINANCEIRAS (Nexus)
-- =======================
CREATE TABLE IF NOT EXISTS transacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  pedido_id UUID REFERENCES pedidos(id),
  tipo VARCHAR(50) NOT NULL,
  valor DECIMAL(10,2) NOT NULL,
  descricao TEXT,
  referencia_externa VARCHAR(255),
  criado_em TIMESTAMP DEFAULT NOW()
);

-- =======================
-- NEGOCIAÇÕES (Iara)
-- =======================
CREATE TABLE IF NOT EXISTS negociacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  produto_id UUID REFERENCES produtos(id),
  preco_base DECIMAL(10,2) NOT NULL,
  proposta DECIMAL(10,2) NOT NULL,
  desconto DECIMAL(10,2) NOT NULL,
  status VARCHAR(50) NOT NULL,
  motivo TEXT,
  criado_em TIMESTAMP DEFAULT NOW()
);

-- =======================
-- MENSAGENS (Peri - WhatsApp)
-- =======================
CREATE TABLE IF NOT EXISTS mensagens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  cliente_id UUID REFERENCES clientes(id),
  pedido_id UUID REFERENCES pedidos(id),
  canal VARCHAR(50) DEFAULT 'whatsapp',
  direcao VARCHAR(10) DEFAULT 'saida',
  conteudo TEXT NOT NULL,
  status_envio VARCHAR(50) DEFAULT 'enviado',
  whatsapp_message_id VARCHAR(255),
  criado_em TIMESTAMP DEFAULT NOW()
);

-- =======================
-- FORNECEDORES
-- =======================
CREATE TABLE IF NOT EXISTS fornecedores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  nome VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  telefone VARCHAR(20),
  api_url TEXT,
  api_key VARCHAR(255),
  ativo BOOLEAN DEFAULT true,
  criado_em TIMESTAMP DEFAULT NOW()
);

-- =======================
-- ÍNDICES
-- =======================
CREATE INDEX IF NOT EXISTS idx_produtos_tenant ON produtos(tenant_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_tenant ON pedidos(tenant_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_cliente ON pedidos(cliente_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_status ON pedidos(status);
CREATE INDEX IF NOT EXISTS idx_transacoes_tenant ON transacoes(tenant_id);
CREATE INDEX IF NOT EXISTS idx_clientes_tenant ON clientes(tenant_id);
CREATE INDEX IF NOT EXISTS idx_mensagens_tenant ON mensagens(tenant_id);
CREATE INDEX IF NOT EXISTS idx_negociacoes_tenant ON negociacoes(tenant_id);
`;

async function initDatabase() {
  try {
    console.log('🔄 Inicializando banco de dados...');
    await pool.query(SQL);
    console.log('✅ Banco de dados inicializado com sucesso!');
    console.log('   Tabelas criadas: tenants, usuarios, produtos, clientes, pedidos, pedido_itens, transacoes, negociacoes, mensagens, fornecedores');
  } catch (err) {
    console.error('❌ Erro ao inicializar banco:', err.message);
    throw err;
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  initDatabase();
}

module.exports = { initDatabase };
