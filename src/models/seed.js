// src/models/seed.js
// Dados iniciais para desenvolvimento e teste

require('dotenv').config();
const bcrypt = require('bcryptjs');
const { pool } = require('../config/database');

async function seed() {
  try {
    console.log('🌱 Inserindo dados iniciais...');

    // Criar tenant padrão
    const tenantRes = await pool.query(`
      INSERT INTO tenants (nome, slug, email, plano)
      VALUES ('Loja Iara Dropship', 'iara-dropship', 'admin@iaradropship.com', 'premium')
      ON CONFLICT (slug) DO UPDATE SET nome = EXCLUDED.nome
      RETURNING id
    `);
    const tenantId = tenantRes.rows[0].id;

    // Criar usuário admin
    const senhaHash = await bcrypt.hash('admin123', 10);
    await pool.query(`
      INSERT INTO usuarios (tenant_id, nome, email, senha_hash, role)
      VALUES ($1, 'Carlos Admin', 'admin@iaradropship.com', $2, 'admin')
      ON CONFLICT (tenant_id, email) DO NOTHING
    `, [tenantId, senhaHash]);

    // Criar fornecedor
    const fornRes = await pool.query(`
      INSERT INTO fornecedores (tenant_id, nome, email, telefone)
      VALUES ($1, 'Fornecedor Nacional', 'fornecedor@example.com', '11999998888')
      RETURNING id
    `, [tenantId]);
    const fornecedorId = fornRes.rows[0].id;

    // Criar produtos
    const produtos = [
      { nome: 'Perfume Lis', descricao: 'Perfume floral premium 100ml', preco: 95.00, preco_fornecedor: 45.00, estoque: 100, categoria: 'Perfumaria' },
      { nome: 'Creme Hidratante', descricao: 'Creme hidratante corporal 200ml', preco: 88.00, preco_fornecedor: 35.00, estoque: 150, categoria: 'Cosméticos' },
      { nome: 'Kit Maquiagem', descricao: 'Kit completo com 12 peças', preco: 149.90, preco_fornecedor: 60.00, estoque: 80, categoria: 'Maquiagem' },
      { nome: 'Shampoo Premium', descricao: 'Shampoo para cabelos danificados 300ml', preco: 45.00, preco_fornecedor: 18.00, estoque: 200, categoria: 'Cabelos' },
      { nome: 'Protetor Solar', descricao: 'FPS 50 rosto e corpo 120ml', preco: 65.00, preco_fornecedor: 25.00, estoque: 120, categoria: 'Cuidados' },
      { nome: 'Batom Matte', descricao: 'Batom matte longa duração', preco: 35.00, preco_fornecedor: 12.00, estoque: 300, categoria: 'Maquiagem' }
    ];

    for (const p of produtos) {
      await pool.query(`
        INSERT INTO produtos (tenant_id, nome, descricao, preco, preco_fornecedor, estoque, categoria, fornecedor_id)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT DO NOTHING
      `, [tenantId, p.nome, p.descricao, p.preco, p.preco_fornecedor, p.estoque, p.categoria, fornecedorId]);
    }

    // Criar clientes de teste
    const clientes = [
      { nome: 'João Silva', email: 'joao@email.com', telefone: '11999991111', whatsapp: '5511999991111' },
      { nome: 'Maria Santos', email: 'maria@email.com', telefone: '11999992222', whatsapp: '5511999992222' },
      { nome: 'Pedro Oliveira', email: 'pedro@email.com', telefone: '11999993333', whatsapp: '5511999993333' }
    ];

    for (const c of clientes) {
      await pool.query(`
        INSERT INTO clientes (tenant_id, nome, email, telefone, whatsapp)
        VALUES ($1, $2, $3, $4, $5)
      `, [tenantId, c.nome, c.email, c.telefone, c.whatsapp]);
    }

    console.log('✅ Dados iniciais inseridos!');
    console.log(`   Tenant: ${tenantId}`);
    console.log('   Usuário: admin@iaradropship.com / admin123');
    console.log(`   ${produtos.length} produtos criados`);
    console.log(`   ${clientes.length} clientes criados`);

  } catch (err) {
    console.error('❌ Erro ao inserir dados:', err.message);
    throw err;
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  seed();
}

module.exports = { seed };
