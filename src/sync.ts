import { AppData } from './types'

// Backend no Google Sheets (Apps Script). Sincroniza entre todos os aparelhos.
// ⚠️ Substitua EXEC_URL pela URL gerada ao implantar o Apps Script (veja google-apps-script/Code.gs)
const EXEC_URL = 'https://script.google.com/macros/s/AKfycbyJor79WJlRYCISTA_JuVjq6_SOnUv82LGN2GX7vS4fT0iZFsEJbStuSLW6GuSmcha8/exec'
const TOKEN = 'lumine_7Xk2Mp9Qw3Zt5Rn8Lv4Bc6Yd1Hs0Jf'

export const cloudConfigured = EXEC_URL.length > 0 && TOKEN.length > 0 && !EXEC_URL.includes('EXEMPLO')

export type SyncStatus = 'syncing' | 'synced' | 'offline'

// Reserva: navegador comum (dev/web) usa fetch. POST text/plain evita preflight de CORS.
async function fetchCall(payload: object): Promise<any> {
  const res = await fetch(EXEC_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(payload),
    redirect: 'follow',
  })
  return res.json()
}

async function call(action: string, data?: AppData): Promise<any> {
  return fetchCall({ token: TOKEN, action, data })
}

export type PullResult = { ok: true; data: AppData | null } | { ok: false }

/** Lê os dados da nuvem. ok:false = sem internet / erro. data:null = nuvem vazia. */
export async function pullFromCloud(): Promise<PullResult> {
  try {
    const r = await call('get')
    console.log('[LUMINE SYNC] pullFromCloud resposta:', JSON.stringify(r).slice(0, 200))
    if (r && r.ok) return { ok: true, data: (r.data as AppData) ?? null }
    console.warn('[LUMINE SYNC] pullFromCloud falhou:', r)
    return { ok: false }
  } catch (e) {
    console.error('[LUMINE SYNC] pullFromCloud erro:', e)
    return { ok: false }
  }
}

/** Grava os dados na nuvem. Retorna true se salvou. */
export async function pushToCloud(data: AppData): Promise<boolean> {
  try {
    console.log('[LUMINE SYNC] pushToCloud enviando dados...')
    const r = await call('save', data)
    console.log('[LUMINE SYNC] pushToCloud resposta:', JSON.stringify(r).slice(0, 200))
    return !!(r && r.ok)
  } catch (e) {
    console.error('[LUMINE SYNC] pushToCloud erro:', e)
    return false
  }
}
