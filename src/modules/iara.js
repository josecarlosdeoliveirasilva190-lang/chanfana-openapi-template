// src/modules/iara.js
// IARA — Módulo de negociação com regras e IA local

const { query } = require('../config/database');

const Iara = {
  // Configurações padrão de negociação
  config: {
    desconto_minimo: 7,           // Desconto mínimo para aceitar (R$)
    margem_minima_pct: 15,        // Margem mínima percentual
    max_contra_propostas: 3,      // Máximo de contra-propostas
    desconto_automatico_pct: 5,   // Desconto automático percentual
  },

  // Negociar preço com fornecedor
  async negociar(tenantId, produtoId, precoBase, precoFornecedor) {
    // Calcular proposta automática
    const descontoAutomatico = precoBase * (this.config.desconto_automatico_pct / 100);
    const proposta = precoBase - descontoAutomatico;
    const desconto = precoBase - proposta;
    const margem = ((proposta - (precoFornecedor || proposta * 0.5)) / proposta) * 100;

    let status, motivo;

    if (desconto >= this.config.desconto_minimo && margem >= this.config.margem_minima_pct) {
      status = 'confirmado';
      motivo = `Desconto de R$${desconto.toFixed(2)} aceito. Margem: ${margem.toFixed(1)}%`;
    } else if (desconto < this.config.desconto_minimo) {
      status = 'cancelado';
      motivo = `Desconto de R$${desconto.toFixed(2)} abaixo do mínimo de R$${this.config.desconto_minimo}`;
    } else {
      status = 'cancelado';
      motivo = `Margem de ${margem.toFixed(1)}% abaixo do mínimo de ${this.config.margem_minima_pct}%`;
    }

    // Registrar negociação no banco
    const res = await query(
      `INSERT INTO negociacoes (tenant_id, produto_id, preco_base, proposta, desconto, status, motivo)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [tenantId, produtoId, precoBase, proposta, desconto, status, motivo]
    );

    return {
      ...res.rows[0],
      analise: {
        preco_base: precoBase,
        proposta: proposta,
        desconto: desconto,
        margem_percentual: Math.round(margem * 100) / 100,
        regras_aplicadas: {
          desconto_minimo: this.config.desconto_minimo,
          margem_minima: this.config.margem_minima_pct
        }
      }
    };
  },

  // Contra-proposta (IA local simples)
  async contraProposta(tenantId, produtoId, precoBase, precoDesejado) {
    const diferenca = precoBase - precoDesejado;
    const percentualDesconto = (diferenca / precoBase) * 100;

    let recomendacao;
    if (percentualDesconto <= 5) {
      recomendacao = { aceitar: true, proposta_final: precoDesejado, mensagem: 'Desconto aceitável, fechar negócio.' };
    } else if (percentualDesconto <= 10) {
      const meio = precoBase - (diferenca * 0.6);
      recomendacao = { aceitar: false, proposta_final: Math.round(meio * 100) / 100, mensagem: 'Contra-proposta: dividir a diferença.' };
    } else if (percentualDesconto <= 20) {
      const contra = precoBase - (diferenca * 0.3);
      recomendacao = { aceitar: false, proposta_final: Math.round(contra * 100) / 100, mensagem: 'Desconto alto. Oferecer contra-proposta conservadora.' };
    } else {
      recomendacao = { aceitar: false, proposta_final: precoBase, mensagem: 'Desconto excessivo. Manter preço original.' };
    }

    return {
      preco_base: precoBase,
      preco_desejado: precoDesejado,
      desconto_solicitado: `${percentualDesconto.toFixed(1)}%`,
      recomendacao
    };
  },

  // Histórico de negociações
  async historico(tenantId, limite = 20) {
    const res = await query(
      `SELECT n.*, p.nome as produto_nome
       FROM negociacoes n
       LEFT JOIN produtos p ON n.produto_id = p.id
       WHERE n.tenant_id = $1
       ORDER BY n.criado_em DESC
       LIMIT $2`,
      [tenantId, limite]
    );
    return res.rows;
  },

  // Estatísticas de negociação
  async estatisticas(tenantId) {
    const res = await query(
      `SELECT
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'confirmado' THEN 1 END) as confirmados,
        COUNT(CASE WHEN status = 'cancelado' THEN 1 END) as cancelados,
        COALESCE(AVG(desconto), 0) as desconto_medio,
        COALESCE(SUM(CASE WHEN status = 'confirmado' THEN desconto ELSE 0 END), 0) as economia_total
       FROM negociacoes WHERE tenant_id = $1`,
      [tenantId]
    );
    return res.rows[0];
  }
};

module.exports = Iara;
