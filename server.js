// server.js
const express = require("express");
const app = express();
const PORT = process.env.PORT || 3000;

// =======================
// NEXUS – núcleo técnico
// =======================
let saldo = 0;

function registrarOperacao(precoBase, proposta, desconto) {
  if (desconto >= 7) {
    saldo += (precoBase - proposta);
    return { status: "confirmado", lucro: precoBase - proposta };
  } else {
    return { status: "cancelado", motivo: "Desconto insuficiente" };
  }
}

// =======================
// IARA – negociação
// =======================
function negociar(precoBase) {
  const proposta = precoBase - 5;
  const desconto = precoBase - proposta;
  return registrarOperacao(precoBase, proposta, desconto);
}

// =======================
// PERI – atendimento
// =======================
function confirmarPedido(cliente, produto, preco) {
  return `Pedido confirmado: ${cliente} comprou ${produto} por R$${preco}`;
}

// =======================
// ROTAS EXPRESS
// =======================

// Teste de negociação
app.get("/negociar/:precoBase", (req, res) => {
  const precoBase = parseInt(req.params.precoBase);
  res.json(negociar(precoBase));
});

// Confirmação de pedido
app.get("/pedido/:cliente/:produto/:preco", (req, res) => {
  const { cliente, produto, preco } = req.params;
  res.json({ mensagem: confirmarPedido(cliente, produto, preco) });
});

// Vitrine
app.get("/vitrine", (req, res) => {
  const produtos = [
    { nome: "Perfume Lis", preco: 95 },
    { nome: "Creme Hidratante", preco: 88 }
  ];
  res.json(produtos);
});

// Saldo Nexus
app.get("/saldo", (req, res) => {
  res.json({ saldo });
});

// Inicialização
app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
