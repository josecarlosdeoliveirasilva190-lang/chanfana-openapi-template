// src/modules/nexus.js
// NEXUS — Núcleo financeiro e controle

const { query, transaction } = require('../config/database');
const { cacheGet, cacheSet, cacheDel } = require('../config/redis');

const Nexus = {
  // Registrar transação financeira
  async registrarTransacao(tenantId, pedidoId, tipo, valor, descricao, refExterna) {
    const res = await query(
      `INSERT INTO transacoes (tenant_id, pedido_id, tipo, valor, descricao, referencia_externa)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [tenantId, pedidoId, tipo, valor, descricao, refExterna]
    );
    await cacheDel(`saldo:${tenantId}`);
    return res.rows[0];
  },

  // Obter saldo do tenant
  async obterSaldo(tenantId) {
    const cached = await cacheGet(`saldo:${tenantId}`);
    if (cached) return cached;

    const res = await query(
      `SELECT
        COALESCE(SUM(CASE WHEN tipo = 'entrada' THEN valor ELSE 0 END), 0) as entradas,
        COALESCE(SUM(CASE WHEN tipo = 'saida' THEN valor ELSE 0 END), 0) as saidas,
        COALESCE(SUM(CASE WHEN tipo = 'entrada' THEN valor ELSE -valor END), 0) as saldo
       FROM transacoes WHERE tenant_id = $1`,
      [tenantId]
    );

    const saldo = res.rows[0];
    await cacheSet(`saldo:${tenantId}`, saldo, 60);
    return saldo;
  },

  // Relatório financeiro por período
  async relatorioFinanceiro(tenantId, dataInicio, dataFim) {
    const res = await query(
      `SELECT
        DATE(criado_em) as data,
        tipo,
        COUNT(*) as quantidade,
        SUM(valor) as total
       FROM transacoes
       WHERE tenant_id = $1 AND criado_em >= $2 AND criado_em <= $3
       GROUP BY DATE(criado_em), tipo
       ORDER BY data DESC`,
      [tenantId, dataInicio, dataFim]
    );
    return res.rows;
  },

  // Relatório de vendas por produto
  async relatorioPorProduto(tenantId) {
    const res = await query(
      `SELECT
        pi.nome_produto,
        COUNT(DISTINCT pi.pedido_id) as total_pedidos,
        SUM(pi.quantidade) as total_vendidos,
        SUM(pi.subtotal) as receita_total
       FROM pedido_itens pi
       JOIN pedidos p ON pi.pedido_id = p.id
       WHERE p.tenant_id = $1 AND p.pagamento_status = 'aprovado'
       GROUP BY pi.nome_produto
       ORDER BY receita_total DESC`,
      [tenantId]
    );
    return res.rows;
  },

  // Relatório de vendas por cliente
  async relatorioPorCliente(tenantId) {
    const res = await query(
      `SELECT
        c.nome,
        c.email,
        COUNT(p.id) as total_pedidos,
        SUM(p.total) as total_gasto
       FROM clientes c
       LEFT JOIN pedidos p ON c.id = p.cliente_id AND p.pagamento_status = 'aprovado'
       WHERE c.tenant_id = $1
       GROUP BY c.id, c.nome, c.email
       ORDER BY total_gasto DESC`,
      [tenantId]
    );
    return res.rows;
  },

  // Exportar dados para BI (Looker Studio)
  async exportarDadosBI(tenantId) {
    const [vendas, produtos, clientes, saldo] = await Promise.all([
      query(`SELECT p.*, c.nome as cliente_nome FROM pedidos p LEFT JOIN clientes c ON p.cliente_id = c.id WHERE p.tenant_id = $1 ORDER BY p.criado_em DESC`, [tenantId]),
      this.relatorioPorProduto(tenantId),
      this.relatorioPorCliente(tenantId),
      this.obterSaldo(tenantId)
    ]);

    return {
      exportado_em: new Date().toISOString(),
      tenant_id: tenantId,
      resumo: saldo,
      vendas: vendas.rows,
      produtos_ranking: produtos,
      clientes_ranking: clientes
    };
  },

  // Verificar margem mínima
  verificarMargem(precoVenda, precoFornecedor, margemMinima = 15) {
    const margem = ((precoVenda - precoFornecedor) / precoVenda) * 100;
    return {
      margem_percentual: Math.round(margem * 100) / 100,
      atende_minimo: margem >= margemMinima,
      lucro_estimado: precoVenda - precoFornecedor
    };
  }
};

module.exports = Nexus;
