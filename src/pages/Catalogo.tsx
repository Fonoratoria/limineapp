import { AppData, Produto } from '../types'
import { formatCurrency } from '../store'
import ShareButton from '../components/ShareButton'

interface Props {
  data: AppData
}

export default function Catalogo({ data }: Props) {
  const produtos = data.produtos.filter(p => p.estoque > 0)

  function textoCompartilhar(p: Produto): string {
    let txt = `🕯️ ${p.nome} — ${formatCurrency(p.precoVarejo)}`
    if (p.precoAtacado != null && p.qtdMinimaAtacado != null) {
      txt += `\n📦 Atacado (+${p.qtdMinimaAtacado} un.): ${formatCurrency(p.precoAtacado)} cada`
    }
    txt += `\n\n✨ Feito à mão com amor • Lumine Velas Artesanais`
    return txt
  }

  if (produtos.length === 0) {
    return (
      <div className="p-6 text-center">
        <div className="text-6xl mb-4">🕯️</div>
        <h2 className="text-lg font-bold text-lumine-ink mb-2">Catálogo</h2>
        <p className="text-accent-light">Cadastre produtos primeiro na aba 📦 Produtos</p>
        <p className="text-sm text-accent-light mt-1">Eles aparecerão aqui automaticamente</p>
      </div>
    )
  }

  return (
    <div className="p-4 space-y-4">
      <div className="text-center mb-2">
        <h2 className="text-lg font-bold text-lumine-ink">🕯️ Catálogo Lumine</h2>
        <p className="text-xs text-accent-light">Toque em 📤 para compartilhar um produto</p>
      </div>

      <div className="space-y-4">
        {produtos.map(p => (
          <div key={p.id} className="bg-card rounded-2xl border border-accent-light/20 overflow-hidden shadow-sm">
            {/* Foto grande */}
            {p.foto ? (
              <img src={p.foto} alt={p.nome} className="w-full h-56 object-cover" />
            ) : (
              <div className="w-full h-56 bg-accent-light/10 flex items-center justify-center text-6xl">
                🕯️
              </div>
            )}

            <div className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-lumine-ink">{p.nome}</h3>
                  <p className="text-xs text-accent-light mt-0.5">{p.estoque} disponíveis</p>
                </div>
                <ShareButton texto={textoCompartilhar(p)} className="py-2 px-3 bg-card border border-accent-light/30 rounded-xl text-sm" />
              </div>

              {/* Preços */}
              <div className="flex items-center gap-3 mt-3">
                <div className="bg-primary/5 rounded-xl px-4 py-2 flex-1 text-center">
                  <p className="text-[10px] text-accent-light uppercase">Varejo</p>
                  <p className="text-lg font-bold text-primary">{formatCurrency(p.precoVarejo)}</p>
                </div>

                {p.precoAtacado != null && p.qtdMinimaAtacado != null ? (
                  <div className="bg-success/5 rounded-xl px-4 py-2 flex-1 text-center">
                    <p className="text-[10px] text-accent-light uppercase">Atacado +{p.qtdMinimaAtacado}</p>
                    <p className="text-lg font-bold text-success">{formatCurrency(p.precoAtacado)}</p>
                  </div>
                ) : (
                  <div className="bg-accent-light/5 rounded-xl px-4 py-2 flex-1 text-center">
                    <p className="text-[10px] text-accent-light uppercase">Atacado</p>
                    <p className="text-sm text-accent-light">Sob consulta</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Rodapé */}
      <div className="text-center pt-4 pb-2">
        <p className="text-xs text-accent-light">✨ Velas artesanais feitas com amor</p>
      </div>
    </div>
  )
}