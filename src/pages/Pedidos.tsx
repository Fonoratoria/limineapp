import { useState } from 'react'
import { AppData, Pedido as PedidoTipo, Produto, ItemVenda } from '../types'
import { addPedido, marcarEntregue, formatCurrency, formatDate, todayStr } from '../store'
import { useToast } from '../components/Toast'
import ShareButton from '../components/ShareButton'

type Aba = 'fazer' | 'concluidos'

interface Props {
  data: AppData
  update: (next: AppData) => void
}

export default function Pedidos({ data, update }: Props) {
  const { notify } = useToast()
  const [aba, setAba] = useState<Aba>('fazer')
  const [showForm, setShowForm] = useState(false)

  // Campos do formulário
  const [nomeCliente, setNomeCliente] = useState('')
  const [dataEntrega, setDataEntrega] = useState(todayStr())
  const [itensPedido, setItensPedido] = useState<{ produtoId: string; nome: string; qtd: number; precoUnit: number }[]>([])

  function addItemPedido(p: Produto) {
    const existente = itensPedido.find(i => i.produtoId === p.id)
    if (existente) {
      setItensPedido(itensPedido.map(i => i.produtoId === p.id ? { ...i, qtd: i.qtd + 1 } : i))
    } else {
      setItensPedido([...itensPedido, { produtoId: p.id, nome: p.nome, qtd: 1, precoUnit: p.preco }])
    }
  }

  function removeItemPedido(produtoId: string) {
    setItensPedido(itensPedido.filter(i => i.produtoId !== produtoId))
  }

  function alterarQtdPedido(produtoId: string, delta: number) {
    setItensPedido(prev => prev.map(i =>
      i.produtoId === produtoId ? { ...i, qtd: Math.max(1, i.qtd + delta) } : i
    ))
  }

  function salvarPedido() {
    if (!nomeCliente.trim()) return
    if (itensPedido.length === 0) { notify('Adicione pelo menos um item!'); return }
    const pedidos = addPedido(data.pedidos, nomeCliente.trim(), dataEntrega, itensPedido)
    update({ ...data, pedidos })
    notify(`Pedido de ${nomeCliente} registrado!`)
    setShowForm(false)
    setNomeCliente('')
    setDataEntrega(todayStr())
    setItensPedido([])
  }

  function entregar(p: PedidoTipo) {
    const pedidos = marcarEntregue(data.pedidos, p.id)
    update({ ...data, pedidos })
    notify(`Pedido de ${p.nomeCliente} marcado como entregue! ✅`)
  }

  const pendentes = data.pedidos.filter(p => p.status === 'pendente')
  const concluidos = data.pedidos.filter(p => p.status === 'entregue')

  if (showForm) return (
    <div className="p-4 space-y-4 max-w-md mx-auto">
      <button onClick={() => setShowForm(false)} className="text-sm text-primary font-semibold">← Voltar</button>
      <h2 className="text-lg font-bold text-lumine-ink">📋 Novo pedido</h2>

      <div>
        <p className="text-sm font-medium text-lumine-ink mb-1">Nome da cliente</p>
        <input value={nomeCliente} onChange={e => setNomeCliente(e.target.value)}
          className="w-full border border-accent-light/40 rounded-xl px-3 py-2 text-sm bg-white"
          placeholder="Ex: Maria Silva"
        />
      </div>

      <div>
        <p className="text-sm font-medium text-lumine-ink mb-1">Data de entrega</p>
        <input type="date" value={dataEntrega} onChange={e => setDataEntrega(e.target.value)}
          className="w-full border border-accent-light/40 rounded-xl px-3 py-2 text-sm bg-white"
        />
      </div>

      {/* Selecionar itens */}
      <div>
        <p className="text-sm font-medium text-lumine-ink mb-2">Itens do pedido</p>
        {itensPedido.length > 0 && (
          <div className="space-y-1 mb-2">
            {itensPedido.map(i => (
              <div key={i.produtoId} className="flex items-center gap-2 bg-lumine-bg rounded-lg px-3 py-1.5">
                <span className="flex-1 text-sm">{i.nome}</span>
                <div className="flex items-center gap-1">
                  <button onClick={() => alterarQtdPedido(i.produtoId, -1)} className="w-6 h-6 rounded-full bg-accent-light/20 text-xs font-bold">−</button>
                  <span className="w-5 text-center text-sm">{i.qtd}</span>
                  <button onClick={() => alterarQtdPedido(i.produtoId, 1)} className="w-6 h-6 rounded-full bg-accent-light/20 text-xs font-bold">+</button>
                </div>
                <button onClick={() => removeItemPedido(i.produtoId)} className="text-danger text-xs">✕</button>
              </div>
            ))}
          </div>
        )}
        <div className="grid grid-cols-2 gap-1.5 max-h-40 overflow-y-auto">
          {data.produtos.map(p => (
            <button key={p.id} onClick={() => addItemPedido(p)}
              className="text-xs bg-card border border-accent-light/20 rounded-lg px-2.5 py-1.5 text-left tapable"
            >
              🕯️ {p.nome} <span className="text-primary font-semibold">{formatCurrency(p.preco)}</span>
            </button>
          ))}
        </div>
      </div>

      <button onClick={salvarPedido} disabled={!nomeCliente.trim() || itensPedido.length === 0}
        className="w-full py-3 bg-primary text-white rounded-xl font-semibold disabled:opacity-50 tapable">
        💾 Registrar pedido
      </button>
    </div>
  )

  return (
    <div className="p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-lumine-ink">📋 Pedidos</h2>
        <button onClick={() => setShowForm(true)} className="text-sm bg-primary text-white px-4 py-2 rounded-xl font-semibold tapable">
          + Novo
        </button>
      </div>

      {/* Abas */}
      <div className="flex bg-accent-light/10 rounded-xl p-1">
        <button onClick={() => setAba('fazer')}
          className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-colors ${aba === 'fazer' ? 'bg-white text-lumine-ink shadow-sm' : 'text-accent-light'}`}
        >
          A Fazer ({pendentes.length})
        </button>
        <button onClick={() => setAba('concluidos')}
          className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-colors ${aba === 'concluidos' ? 'bg-white text-lumine-ink shadow-sm' : 'text-accent-light'}`}
        >
          Concluídos ({concluidos.length})
        </button>
      </div>

      {/* Lista */}
      {aba === 'fazer' && (
        pendentes.length === 0 ? (
          <div className="text-center py-10 text-accent-light">
            <p className="text-3xl mb-2">📋</p>
            <p className="font-medium">Nenhum pedido pendente</p>
          </div>
        ) : (
          <div className="space-y-2">
            {pendentes.map(p => (
              <div key={p.id} className="bg-card rounded-xl border border-accent-light/20 p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-semibold text-lumine-ink">{p.nomeCliente}</p>
                    <p className="text-xs text-accent-light">📅 Entrega: {formatDate(p.dataEntrega)}</p>
                  </div>
                  <span className="text-sm font-bold text-primary">{formatCurrency(p.total)}</span>
                </div>
                <div className="text-xs text-lumine-ink/70 mb-3">
                  {p.itens.map(i => `${i.nome} x${i.qtd}`).join(' · ')}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => entregar(p)}
                    className="flex-1 py-2 bg-success text-white rounded-xl text-sm font-semibold tapable"
                  >
                    ✅ Marcar como Entregue
                  </button>
                  <ShareButton
                    texto={`Pedido: ${p.nomeCliente} • Entrega: ${formatDate(p.dataEntrega)} • ${formatCurrency(p.total)} • ${p.itens.map(i => `${i.nome} x${i.qtd}`).join(', ')} • Lumine App`}
                    className="py-2 px-3 bg-card border border-accent-light/30 rounded-xl text-sm tapable"
                  />
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {aba === 'concluidos' && (
        concluidos.length === 0 ? (
          <div className="text-center py-10 text-accent-light">
            <p className="text-3xl mb-2">✅</p>
            <p className="font-medium">Nenhum pedido concluído</p>
          </div>
        ) : (
          <div className="space-y-2">
            {concluidos.map(p => (
              <div key={p.id} className="bg-card rounded-xl border border-accent-light/20 p-4 opacity-70">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-semibold text-lumine-ink">{p.nomeCliente}</p>
                    <p className="text-xs text-accent-light">📅 Entrega: {formatDate(p.dataEntrega)}</p>
                  </div>
                  <span className="text-sm font-bold text-success">{formatCurrency(p.total)}</span>
                </div>
                <div className="text-xs text-lumine-ink/70 mb-3">
                  {p.itens.map(i => `${i.nome} x${i.qtd}`).join(' · ')}
                </div>
                <ShareButton
                  texto={`Pedido: ${p.nomeCliente} • Entrega: ${formatDate(p.dataEntrega)} • ${formatCurrency(p.total)} • ${p.itens.map(i => `${i.nome} x${i.qtd}`).join(', ')} • Lumine App`}
                  className="py-1.5 text-xs text-accent-light tapable"
                />
              </div>
            ))}
          </div>
        )
      )}
    </div>
  )
}