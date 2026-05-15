// src/routes/clientes.js
// Rotas de clientes

const express = require('express');
const { query } = require('../config/database');
const { autenticar, isolarTenant } = require('../middleware/auth');
const Peri = require('../modules/peri');

const router = express.Router();

// GET /api/clientes — Listar clientes
router.get('/', autenticar, isolarTenant, async (req, res) => {
  try {
    const result = await query(
      `SELECT * FROM clientes WHERE tenant_id = $1 ORDER BY criado_em DESC`,
      [req.tenantId]
    );
    res.json({ clientes: result.rows, total: result.rows.length });
  } catch (err) {
    console.error('Erro ao listar clientes:', err);
    res.status(500).json({ erro: 'Erro ao listar clientes' });
  }
});

// POST /api/clientes — Criar cliente
router.post('/', autenticar, isolarTenant, async (req, res) => {
  try {
    const { nome, email, telefone, whatsapp, endereco } = req.body;

    if (!nome) {
      return res.status(400).json({ erro: 'Nome é obrigatório' });
    }

    const result = await query(
      `INSERT INTO clientes (tenant_id, nome, email, telefone, whatsapp, endereco)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [req.tenantId, nome, email, telefone, whatsapp, endereco ? JSON.stringify(endereco) : '{}']
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Erro ao criar cliente:', err);
    res.status(500).json({ erro: 'Erro ao criar cliente' });
  }
});

// GET /api/clientes/:id — Detalhes do cliente
router.get('/:id', autenticar, isolarTenant, async (req, res) => {
  try {
    const clienteRes = await query(
      `SELECT * FROM clientes WHERE id = $1 AND tenant_id = $2`,
      [req.params.id, req.tenantId]
    );

    if (clienteRes.rows.length === 0) {
      return res.status(404).json({ erro: 'Cliente não encontrado' });
    }

    // Histórico de pedidos
    const pedidosRes = await query(
      `SELECT * FROM pedidos WHERE cliente_id = $1 AND tenant_id = $2 ORDER BY criado_em DESC LIMIT 10`,
      [req.params.id, req.tenantId]
    );

    res.json({
      cliente: clienteRes.rows[0],
      pedidos: pedidosRes.rows
    });
  } catch (err) {
    console.error('Erro ao buscar cliente:', err);
    res.status(500).json({ erro: 'Erro ao buscar cliente' });
  }
});

// POST /api/clientes/:id/mensagem — Enviar mensagem WhatsApp
router.post('/:id/mensagem', autenticar, isolarTenant, async (req, res) => {
  try {
    const { mensagem } = req.body;

    if (!mensagem) {
      return res.status(400).json({ erro: 'Mensagem é obrigatória' });
    }

    const clienteRes = await query(
      `SELECT * FROM clientes WHERE id = $1 AND tenant_id = $2`,
      [req.params.id, req.tenantId]
    );

    if (clienteRes.rows.length === 0) {
      return res.status(404).json({ erro: 'Cliente não encontrado' });
    }

    const cliente = clienteRes.rows[0];
    let resultado;

    if (cliente.whatsapp) {
      resultado = await Peri.enviarWhatsApp(cliente.whatsapp, mensagem);
    } else {
      resultado = { status: 'sem_whatsapp', motivo: 'Cliente não tem WhatsApp cadastrado' };
    }

    await Peri.registrarMensagem(req.tenantId, req.params.id, null, mensagem, resultado.status, null);

    res.json(resultado);
  } catch (err) {
    console.error('Erro ao enviar mensagem:', err);
    res.status(500).json({ erro: 'Erro ao enviar mensagem' });
  }
});

// GET /api/clientes/:id/mensagens — Histórico de mensagens
router.get('/:id/mensagens', autenticar, isolarTenant, async (req, res) => {
  try {
    const mensagens = await Peri.historicoCliente(req.tenantId, req.params.id);
    res.json({ mensagens });
  } catch (err) {
    console.error('Erro ao buscar mensagens:', err);
    res.status(500).json({ erro: 'Erro ao buscar mensagens' });
  }
});

module.exports = router;
