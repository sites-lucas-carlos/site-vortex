// Contact form: validation, phone mask and delivery.
//
// Every lead goes to two places in parallel; the submission counts as sent if either works:
// 1. Google Sheets, through the Apps Script web app in apps-script/leads.gs (the source of truth).
// 2. E-mail via FormSubmit (https://formsubmit.co), no backend needed.
//    IMPORTANT: the first submission sends an activation e-mail to the address below.
//    Someone must click "Activate Form" in that e-mail before leads start arriving.
//    After activation you can swap the address for the random alias FormSubmit provides.
const SHEETS_ENDPOINT = 'https://script.google.com/macros/s/AKfycbzDuK2SeED8qUbqn4jlyG0lXYk4rRd2oCEqcrZK1Bw-YjCoCY5AdT-78E5bF_L2RTnKKg/exec'
const ENDPOINT = 'https://formsubmit.co/ajax/contato@vortexinc.com.br'

const MESSAGES = {
  nome: 'Informe seu nome.',
  whatsapp: 'Informe um WhatsApp válido com DDD.',
  email: 'Informe um e-mail válido.',
  empresa: 'Informe o nome da empresa.',
  segmento: 'Selecione o segmento.',
  faturamento: 'Selecione a faixa de faturamento.',
}

function maskPhone(value) {
  const d = value.replace(/\D/g, '').slice(0, 11)
  if (d.length <= 2) return d.length ? `(${d}` : ''
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
}

// Apps Script answers with a redirect; a text/plain body keeps this a simple request (no CORS preflight).
async function saveToSheet(lead) {
  if (!SHEETS_ENDPOINT) throw new Error('SHEETS_ENDPOINT not set')
  const res = await fetch(SHEETS_ENDPOINT, { method: 'POST', body: JSON.stringify(lead) })
  const json = await res.json().catch(() => ({}))
  if (!res.ok || json.ok !== true) throw new Error(json.error || res.statusText)
}

async function sendEmail(payload) {
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(payload),
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok || String(json.success) !== 'true') throw new Error(json.message || res.statusText)
}

function validate(input) {
  const v = input.value.trim()
  if (input.name === 'whatsapp') {
    const n = v.replace(/\D/g, '').length
    return n === 10 || n === 11
  }
  if (input.name === 'email') return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)
  return v.length > 0
}

export function initForm({ onSuccess } = {}) {
  const form = document.querySelector('[data-form]')
  if (!form) return

  const status = form.querySelector('[data-form-status]')
  const done = form.querySelector('[data-form-done]')
  const submit = form.querySelector('button[type="submit"]')
  const label = form.querySelector('[data-submit-label]')
  const fields = [...form.querySelectorAll('input[required], select[required]')]

  const phone = form.querySelector('[data-phone]')
  phone.addEventListener('input', () => {
    phone.value = maskPhone(phone.value)
  })

  function setError(input, show) {
    const field = input.closest('.field')
    const err = field.querySelector('.field__err')
    field.classList.toggle('is-invalid', show)
    input.setAttribute('aria-invalid', show ? 'true' : 'false')
    err.textContent = show ? MESSAGES[input.name] || 'Campo obrigatório.' : ''
  }

  fields.forEach((input) => {
    const evt = input.tagName === 'SELECT' ? 'change' : 'blur'
    input.addEventListener(evt, () => setError(input, !validate(input)))
    input.addEventListener('input', () => {
      if (input.closest('.field').classList.contains('is-invalid') && validate(input)) setError(input, false)
    })
  })

  form.addEventListener('submit', async (e) => {
    e.preventDefault()
    status.textContent = ''

    const invalid = fields.filter((input) => !validate(input))
    fields.forEach((input) => setError(input, invalid.includes(input)))
    if (invalid.length) {
      invalid[0].focus()
      return
    }

    const data = Object.fromEntries(new FormData(form))
    if (data._honey) return // bot

    const payload = {
      Nome: data.nome,
      WhatsApp: data.whatsapp,
      'E-mail': data.email,
      Empresa: data.empresa,
      Segmento: data.segmento,
      Faturamento: data.faturamento,
      Objetivo: data.mensagem || '-',
      _subject: `Novo lead pelo site: ${data.empresa}`,
      _replyto: data.email,
      _template: 'table',
      _captcha: 'false',
    }

    submit.disabled = true
    label.textContent = 'Enviando...'

    const lead = {
      nome: data.nome,
      whatsapp: data.whatsapp,
      email: data.email,
      empresa: data.empresa,
      segmento: data.segmento,
      faturamento: data.faturamento,
      mensagem: data.mensagem,
      origem: location.href,
    }

    try {
      const results = await Promise.allSettled([saveToSheet(lead), sendEmail(payload)])
      results.forEach((r, i) => r.status === 'rejected' && console.error(['[form] sheets', '[form] email'][i], r.reason))
      if (results.every((r) => r.status === 'rejected')) throw new Error('all deliveries failed')

      form.reset()
      done.hidden = false
      onSuccess?.(done)
      window.dataLayer?.push({ event: 'form_submited_datalayer', segmento: data.segmento, faturamento: data.faturamento })
      window.fbq?.('track', 'Lead')
    } catch (err) {
      console.error('[form]', err.message)
      status.textContent = 'Não foi possível enviar agora. Tente de novo ou escreva para contato@vortexinc.com.br.'
    } finally {
      submit.disabled = false
      label.textContent = 'Quero uma proposta sob medida'
    }
  })
}
