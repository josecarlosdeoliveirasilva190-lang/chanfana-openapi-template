// src/routes/produtos.js
// Rotas da Vitrine e Produtos (Lovable)

const express = require('express');
const { query } = require('../config/database');
const { autenticar, isolarTenant } = require('../middleware/auth');
const { cacheGet, cacheSet, cacheDel } = require('../config/redis');

const router = express.Router();

// GET /api/vitrine/:slug — Vitrine pública (sem autenticação)
router.get('/vitrine/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    const { categoria, busca } = req.query;

    const cacheKey = `vitrine:${slug}:${categoria || 'all'}:${busca || ''}`;
    const cached = await cacheGet(cacheKey);
    if (cached) return res.json(cached);

    let sql = `
      SELECT p.id, p.nome, p.descricao, p.preco, p.categoria, p.imagem_url, p.estoque
      FROM produtos p
      JOIN tenants t ON p.tenant_id = t.id
      WHERE t.slug = $1 AND p.ativo = true AND p.estoque > 0
    `;
    const params = [slug];

    if (categoria) {
      params.push(categoria);
      sql += ` AND p.categoria = $${params.length}`;
    }

    if (busca) {
      params.push(`%${busca}%`);
      sql += ` AND (p.nome ILIKE $${params.length} OR p.descricao ILIKE $${params.length})`;
    }

    sql += ' ORDER BY p.criado_em DESC';

    const result = await query(sql, params);
    const dados = {
      loja: slug,
      produtos: result.rows,
      total: result.rows.length
    };

    await cacheSet(cacheKey, dados, 120);
    res.json(dados);
  } catch (err) {
    console.error('Erro na vitrine:', err);
    res.status(500).json({ erro: 'Erro ao carregar vitrine' });
  }
});

// === Rotas autenticadas ===

// GET /api/produtos — Listar produtos do tenant
router.get('/', autenticar, isolarTenant, async (req, res) => {
  try {
    const result = await query(
      `SELECT * FROM produtos WHERE tenant_id = $1 ORDER BY criado_em DESC`,
      [req.tenantId]
    );
    res.json({ produtos: result.rows, total: result.rows.length });
  } catch (err) {
    console.error('Erro ao listar produtos:', err);
    res.status(500).json({ erro: 'Erro ao listar produtos' });
  }
});

// POST /api/produtos — Criar produto
router.post('/', autenticar, isolarTenant, async (req, res) => {
  try {
    const { nome, descricao, preco, preco_fornecedor, estoque, categoria, imagem_url, fornecedor_id } = req.body;

    if (!nome || !preco) {
      return res.status(400).json({ erro: 'Nome e preço são obrigatórios' });
    }

    const result = await query(
      `INSERT INTO produtos (tenant_id, nome, descricao, preco, preco_fornecedor, estoque, categoria, imagem_url, fornecedor_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [req.tenantId, nome, descricao, preco, preco_fornecedor, estoque || 0, categoria, imagem_url, fornecedor_id]
    );

    await cacheDel(`vitrine:*`);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Erro ao criar produto:', err);
    res.status(500).json({ erro: 'Erro ao criar produto' });
  }
});

// PUT /api/produtos/:id — Atualizar produto
router.put('/:id', autenticar, isolarTenant, async (req, res) => {
  try {
    const { nome, descricao, preco, preco_fornecedor, estoque, categoria, imagem_url, ativo } = req.body;

    const result = await query(
      `UPDATE produtos SET
        nome = COALESCE($1, nome),
        descricao = COALESCE($2, descricao),
        preco = COALESCE($3, preco),
        preco_fornecedor = COALESCE($4, preco_fornecedor),
        estoque = COALESCE($5, estoque),
        categoria = COALESCE($6, categoria),
        imagem_url = COALESCE($7, imagem_url),
        ativo = COALESCE($8, ativo),
        atualizado_em = NOW()
       WHERE id = $9 AND tenant_id = $10 RETURNING *`,
      [nome, descricao, preco, preco_fornecedor, estoque, categoria, imagem_url, ativo, req.params.id, req.tenantId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ erro: 'Produto não encontrado' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Erro ao atualizar produto:', err);
    res.status(500).json({ erro: 'Erro ao atualizar produto' });
  }
});

// DELETE /api/produtos/:id — Desativar produto
router.delete('/:id', autenticar, isolarTenant, async (req, res) => {
  try {
    await query(
      `UPDATE produtos SET ativo = false, atualizado_em = NOW() WHERE id = $1 AND tenant_id = $2`,
      [req.params.id, req.tenantId]
    );
    res.json({ mensagem: 'Produto desativado' });
  } catch (err) {
    console.error('Erro ao desativar produto:', err);
    res.status(500).json({ erro: 'Erro ao desativar produto' });
  }
});

module.exports = router;
