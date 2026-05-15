import Link from "next/link";

export default function Home() {
  return (
    <div>
      <section className="bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="max-w-3xl">
            <h1 className="text-4xl sm:text-5xl font-bold leading-tight mb-6">
              Marketplace Nacional com IA Integrada
            </h1>
            <p className="text-xl text-indigo-100 mb-8">
              Compre e venda com preços inteligentes. Nossa IA Iara negocia os
              melhores preços automaticamente, garantindo margens justas para
              todos.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/products"
                className="bg-white text-indigo-700 px-8 py-3 rounded-lg font-semibold text-center hover:bg-indigo-50 transition-colors"
              >
                Explorar Produtos
              </Link>
              <Link
                href="/register"
                className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold text-center hover:bg-white/10 transition-colors"
              >
                Comece a Vender
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-4">
          Plataforma Modular
        </h2>
        <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
          Cada módulo foi projetado para otimizar uma parte específica do seu
          negócio
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white rounded-xl p-8 border border-gray-200 hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
              <span className="text-2xl">&#9881;</span>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Nexus</h3>
            <p className="text-gray-600 mb-4">
              Núcleo financeiro com controle de saldo, margem mínima de R$7,
              relatórios por cidade/produto e multi-tenancy.
            </p>
            <ul className="text-sm text-gray-500 space-y-1">
              <li>Painel financeiro</li>
              <li>Cancelamento automático</li>
              <li>Cobrança recorrente</li>
            </ul>
          </div>

          <div className="bg-white rounded-xl p-8 border border-gray-200 hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
              <span className="text-2xl">&#9733;</span>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Iara</h3>
            <p className="text-gray-600 mb-4">
              IA de negociação que propõe preços dinâmicos, sempre abaixo do
              fornecedor, protegendo a margem mínima.
            </p>
            <ul className="text-sm text-gray-500 space-y-1">
              <li>Preços dinâmicos com IA</li>
              <li>Proteção de margem R$7</li>
              <li>Propostas automáticas</li>
            </ul>
          </div>

          <div className="bg-white rounded-xl p-8 border border-gray-200 hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
              <span className="text-2xl">&#9993;</span>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Peri</h3>
            <p className="text-gray-600 mb-4">
              Atendimento automático com confirmações de pedido, mensagens
              dinâmicas e notificações em tempo real.
            </p>
            <ul className="text-sm text-gray-500 space-y-1">
              <li>Confirmação de pedidos</li>
              <li>Mensagens automáticas</li>
              <li>Notificações em tempo real</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="bg-white border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <p className="text-3xl font-bold text-indigo-600">Multi</p>
              <p className="text-gray-600 mt-1">Tenancy</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-indigo-600">R$7</p>
              <p className="text-gray-600 mt-1">Margem Mínima</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-indigo-600">IA</p>
              <p className="text-gray-600 mt-1">Negociação</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-indigo-600">Stripe</p>
              <p className="text-gray-600 mt-1">Pagamentos</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
