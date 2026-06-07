import { useState } from 'react'
import { AppData, LancamentoCaixa, TipoLancamento } from '../types'
import {
  formatCurrency, formatDate, monthStr, todayStr,
  totalVendidoMes, margemLucroMes, rankingProdutosMes,
  addLancamento, deleteLancamento, caixaDoMes,
  totalReceitasMes, totalDespesasMes, saldoMes, mesesComLancamentos
} from '../store'
import { useToast } from '../components/Toast'

interface Props {
  data: AppData
  update: (next: AppData) => void
}

const MEDALHAS = ['🥇', '🥈', '🥉']
const PODIO_CORES = ['#D4A017', '#A0A0A0', '#CD7F32']

const CATEGORIAS = ['Material', 'Frete', 'Feira', 'Embalagem', 'Ferramenta', 'Taxa', 'Outro']

const MESES_NOMES: Record<string, string> = {
  '01': 'Janeiro', '02': 'Fevereiro', '03': 'Março', '04': 'Abril',
  '05': 'Maio', '06': 'Junho', '07': 'Julho', '08': 'Agosto',
  '09': 'Setembro', '10': 'Outubro', '11': 'Novembro', '12': 'Dezembro',
}

function nomeMes(mes: string): string {
  const m = mes.slice(5, 7)
  const ano = mes.slice(0, 4)
  return `${MESES_NOMES[m] || m} ${ano}`
}

