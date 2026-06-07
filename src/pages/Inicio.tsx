import { AppData } from '../types'
import { todayStr, totalVendidoDia, pedidosPendentesHoje, produtosEstoqueBaixo, formatCurrency } from '../store'

interface Props {
  data: AppData
  update: (next: AppData) => void
}

export default function Inicio({ data }: Props) {
  const hoje = todayStr()
  const totalHoje = totalVendidoDia(data.vendas, hoje)
  const pendentes = pedidosPendentesHoje(data.pedidos, hoje)
  const baixos = produtosEstoqueBaixo(data.produtos)

  return (
    <div className="p-4 space-y-4">
      {/* Card principal — vendas do dia */}
      <div className="bg-card rounded-2xl shadow-sm border border-accent-light/20 p-6 text-center">
        <p className="text-sm text-accent-light font-medium uppercase tracking-wider">Vendas hoje</p>
        <p className="text-4xl font-bold text-lumine-ink mt-2">{formatCurrency(totalHoje)}</p>
        <p className="text-xs text-accent-light mt-1">{new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
      </div>

      {/* Alertas */}
      <div className="space-y-2">
        {pendentes.length > 0 && (
          <div className="bg-warning/10 border border-warning/30 rounded-xl px-4 py-3 flex items-start gap-3">
            <span className="text-lg">⚠️</span>
            <div>
              <p className="text-sm font-semibold text-warning">
                {pendentes.length} {pendentes.length === 1 ? 'pedido pendente' : 'pedidos pendentes'} para hoje
              </p>
              <p className="text-xs text-lumine-ink/70">
                {pendentes.map(p => p.nomeCliente).join(', ')}
              </p>
            </div>
          </div>
        )}

        {baixos.length > 0 && (
          <div className="bg-danger/10 border border-danger/30 rounded-xl px-4 py-3 flex items-start gap-3">
            <span className="text-lg">📦</span>
            <div>
              <p className="text-sm font-semibold text-danger">
                {baixos.length === 1 ? 'Produto com estoque baixo' : 'Produtos com estoque baixo'}
              </p>
              <p className="text-xs text-lumine-ink/70">
                {baixos.map(p => `${p.nome} (${p.estoque === 0 ? 'zerado' : `só ${p.estoque}`})`).join(', ')}
              </p>
            </div>
          </div>
        )}

        {pendentes.length === 0 && baixos.length === 0 && (
          <div className="bg-success/10 border border-success/30 rounded-xl px-4 py-3 flex items-start gap-3">
            <span className="text-lg">✅</span>
            <p className="text-sm font-semibold text-success">Tudo em ordem! Nenhum alerta hoje.</p>
          </div>
        )}
      </div>
    </div>
  )
}