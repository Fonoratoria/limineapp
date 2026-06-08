/**
 * Code.gs — Backend do App Lumine (Google Apps Script)
 */

const APP_TOKEN = 'lumine_7Xk2Mp9Qw3Zt5Rn8Lv4Bc6Yd1Hs0Jf'
const SHEET_NAME = '_app'
const CELL_REF = 'A1'
const SPREADSHEET_ID = '1u3qGJbMGqQcQaHn0uenKJjsi7i95uy_HP1Us6WlaNGI'

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
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID)
  let sheet = ss.getSheetByName(SHEET_NAME)
  if (!sheet) {
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
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID)
  let sheet = ss.getSheetByName(SHEET_NAME)
  if (!sheet) { sheet = ss.insertSheet(SHEET_NAME); sheet.getRange(CELL_REF).setValue('') }
  sheet.getRange(CELL_REF).setValue(JSON.stringify(data))
  return json({ ok: true })
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON)
}

function error(msg) {
  return json({ ok: false, error: msg })
}
