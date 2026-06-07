import { useState } from 'react'
import { AppData, Cliente } from '../types'
import { addCliente, updateCliente, deleteCliente, historicoCliente, formatCurrency, formatDate } from '../store'
import { useToast } from '../components/Toast'

interface Props {
  data: AppData
  update: (next: AppData) => void
}

export default function Clientes({ data, update }: Props) {
  const { notify } = useToast()
  const [mostraForm, setMostraForm] = useState(false)
  const [editando, setEditando] = useState<Cliente | null>(null)
  const [clienteSelecionado, setClienteSelecionado] = useState<Cliente | null>(null)
  const [nome, setNome] = useState('')
  const [telefone, setTelefone] = useState('')
  const [instagram, setInstagram] = useState('')
  const [observacoes, setObservacoes] = useState('')

  // Ordena clientes por nome
  const clientesOrdenados = [...data.clientes].sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))

  function abrirNovo() {
    setEditando(null)
    setNome('')
    setTelefone('')
    setInstagram('')
    setObservacoes('')
    setMostraForm(true)
  }

  function abrirEditar(c: Cliente) {
    setEditando(c)
    setNome(c.nome)
    setTelefone(c.telefone ?? '')
    setInstagram(c.instagram ?? '')
    setObservacoes(c.observacoes ?? '')
    setMostraForm(true)
  }

  function salvar() {
    const nomeTrim = nome.trim()
    if (!nomeTrim) { notify('Nome é obrigatório'); return }
    if (editando) {
      update({ ...data, clientes: updateCliente(data.clientes, editando.id, { nome: nomeTrim, telefone: telefone.trim() || undefined, instagram: instagram.trim() || undefined, observacoes: observacoes.trim() || undefined }) })
      notify('Cliente atualizado!')
    } else {
      update({ ...data, clientes: addCliente(data.clientes, nomeTrim, telefone.trim() || undefined, instagram.trim() || undefined, observacoes.trim() || undefined) })
      notify('Cliente adicionado!')
    }
    setMostraForm(false)
  }

  function excluir(id: string) {
    update({ ...data, clientes: deleteCliente(data.clientes, id) })
    notify('Cliente removido')
    if (clienteSelecionado?.id === id) setClienteSelecionado(null)
  }

  // Tela de detalhe do cliente (histórico de compras)
  if (clienteSelecionado) {
    const hist = historicoCliente(data.vendas, data.pedidos, clienteSelecionado.id)

    // Combina vendas e pedidos em uma lista única ordenada por data
    const linhaDoTempo: { tipo: 'venda' | 'pedido'; id: string; data: string; total: number; itens: string; status?: string; pago?: boolean }[] = [
      ...hist.vendas.map(v => ({ tipo: 'venda' as const, id: v.id, data: v.data, total: v.total, itens: v.itens.map(i => `${i.nome} x${i.qtd}`).join(', ') })),
      ...hist.pedidos.map(p => ({ tipo: 'pedido' as const, id: p.id, data: p.dataCriacao, total: p.total, itens: p.itens.map(i => `${i.nome} x${i.qtd}`).join(', '), status: p.status, pago: p.pago })),
    ].sort((a, b) => b.data.localeCompare(a.data))

    return (
      <div className="p-4 space-y-4">
        <button onClick={() => setClienteSelecionado(null)} className="text-sm text-primary font-semibold">← Voltar</button>

        {/* Card resumo */}
        <div className="bg-card rounded-2xl border border-accent-light/20 p-5">
          <h2 className="text-xl font-bold text-lumine-ink">{clienteSelecionado.nome}</h2>
          {clienteSelecionado.telefone && <p className="text-sm text-accent-light mt-1">📱 {clienteSelecionado.telefone}</p>}
          {clienteSelecionado.instagram && <p className="text-sm text-accent-light">📷 @{clienteSelecionado.instagram}</p>}
          {clienteSelecionado.observacoes && <p className="text-sm text-lumine-ink/70 mt-2 italic">"{clienteSelecionado.observacoes}"</p>}

          <div className="grid grid-cols-3 gap-3 mt-4">
            <div className="bg-lumine-bg rounded-xl p-3 text-center">
              <p className="text-xs text-accent-light uppercase tracking-wider">Total gasto</p>
              <p className="text-lg font-bold text-lumine-ink">{formatCurrency(hist.totalGasto)}</p>
            </div>
            <div className="bg-lumine-bg rounded-xl p-3 text-center">
              <p className="text-xs text-accent-light uppercase tracking-wider">Compras</p>
              <p className="text-lg font-bold text-lumine-ink">{hist.totalCompras}</p>
            </div>
            <div className="bg-lumine-bg rounded-xl p-3 text-center">
              <p className="text-xs text-accent-light uppercase tracking-wider">Última</p>
              <p className="text-sm font-bold text-lumine-ink">{hist.ultimaCompra ? formatDate(hist.ultimaCompra) : '—'}</p>
            </div>
          </div>
        </div>

        {/* Linha do tempo */}
        <div className="bg-card rounded-2xl border border-accent-light/20 p-5">
          <p className="text-sm text-accent-light font-medium uppercase tracking-wider mb-3">Histórico</p>
          {linhaDoTempo.length === 0 ? (
            <p className="text-center text-accent-light text-sm py-4">Nenhuma compra ainda</p>
          ) : (
            <div className="space-y-2">
              {linhaDoTempo.map(item => (
                <div key={item.id} className="flex items-center gap-3 bg-lumine-bg rounded-xl px-3 py-2.5">
                  <span className="text-lg">{item.tipo === 'venda' ? '🛒' : '📋'}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-accent-light">{formatDate(item.data)}</p>
                    <p className="text-sm text-lumine-ink/70 truncate">{item.itens}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-lumine-ink">{formatCurrency(item.total)}</p>
                    {item.tipo === 'pedido' && (
                      <p className={`text-xs font-medium ${item.status === 'entregue' ? 'text-success' : 'text-warning'}`}>
                        {item.status === 'entregue' ? '✓ Entregue' : '⏳ Pendente'}
                        {!item.pago && ' · Não pago'}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  // Tela de formulário (novo/editar)
  if (mostraForm) return (
    <div className="p-4 space-y-4 max-w-md mx-auto">
      <button onClick={() => setMostraForm(false)} className="text-sm text-primary font-semibold">← Cancelar</button>
      <h2 className="text-lg font-bold text-lumine-ink">{editando ? 'Editar cliente' : 'Novo cliente'}</h2>

      <div className="space-y-3">
        <div>
          <label className="text-xs font-semibold text-accent-light uppercase tracking-wider">Nome *</label>
          <input value={nome} onChange={e => setNome(e.target.value)} placeholder="Nome da cliente"
            className="w-full mt-1 bg-white border border-accent-light/30 rounded-xl px-4 py-2.5 text-sm text-lumine-ink placeholder:text-accent-light/50 focus:outline-none focus:border-primary"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-accent-light uppercase tracking-wider">Telefone</label>
          <input value={telefone} onChange={e => setTelefone(e.target.value)} placeholder="(11) 99999-9999"
            className="w-full mt-1 bg-white border border-accent-light/30 rounded-xl px-4 py-2.5 text-sm text-lumine-ink placeholder:text-accent-light/50 focus:outline-none focus:border-primary"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-accent-light uppercase tracking-wider">Instagram</label>
          <input value={instagram} onChange={e => setInstagram(e.target.value)} placeholder="@usuario (sem @)"
            className="w-full mt-1 bg-white border border-accent-light/30 rounded-xl px-4 py-2.5 text-sm text-lumine-ink placeholder:text-accent-light/50 focus:outline-none focus:border-primary"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-accent-light uppercase tracking-wider">Observações</label>
          <textarea value={observacoes} onChange={e => setObservacoes(e.target.value)} placeholder="Ex: Prefere lavanda, alérgica a citronela..."
            rows={2}
            className="w-full mt-1 bg-white border border-accent-light/30 rounded-xl px-4 py-2.5 text-sm text-lumine-ink placeholder:text-accent-light/50 focus:outline-none focus:border-primary resize-none"
          />
        </div>
        <button onClick={salvar}
          className="w-full py-3 bg-primary text-white rounded-xl font-bold tapable mt-2"
        >
          {editando ? '💾 Salvar' : '✨ Adicionar cliente'}
        </button>
      </div>

      {editando && (
        <button onClick={() => { excluir(editando.id); setMostraForm(false) }}
          className="w-full py-3 text-danger text-sm font-semibold tapable"
        >
          🗑 Excluir cliente
        </button>
      )}
    </div>
  )

  // Lista de clientes
  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-lumine-ink">👥 Clientes</h2>
        <button onClick={abrirNovo}
          className="bg-primary text-white px-4 py-2 rounded-xl text-sm font-bold tapable"
        >
          + Novo
        </button>
      </div>

      {clientesOrdenados.length === 0 ? (
        <div className="text-center py-16 text-accent-light">
          <p className="text-4xl mb-3">👤</p>
          <p className="font-medium">Nenhum cliente cadastrado</p>
          <p className="text-sm mt-1">Cadastre clientes para vincular vendas e pedidos</p>
        </div>
      ) : (
        <div className="space-y-2">
          {clientesOrdenados.map(c => {
            const hist = historicoCliente(data.vendas, data.pedidos, c.id)
            return (
              <button key={c.id} onClick={() => setClienteSelecionado(c)}
                className="w-full bg-card rounded-2xl border border-accent-light/20 p-4 flex items-center gap-3 tapable text-left"
              >
                <div className="w-10 h-10 rounded-full bg-accent-light/20 flex items-center justify-center text-lg shrink-0">
                  {c.nome.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-lumine-ink">{c.nome}</p>
                  {hist.totalCompras > 0 ? (
                    <p className="text-xs text-accent-light">{hist.totalCompras} compras · {formatCurrency(hist.totalGasto)}</p>
                  ) : (
                    <p className="text-xs text-accent-light">Nenhuma compra ainda</p>
                  )}
                </div>
                <span className="text-accent-light text-sm">›</span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}