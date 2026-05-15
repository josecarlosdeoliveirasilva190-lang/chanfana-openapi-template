// App.js
import React, { useState, useEffect } from "react";

function App() {
  const [vitrine, setVitrine] = useState([]);
  const [negociacao, setNegociacao] = useState(null);
  const [pedido, setPedido] = useState(null);
  const [saldo, setSaldo] = useState(null);

  useEffect(() => {
    // Vitrine
    fetch("/vitrine")
      .then(res => res.json())
      .then(data => setVitrine(data));

    // Negociação
    fetch("/negociar/100")
      .then(res => res.json())
      .then(data => setNegociacao(data));

    // Pedido
    fetch("/pedido/Joao/PerfumeLis/95")
      .then(res => res.json())
      .then(data => setPedido(data));

    // Saldo
    fetch("/saldo")
      .then(res => res.json())
      .then(data => setSaldo(data));
  }, []);

  return (
    <div style={{ padding: "20px", fontFamily: "Arial" }}>
      <h1>Iara Dropship SaaS</h1>

      <h2>🛍️ Vitrine</h2>
      <ul>
        {vitrine.map((p, i) => (
          <li key={i}>{p.nome} - R${p.preco}</li>
        ))}
      </ul>

      <h2>🤝 Negociação</h2>
      {negociacao && <pre>{JSON.stringify(negociacao, null, 2)}</pre>}

      <h2>📦 Pedido</h2>
      {pedido && <p>{pedido.mensagem}</p>}

      <h2>💰 Saldo Nexus</h2>
      {saldo && <p>Saldo atual: R${saldo.saldo}</p>}
    </div>
  );
}

export default App;
