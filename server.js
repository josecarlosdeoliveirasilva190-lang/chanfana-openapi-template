// server.js
// API Express standalone – versão simplificada do SaaS
// Para a versão completa com banco de dados, use: npm run dev (Next.js)
const express = require("express");
const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json());

// =======================
// NEXUS – núcleo técnico
// =======================
let saldo = 0;
const operacoes = [];

function registrarOperacao(precoBase, proposta, desconto) {
  if (desconto >= 7) {
    const lucro = precoBase - proposta;
    saldo += lucro;
    const op = { status: "confirmado", lucro, precoBase, proposta, desconto, timestamp: new Date().toISOString() };
    operacoes.push(op);
    return op;
  } else {
    const op = { status: "cancelado", motivo: "Desconto insuficiente (< R$7)", precoBase, proposta, desconto };
    operacoes.push(op);
    return op;
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
const mensagens = [];

function confirmarPedido(cliente, produto, preco) {
  const msg = {
    cliente,
    mensagem: `Pedido confirmado: ${cliente} comprou ${produto} por R$${preco}`,
    timestamp: new Date().toISOString()
  };
  mensagens.push(msg);
  return msg;
}

// =======================
// ROTAS EXPRESS
// =======================

// Teste de negociação (Iara)
app.get("/negociar/:precoBase", (req, res) => {
  const precoBase = parseInt(req.params.precoBase);
  if (isNaN(precoBase) || precoBase <= 0) {
    return res.status(400).json({ error: "Preço base inválido" });
  }
  res.json(negociar(precoBase));
});

// Negociação com proposta customizada (Iara)
app.post("/negociar", (req, res) => {
  const { precoBase, proposta } = req.body;
  if (!precoBase || !proposta) {
    return res.status(400).json({ error: "precoBase e proposta são obrigatórios" });
  }
  const desconto = precoBase - proposta;
  res.json(registrarOperacao(precoBase, proposta, desconto));
});

// Confirmação de pedido (Peri)
app.get("/pedido/:cliente/:produto/:preco", (req, res) => {
  const { cliente, produto, preco } = req.params;
  res.json(confirmarPedido(cliente, produto, preco));
});

// Vitrine (Lovable)
app.get("/vitrine", (req, res) => {
  const produtos = [
    { nome: "Perfume Lis", preco: 95 },
    { nome: "Creme Hidratante", preco: 88 }
  ];
  res.json(produtos);
});

// Saldo Nexus
app.get("/saldo", (req, res) => {
  res.json({ saldo, totalOperacoes: operacoes.length });
});

// Histórico de operações (Nexus)
app.get("/operacoes", (req, res) => {
  res.json({ operacoes, total: operacoes.length });
});

// Mensagens (Peri)
app.get("/mensagens", (req, res) => {
  res.json({ mensagens, total: mensagens.length });
});

// Health check
app.get("/", (req, res) => {
  res.json({
    nome: "Marketplace SaaS API",
    modulos: ["Nexus", "Iara", "Peri", "Lovable"],
    rotas: [
      "GET /negociar/:precoBase",
      "POST /negociar { precoBase, proposta }",
      "GET /pedido/:cliente/:produto/:preco",
      "GET /vitrine",
      "GET /saldo",
      "GET /operacoes",
      "GET /mensagens"
    ]
  });
});

// Inicialização
app.listen(PORT, () => {
  console.log(`Servidor SaaS rodando em http://localhost:${PORT}`);
  console.log(`Módulos: Nexus | Iara | Peri | Lovable`);
});
