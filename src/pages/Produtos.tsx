import { useState, useRef } from 'react'
import { AppData, Produto } from '../types'
import { formatCurrency, addProduto, updateProduto, deleteProduto } from '../store'
import { useToast } from '../components/Toast'

interface Props {
  data: AppData
  update: (next: AppData) => void
}

export default function Produtos({ data, update }: Props) {
  const { notify } = useToast()
  const [showForm, setShowForm] = useState(false)
  const [editando, setEditando] = useState<Produto | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  // Campos do formulário
  const [nome, setNome] = useState('')
  const [custo, setCusto] = useState('')
  const [preco, setPreco] = useState('')
  const [estoque, setEstoque] = useState('')
  const [foto, setFoto] = useState('')

  function abrirNovo() {
    setEditando(null)
    setNome(''); setCusto(''); setPreco(''); setEstoque(''); setFoto('')
    setShowForm(true)
  }

  function abrirEditar(p: Produto) {
    setEditando(p)
    setNome(p.nome); setCusto(String(p.custo)); setPreco(String(p.preco))
    setEstoque(String(p.estoque)); setFoto(p.foto || '')
    setShowForm(true)
  }

  function handleFoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setFoto(reader.result as string)
    reader.readAsDataURL(file)
  }

  function salvar() {
    if (!nome.trim()) return
    const c = parseFloat(custo) || 0
    const p = parseFloat(preco) || 0
    const e = parseInt(estoque) || 0

    if (editando) {
      const produtos = updateProduto(data.produtos, editando.id, { nome: nome.trim(), foto, custo: c, preco: p, estoque: e })
      update({ ...data, produtos })
      notify(`"${nome}" atualizado!`)
    } else {
      const produtos = addProduto(data.produtos, nome.trim(), foto, c, p, e)
      update({ ...data, produtos })
      notify(`"${nome}" criado!`)
    }
    setShowForm(false)
  }

  function remover(p: Produto) {
    const produtos = deleteProduto(data.produtos, p.id)
    const prev = data.produtos
    update({ ...data, produtos })
    notify(`"${p.nome}" removido.`, () => update({ ...data, produtos: prev }))
  }

  if (showForm) return (
    <div className="p-4 space-y-4 max-w-md mx-auto">
      <button onClick={() => setShowForm(false)} className="text-sm text-primary font-semibold">← Voltar</button>
      <h2 className="text-lg font-bold text-lumine-ink">{editando ? 'Editar produto' : '+ Novo produto'}</h2>

      {/* Foto */}
      <div>
        <p className="text-sm font-medium text-lumine-ink mb-1">Foto</p>
        <input ref={fileRef} type="file" accept="image/*" onChange={handleFoto} className="text-sm" />
        {foto && (
          <img src={foto} alt="Preview" className="mt-2 w-24 h-24 object-cover rounded-xl border border-accent-light/30" />
        )}
      </div>

      <div>
        <p className="text-sm font-medium text-lumine-ink mb-1">Nome</p>
        <input value={nome} onChange={e => setNome(e.target.value)} className="w-full border border-accent-light/40 rounded-xl px-3 py-2 text-sm bg-white" placeholder="Ex: Vela Aromática M" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <p className="text-sm font-medium text-lumine-ink mb-1">Custo (R$)</p>
          <input type="number" step="0.01" value={custo} onChange={e => setCusto(e.target.value)} className="w-full border border-accent-light/40 rounded-xl px-3 py-2 text-sm bg-white" placeholder="0,00" />
        </div>
        <div>
          <p className="text-sm font-medium text-lumine-ink mb-1">Preço (R$)</p>
          <input type="number" step="0.01" value={preco} onChange={e => setPreco(e.target.value)} className="w-full border border-accent-light/40 rounded-xl px-3 py-2 text-sm bg-white" placeholder="0,00" />
        </div>
      </div>

      <div>
        <p className="text-sm font-medium text-lumine-ink mb-1">Quantidade produzida (estoque)</p>
        <input type="number" value={estoque} onChange={e => setEstoque(e.target.value)} className="w-full border border-accent-light/40 rounded-xl px-3 py-2 text-sm bg-white" placeholder="0" />
      </div>

      <button onClick={salvar} disabled={!nome.trim()} className="w-full py-3 bg-primary text-white rounded-xl font-semibold disabled:opacity-50 tapable">
        💾 {editando ? 'Salvar alterações' : 'Criar produto'}
      </button>
    </div>
  )

  return (
    <div className="p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-lumine-ink">📦 Produtos</h2>
        <button onClick={abrirNovo} className="text-sm bg-primary text-white px-4 py-2 rounded-xl font-semibold tapable">
          + Novo
        </button>
      </div>

      {data.produtos.length === 0 ? (
        <div className="text-center py-12 text-accent-light">
          <p className="text-4xl mb-3">🕯️</p>
          <p className="font-medium">Nenhum produto cadastrado</p>
          <p className="text-sm mt-1">Toque em "+ Novo" para começar</p>
        </div>
      ) : (
        <div className="space-y-2">
          {data.produtos.map(p => (
            <div key={p.id} className="bg-card rounded-xl border border-accent-light/20 p-3 flex items-center gap-3 tapable" onClick={() => abrirEditar(p)}>
              {p.foto ? (
                <img src={p.foto} alt={p.nome} className="w-14 h-14 object-cover rounded-lg" />
              ) : (
                <div className="w-14 h-14 rounded-lg bg-accent-light/20 flex items-center justify-center text-2xl">🕯️</div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-lumine-ink truncate">{p.nome}</p>
                <p className="text-xs text-accent-light">
                  Custo {formatCurrency(p.custo)} · Venda {formatCurrency(p.preco)}
                </p>
                <p className={`text-xs font-medium mt-0.5 ${p.estoque <= 1 ? 'text-danger' : 'text-success'}`}>
                  Estoque: {p.estoque} {p.estoque === 0 ? '⚠️' : p.estoque === 1 ? '⚠️' : ''}
                </p>
              </div>
              <button onClick={(e) => { e.stopPropagation(); remover(p) }} className="text-danger text-xs font-semibold px-2 py-1">
                🗑
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}