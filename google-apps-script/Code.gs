/**
 * Code.gs — Backend do App Lumine (Google Apps Script)
 *
 * Este código roda dentro da planilha Google que serve de banco de dados.
 * Extensões → Apps Script → colar este código → Implantar → Nova versão.
 *
 * Ações:
 *   get  — lê os dados da aba _app
 *   save — grava os dados na aba _app
 */

// === CONFIGURAÇÃO ===
const APP_TOKEN = 'lumine_7Xk2Mp9Qw3Zt5Rn8Lv4Bc6Yd1Hs0Jf'
const SHEET_NAME = '_app'
const CELL_REF = 'A1'

// === ENTRY POINT (Web App) ===
function doPost(e) {
  const body = JSON.parse(e.postData.contents)
  if (body.token !== APP_TOKEN) return error('token invalido')

  switch (body.action) {
    case 'get':   return handleGet()
    case 'save':  return handleSave(body.data)
    default:      return error('acao desconhecida')
  }
}

function doGet(e) {
  return error('use POST')
}

function handleGet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet()
  let sheet = ss.getSheetByName(SHEET_NAME)
  if (!sheet) {
    // Cria a aba automaticamente no primeiro acesso
    sheet = ss.insertSheet(SHEET_NAME)
    sheet.getRange(CELL_REF).setValue('')
    return json({ ok: true, data: null })
  }
  const raw = sheet.getRange(CELL_REF).getValue()
  if (!raw) return json({ ok: true, data: null })
  try {
    const data = JSON.parse(raw)
    return json({ ok: true, data })
  } catch (e) {
    return error('dados corrompidos')
  }
}

function handleSave(data) {
  const ss = SpreadsheetApp.getActiveSpreadsheet()
  let sheet = ss.getSheetByName(SHEET_NAME)
  if (!sheet) { sheet = ss.insertSheet(SHEET_NAME); sheet.getRange(CELL_REF).setValue('') }
  sheet.getRange(CELL_REF).setValue(JSON.stringify(data))
  return json({ ok: true })
}

// === HELPERS ===
function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON)
}
function error(msg) {
  return json({ ok: false, error: msg })
}