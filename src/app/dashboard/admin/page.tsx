"use client";

import { useState, useEffect } from "react";

interface Stats {
  totalUsers: number;
  totalProducts: number;
  totalOrders: number;
  totalTenants: number;
  totalRevenue: number;
  totalPlatformFees: number;
  recentOrders: {
    id: string;
    status: string;
    totalAmount: number;
    createdAt: string;
    user: { name: string };
    tenant: { name: string };
  }[];
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [newTenant, setNewTenant] = useState({
    name: "",
    slug: "",
    city: "",
    state: "",
  });
  const [tenantMsg, setTenantMsg] = useState("");

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((r) => r.json())
      .then((data) => setStats(data.stats))
      .finally(() => setLoading(false));
  }, []);

  async function createTenant(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/admin/tenants", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newTenant),
    });

    if (res.ok) {
      setTenantMsg("Comércio criado com sucesso!");
      setNewTenant({ name: "", slug: "", city: "", state: "" });
    } else {
      const data = await res.json();
      setTenantMsg(data.error || "Erro ao criar comércio");
    }
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 animate-pulse">
        <div className="h-10 bg-gray-200 rounded w-1/4 mb-8" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 bg-gray-200 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">
        Painel Administrativo
      </h1>

      {stats && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <p className="text-xs text-gray-500">Usuários</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.totalUsers}
              </p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <p className="text-xs text-gray-500">Produtos</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.totalProducts}
              </p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <p className="text-xs text-gray-500">Pedidos</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.totalOrders}
              </p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <p className="text-xs text-gray-500">Comércios</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.totalTenants}
              </p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <p className="text-xs text-gray-500">Receita Total</p>
              <p className="text-2xl font-bold text-green-600">
                R$ {stats.totalRevenue.toFixed(2)}
              </p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <p className="text-xs text-gray-500">Taxas Plataforma</p>
              <p className="text-2xl font-bold text-indigo-600">
                R$ {stats.totalPlatformFees.toFixed(2)}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white rounded-xl border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">
                  Pedidos Recentes
                </h2>
              </div>
              <div className="divide-y divide-gray-200">
                {stats.recentOrders.map((order) => (
                  <div key={order.id} className="px-6 py-3 flex justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {order.user.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {order.tenant.name} &middot;{" "}
                        {new Date(order.createdAt).toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold">
                        R$ {order.totalAmount.toFixed(2)}
                      </p>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          order.status === "CONFIRMED"
                            ? "bg-green-100 text-green-700"
                            : "bg-yellow-100 text-yellow-700"
                        }`}
                      >
                        {order.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Novo Comércio (Tenant)
              </h2>
              {tenantMsg && (
                <div
                  className={`mb-4 px-4 py-2 rounded text-sm ${
                    tenantMsg.includes("sucesso")
                      ? "bg-green-50 text-green-700"
                      : "bg-red-50 text-red-600"
                  }`}
                >
                  {tenantMsg}
                </div>
              )}
              <form onSubmit={createTenant} className="space-y-3">
                <input
                  type="text"
                  placeholder="Nome do comércio"
                  value={newTenant.name}
                  onChange={(e) =>
                    setNewTenant({ ...newTenant, name: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
                <input
                  type="text"
                  placeholder="Slug (URL amigável)"
                  value={newTenant.slug}
                  onChange={(e) =>
                    setNewTenant({ ...newTenant, slug: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="Cidade"
                    value={newTenant.city}
                    onChange={(e) =>
                      setNewTenant({ ...newTenant, city: e.target.value })
                    }
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                  <input
                    type="text"
                    placeholder="Estado"
                    value={newTenant.state}
                    onChange={(e) =>
                      setNewTenant({ ...newTenant, state: e.target.value })
                    }
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-indigo-600 text-white py-2 rounded-lg font-medium hover:bg-indigo-700 text-sm"
                >
                  Criar Comércio
                </button>
              </form>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
