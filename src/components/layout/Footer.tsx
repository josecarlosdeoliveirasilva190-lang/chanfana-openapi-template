export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-400 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">M</span>
              </div>
              <span className="font-bold text-xl text-white">Marketplace</span>
            </div>
            <p className="text-sm">
              Plataforma nacional de marketplace com IA integrada para
              negociação de preços.
            </p>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-3">Plataforma</h3>
            <ul className="space-y-2 text-sm">
              <li>Nexus - Painel Financeiro</li>
              <li>Iara - Negociação IA</li>
              <li>Peri - Atendimento</li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-3">Para Vendedores</h3>
            <ul className="space-y-2 text-sm">
              <li>Multi-tenancy</li>
              <li>Relatórios por cidade</li>
              <li>Cobrança recorrente</li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-3">Suporte</h3>
            <ul className="space-y-2 text-sm">
              <li>Central de Ajuda</li>
              <li>Contato</li>
              <li>Termos de Uso</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm">
          <p>&copy; {new Date().getFullYear()} Marketplace. Todos os direitos reservados.</p>
        </div>
      </div>
    </footer>
  );
}
