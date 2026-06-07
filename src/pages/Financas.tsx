import { AppData } from '../types'
import { formatCurrency, monthStr, totalVendidoMes, margemLucroMes, rankingProdutosMes } from '../store'

interface Props {
  data: AppData
  update: (next: AppData) => void
}

const MEDALHAS = ['🥇', '🥈', '🥉']
const PODIO_CORES = ['#D4A017', '#A0A0A0', '#CD7F32'] // ouro, prata, bronze

export default function Financas({ data }: Props) {
  const mes = monthStr()
  const faturamento = totalVendidoMes(data.vendas, mes)
  const { receita, custo, lucro, margem } = margemLucroMes(data.vendas, data.produtos, mes)
  const ranking = rankingProdutosMes(data.vendas, data.produtos, mes)

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-lg font-bold text-lumine-ink">📊 Finanças</h2>

      {/* Card faturamento */}
      <div className="bg-card rounded-2xl border border-accent-light/20 p-5">
        <p className="text-sm text-accent-light font-medium uppercase tracking-wider">Faturamento do mês</p>
        <p className="text-3xl font-bold text-lumine-ink mt-1">{formatCurrency(faturamento)}</p>
      </div>

      {/* Margem de lucro */}
      <div className="bg-card rounded-2xl border border-accent-light/20 p-5">
        <p className="text-sm text-accent-light font-medium uppercase tracking-wider">Lucro bruto</p>
        <div className="flex items-end justify-between mt-2">
          <p className={`text-3xl font-bold ${lucro >= 0 ? 'text-success' : 'text-danger'}`}>
            {formatCurrency(lucro)}
          </p>
          <span className={`px-3 py-1 rounded-full text-sm font-bold ${margem >= 30 ? 'bg-success/10 text-success' : margem >= 15 ? 'bg-warning/10 text-warning' : 'bg-danger/10 text-danger'}`}>
            {margem}% margem
          </span>
        </div>
        <div className="flex justify-between text-xs text-accent-light mt-2">
          <span>Receita: {formatCurrency(receita)}</span>
          <span>Custo: {formatCurrency(custo)}</span>
        </div>
      </div>

      {/* Ranking pódio */}
      <div className="bg-card rounded-2xl border border-accent-light/20 p-5">
        <p className="text-sm text-accent-light font-medium uppercase tracking-wider mb-4">🏆 Mais vendidos do mês</p>

        {ranking.length === 0 ? (
          <p className="text-center text-accent-light text-sm py-4">Nenhuma venda neste mês ainda</p>
        ) : (
          <div className="space-y-3">
            {ranking.slice(0, 10).map((item, idx) => (
              <div key={item.id} className="flex items-center gap-3">
                {/* Pódio */}
                <div className="flex items-center gap-2 min-w-[60px]">
                  {idx < 3 ? (
                    <span className="text-xl">{MEDALHAS[idx]}</span>
                  ) : (
                    <span className="w-7 text-center text-sm font-bold text-accent-light">{idx + 1}º</span>
                  )}
                </div>

                {/* Barra de progresso proporcional ao 1º lugar */}
                <div className="flex-1 flex items-center gap-2">
                  <div className="flex-1 h-8 bg-accent-light/10 rounded-lg overflow-hidden relative">
                    <div
                      className="absolute inset-y-0 left-0 rounded-lg transition-all"
                      style={{
                        width: `${ranking[0].receita > 0 ? (item.receita / ranking[0].receita) * 100 : 0}%`,
                        backgroundColor: idx < 3 ? PODIO_CORES[idx] : '#6B7B3A',
                        opacity: idx < 3 ? 0.25 : 0.15,
                      }}
                    />
                    <div className="absolute inset-0 flex items-center px-3">
                      <span className="text-sm font-medium text-lumine-ink truncate">{item.nome}</span>
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-lumine-ink w-20 text-right">
                    {formatCurrency(item.receita)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}