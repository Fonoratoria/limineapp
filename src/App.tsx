import { useState, useCallback, lazy, Suspense } from 'react'
import { AppData } from './types'
import { loadData, saveData } from './store'
import { ToastProvider } from './components/Toast'

const Inicio = lazy(() => import('./pages/Inicio'))
const Produtos = lazy(() => import('./pages/Produtos'))
const Vender = lazy(() => import('./pages/Vender'))
const Pedidos = lazy(() => import('./pages/Pedidos'))
const Financas = lazy(() => import('./pages/Financas'))

type Page = 'inicio' | 'produtos' | 'vender' | 'pedidos' | 'financas'

const NAV: { id: Page; label: string; icon: string }[] = [
  { id: 'inicio', label: 'Início', icon: '🏠' },
  { id: 'produtos', label: 'Produtos', icon: '📦' },
  { id: 'vender', label: 'Vender', icon: '🛒' },
  { id: 'pedidos', label: 'Pedidos', icon: '📋' },
  { id: 'financas', label: 'Finanças', icon: '📊' },
]

function Spinner() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-3 border-accent-light border-t-primary rounded-full animate-spin" />
    </div>
  )
}

export default function App() {
  const [page, setPage] = useState<Page>('inicio')
  const [data, setData] = useState<AppData>(() => loadData())

  const update = useCallback((next: AppData) => {
    saveData(next)
    setData(next)
  }, [])

  const props = { data, update }

  return (
    <ToastProvider>
      <div className="flex flex-col h-screen overflow-hidden bg-lumine-bg">
        {/* Header */}
        <header className="bg-white border-b border-accent-light/30 px-4 py-3 safe-top">
          <h1 className="text-lg font-bold text-lumine-ink text-center">Lumine 🕯️</h1>
        </header>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto pb-16">
          <Suspense fallback={<Spinner />}>
            {page === 'inicio' && <Inicio {...props} />}
            {page === 'produtos' && <Produtos {...props} />}
            {page === 'vender' && <Vender {...props} />}
            {page === 'pedidos' && <Pedidos {...props} />}
            {page === 'financas' && <Financas {...props} />}
          </Suspense>
        </main>

        {/* Bottom nav */}
        <nav className="bg-white border-t border-accent-light/30 flex safe-bottom z-40">
          {NAV.map(n => (
            <button
              key={n.id}
              onClick={() => setPage(n.id)}
              className={`flex-1 flex flex-col items-center py-2 text-xs font-medium transition-colors ${
                page === n.id ? 'text-primary' : 'text-accent-light'
              }`}
            >
              <span className="text-xl mb-0.5">{n.icon}</span>
              {n.label}
            </button>
          ))}
        </nav>
      </div>
    </ToastProvider>
  )
}