// Recebe os leads do formulário do site e grava na planilha.
//
// Como instalar (uma vez):
// 1. Crie uma planilha no Google Sheets, em Extensões > Apps Script cole este arquivo inteiro.
// 2. Opcional: preencha NOTIFY_TO com um e-mail que funciona para receber um aviso a cada lead.
// 3. Implantar > Nova implantação > tipo "App da Web".
//    Executar como: "Eu". Quem pode acessar: "Qualquer pessoa". Autorize quando pedir.
// 4. Copie a URL que termina em /exec e coloque em SHEETS_ENDPOINT no src/form.js.
// Ao editar este script depois: Implantar > Gerenciar implantações > editar > Nova versão
// (assim a URL continua a mesma).

const SHEET_NAME = 'Leads'
const NOTIFY_TO = '' // ex.: 'seuemail@gmail.com'; vazio = sem aviso por e-mail

const COLUMNS = [
  ['nome', 'Nome'],
  ['whatsapp', 'WhatsApp'],
  ['email', 'E-mail'],
  ['empresa', 'Empresa'],
  ['segmento', 'Segmento'],
  ['faturamento', 'Faturamento'],
  ['mensagem', 'Objetivo'],
  ['origem', 'Página'],
]

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents)
    if (data._honey) return json({ ok: true }) // bot
    if (!data.nome || !data.email || !data.whatsapp) return json({ ok: false, error: 'missing fields' })

    const lock = LockService.getScriptLock()
    lock.waitLock(10000)
    try {
      getSheet().appendRow([new Date(), ...COLUMNS.map(([key]) => clean(data[key]))])
    } finally {
      lock.releaseLock()
    }

    if (NOTIFY_TO) notify(data)
    return json({ ok: true })
  } catch (err) {
    console.error(err)
    return json({ ok: false, error: String(err) })
  }
}

function getSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet()
  let sheet = ss.getSheetByName(SHEET_NAME)
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME)
    sheet.appendRow(['Data', ...COLUMNS.map(([, title]) => title)])
    sheet.setFrozenRows(1)
    sheet.getRange(1, 1, 1, COLUMNS.length + 1).setFontWeight('bold')
  }
  return sheet
}

// Limita o tamanho e impede que um valor vire fórmula na planilha.
function clean(value) {
  const s = String(value == null ? '' : value).trim().slice(0, 2000)
  return /^[=+\-@]/.test(s) ? `'${s}` : s
}

function notify(data) {
  try {
    const body = COLUMNS.map(([key, title]) => `${title}: ${data[key] || '-'}`).join('\n')
    MailApp.sendEmail({
      to: NOTIFY_TO,
      replyTo: data.email,
      subject: `Novo lead pelo site: ${data.empresa || data.nome}`,
      body: `${body}\n\nPlanilha: ${SpreadsheetApp.getActiveSpreadsheet().getUrl()}`,
    })
  } catch (err) {
    console.error('notify', err) // o lead já está salvo; o aviso é só um extra
  }
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON)
}
