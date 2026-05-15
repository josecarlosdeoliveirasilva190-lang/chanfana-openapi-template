"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface Order {
  id: string;
  status: string;
  totalAmount: number;
  platformFee: number;
  sellerAmount: number;
  createdAt: string;
  items: { product: { name: string }; quantity: number; unitPrice: number }[];
}

export default function SellerDashboard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/orders")
      .then((r) => r.json())
      .then((data) => setOrders(data.orders || []))
      .finally(() => setLoading(false));
  }, []);

  const totalRevenue = orders
    .filter((o) => o.status === "CONFIRMED" || o.status === "DELIVERED")
    .reduce((s, o) => s + o.sellerAmount, 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Painel do Vendedor
          </h1>
          <p className="text-gray-600 mt-1">Gerencie seus produtos e pedidos</p>
        </div>
        <Link
          href="/dashboard/seller/products"
          className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 font-medium"
        >
          Gerenciar Produtos
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <p className="text-sm text-gray-500">Total de Pedidos</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">
            {orders.length}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <p className="text-sm text-gray-500">Receita Líquida</p>
          <p className="text-3xl font-bold text-green-600 mt-1">
            R$ {totalRevenue.toFixed(2)}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <p className="text-sm text-gray-500">Pedidos Confirmados</p>
          <p className="text-3xl font-bold text-indigo-600 mt-1">
            {orders.filter((o) => o.status === "CONFIRMED").length}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Pedidos Recentes
          </h2>
        </div>

        {loading ? (
          <div className="p-6 animate-pulse space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 bg-gray-100 rounded" />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            Nenhum pedido ainda
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {orders.slice(0, 10).map((order) => (
              <div
                key={order.id}
                className="px-6 py-4 flex items-center justify-between"
              >
                <div>
                  <p className="font-medium text-gray-900">
                    Pedido #{order.id.slice(0, 8)}
                  </p>
                  <p className="text-sm text-gray-500">
                    {order.items
                      .map((i) => `${i.product.name} x${i.quantity}`)
                      .join(", ")}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-900">
                    R$ {order.totalAmount.toFixed(2)}
                  </p>
                  <span
                    className={`text-xs font-medium px-2 py-1 rounded-full ${
                      order.status === "CONFIRMED"
                        ? "bg-green-100 text-green-700"
                        : order.status === "CANCELLED"
                          ? "bg-red-100 text-red-700"
                          : order.status === "DELIVERED"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-yellow-100 text-yellow-700"
                    }`}
                  >
                    {order.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
