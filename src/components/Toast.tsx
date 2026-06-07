import { createContext, useContext, useState, useCallback, useRef } from 'react'

interface ToastItem {
  id: number
  message: string
  undo?: () => void
}

interface ToastCtx {
  notify: (message: string, undo?: () => void) => void
}

const Ctx = createContext<ToastCtx>({ notify: () => {} })

export function useToast() {
  return useContext(Ctx)
}

let nextId = 0

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const timers = useRef<Map<number, number>>(new Map())

  const dismiss = useCallback((id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id))
    const t = timers.current.get(id)
    if (t) { clearTimeout(t); timers.current.delete(id) }
  }, [])

  const notify = useCallback((message: string, undo?: () => void) => {
    const id = ++nextId
    setToasts(prev => [...prev.slice(-2), { id, message, undo }])
    const t = window.setTimeout(() => dismiss(id), 5000)
    timers.current.set(id, t)
  }, [dismiss])

  return (
    <Ctx.Provider value={{ notify }}>
      {children}
      {/* Container de toasts */}
      <div className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 items-center pointer-events-none">
        {toasts.map(t => (
          <div key={t.id} className="pointer-events-auto bg-lumine-ink text-white px-4 py-2.5 rounded-full shadow-lg flex items-center gap-3 text-sm font-medium animate-[fadeIn_0.2s_ease-out]">
            <span>{t.message}</span>
            {t.undo && (
              <button
                onClick={() => { t.undo!(); dismiss(t.id) }}
                className="text-accent-light hover:text-white font-semibold underline underline-offset-2"
              >
                Desfazer
              </button>
            )}
          </div>
        ))}
      </div>
    </Ctx.Provider>
  )
}