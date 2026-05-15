// src/routes/negociacao.js
// Rotas do módulo Iara (negociação)

const express = require('express');
const { query } = require('../config/database');
const { autenticar, isolarTenant } = require('../middleware/auth');
const Iara = require('../modules/iara');

const router = express.Router();

// POST /api/negociar — Negociar preço de um produto
router.post('/', autenticar, isolarTenant, async (req, res) => {
  try {
    const { produto_id, preco_base } = req.body;

    if (!produto_id) {
      return res.status(400).json({ erro: 'produto_id é obrigatório' });
    }

    // Buscar produto
    const prodRes = await query(
      `SELECT * FROM produtos WHERE id = $1 AND tenant_id = $2`,
      [produto_id, req.tenantId]
    );

    if (prodRes.rows.length === 0) {
      return res.status(404).json({ erro: 'Produto não encontrado' });
    }

    const produto = prodRes.rows[0];
    const base = preco_base || parseFloat(produto.preco);
    const precoFornecedor = produto.preco_fornecedor ? parseFloat(produto.preco_fornecedor) : null;

    const resultado = await Iara.negociar(req.tenantId, produto_id, base, precoFornecedor);

    res.json({
      produto: { id: produto.id, nome: produto.nome },
      negociacao: resultado
    });
  } catch (err) {
    console.error('Erro na negociação:', err);
    res.status(500).json({ erro: 'Erro na negociação' });
  }
});

// POST /api/negociar/contraproposta — Contra-proposta
router.post('/contraproposta', autenticar, isolarTenant, async (req, res) => {
  try {
    const { produto_id, preco_desejado } = req.body;

    if (!produto_id || !preco_desejado) {
      return res.status(400).json({ erro: 'produto_id e preco_desejado são obrigatórios' });
    }

    const prodRes = await query(
      `SELECT * FROM produtos WHERE id = $1 AND tenant_id = $2`,
      [produto_id, req.tenantId]
    );

    if (prodRes.rows.length === 0) {
      return res.status(404).json({ erro: 'Produto não encontrado' });
    }

    const produto = prodRes.rows[0];
    const resultado = await Iara.contraProposta(
      req.tenantId, produto_id, parseFloat(produto.preco), preco_desejado
    );

    res.json({
      produto: { id: produto.id, nome: produto.nome },
      contraproposta: resultado
    });
  } catch (err) {
    console.error('Erro na contra-proposta:', err);
    res.status(500).json({ erro: 'Erro na contra-proposta' });
  }
});

// GET /api/negociar/historico — Histórico de negociações
router.get('/historico', autenticar, isolarTenant, async (req, res) => {
  try {
    const historico = await Iara.historico(req.tenantId);
    res.json({ negociacoes: historico });
  } catch (err) {
    console.error('Erro no histórico:', err);
    res.status(500).json({ erro: 'Erro ao buscar histórico' });
  }
});

// GET /api/negociar/estatisticas — Estatísticas
router.get('/estatisticas', autenticar, isolarTenant, async (req, res) => {
  try {
    const stats = await Iara.estatisticas(req.tenantId);
    res.json(stats);
  } catch (err) {
    console.error('Erro nas estatísticas:', err);
    res.status(500).json({ erro: 'Erro ao buscar estatísticas' });
  }
});

module.exports = router;
