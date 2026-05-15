"use client";

import Link from "next/link";

interface ProductCardProps {
  product: {
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
  };
}

export default function ProductCard({ product }: ProductCardProps) {
  const hasDiscount = product.currentPrice < product.basePrice;
  const discountPercent = hasDiscount
    ? Math.round(
        ((product.basePrice - product.currentPrice) / product.basePrice) * 100
      )
    : 0;

  return (
    <Link href={`/products/${product.id}`}>
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow group">
        <div className="aspect-square bg-gray-100 relative overflow-hidden">
          {product.imageUrl ? (
            <img
              src={product.imageUrl}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              <svg
                className="w-16 h-16"
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
          {hasDiscount && (
            <span className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
              -{discountPercent}%
            </span>
          )}
        </div>

        <div className="p-4">
          <p className="text-xs text-indigo-600 font-medium mb-1">
            {product.category} &middot; {product.city}
          </p>
          <h3 className="font-semibold text-gray-900 mb-1 line-clamp-1">
            {product.name}
          </h3>
          <p className="text-sm text-gray-500 mb-3 line-clamp-2">
            {product.description}
          </p>

          <div className="flex items-end gap-2">
            <span className="text-lg font-bold text-gray-900">
              R$ {product.currentPrice.toFixed(2)}
            </span>
            {hasDiscount && (
              <span className="text-sm text-gray-400 line-through">
                R$ {product.basePrice.toFixed(2)}
              </span>
            )}
          </div>

          <p className="text-xs text-gray-400 mt-2">
            por {product.seller.name} &middot; {product.tenant.name}
          </p>
        </div>
      </div>
    </Link>
  );
}
