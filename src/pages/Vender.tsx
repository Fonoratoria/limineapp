import { useState } from 'react'
import { AppData, FormaPagamento, ItemVenda, Produto } from '../types'
import { registrarVenda, formatCurrency } from '../store'
import { useToast } from '../components/Toast'

const PAGAMENTOS: { id: FormaPagamento; label: string; icon: string }[] = [
  { id: 'Pix', label: 'Pix', icon: '📱' },
  { id: 'Cartão', label: 'Cartão', icon: '💳' },
  { id: 'Dinheiro', label: 'Dinheiro', icon: '💵' },
]

interface Props {
  data: AppData
  update: (next: AppData) => void
}

export default function Vender({ data, update }: Props) {
  const { notify } = useToast()
  const [carrinho, setCarrinho] = useState<ItemVenda[]>([])
  const [showPagamento, setShowPagamento] = useState(false)

  function addItem(p: Produto) {
    if (p.estoque <= 0) { notify('Produto sem estoque!'); return }
    const existente = carrinho.find(i => i.produtoId === p.id)
    if (existente) {
      if (existente.qtd >= p.estoque) { notify('Estoque insuficiente!'); return }
      setCarrinho(carrinho.map(i => i.produtoId === p.id ? { ...i, qtd: i.qtd + 1 } : i))
    } else {
      setCarrinho([...carrinho, { produtoId: p.id, nome: p.nome, qtd: 1, precoUnit: p.preco }])
    }
  }

  function removeItem(produtoId: string) {
    setCarrinho(carrinho.filter(i => i.produtoId !== produtoId))
  }

  function alterarQtd(produtoId: string, delta: number) {
    setCarrinho(carrinho.map(i => {
      if (i.produtoId !== produtoId) return i
      const nova = i.qtd + delta
      if (nova <= 0) return i // vai ser filtrado abaixo
      const p = data.produtos.find(x => x.id === produtoId)
      if (p && nova > p.estoque) { notify('Estoque insuficiente!'); return i }
      return { ...i, qtd: nova }
    }).filter(i => i.qtd > 0))
  }

  function cobrar(forma: string) {
    const { vendas } = registrarVenda(data.vendas, carrinho, forma)
    // Atualiza estoque
    const produtos = data.produtos.map(p => {
      const item = carrinho.find(i => i.produtoId === p.id)
      return item ? { ...p, estoque: p.estoque - item.qtd } : p
    })
    update({ ...data, vendas, produtos })
    notify(`Venda de ${formatCurrency(carrinho.reduce((s, i) => s + i.precoUnit * i.qtd, 0))} finalizada!`)
    setCarrinho([])
    setShowPagamento(false)
  }

  const total = carrinho.reduce((s, i) => s + i.precoUnit * i.qtd, 0)

  // Modal de pagamento
  if (showPagamento && carrinho.length > 0) return (
    <div className="p-4 space-y-4 max-w-md mx-auto">
      <button onClick={() => setShowPagamento(false)} className="text-sm text-primary font-semibold">← Voltar</button>
      <h2 className="text-lg font-bold text-lumine-ink">💳 Como a cliente pagou?</h2>

      <div className="bg-card rounded-2xl border border-accent-light/20 p-4 space-y-1">
        {carrinho.map(i => (
          <div key={i.produtoId} className="flex justify-between text-sm">
            <span>{i.nome} x{i.qtd}</span>
            <span className="font-semibold">{formatCurrency(i.precoUnit * i.qtd)}</span>
          </div>
        ))}
        <hr className="border-accent-light/20 my-1" />
        <div className="flex justify-between text-lg font-bold text-lumine-ink">
          <span>Total</span>
          <span>{formatCurrency(total)}</span>
        </div>
      </div>

      <div className="space-y-2">
        {PAGAMENTOS.map(pg => (
          <button key={pg.id} onClick={() => cobrar(pg.id)}
            className="w-full py-3 bg-card border border-accent-light/30 rounded-xl flex items-center justify-center gap-2 font-semibold text-lumine-ink tapable text-base"
          >
            {pg.icon} {pg.label}
          </button>
        ))}
      </div>
    </div>
  )

  return (
    <div className="h-full flex flex-col">
      {/* Grid de produtos (parte superior) */}
      <div className="flex-1 overflow-y-auto p-4">
        {data.produtos.length === 0 ? (
          <div className="text-center py-12 text-accent-light">
            <p className="text-4xl mb-3">🕯️</p>
            <p className="font-medium">Nenhum produto cadastrado</p>
            <p className="text-sm mt-1">Cadastre produtos na aba "Produtos" primeiro</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {data.produtos.map(p => (
              <button key={p.id} onClick={() => addItem(p)}
                disabled={p.estoque <= 0}
                className="bg-card rounded-2xl border border-accent-light/20 p-3 flex flex-col items-center gap-2 tapable disabled:opacity-40"
              >
                {p.foto ? (
                  <img src={p.foto} alt={p.nome} className="w-20 h-20 object-cover rounded-xl" />
                ) : (
                  <div className="w-20 h-20 rounded-xl bg-accent-light/20 flex items-center justify-center text-3xl">🕯️</div>
                )}
                <p className="text-sm font-semibold text-lumine-ink text-center leading-tight">{p.nome}</p>
                <p className="text-sm font-bold text-primary">{formatCurrency(p.preco)}</p>
                {p.estoque <= 0 && <p className="text-xs text-danger">Esgotado</p>}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Carrinho (parte inferior) */}
      <div className="bg-white border-t border-accent-light/30 p-4">
        {carrinho.length === 0 ? (
          <p className="text-center text-accent-light text-sm py-3">Toque nos produtos acima para adicionar ao carrinho</p>
        ) : (
          <div className="space-y-2">
            {carrinho.map(i => (
              <div key={i.produtoId} className="flex items-center gap-2 bg-lumine-bg rounded-xl px-3 py-2">
                <span className="flex-1 text-sm font-medium truncate">{i.nome}</span>
                <div className="flex items-center gap-1">
                  <button onClick={() => alterarQtd(i.produtoId, -1)} className="w-7 h-7 rounded-full bg-accent-light/20 text-lumine-ink font-bold text-sm">−</button>
                  <span className="w-6 text-center text-sm font-semibold">{i.qtd}</span>
                  <button onClick={() => alterarQtd(i.produtoId, 1)} className="w-7 h-7 rounded-full bg-accent-light/20 text-lumine-ink font-bold text-sm">+</button>
                </div>
                <span className="text-sm font-semibold w-16 text-right">{formatCurrency(i.precoUnit * i.qtd)}</span>
                <button onClick={() => removeItem(i.produtoId)} className="text-danger text-sm ml-1">✕</button>
              </div>
            ))}
            <div className="flex items-center justify-between pt-2 border-t border-accent-light/20">
              <span className="font-bold text-lumine-ink">Total: {formatCurrency(total)}</span>
              <button onClick={() => setShowPagamento(true)}
                className="bg-primary text-white px-6 py-2.5 rounded-xl font-bold tapable"
              >
                💰 Cobrar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}