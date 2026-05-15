"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

interface CartItem {
  id: string;
  quantity: number;
  product: {
    id: string;
    name: string;
    currentPrice: number;
    imageUrl?: string | null;
    seller: { name: string };
    tenant: { name: string };
  };
}

export default function CartPage() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchCart = useCallback(async () => {
    try {
      const res = await fetch("/api/cart");
      if (!res.ok) {
        router.push("/login");
        return;
      }
      const data = await res.json();
      setItems(data.items || []);
      setTotal(data.total || 0);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  async function removeItem(productId: string) {
    await fetch("/api/cart", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId }),
    });
    fetchCart();
  }

  async function checkout() {
    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });

    if (res.ok) {
      const data = await res.json();
      if (data.orders?.length > 0) {
        alert(
          `Pedido(s) confirmado(s)! Total: R$${data.orders.reduce((s: number, o: { totalAmount: number }) => s + o.totalAmount, 0).toFixed(2)}`
        );
        fetchCart();
      } else {
        alert("Pedidos cancelados: margem insuficiente (< R$7)");
      }
    } else {
      alert("Erro ao finalizar pedido");
    }
  }

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4" />
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-gray-200 rounded" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Carrinho</h1>

      {items.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-gray-500 text-lg">Seu carrinho está vazio</p>
          <button
            onClick={() => router.push("/products")}
            className="mt-4 bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700"
          >
            Ver Produtos
          </button>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {items.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4"
              >
                <div className="w-20 h-20 bg-gray-100 rounded-lg flex-shrink-0 overflow-hidden">
                  {item.product.imageUrl ? (
                    <img
                      src={item.product.imageUrl}
                      alt={item.product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                      Sem foto
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 truncate">
                    {item.product.name}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {item.product.seller.name} &middot;{" "}
                    {item.product.tenant.name}
                  </p>
                  <p className="text-sm text-gray-500">
                    Qtd: {item.quantity}
                  </p>
                </div>

                <div className="text-right">
                  <p className="font-bold text-gray-900">
                    R${" "}
                    {(item.product.currentPrice * item.quantity).toFixed(2)}
                  </p>
                  <button
                    onClick={() => removeItem(item.product.id)}
                    className="text-sm text-red-600 hover:text-red-800 mt-1"
                  >
                    Remover
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex justify-between items-center mb-4">
              <span className="text-lg font-semibold text-gray-900">
                Total
              </span>
              <span className="text-2xl font-bold text-gray-900">
                R$ {total.toFixed(2)}
              </span>
            </div>
            <p className="text-xs text-gray-500 mb-4">
              Taxa da plataforma: {process.env.NEXT_PUBLIC_PLATFORM_FEE || 10}%
              &middot; Margem mínima: R$7
            </p>
            <button
              onClick={checkout}
              className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
            >
              Finalizar Compra
            </button>
          </div>
        </>
      )}
    </div>
  );
}
