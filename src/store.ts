import { AppData, Produto, Venda, Pedido, Cliente, ItemVenda, LancamentoCaixa, TipoLancamento } from './types'
import { v4 as uuid } from 'uuid'

const KEY = 'lumine_v1'

function emptyData(): AppData {
  return { produtos: [], vendas: [], pedidos: [], clientes: [], caixa: [] }
}

export function loadData(): AppData {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  return emptyData()
}

export function saveData(data: AppData): void {
  localStorage.setItem(KEY, JSON.stringify(data))
}

// ====== Helpers de data ======

export function todayStr(): string {
  return new Date().toISOString().split('T')[0]
}

export function nowHora(): string {
  return new Date().toTimeString().slice(0, 5)
}

export function monthStr(offset = 0): string {
  const d = new Date()
  d.setMonth(d.getMonth() + offset)
  return d.toISOString().slice(0, 7)
}

export function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-')
  return `${d}/${m}/${y}`
}

export function formatCurrency(val: number | null | undefined): string {
  if (val == null) return '—'
  return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

// ====== Preço de Atacado ======

/** Calcula o preço unitário correto com base na quantidade:
 *  se tiver preço de atacado E a qtd >= qtd mínima → preço de atacado,
 *  senão → preço de varejo.
 */
export function calcularPrecoUnitario(p: Produto, qtd: number): number {
  if (p.precoAtacado != null && p.qtdMinimaAtacado != null && qtd >= p.qtdMinimaAtacado) {
    return p.precoAtacado
  }
  return p.precoVarejo
}

// ====== Produtos ======

export function addProduto(produtos: Produto[], nome: string, foto: string, custo: number, precoVarejo: number, estoque: number, precoAtacado?: number, qtdMinimaAtacado?: number): Produto[] {
  return [...produtos, { id: uuid(), nome, foto, custo, precoVarejo, estoque, precoAtacado, qtdMinimaAtacado }]
}

export function updateProduto(produtos: Produto[], id: string, dados: Partial<Omit<Produto, 'id'>>): Produto[] {
  return produtos.map(p => p.id === id ? { ...p, ...dados } : p)
}

export function deleteProduto(produtos: Produto[], id: string): Produto[] {
  return produtos.filter(p => p.id !== id)
}

// ====== Vendas ======

export function registrarVenda(vendas: Venda[], itens: ItemVenda[], formaPagamento: string, clienteId?: string, clienteNome?: string): { vendas: Venda[]; venda: Venda } {
  const total = itens.reduce((s, i) => s + i.precoUnit * i.qtd, 0)
  const venda: Venda = {
    id: uuid(),
    data: todayStr(),
    hora: nowHora(),
    itens,
    formaPagamento: formaPagamento as any,
    total,
    clienteId,
    clienteNome,
  }
  return { vendas: [...vendas, venda], venda }
}

// Total vendido num dia
export function totalVendidoDia(vendas: Venda[], data: string): number {
  return vendas.filter(v => v.data === data).reduce((s, v) => s + v.total, 0)
}

// Total vendido num mês
export function totalVendidoMes(vendas: Venda[], mes: string): number {
  return vendas.filter(v => v.data.startsWith(mes)).reduce((s, v) => s + v.total, 0)
}

// Custo total das vendas num mês (soma os custos dos produtos vendidos)
export function custoVendasMes(vendas: Venda[], produtos: Produto[], mes: string): number {
  const prodMap = new Map(produtos.map(p => [p.id, p.custo]))
  return vendas
    .filter(v => v.data.startsWith(mes))
    .reduce((s, v) => {
      return s + v.itens.reduce((sum, i) => sum + (prodMap.get(i.produtoId) ?? 0) * i.qtd, 0)
    }, 0)
}

// Margem de lucro bruto no mês
export function margemLucroMes(vendas: Venda[], produtos: Produto[], mes: string): { receita: number; custo: number; lucro: number; margem: number } {
  const receita = totalVendidoMes(vendas, mes)
  const custo = custoVendasMes(vendas, produtos, mes)
  const lucro = receita - custo
  const margem = receita > 0 ? Math.round((lucro / receita) * 100) : 0
  return { receita, custo, lucro, margem }
}

// Ranking de vendas no mês (por produto)
export function rankingProdutosMes(vendas: Venda[], produtos: Produto[], mes: string): { id: string; nome: string; qtd: number; receita: number }[] {
  const mapa = new Map<string, { nome: string; qtd: number; receita: number }>()
  const prodMap = new Map(produtos.map(p => [p.id, p.nome]))
  for (const v of vendas.filter(v => v.data.startsWith(mes))) {
    for (const i of v.itens) {
      const nome = prodMap.get(i.produtoId) ?? i.nome
      const entry = mapa.get(i.produtoId) ?? { nome, qtd: 0, receita: 0 }
      entry.qtd += i.qtd
      entry.receita += i.precoUnit * i.qtd
      mapa.set(i.produtoId, entry)
    }
  }
  return Array.from(mapa.entries())
    .map(([id, e]) => ({ id, ...e }))
    .sort((a, b) => b.receita - a.receita)
}

// ====== Pedidos ======

export function addPedido(pedidos: Pedido[], nomeCliente: string, dataEntrega: string, itens: { produtoId: string; nome: string; qtd: number; precoUnit: number }[], clienteId?: string): Pedido[] {
  const total = itens.reduce((s, i) => s + i.precoUnit * i.qtd, 0)
  return [...pedidos, {
    id: uuid(),
    nomeCliente,
    dataCriacao: todayStr(),
    dataEntrega,
    itens,
    total,
    status: 'pendente',
    pago: false,
    clienteId,
  }]
}

export function marcarEntregue(pedidos: Pedido[], id: string): Pedido[] {
  return pedidos.map(p => p.id === id ? { ...p, status: 'entregue' } : p)
}

export function pedidosPendentesHoje(pedidos: Pedido[], data: string): Pedido[] {
  return pedidos.filter(p => p.status === 'pendente' && p.dataEntrega === data)
}

export function produtosEstoqueBaixo(produtos: Produto[]): Produto[] {
  return produtos.filter(p => p.estoque <= 1)
}

// ====== Caixa (Receitas e Despesas) ======

export function addLancamento(caixa: LancamentoCaixa[], descricao: string, valor: number, tipo: TipoLancamento, data: string, categoria?: string): LancamentoCaixa[] {
  return [...caixa, { id: uuid(), descricao, valor, tipo, data, categoria }]
}

export function deleteLancamento(caixa: LancamentoCaixa[], id: string): LancamentoCaixa[] {
  return caixa.filter(l => l.id !== id)
}

export function caixaDoMes(caixa: LancamentoCaixa[], mes: string): LancamentoCaixa[] {
  return caixa.filter(l => l.data.startsWith(mes))
}

export function totalReceitasMes(caixa: LancamentoCaixa[], mes: string): number {
  return caixa.filter(l => l.tipo === 'receita' && l.data.startsWith(mes)).reduce((s, l) => s + l.valor, 0)
}

export function totalDespesasMes(caixa: LancamentoCaixa[], mes: string): number {
  return caixa.filter(l => l.tipo === 'despesa' && l.data.startsWith(mes)).reduce((s, l) => s + l.valor, 0)
}

export function saldoMes(caixa: LancamentoCaixa[], mes: string): number {
  return totalReceitasMes(caixa, mes) - totalDespesasMes(caixa, mes)
}

// Lista de meses que têm lançamentos (para navegação)
export function mesesComLancamentos(caixa: LancamentoCaixa[]): string[] {
  const set = new Set(caixa.map(l => l.data.slice(0, 7)))
  const meses = Array.from(set).sort((a, b) => b.localeCompare(a)) // mais recente primeiro
  return meses
}

// ====== Clientes ======

export function addCliente(clientes: Cliente[], nome: string, telefone?: string, instagram?: string, observacoes?: string): Cliente[] {
  return [...clientes, {
    id: uuid(),
    nome,
    telefone: telefone || undefined,
    instagram: instagram || undefined,
    observacoes: observacoes || undefined,
    criadoEm: todayStr(),
  }]
}

export function updateCliente(clientes: Cliente[], id: string, dados: Partial<Omit<Cliente, 'id' | 'criadoEm'>>): Cliente[] {
  return clientes.map(c => c.id === id ? { ...c, ...dados } : c)
}

export function deleteCliente(clientes: Cliente[], id: string): Cliente[] {
  return clientes.filter(c => c.id !== id)
}

// Histórico de compras de um cliente (vendas + pedidos)
export function historicoCliente(vendas: Venda[], pedidos: Pedido[], clienteId: string): {
  totalGasto: number
  totalCompras: number
  ultimaCompra: string | null
  vendas: Venda[]
  pedidos: Pedido[]
} {
  const vendasCliente = vendas.filter(v => v.clienteId === clienteId)
  const pedidosCliente = pedidos.filter(p => p.clienteId === clienteId)

  const totalGasto = vendasCliente.reduce((s, v) => s + v.total, 0) +
    pedidosCliente.filter(p => p.pago).reduce((s, p) => s + p.total, 0)

  const datas: string[] = [
    ...vendasCliente.map(v => v.data),
    ...pedidosCliente.map(p => p.dataCriacao),
  ]
  datas.sort()
  const ultimaCompra = datas.length > 0 ? datas[datas.length - 1] : null

  return {
    totalGasto,
    totalCompras: vendasCliente.length + pedidosCliente.length,
    ultimaCompra,
    vendas: vendasCliente,
    pedidos: pedidosCliente,
  }
}