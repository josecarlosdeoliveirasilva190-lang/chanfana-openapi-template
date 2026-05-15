// src/routes/financeiro.js
// Rotas do módulo Nexus (financeiro)

const express = require('express');
const { autenticar, isolarTenant } = require('../middleware/auth');
const Nexus = require('../modules/nexus');

const router = express.Router();

// GET /api/financeiro/saldo
router.get('/saldo', autenticar, isolarTenant, async (req, res) => {
  try {
    const saldo = await Nexus.obterSaldo(req.tenantId);
    res.json(saldo);
  } catch (err) {
    console.error('Erro ao buscar saldo:', err);
    res.status(500).json({ erro: 'Erro ao buscar saldo' });
  }
});

// GET /api/financeiro/relatorio
router.get('/relatorio', autenticar, isolarTenant, async (req, res) => {
  try {
    const { inicio, fim } = req.query;
    const dataInicio = inicio || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const dataFim = fim || new Date().toISOString();

    const relatorio = await Nexus.relatorioFinanceiro(req.tenantId, dataInicio, dataFim);
    res.json({ periodo: { inicio: dataInicio, fim: dataFim }, dados: relatorio });
  } catch (err) {
    console.error('Erro no relatório:', err);
    res.status(500).json({ erro: 'Erro ao gerar relatório' });
  }
});

// GET /api/financeiro/produtos — Relatório por produto
router.get('/produtos', autenticar, isolarTenant, async (req, res) => {
  try {
    const relatorio = await Nexus.relatorioPorProduto(req.tenantId);
    res.json({ produtos: relatorio });
  } catch (err) {
    console.error('Erro no relatório por produto:', err);
    res.status(500).json({ erro: 'Erro ao gerar relatório' });
  }
});

// GET /api/financeiro/clientes — Relatório por cliente
router.get('/clientes', autenticar, isolarTenant, async (req, res) => {
  try {
    const relatorio = await Nexus.relatorioPorCliente(req.tenantId);
    res.json({ clientes: relatorio });
  } catch (err) {
    console.error('Erro no relatório por cliente:', err);
    res.status(500).json({ erro: 'Erro ao gerar relatório' });
  }
});

// GET /api/financeiro/margem/:precoVenda/:precoFornecedor — Verificar margem
router.get('/margem/:precoVenda/:precoFornecedor', (req, res) => {
  const precoVenda = parseFloat(req.params.precoVenda);
  const precoFornecedor = parseFloat(req.params.precoFornecedor);
  const resultado = Nexus.verificarMargem(precoVenda, precoFornecedor);
  res.json(resultado);
});

// GET /api/financeiro/exportar — Exportar dados para BI
router.get('/exportar', autenticar, isolarTenant, async (req, res) => {
  try {
    const dados = await Nexus.exportarDadosBI(req.tenantId);
    res.json(dados);
  } catch (err) {
    console.error('Erro na exportação:', err);
    res.status(500).json({ erro: 'Erro ao exportar dados' });
  }
});

module.exports = router;
