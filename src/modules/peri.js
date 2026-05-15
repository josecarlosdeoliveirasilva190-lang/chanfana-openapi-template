// src/modules/peri.js
// PERI — Atendimento ao cliente via WhatsApp Business API

const { query } = require('../config/database');

const Peri = {
  // Enviar mensagem via WhatsApp Business API
  async enviarWhatsApp(telefone, mensagem) {
    const WHATSAPP_API_URL = process.env.WHATSAPP_API_URL;
    const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
    const WHATSAPP_PHONE_ID = process.env.WHATSAPP_PHONE_ID;

    if (!WHATSAPP_TOKEN || !WHATSAPP_PHONE_ID) {
      console.log(`[PERI] WhatsApp não configurado. Mensagem para ${telefone}: ${mensagem}`);
      return { status: 'simulado', mensagem: 'WhatsApp API não configurada. Mensagem registrada localmente.' };
    }

    try {
      const response = await fetch(`${WHATSAPP_API_URL}/${WHATSAPP_PHONE_ID}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${WHATSAPP_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: telefone,
          type: 'text',
          text: { body: mensagem }
        })
      });

      const data = await response.json();
      return { status: 'enviado', whatsapp_response: data };
    } catch (err) {
      console.error('[PERI] Erro ao enviar WhatsApp:', err.message);
      return { status: 'erro', erro: err.message };
    }
  },

  // Registrar mensagem no banco
  async registrarMensagem(tenantId, clienteId, pedidoId, conteudo, statusEnvio, whatsappMessageId) {
    const res = await query(
      `INSERT INTO mensagens (tenant_id, cliente_id, pedido_id, conteudo, status_envio, whatsapp_message_id)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [tenantId, clienteId, pedidoId, conteudo, statusEnvio, whatsappMessageId]
    );
    return res.rows[0];
  },

  // Notificar cliente sobre status do pedido
  async notificarStatusPedido(tenantId, pedidoId) {
    // Buscar dados do pedido e cliente
    const pedidoRes = await query(
      `SELECT p.*, c.nome as cliente_nome, c.whatsapp
       FROM pedidos p
       LEFT JOIN clientes c ON p.cliente_id = c.id
       WHERE p.id = $1 AND p.tenant_id = $2`,
      [pedidoId, tenantId]
    );

    if (pedidoRes.rows.length === 0) return { status: 'erro', motivo: 'Pedido não encontrado' };

    const pedido = pedidoRes.rows[0];
    const mensagens = {
      'pendente': `Olá ${pedido.cliente_nome}! Seu pedido #${pedido.numero_pedido} foi recebido e está sendo processado. Total: R$${pedido.total}`,
      'pago': `${pedido.cliente_nome}, pagamento do pedido #${pedido.numero_pedido} confirmado! Estamos preparando seu envio.`,
      'enviado': `Boa notícia, ${pedido.cliente_nome}! Seu pedido #${pedido.numero_pedido} foi enviado. Rastreio: ${pedido.rastreio || 'em breve'}`,
      'entregue': `${pedido.cliente_nome}, seu pedido #${pedido.numero_pedido} foi entregue! Obrigado pela compra. Avalie sua experiência!`,
      'cancelado': `${pedido.cliente_nome}, infelizmente seu pedido #${pedido.numero_pedido} foi cancelado. Entre em contato para mais informações.`
    };

    const conteudo = mensagens[pedido.status] || `Atualização do pedido #${pedido.numero_pedido}: ${pedido.status}`;

    // Enviar WhatsApp
    let statusEnvio = 'registrado';
    let whatsappMsgId = null;

    if (pedido.whatsapp) {
      const resultado = await this.enviarWhatsApp(pedido.whatsapp, conteudo);
      statusEnvio = resultado.status;
      whatsappMsgId = resultado.whatsapp_response?.messages?.[0]?.id;
    }

    // Registrar no banco
    await this.registrarMensagem(tenantId, pedido.cliente_id, pedidoId, conteudo, statusEnvio, whatsappMsgId);

    return { status: statusEnvio, mensagem: conteudo };
  },

  // Enviar promoção para cliente
  async enviarPromocao(tenantId, clienteId, produto, precoPromocional) {
    const clienteRes = await query(
      `SELECT * FROM clientes WHERE id = $1 AND tenant_id = $2`,
      [clienteId, tenantId]
    );

    if (clienteRes.rows.length === 0) return { status: 'erro', motivo: 'Cliente não encontrado' };

    const cliente = clienteRes.rows[0];
    const mensagem = `🛍️ Promoção exclusiva para você, ${cliente.nome}!\n\n${produto.nome} por apenas R$${precoPromocional}!\nPreço original: R$${produto.preco}\n\nResponda SIM para garantir o seu!`;

    let resultado;
    if (cliente.whatsapp) {
      resultado = await this.enviarWhatsApp(cliente.whatsapp, mensagem);
    } else {
      resultado = { status: 'sem_whatsapp' };
    }

    await this.registrarMensagem(tenantId, clienteId, null, mensagem, resultado.status, null);

    return { status: resultado.status, mensagem };
  },

  // Histórico de mensagens de um cliente
  async historicoCliente(tenantId, clienteId) {
    const res = await query(
      `SELECT * FROM mensagens
       WHERE tenant_id = $1 AND cliente_id = $2
       ORDER BY criado_em DESC LIMIT 50`,
      [tenantId, clienteId]
    );
    return res.rows;
  },

  // Webhook WhatsApp — receber mensagens
  async processarWebhookWhatsApp(body) {
    // Verificação do webhook do WhatsApp
    if (body.object === 'whatsapp_business_account') {
      const entries = body.entry || [];
      for (const entry of entries) {
        const changes = entry.changes || [];
        for (const change of changes) {
          if (change.value?.messages) {
            for (const msg of change.value.messages) {
              console.log(`[PERI] Mensagem recebida de ${msg.from}: ${msg.text?.body || msg.type}`);
              // Aqui pode processar respostas automáticas
            }
          }
        }
      }
    }
    return { status: 'processado' };
  }
};

module.exports = Peri;
