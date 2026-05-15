// src/services/mercadopago.js
// Integração com Mercado Pago — Pix, Boleto e Cartão

const { query } = require('../config/database');
const Nexus = require('../modules/nexus');
const Peri = require('../modules/peri');

const MercadoPagoService = {
  // Criar preferência de pagamento (checkout)
  async criarCheckout(tenantId, pedidoId) {
    const ACCESS_TOKEN = process.env.MERCADOPAGO_ACCESS_TOKEN;

    // Buscar pedido com itens
    const pedidoRes = await query(
      `SELECT p.*, c.nome as cliente_nome, c.email as cliente_email
       FROM pedidos p
       LEFT JOIN clientes c ON p.cliente_id = c.id
       WHERE p.id = $1 AND p.tenant_id = $2`,
      [pedidoId, tenantId]
    );

    if (pedidoRes.rows.length === 0) throw new Error('Pedido não encontrado');
    const pedido = pedidoRes.rows[0];

    const itensRes = await query(
      `SELECT * FROM pedido_itens WHERE pedido_id = $1`,
      [pedidoId]
    );

    const APP_URL = process.env.APP_URL || 'https://seu-dominio.com';
    const WEBHOOK_URL = process.env.WEBHOOK_URL || `${APP_URL}/api/webhooks/mercadopago`;

    // Preparar dados para o Mercado Pago
    const preferencia = {
      items: itensRes.rows.map(item => ({
        id: item.id,
        title: item.nome_produto,
        quantity: item.quantidade,
        unit_price: parseFloat(item.preco_unitario),
        currency_id: 'BRL'
      })),
      payer: {
        name: pedido.cliente_nome || 'Cliente',
        email: pedido.cliente_email || 'cliente@email.com'
      },
      back_urls: {
        success: `${APP_URL}/pagamento/sucesso?pedido=${pedidoId}`,
        failure: `${APP_URL}/pagamento/falha?pedido=${pedidoId}`,
        pending: `${APP_URL}/pagamento/pendente?pedido=${pedidoId}`
      },
      notification_url: `${WEBHOOK_URL}?pedido_id=${pedidoId}&tenant_id=${tenantId}`,
      external_reference: pedidoId,
      auto_return: 'approved',
      payment_methods: {
        excluded_payment_types: [],
        installments: 12
      }
    };

    if (!ACCESS_TOKEN) {
      console.log('[MERCADOPAGO] Token não configurado. Simulando checkout.');
      return {
        status: 'simulado',
        checkout_url: `${APP_URL}/checkout/simulado/${pedidoId}`,
        preferencia_id: `SIM_${pedidoId}`,
        dados: preferencia,
        instrucoes: 'Configure MERCADOPAGO_ACCESS_TOKEN no .env para checkout real'
      };
    }

    try {
      const response = await fetch('https://api.mercadopago.com/checkout/preferences', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${ACCESS_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(preferencia)
      });

      const data = await response.json();

      // Atualizar pedido com ID do pagamento
      await query(
        `UPDATE pedidos SET pagamento_id = $1, atualizado_em = NOW() WHERE id = $2`,
        [data.id, pedidoId]
      );

      return {
        status: 'criado',
        checkout_url: data.init_point,
        sandbox_url: data.sandbox_init_point,
        preferencia_id: data.id
      };
    } catch (err) {
      console.error('[MERCADOPAGO] Erro ao criar checkout:', err.message);
      throw err;
    }
  },

  // Processar webhook de pagamento
  async processarWebhook(tenantId, pedidoId, body) {
    const { type, data } = body;

    if (type !== 'payment') return { status: 'ignorado', tipo: type };

    const ACCESS_TOKEN = process.env.MERCADOPAGO_ACCESS_TOKEN;

    let paymentData;

    if (ACCESS_TOKEN) {
      // Buscar detalhes do pagamento no Mercado Pago
      try {
        const response = await fetch(`https://api.mercadopago.com/v1/payments/${data.id}`, {
          headers: { 'Authorization': `Bearer ${ACCESS_TOKEN}` }
        });
        paymentData = await response.json();
      } catch (err) {
        console.error('[MERCADOPAGO] Erro ao buscar pagamento:', err.message);
        paymentData = { status: 'unknown' };
      }
    } else {
      paymentData = { status: body.status || 'approved', id: data?.id || 'SIM' };
    }

    // Mapear status do Mercado Pago
    const statusMap = {
      'approved': 'pago',
      'pending': 'pendente',
      'in_process': 'pendente',
      'rejected': 'rejeitado',
      'cancelled': 'cancelado',
      'refunded': 'reembolsado'
    };

    const novoStatus = statusMap[paymentData.status] || 'pendente';

    // Atualizar pedido
    await query(
      `UPDATE pedidos SET
        pagamento_status = $1,
        status = CASE WHEN $1 = 'pago' THEN 'confirmado' ELSE status END,
        metodo_pagamento = $2,
        atualizado_em = NOW()
       WHERE id = $3`,
      [novoStatus, paymentData.payment_method_id || 'desconhecido', pedidoId]
    );

    // Se pagamento aprovado, registrar no Nexus e notificar via Peri
    if (novoStatus === 'pago') {
      const pedido = await query(`SELECT * FROM pedidos WHERE id = $1`, [pedidoId]);
      if (pedido.rows.length > 0) {
        await Nexus.registrarTransacao(
          tenantId, pedidoId, 'entrada',
          parseFloat(pedido.rows[0].total),
          `Pagamento aprovado - Pedido #${pedido.rows[0].numero_pedido}`,
          String(paymentData.id)
        );

        // Notificar cliente via WhatsApp
        await Peri.notificarStatusPedido(tenantId, pedidoId);

        // Enviar para fornecedor (simulado)
        await this.enviarParaFornecedor(tenantId, pedidoId);
      }
    }

    return { status: 'processado', pagamento_status: novoStatus };
  },

  // Enviar pedido ao fornecedor após pagamento
  async enviarParaFornecedor(tenantId, pedidoId) {
    // Buscar itens do pedido com dados do fornecedor
    const itens = await query(
      `SELECT pi.*, pr.fornecedor_id, f.nome as fornecedor_nome, f.api_url
       FROM pedido_itens pi
       JOIN produtos pr ON pi.produto_id = pr.id
       LEFT JOIN fornecedores f ON pr.fornecedor_id = f.id
       WHERE pi.pedido_id = $1`,
      [pedidoId]
    );

    // Atualizar status do fornecedor
    await query(
      `UPDATE pedidos SET fornecedor_status = 'enviado', atualizado_em = NOW() WHERE id = $1`,
      [pedidoId]
    );

    console.log(`[FORNECEDOR] Pedido ${pedidoId} enviado ao fornecedor com ${itens.rows.length} itens`);

    return {
      status: 'enviado_ao_fornecedor',
      itens: itens.rows.length,
      fornecedores: [...new Set(itens.rows.map(i => i.fornecedor_nome).filter(Boolean))]
    };
  },

  // Gerar Pix (direto, sem checkout)
  async gerarPix(tenantId, pedidoId) {
    const ACCESS_TOKEN = process.env.MERCADOPAGO_ACCESS_TOKEN;
    const pedidoRes = await query(`SELECT * FROM pedidos WHERE id = $1 AND tenant_id = $2`, [pedidoId, tenantId]);

    if (pedidoRes.rows.length === 0) throw new Error('Pedido não encontrado');
    const pedido = pedidoRes.rows[0];

    if (!ACCESS_TOKEN) {
      return {
        status: 'simulado',
        qr_code: 'PIX_SIMULADO_00020126580014br.gov.bcb.pix',
        valor: pedido.total,
        instrucoes: 'Configure MERCADOPAGO_ACCESS_TOKEN para Pix real'
      };
    }

    try {
      const response = await fetch('https://api.mercadopago.com/v1/payments', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
          'X-Idempotency-Key': pedidoId
        },
        body: JSON.stringify({
          transaction_amount: parseFloat(pedido.total),
          payment_method_id: 'pix',
          payer: { email: 'cliente@email.com' },
          description: `Pedido #${pedido.numero_pedido}`
        })
      });

      const data = await response.json();
      return {
        status: 'criado',
        qr_code: data.point_of_interaction?.transaction_data?.qr_code,
        qr_code_base64: data.point_of_interaction?.transaction_data?.qr_code_base64,
        valor: pedido.total,
        expiracao: data.date_of_expiration
      };
    } catch (err) {
      console.error('[MERCADOPAGO] Erro ao gerar Pix:', err.message);
      throw err;
    }
  }
};

module.exports = MercadoPagoService;
