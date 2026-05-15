"use client";

import { useState, useEffect } from "react";
import ProductCard from "@/components/ui/ProductCard";

interface Product {
  id: string;
  name: string;
  description: string;
  basePrice: number;
  currentPrice: number;
  imageUrl?: string | null;
  category: string;
  city: string;
  seller: { name: string };
  tenant: { name: string; city?: string };
}

const CATEGORIES = [
  "Todos",
  "Eletrônicos",
  "Roupas",
  "Alimentos",
  "Casa",
  "Esportes",
  "Livros",
  "Outros",
];

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [city, setCity] = useState("");
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTrigger, setSearchTrigger] = useState(0);

  useEffect(() => {
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional: data fetching pattern
    setLoading(true);

    const params = new URLSearchParams();
    if (category && category !== "Todos") params.set("category", category);
    if (city) params.set("city", city);
    if (search) params.set("search", search);
    params.set("page", String(page));

    fetch(`/api/products?${params}`)
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) {
          setProducts(data.products || []);
          setTotalPages(data.pages || 1);
        }
      })
      .catch(() => {
        if (!cancelled) console.error("Erro ao carregar produtos");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [category, city, page, search, searchTrigger]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    setSearchTrigger((n) => n + 1);
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Produtos</h1>
          <p className="text-gray-600 mt-1">
            Explore nossa vitrine nacional de produtos
          </p>
        </div>

        <form onSubmit={handleSearch} className="flex gap-2 w-full md:w-auto">
          <input
            type="text"
            placeholder="Buscar produtos..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 md:w-64 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
          />
          <button
            type="submit"
            className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 font-medium"
          >
            Buscar
          </button>
        </form>
      </div>

      <div className="flex flex-wrap gap-2 mb-8">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => {
              setCategory(cat === "Todos" ? "" : cat);
              setPage(1);
            }}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              (cat === "Todos" && !category) || category === cat
                ? "bg-indigo-600 text-white"
                : "bg-white text-gray-600 border border-gray-300 hover:bg-gray-50"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="flex gap-2 mb-8">
        <input
          type="text"
          placeholder="Filtrar por cidade..."
          value={city}
          onChange={(e) => {
            setCity(e.target.value);
            setPage(1);
          }}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none w-48"
        />
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-xl border border-gray-200 overflow-hidden animate-pulse"
            >
              <div className="aspect-square bg-gray-200" />
              <div className="p-4 space-y-3">
                <div className="h-3 bg-gray-200 rounded w-1/3" />
                <div className="h-4 bg-gray-200 rounded w-2/3" />
                <div className="h-3 bg-gray-200 rounded w-full" />
                <div className="h-5 bg-gray-200 rounded w-1/3" />
              </div>
            </div>
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-gray-500 text-lg">Nenhum produto encontrado</p>
          <p className="text-gray-400 mt-2">
            Tente ajustar os filtros ou busca
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-8">
              {[...Array(totalPages)].map((_, i) => (
                <button
                  key={i}
                  onClick={() => setPage(i + 1)}
                  className={`w-10 h-10 rounded-lg font-medium ${
                    page === i + 1
                      ? "bg-indigo-600 text-white"
                      : "bg-white text-gray-600 border border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