export default function Financas({ data, update }: Props) {
  const { notify } = useToast()
  const [showForm, setShowForm] = useState(false)
  const [tipoSelecionado, setTipoSelecionado] = useState<TipoLancamento>('receita')
  const [mesSelecionado, setMesSelecionado] = useState(monthStr())

  // Campos do formulário de lançamento
  const [descricao, setDescricao] = useState('')
  const [valor, setValor] = useState('')
  const [dataLanc, setDataLanc] = useState(todayStr())
  const [categoria, setCategoria] = useState('')

  const mes = mesSelecionado
  const faturamento = totalVendidoMes(data.vendas, mes)
  const { receita, custo, lucro, margem } = margemLucroMes(data.vendas, data.produtos, mes)
  const ranking = rankingProdutosMes(data.vendas, data.produtos, mes)

  // Caixa
  const lancamentos = caixaDoMes(data.caixa, mes).sort((a, b) => b.data.localeCompare(a.data))
  const receitasCaixa = totalReceitasMes(data.caixa, mes)
  const despesasCaixa = totalDespesasMes(data.caixa, mes)
  const saldoCaixa = saldoMes(data.caixa, mes)
  const mesesAnteriores = mesesComLancamentos(data.caixa)

  function abrirNovo() {
    setDescricao(''); setValor(''); setDataLanc(todayStr()); setCategoria(''); setTipoSelecionado('receita')
    setShowForm(true)
  }

  function salvarLancamento() {
    if (!descricao.trim()) return
    const v = parseFloat(valor) || 0
    if (v <= 0) { notify('Informe um valor válido!'); return }
    const caixa = addLancamento(data.caixa, descricao.trim(), v, tipoSelecionado, dataLanc, categoria || undefined)
    update({ ...data, caixa })
    notify(`"${descricao}" registrado!`)
    setShowForm(false)
  }

  function removerLancamento(l: LancamentoCaixa) {
    const caixa = deleteLancamento(data.caixa, l.id)
    const prev = data.caixa
    update({ ...data, caixa })
    notify(`"${l.descricao}" removido.`, () => update({ ...data, caixa: prev }))
  }

  // Formulário de novo lançamento
  if (showForm) return (
    <div className="p-4 space-y-4 max-w-md mx-auto">
      <button onClick={() => setShowForm(false)} className="text-sm text-primary font-semibold">← Voltar</button>
      <h2 className="text-lg font-bold text-lumine-ink">+ Novo lançamento</h2>

      {/* Tipo: Receita ou Despesa */}
      <div className="flex gap-2">
        <button onClick={() => setTipoSelecionado('receita')}
          className={`flex-1 py-3 rounded-xl font-semibold tapable text-sm border ${
            tipoSelecionado === 'receita' ? 'bg-success/10 border-success text-success' : 'bg-card border-accent-light/30 text-lumine-ink'
          }`}
        >➕ Receita</button>
        <button onClick={() => setTipoSelecionado('despesa')}
          className={`flex-1 py-3 rounded-xl font-semibold tapable text-sm border ${
            tipoSelecionado === 'despesa' ? 'bg-danger/10 border-danger text-danger' : 'bg-card border-accent-light/30 text-lumine-ink'
          }`}
        >➖ Despesa</button>
      </div>

      <div>
        <p className="text-sm font-medium text-lumine-ink mb-1">Descrição</p>
        <input value={descricao} onChange={e => setDescricao(e.target.value)}
          className="w-full border border-accent-light/40 rounded-xl px-3 py-2 text-sm bg-white"
          placeholder={tipoSelecionado === 'receita' ? 'Ex: Venda feira domingo' : 'Ex: Comprei cera'}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <p className="text-sm font-medium text-lumine-ink mb-1">Valor (R$)</p>
          <input type="number" step="0.01" value={valor} onChange={e => setValor(e.target.value)}
            className="w-full border border-accent-light/40 rounded-xl px-3 py-2 text-sm bg-white" placeholder="0,00"
          />
        </div>
        <div>
          <p className="text-sm font-medium text-lumine-ink mb-1">Data</p>
          <input type="date" value={dataLanc} onChange={e => setDataLanc(e.target.value)}
            className="w-full border border-accent-light/40 rounded-xl px-3 py-2 text-sm bg-white"
          />
        </div>
      </div>

      <div>
        <p className="text-sm font-medium text-lumine-ink mb-1">Categoria <span className="text-[10px] text-accent-light font-normal">(opcional)</span></p>
        <div className="flex flex-wrap gap-1.5">
          {CATEGORIAS.map(cat => (
            <button key={cat} onClick={() => setCategoria(categoria === cat ? '' : cat)}
              className={`text-xs px-2.5 py-1 rounded-full border tapable ${
                categoria === cat ? 'bg-primary text-white border-primary' : 'bg-card border-accent-light/30 text-lumine-ink'
              }`}
            >{cat}</button>
          ))}
        </div>
      </div>

      <button onClick={salvarLancamento} disabled={!descricao.trim()}
        className="w-full py-3 bg-primary text-white rounded-xl font-semibold disabled:opacity-50 tapable">
        💾 Registrar {tipoSelecionado === 'receita' ? 'receita' : 'despesa'}
      </button>
    </div>
  )

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-lg font-bold text-lumine-ink">📊 Finanças</h2>

      {/* ====== RESUMO DE VENDAS DO MÊS ====== */}
      <div className="bg-card rounded-2xl border border-accent-light/20 p-5">
        <p className="text-sm text-accent-light font-medium uppercase tracking-wider">Faturamento do mês</p>
        <p className="text-3xl font-bold text-lumine-ink mt-1">{formatCurrency(faturamento)}</p>
      </div>

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

      {/* ====== CAIXA MENSAL ====== */}
      <div className="bg-card rounded-2xl border border-accent-light/20 p-5">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm text-accent-light font-medium uppercase tracking-wider">🧾 Caixa do mês</p>
          <button onClick={abrirNovo} className="text-xs bg-primary text-white px-3 py-1 rounded-full font-semibold tapable">
            + Novo
          </button>
        </div>

        {/* Seletor de mês */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {([monthStr(), monthStr(-1), monthStr(-2), ...mesesAnteriores.filter(m => m !== monthStr() && m !== monthStr(-1) && m !== monthStr(-2))].slice(0, 6)).map(m => (
            <button key={m} onClick={() => setMesSelecionado(m)}
              className={`text-xs px-2.5 py-1 rounded-full tapable ${
                mesSelecionado === m ? 'bg-primary text-white' : 'bg-accent-light/10 text-lumine-ink'
              }`}
            >{nomeMes(m)}</button>
          ))}
        </div>

        {/* Cards de receitas, despesas e saldo */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="bg-success/5 rounded-xl p-3 text-center">
            <p className="text-[10px] text-success font-medium uppercase">Receitas</p>
            <p className="text-sm font-bold text-success">{formatCurrency(receitasCaixa)}</p>
          </div>
          <div className="bg-danger/5 rounded-xl p-3 text-center">
            <p className="text-[10px] text-danger font-medium uppercase">Despesas</p>
            <p className="text-sm font-bold text-danger">{formatCurrency(despesasCaixa)}</p>
          </div>
          <div className={`rounded-xl p-3 text-center ${saldoCaixa >= 0 ? 'bg-primary/5' : 'bg-danger/10'}`}>
            <p className="text-[10px] font-medium uppercase" style={{ color: saldoCaixa >= 0 ? '#006EB4' : '#DC3545' }}>Saldo</p>
            <p className="text-sm font-bold" style={{ color: saldoCaixa >= 0 ? '#006EB4' : '#DC3545' }}>{formatCurrency(saldoCaixa)}</p>
          </div>
        </div>

        {/* Lista de lançamentos do mês */}
        {lancamentos.length === 0 ? (
          <p className="text-center text-accent-light text-sm py-4">Nenhum lançamento neste mês</p>
        ) : (
          <div className="space-y-1.5">
            {lancamentos.map(l => (
              <div key={l.id} className="flex items-center gap-2 bg-lumine-bg rounded-lg px-3 py-2">
                <span className="text-sm">{l.tipo === 'receita' ? '➕' : '➖'}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{l.descricao}</p>
                  <div className="flex gap-2 text-[10px] text-accent-light">
                    <span>{formatDate(l.data)}</span>
                    {l.categoria && <span className="bg-accent-light/10 px-1 rounded">{l.categoria}</span>}
                  </div>
                </div>
                <span className={`text-sm font-semibold ${l.tipo === 'receita' ? 'text-success' : 'text-danger'}`}>
                  {l.tipo === 'receita' ? '+' : '−'}{formatCurrency(l.valor)}
                </span>
                <button onClick={() => removerLancamento(l)} className="text-danger text-xs ml-1">✕</button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ====== RANKING PÓDIO ====== */}
      <div className="bg-card rounded-2xl border border-accent-light/20 p-5">
        <p className="text-sm text-accent-light font-medium uppercase tracking-wider mb-4">🏆 Mais vendidos do mês</p>

        {ranking.length === 0 ? (
          <p className="text-center text-accent-light text-sm py-4">Nenhuma venda neste mês ainda</p>
        ) : (
          <div className="space-y-3">
            {ranking.slice(0, 10).map((item, idx) => (
              <div key={item.id} className="flex items-center gap-3">
                <div className="flex items-center gap-2 min-w-[60px]">
                  {idx < 3 ? (
                    <span className="text-xl">{MEDALHAS[idx]}</span>
                  ) : (
                    <span className="w-7 text-center text-sm font-bold text-accent-light">{idx + 1}º</span>
                  )}
                </div>
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