import { useState, useCallback, useRef, useEffect, lazy, Suspense } from 'react'
import { AppData } from './types'
import { loadData, saveData } from './store'
import { pullFromCloud, pushToCloud, cloudConfigured, SyncStatus } from './sync'
import { ToastProvider } from './components/Toast'

const Inicio = lazy(() => import('./pages/Inicio'))
const Produtos = lazy(() => import('./pages/Produtos'))
const Vender = lazy(() => import('./pages/Vender'))
const Pedidos = lazy(() => import('./pages/Pedidos'))
const Clientes = lazy(() => import('./pages/Clientes'))
const Financas = lazy(() => import('./pages/Financas'))
const Catalogo = lazy(() => import('./pages/Catalogo'))

type Page = 'inicio' | 'produtos' | 'vender' | 'pedidos' | 'clientes' | 'financas' | 'catalogo'

const NAV: { id: Page; label: string; icon: string }[] = [
  { id: 'inicio', label: 'Início', icon: '🏠' },
  { id: 'produtos', label: 'Produtos', icon: '📦' },
  { id: 'vender', label: 'Vender', icon: '🛒' },
  { id: 'pedidos', label: 'Pedidos', icon: '📋' },
  { id: 'clientes', label: 'Clientes', icon: '👥' },
  { id: 'financas', label: 'Finanças', icon: '📊' },
  { id: 'catalogo', label: 'Catálogo', icon: '📖' },
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
  const [sync, setSync] = useState<SyncStatus>(cloudConfigured ? 'syncing' : 'offline')

  const dataRef = useRef(data)
  dataRef.current = data
  const dirtyRef = useRef(false)
  const pushTimer = useRef<number | undefined>(undefined)
  const pushGen = useRef(0)
  const lastPull = useRef(0)

  // Envia para a nuvem (com pequeno atraso para agrupar mudanças rápidas)
  const doPush = useCallback((next: AppData) => {
    if (!cloudConfigured) return
    dirtyRef.current = true
    setSync('syncing')
    const gen = ++pushGen.current
    if (pushTimer.current) window.clearTimeout(pushTimer.current)
    pushTimer.current = window.setTimeout(async () => {
      if (gen !== pushGen.current) return
      const ok = await pushToCloud(next)
      if (gen !== pushGen.current) return
      if (ok) { dirtyRef.current = false; setSync('synced') }
      else setSync('offline')
    }, 800)
  }, [])

  const update = useCallback((next: AppData) => {
    saveData(next)
    setData(next)
    doPush(next)
  }, [doPush])

  // Sincroniza (puxa da nuvem). Se houver mudanças locais não enviadas, envia primeiro.
  const syncNow = useCallback(async () => {
    if (!cloudConfigured) { setSync('offline'); return }
    if (dirtyRef.current) { doPush(dataRef.current); return }
    setSync('syncing')
    lastPull.current = Date.now()
    const res = await pullFromCloud()
    if (!res.ok) { setSync('offline'); return }
    if (res.data && Array.isArray(res.data.produtos)) {
      saveData(res.data)
      setData(res.data)
      setSync('synced')
    } else {
      // nuvem vazia → sobe dados locais
      const ok = await pushToCloud(dataRef.current)
      setSync(ok ? 'synced' : 'offline')
    }
  }, [doPush])

  // Ao entrar: puxa da nuvem
  useEffect(() => {
    if (!cloudConfigured) { setSync('offline'); return }
    void syncNow()
  }, [syncNow])

  // Ao voltar o foco / reconectar a internet: re-sincroniza
  useEffect(() => {
    if (!cloudConfigured) return
    const onWake = () => {
      if (document.visibilityState === 'hidden') return
      if (Date.now() - lastPull.current < 10000 && !dirtyRef.current) return
      void syncNow()
    }
    window.addEventListener('online', onWake)
    document.addEventListener('visibilitychange', onWake)
    return () => {
      window.removeEventListener('online', onWake)
      document.removeEventListener('visibilitychange', onWake)
    }
  }, [syncNow])

  // Sincronização periódica (a cada 30s)
  useEffect(() => {
    if (!cloudConfigured) return
    const timer = setInterval(() => {
      if (document.visibilityState === 'hidden') return
      void syncNow()
    }, 30000)
    return () => clearInterval(timer)
  }, [syncNow])

  const props = { data, update }

  const syncPill =
    sync === 'syncing' ? { txt: '⟳ Sincronizando…', cls: 'bg-gray-100 text-gray-500' } :
    sync === 'synced' ? { txt: '☁ Sincronizado', cls: 'bg-green-100 text-green-700' } :
    { txt: '⚠ Salvo aqui', cls: 'bg-yellow-100 text-yellow-700' }

  return (
    <ToastProvider>
      <div className="flex flex-col h-screen overflow-hidden bg-lumine-bg">
        {/* Header */}
        <header className="bg-white border-b border-accent-light/30 px-4 py-3 safe-top">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-bold text-lumine-ink text-center flex-1">Lumine 🕯️</h1>
            <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full whitespace-nowrap ${syncPill.cls}`}>
              {syncPill.txt}
            </span>
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto pb-16">
          <Suspense fallback={<Spinner />}>
            {page === 'inicio' && <Inicio {...props} />}
            {page === 'produtos' && <Produtos {...props} />}
            {page === 'vender' && <Vender {...props} />}
            {page === 'pedidos' && <Pedidos {...props} />}
            {page === 'clientes' && <Clientes {...props} />}
            {page === 'financas' && <Financas {...props} />}
            {page === 'catalogo' && <Catalogo data={data} />}
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