import { useState } from 'react'
import { useToast } from './Toast'

interface Props {
  texto: string
  rotulo?: string
  className?: string
}

export default function ShareButton({ texto, rotulo, className }: Props) {
  const { notify } = useToast()
  const [showMenu, setShowMenu] = useState(false)

  const comp = async () => {
    // 1. Tenta Web Share API nativa (funciona em mobile)
    if (navigator.share) {
      try {
        await navigator.share({ text: texto })
        return
      } catch {
        // usuário cancelou — não faz nada
        return
      }
    }
    // 2. Fallback: abre menu manual
    setShowMenu(true)
  }

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(texto)
      notify('Copiado!')
    } catch {
      // fallback para navegadores antigos
      const ta = document.createElement('textarea')
      ta.value = texto
      ta.style.position = 'fixed'
      ta.style.opacity = '0'
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
      notify('Copiado!')
    }
    setShowMenu(false)
  }

  const abrirWhatsApp = () => {
    const msg = encodeURIComponent(texto)
    window.open(`https://wa.me/?text=${msg}`, '_blank')
    setShowMenu(false)
  }

  return (
    <>
      <button onClick={comp}
        className={className || 'text-sm text-accent-light tapable'}
      >
        📤 {rotulo || 'Compartilhar'}
      </button>

      {/* Fallback menu (aparece quando navigator.share não existe) */}
      {showMenu && (
        <div className="fixed inset-0 z-50 bg-lumine-ink/30 flex items-end justify-center" onClick={() => setShowMenu(false)}>
          <div className="bg-white rounded-t-3xl w-full max-w-md p-5 space-y-3 animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="w-10 h-1 bg-accent-light/30 rounded-full mx-auto mb-2" />
            <p className="text-sm font-semibold text-lumine-ink text-center">Compartilhar</p>

            <button onClick={abrirWhatsApp}
              className="w-full py-3 bg-[#25D366]/10 border border-[#25D366]/30 rounded-xl flex items-center justify-center gap-2 font-semibold text-[#25D366] tapable"
            >
              💬 Enviar para WhatsApp
            </button>

            <button onClick={copiar}
              className="w-full py-3 bg-card border border-accent-light/30 rounded-xl flex items-center justify-center gap-2 font-semibold text-lumine-ink tapable"
            >
              📋 Copiar texto
            </button>

            <button onClick={() => { setShowMenu(false); comp() }}
              className="w-full py-3 bg-card border border-accent-light/30 rounded-xl flex items-center justify-center gap-2 font-semibold text-lumine-ink tapable"
            >
              🔗 Compartilhar
            </button>

            <button onClick={() => setShowMenu(false)}
              className="w-full py-2 text-accent-light text-sm font-medium tapable"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </>
  )
}