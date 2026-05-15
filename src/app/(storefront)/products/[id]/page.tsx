"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";

interface Product {
  id: string;
  name: string;
  description: string;
  basePrice: number;
  currentPrice: number;
  imageUrl?: string | null;
  category: string;
  city: string;
  stock: number;
  seller: { name: string };
  tenant: { name: string };
}

export default function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [negotiating, setNegotiating] = useState(false);
  const [negotiationResult, setNegotiationResult] = useState<string | null>(
    null
  );
  const router = useRouter();

  useEffect(() => {
    fetch(`/api/products?search=&page=1&limit=100`)
      .then((r) => r.json())
      .then((data) => {
        const found = data.products?.find(
          (p: Product) => p.id === id
        );
        setProduct(found || null);
      })
      .finally(() => setLoading(false));
  }, [id]);

  async function addToCart() {
    setAdding(true);
    try {
      const res = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: id }),
      });
      if (res.ok) {
        router.push("/cart");
      } else {
        alert("Faça login para adicionar ao carrinho");
      }
    } finally {
      setAdding(false);
    }
  }

  async function negotiate() {
    if (!product) return;
    setNegotiating(true);
    setNegotiationResult(null);

    try {
      const res = await fetch("/api/iara/negotiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: id,
          proposedPrice: product.currentPrice * 0.9,
        }),
      });
      const data = await res.json();
      if (data.negotiation) {
        setNegotiationResult(
          data.negotiation.accepted
            ? `Proposta aceita! Novo preço: R$${data.negotiation.proposedPrice.toFixed(2)}`
            : `Proposta recusada: ${data.negotiation.reason}`
        );
        if (data.negotiation.accepted) {
          setProduct({
            ...product,
            currentPrice: data.negotiation.proposedPrice,
          });
        }
      }
    } catch {
      setNegotiationResult("Erro na negociação");
    } finally {
      setNegotiating(false);
    }
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 animate-pulse">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="aspect-square bg-gray-200 rounded-xl" />
          <div className="space-y-4">
            <div className="h-8 bg-gray-200 rounded w-3/4" />
            <div className="h-4 bg-gray-200 rounded w-full" />
            <div className="h-4 bg-gray-200 rounded w-2/3" />
            <div className="h-10 bg-gray-200 rounded w-1/3" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <h1 className="text-2xl font-bold text-gray-900">
          Produto não encontrado
        </h1>
      </div>
    );
  }

  const hasDiscount = product.currentPrice < product.basePrice;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="aspect-square bg-gray-100 rounded-xl overflow-hidden">
          {product.imageUrl ? (
            <img
              src={product.imageUrl}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              <svg
                className="w-24 h-24"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1}
                  d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                />
              </svg>
            </div>
          )}
        </div>

        <div>
          <p className="text-sm text-indigo-600 font-medium mb-2">
            {product.category} &middot; {product.city}
          </p>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            {product.name}
          </h1>
          <p className="text-gray-600 mb-6">{product.description}</p>

          <div className="flex items-end gap-3 mb-2">
            <span className="text-3xl font-bold text-gray-900">
              R$ {product.currentPrice.toFixed(2)}
            </span>
            {hasDiscount && (
              <span className="text-lg text-gray-400 line-through">
                R$ {product.basePrice.toFixed(2)}
              </span>
            )}
          </div>

          <p className="text-sm text-gray-500 mb-6">
            Vendido por{" "}
            <span className="font-medium">{product.seller.name}</span> &middot;{" "}
            {product.tenant.name}
          </p>

          <p className="text-sm text-gray-500 mb-6">
            Estoque: {product.stock > 0 ? `${product.stock} unidades` : "Sob consulta"}
          </p>

          <div className="space-y-3">
            <button
              onClick={addToCart}
              disabled={adding}
              className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              {adding ? "Adicionando..." : "Adicionar ao Carrinho"}
            </button>

            <button
              onClick={negotiate}
              disabled={negotiating}
              className="w-full bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700 disabled:opacity-50 transition-colors"
            >
              {negotiating
                ? "Negociando com Iara..."
                : "Negociar Preço com IA"}
            </button>

            {negotiationResult && (
              <div
                className={`p-4 rounded-lg text-sm ${
                  negotiationResult.includes("aceita")
                    ? "bg-green-50 text-green-700"
                    : "bg-yellow-50 text-yellow-700"
                }`}
              >
                {negotiationResult}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
