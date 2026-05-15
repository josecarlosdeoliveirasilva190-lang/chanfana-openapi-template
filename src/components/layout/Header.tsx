"use client";

import Link from "next/link";
import { useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";

interface User {
  id: string;
  name: string;
  role: string;
}

function getStoredUser(): User | null {
  if (typeof window === "undefined") return null;
  const stored = localStorage.getItem("user");
  if (!stored) return null;
  try {
    return JSON.parse(stored) as User;
  } catch {
    return null;
  }
}

const subscribe = (cb: () => void) => {
  window.addEventListener("storage", cb);
  return () => window.removeEventListener("storage", cb);
};

export default function Header() {
  const user = useSyncExternalStore(subscribe, getStoredUser, () => null);
  const [menuOpen, setMenuOpen] = useState(false);
  const router = useRouter();

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.dispatchEvent(new Event("storage"));
    router.push("/");
  };

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">M</span>
            </div>
            <span className="font-bold text-xl text-gray-900">
              Marketplace
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            <Link
              href="/products"
              className="text-gray-600 hover:text-gray-900 font-medium"
            >
              Produtos
            </Link>
            {user ? (
              <>
                <Link
                  href="/cart"
                  className="text-gray-600 hover:text-gray-900 font-medium"
                >
                  Carrinho
                </Link>
                {(user.role === "SELLER" || user.role === "ADMIN") && (
                  <Link
                    href="/dashboard/seller"
                    className="text-gray-600 hover:text-gray-900 font-medium"
                  >
                    Painel Vendedor
                  </Link>
                )}
                {user.role === "ADMIN" && (
                  <Link
                    href="/dashboard/admin"
                    className="text-gray-600 hover:text-gray-900 font-medium"
                  >
                    Admin
                  </Link>
                )}
                <Link
                  href="/dashboard/nexus"
                  className="text-gray-600 hover:text-gray-900 font-medium"
                >
                  Nexus
                </Link>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-500">{user.name}</span>
                  <button
                    onClick={logout}
                    className="text-sm text-red-600 hover:text-red-800"
                  >
                    Sair
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  href="/login"
                  className="text-gray-600 hover:text-gray-900 font-medium"
                >
                  Entrar
                </Link>
                <Link
                  href="/register"
                  className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 font-medium"
                >
                  Cadastrar
                </Link>
              </div>
            )}
          </nav>

          <button
            className="md:hidden p-2"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d={
                  menuOpen
                    ? "M6 18L18 6M6 6l12 12"
                    : "M4 6h16M4 12h16M4 18h16"
                }
              />
            </svg>
          </button>
        </div>

        {menuOpen && (
          <div className="md:hidden pb-4 space-y-2">
            <Link
              href="/products"
              className="block px-3 py-2 text-gray-600 hover:bg-gray-50 rounded"
            >
              Produtos
            </Link>
            {user ? (
              <>
                <Link
                  href="/cart"
                  className="block px-3 py-2 text-gray-600 hover:bg-gray-50 rounded"
                >
                  Carrinho
                </Link>
                <button
                  onClick={logout}
                  className="block px-3 py-2 text-red-600 hover:bg-gray-50 rounded w-full text-left"
                >
                  Sair
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="block px-3 py-2 text-gray-600 hover:bg-gray-50 rounded"
                >
                  Entrar
                </Link>
                <Link
                  href="/register"
                  className="block px-3 py-2 text-indigo-600 hover:bg-gray-50 rounded"
                >
                  Cadastrar
                </Link>
              </>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
