"use client";

import { useState, useEffect } from "react";

interface Balance {
  currentBalance: number;
  totalRevenue: number;
  totalFees: number;
}

interface Report {
  totalOrders: number;
  totalRevenue: number;
  totalFees: number;
  netRevenue: number;
  byCity: Record<string, { orders: number; revenue: number }>;
  byProduct: { name: string; quantity: number; revenue: number }[];
}

export default function NexusDashboard() {
  const [balance, setBalance] = useState<Balance | null>(null);
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<
    { id: string; content: string; type: string; isRead: boolean; createdAt: string }[]
  >([]);

  useEffect(() => {
    Promise.all([
      fetch("/api/nexus/balance").then((r) => r.json()),
      fetch("/api/nexus/reports").then((r) => r.json()),
      fetch("/api/peri/messages").then((r) => r.json()),
    ])
      .then(([balData, repData, msgData]) => {
        setBalance(balData.balance);
        setReport(repData.report);
        setMessages(msgData.messages || []);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 animate-pulse">
        <div className="h-10 bg-gray-200 rounded w-1/3 mb-8" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-gray-200 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Nexus - Painel Financeiro
        </h1>
        <p className="text-gray-600 mt-1">
          Controle de saldo, margens e relatórios do seu comércio
        </p>
      </div>

      {balance && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <p className="text-sm text-gray-500">Saldo Atual</p>
            <p className="text-3xl font-bold text-green-600 mt-1">
              R$ {balance.currentBalance.toFixed(2)}
            </p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <p className="text-sm text-gray-500">Receita Total</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">
              R$ {balance.totalRevenue.toFixed(2)}
            </p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <p className="text-sm text-gray-500">Taxas Pagas</p>
            <p className="text-3xl font-bold text-red-500 mt-1">
              R$ {balance.totalFees.toFixed(2)}
            </p>
          </div>
        </div>
      )}

      {report && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="bg-white rounded-xl border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                Vendas por Cidade
              </h2>
            </div>
            <div className="p-6">
              {Object.keys(report.byCity).length === 0 ? (
                <p className="text-gray-500 text-sm">Sem dados ainda</p>
              ) : (
                <div className="space-y-3">
                  {Object.entries(report.byCity).map(([city, data]) => (
                    <div key={city} className="flex justify-between items-center">
                      <div>
                        <p className="font-medium text-gray-900">{city}</p>
                        <p className="text-xs text-gray-500">
                          {data.orders} pedidos
                        </p>
                      </div>
                      <p className="font-bold text-gray-900">
                        R$ {data.revenue.toFixed(2)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                Top Produtos
              </h2>
            </div>
            <div className="p-6">
              {report.byProduct.length === 0 ? (
                <p className="text-gray-500 text-sm">Sem dados ainda</p>
              ) : (
                <div className="space-y-3">
                  {report.byProduct.slice(0, 10).map((p, i) => (
                    <div key={i} className="flex justify-between items-center">
                      <div>
                        <p className="font-medium text-gray-900">{p.name}</p>
                        <p className="text-xs text-gray-500">
                          {p.quantity} vendidos
                        </p>
                      </div>
                      <p className="font-bold text-gray-900">
                        R$ {p.revenue.toFixed(2)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 mb-8">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Resumo Financeiro
          </h2>
        </div>
        <div className="p-6">
          {report ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">
                  {report.totalOrders}
                </p>
                <p className="text-xs text-gray-500">Pedidos</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">
                  R$ {report.netRevenue.toFixed(2)}
                </p>
                <p className="text-xs text-gray-500">Receita Líquida</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">
                  R$ {report.totalRevenue.toFixed(2)}
                </p>
                <p className="text-xs text-gray-500">Receita Bruta</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-red-500">
                  R$ {report.totalFees.toFixed(2)}
                </p>
                <p className="text-xs text-gray-500">Taxas</p>
              </div>
            </div>
          ) : (
            <p className="text-gray-500">Sem dados financeiros disponíveis</p>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between">
          <h2 className="text-lg font-semibold text-gray-900">
            Peri - Mensagens
          </h2>
          <span className="text-sm text-gray-500">
            {messages.filter((m) => !m.isRead).length} não lidas
          </span>
        </div>
        <div className="divide-y divide-gray-200 max-h-64 overflow-y-auto">
          {messages.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              Nenhuma mensagem
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`px-6 py-3 ${!msg.isRead ? "bg-indigo-50" : ""}`}
              >
                <p className="text-sm text-gray-900">{msg.content}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {new Date(msg.createdAt).toLocaleString("pt-BR")}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
