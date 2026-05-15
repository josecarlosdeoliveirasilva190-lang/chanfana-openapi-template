// src/routes/webhooks.js
// Rotas de webhooks (Mercado Pago e WhatsApp)

const express = require('express');
const MercadoPagoService = require('../services/mercadopago');
const Peri = require('../modules/peri');

const router = express.Router();

// POST /api/webhooks/mercadopago — Webhook do Mercado Pago
router.post('/mercadopago', async (req, res) => {
  try {
    const { pedido_id, tenant_id } = req.query;

    if (!pedido_id || !tenant_id) {
      return res.status(400).json({ erro: 'pedido_id e tenant_id são obrigatórios' });
    }

    console.log(`[WEBHOOK] Mercado Pago - Pedido: ${pedido_id}, Tipo: ${req.body.type}`);

    const resultado = await MercadoPagoService.processarWebhook(tenant_id, pedido_id, req.body);

    res.status(200).json(resultado);
  } catch (err) {
    console.error('[WEBHOOK] Erro Mercado Pago:', err);
    res.status(500).json({ erro: 'Erro ao processar webhook' });
  }
});

// GET /api/webhooks/whatsapp — Verificação do webhook WhatsApp
router.get('/whatsapp', (req, res) => {
  const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || 'iara-dropship-verify';

  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log('[WEBHOOK] WhatsApp verificado');
    return res.status(200).send(challenge);
  }

  res.sendStatus(403);
});

// POST /api/webhooks/whatsapp — Receber mensagens WhatsApp
router.post('/whatsapp', async (req, res) => {
  try {
    console.log('[WEBHOOK] WhatsApp - Mensagem recebida');
    await Peri.processarWebhookWhatsApp(req.body);
    res.sendStatus(200);
  } catch (err) {
    console.error('[WEBHOOK] Erro WhatsApp:', err);
    res.sendStatus(500);
  }
});

// POST /api/webhooks/fornecedor — Webhook do fornecedor (atualização de entrega)
router.post('/fornecedor', async (req, res) => {
  try {
    const { pedido_id, tenant_id, status, rastreio } = req.body;

    if (!pedido_id || !tenant_id) {
      return res.status(400).json({ erro: 'pedido_id e tenant_id são obrigatórios' });
    }

    const { query: dbQuery } = require('../config/database');

    // Atualizar status do pedido
    await dbQuery(
      `UPDATE pedidos SET
        fornecedor_status = $1,
        status = CASE WHEN $1 = 'entregue' THEN 'entregue' WHEN $1 = 'enviado' THEN 'enviado' ELSE status END,
        rastreio = COALESCE($2, rastreio),
        atualizado_em = NOW()
       WHERE id = $3 AND tenant_id = $4`,
      [status, rastreio, pedido_id, tenant_id]
    );

    // Notificar cliente
    await Peri.notificarStatusPedido(tenant_id, pedido_id);

    console.log(`[WEBHOOK] Fornecedor - Pedido ${pedido_id}: ${status}`);
    res.json({ status: 'atualizado' });
  } catch (err) {
    console.error('[WEBHOOK] Erro fornecedor:', err);
    res.status(500).json({ erro: 'Erro ao processar webhook' });
  }
});

module.exports = router;
