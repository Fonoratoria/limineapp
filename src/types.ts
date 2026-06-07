// ====== App Lumine — Velas Artesanais ======

export type FormaPagamento = 'Pix' | 'Cartão' | 'Dinheiro'

export interface Produto {
  id: string
  nome: string
  foto: string         // base64
  custo: number        // custo de produção
  preco: number        // preço de venda
  estoque: number      // quantidade produzida disponível
}

export interface ItemVenda {
  produtoId: string
  nome: string
  qtd: number
  precoUnit: number    // preço no momento da venda
}

export interface Venda {
  id: string
  data: string         // "YYYY-MM-DD"
  hora: string         // "HH:MM"
  itens: ItemVenda[]
  formaPagamento: FormaPagamento
  total: number
}

export type StatusPedido = 'pendente' | 'entregue'

export interface Pedido {
  id: string
  nomeCliente: string
  dataCriacao: string  // "YYYY-MM-DD"
  dataEntrega: string  // "YYYY-MM-DD"
  itens: { produtoId: string; nome: string; qtd: number; precoUnit: number }[]
  total: number
  status: StatusPedido
  pago: boolean
  formaPagamento?: FormaPagamento
}

export interface AppData {
  produtos: Produto[]
  vendas: Venda[]
  pedidos: Pedido[]
}