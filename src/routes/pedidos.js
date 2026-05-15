// src/routes/pedidos.js
// Rotas de pedidos e checkout

const express = require('express');
const { query, transaction } = require('../config/database');
const { autenticar, isolarTenant } = require('../middleware/auth');
const MercadoPagoService = require('../services/mercadopago');
const Peri = require('../modules/peri');

const router = express.Router();

// POST /api/pedidos — Criar pedido (checkout)
router.post('/', autenticar, isolarTenant, async (req, res) => {
  try {
    const { cliente_id, itens, metodo_pagamento } = req.body;

    if (!cliente_id || !itens || !Array.isArray(itens) || itens.length === 0) {
      return res.status(400).json({ erro: 'cliente_id e itens são obrigatórios' });
    }

    const resultado = await transaction(async (client) => {
      // Buscar preços dos produtos
      let subtotal = 0;
      const itensValidados = [];

      for (const item of itens) {
        const prodRes = await client.query(
          `SELECT * FROM produtos WHERE id = $1 AND tenant_id = $2 AND ativo = true`,
          [item.produto_id, req.tenantId]
        );

        if (prodRes.rows.length === 0) {
          throw new Error(`Produto ${item.produto_id} não encontrado`);
        }

        const produto = prodRes.rows[0];
        if (produto.estoque < (item.quantidade || 1)) {
          throw new Error(`Estoque insuficiente para ${produto.nome}`);
        }

        const quantidade = item.quantidade || 1;
        const itemSubtotal = produto.preco * quantidade;
        subtotal += itemSubtotal;

        itensValidados.push({
          produto_id: produto.id,
          nome_produto: produto.nome,
          quantidade,
          preco_unitario: produto.preco,
          subtotal: itemSubtotal
        });

        // Atualizar estoque
        await client.query(
          `UPDATE produtos SET estoque = estoque - $1, atualizado_em = NOW() WHERE id = $2`,
          [quantidade, produto.id]
        );
      }

      // Criar pedido
      const pedidoRes = await client.query(
        `INSERT INTO pedidos (tenant_id, cliente_id, subtotal, total, metodo_pagamento)
         VALUES ($1, $2, $3, $4, $5) RETURNING *`,
        [req.tenantId, cliente_id, subtotal, subtotal, metodo_pagamento || 'pendente']
      );
      const pedido = pedidoRes.rows[0];

      // Inserir itens
      for (const item of itensValidados) {
        await client.query(
          `INSERT INTO pedido_itens (pedido_id, produto_id, nome_produto, quantidade, preco_unitario, subtotal)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [pedido.id, item.produto_id, item.nome_produto, item.quantidade, item.preco_unitario, item.subtotal]
        );
      }

      return { pedido, itens: itensValidados };
    });

    // Notificar cliente
    await Peri.notificarStatusPedido(req.tenantId, resultado.pedido.id);

    res.status(201).json({
      pedido: resultado.pedido,
      itens: resultado.itens,
      total: resultado.pedido.total
    });
  } catch (err) {
    console.error('Erro ao criar pedido:', err);
    res.status(400).json({ erro: err.message });
  }
});

// POST /api/pedidos/:id/checkout — Gerar checkout Mercado Pago
router.post('/:id/checkout', autenticar, isolarTenant, async (req, res) => {
  try {
    const resultado = await MercadoPagoService.criarCheckout(req.tenantId, req.params.id);
    res.json(resultado);
  } catch (err) {
    console.error('Erro no checkout:', err);
    res.status(500).json({ erro: 'Erro ao gerar checkout' });
  }
});

// POST /api/pedidos/:id/pix — Gerar Pix
router.post('/:id/pix', autenticar, isolarTenant, async (req, res) => {
  try {
    const resultado = await MercadoPagoService.gerarPix(req.tenantId, req.params.id);
    res.json(resultado);
  } catch (err) {
    console.error('Erro ao gerar Pix:', err);
    res.status(500).json({ erro: 'Erro ao gerar Pix' });
  }
});

// GET /api/pedidos — Listar pedidos do tenant
router.get('/', autenticar, isolarTenant, async (req, res) => {
  try {
    const { status, pagina = 1, limite = 20 } = req.query;
    const offset = (pagina - 1) * limite;

    let sql = `
      SELECT p.*, c.nome as cliente_nome, c.email as cliente_email
      FROM pedidos p
      LEFT JOIN clientes c ON p.cliente_id = c.id
      WHERE p.tenant_id = $1
    `;
    const params = [req.tenantId];

    if (status) {
      params.push(status);
      sql += ` AND p.status = $${params.length}`;
    }

    sql += ' ORDER BY p.criado_em DESC';
    params.push(limite, offset);
    sql += ` LIMIT $${params.length - 1} OFFSET $${params.length}`;

    const result = await query(sql, params);

    // Total de pedidos
    const countRes = await query(
      `SELECT COUNT(*) FROM pedidos WHERE tenant_id = $1`,
      [req.tenantId]
    );

    res.json({
      pedidos: result.rows,
      total: parseInt(countRes.rows[0].count),
      pagina: parseInt(pagina),
      limite: parseInt(limite)
    });
  } catch (err) {
    console.error('Erro ao listar pedidos:', err);
    res.status(500).json({ erro: 'Erro ao listar pedidos' });
  }
});

// GET /api/pedidos/:id — Detalhes do pedido
router.get('/:id', autenticar, isolarTenant, async (req, res) => {
  try {
    const pedidoRes = await query(
      `SELECT p.*, c.nome as cliente_nome, c.email as cliente_email, c.whatsapp as cliente_whatsapp
       FROM pedidos p
       LEFT JOIN clientes c ON p.cliente_id = c.id
       WHERE p.id = $1 AND p.tenant_id = $2`,
      [req.params.id, req.tenantId]
    );

    if (pedidoRes.rows.length === 0) {
      return res.status(404).json({ erro: 'Pedido não encontrado' });
    }

    const itensRes = await query(
      `SELECT * FROM pedido_itens WHERE pedido_id = $1`,
      [req.params.id]
    );

    res.json({
      pedido: pedidoRes.rows[0],
      itens: itensRes.rows
    });
  } catch (err) {
    console.error('Erro ao buscar pedido:', err);
    res.status(500).json({ erro: 'Erro ao buscar pedido' });
  }
});

// PATCH /api/pedidos/:id/status — Atualizar status
router.patch('/:id/status', autenticar, isolarTenant, async (req, res) => {
  try {
    const { status, rastreio } = req.body;
    const statusValidos = ['pendente', 'confirmado', 'pago', 'enviado', 'entregue', 'cancelado'];

    if (!statusValidos.includes(status)) {
      return res.status(400).json({ erro: `Status inválido. Use: ${statusValidos.join(', ')}` });
    }

    await query(
      `UPDATE pedidos SET status = $1, rastreio = COALESCE($2, rastreio), atualizado_em = NOW()
       WHERE id = $3 AND tenant_id = $4`,
      [status, rastreio, req.params.id, req.tenantId]
    );

    // Notificar cliente via WhatsApp
    await Peri.notificarStatusPedido(req.tenantId, req.params.id);

    res.json({ mensagem: `Status atualizado para ${status}`, rastreio });
  } catch (err) {
    console.error('Erro ao atualizar status:', err);
    res.status(500).json({ erro: 'Erro ao atualizar status' });
  }
});

module.exports = router;
