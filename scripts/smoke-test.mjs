#!/usr/bin/env node
// Smoke tests pós-deploy — sem dependências (usa fetch nativo do Node >= 18).
//
// Uso:
//   node scripts/smoke-test.mjs <url-base>
//   npm run smoke -- https://tomo-do-aventureiro-react-app.vercel.app
//
// Verifica o mínimo para considerar um deploy "vivo":
//   1. GET /                     -> 200
//   2. HTML tem <div id="root">  (app montou o ponto de entrada)
//   3. HTML tem <title>Tomo do Aventureiro</title>
//   4. o primeiro bundle /assets/*.js referenciado no HTML responde 200
//   5. rota profunda inexistente -> 200 (fallback SPA do vercel.json, não 404)
//
// Sai com código 0 se tudo passar, 1 caso contrário. Reexecuta com backoff
// para tolerar propagação de CDN / cold start logo após o deploy.

const baseUrl = process.argv[2]?.replace(/\/+$/, '')

if (!baseUrl || !/^https?:\/\//.test(baseUrl)) {
  console.error('Uso: node scripts/smoke-test.mjs <url-base>')
  process.exit(2)
}

const MAX_ATTEMPTS = 5
const RETRY_DELAY_MS = 5000
const TIMEOUT_MS = 15000

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function fetchWithTimeout(url, init = {}) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
  try {
    return await fetch(url, { ...init, signal: controller.signal, redirect: 'follow' })
  } finally {
    clearTimeout(timer)
  }
}

async function runChecks() {
  const failures = []
  const pass = (name) => console.log(`  ✓ ${name}`)
  const fail = (name, detail) => {
    console.log(`  ✗ ${name} — ${detail}`)
    failures.push(`${name}: ${detail}`)
  }

  // 1 + 2 + 3 — página inicial
  const rootRes = await fetchWithTimeout(baseUrl + '/')
  if (rootRes.status === 200) pass('GET / responde 200')
  else fail('GET / responde 200', `status ${rootRes.status}`)

  const html = await rootRes.text()
  if (html.includes('<div id="root">')) pass('HTML contém #root')
  else fail('HTML contém #root', 'marcador não encontrado')

  if (html.includes('<title>Tomo do Aventureiro</title>')) pass('HTML contém o <title> esperado')
  else fail('HTML contém o <title> esperado', 'título não encontrado')

  // 4 — bundle principal
  const assetMatch = html.match(/\/assets\/[^"']+\.js/)
  if (assetMatch) {
    const assetUrl = baseUrl + assetMatch[0]
    const assetRes = await fetchWithTimeout(assetUrl)
    if (assetRes.status === 200) pass(`bundle ${assetMatch[0]} responde 200`)
    else fail(`bundle ${assetMatch[0]} responde 200`, `status ${assetRes.status}`)
  } else {
    fail('bundle JS referenciado no HTML', 'nenhum /assets/*.js no HTML')
  }

  // 5 — fallback SPA
  const deepRes = await fetchWithTimeout(baseUrl + '/rota-inexistente-para-smoke-test')
  if (deepRes.status === 200) pass('rota profunda inexistente cai no fallback SPA (200)')
  else fail('fallback SPA', `status ${deepRes.status} (esperado 200)`)

  return failures
}

console.log(`\nSmoke tests em: ${baseUrl}\n`)

for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
  console.log(`Tentativa ${attempt}/${MAX_ATTEMPTS}`)
  let failures
  try {
    failures = await runChecks()
  } catch (err) {
    failures = [`erro de rede: ${err.message}`]
    console.log(`  ✗ requisição falhou — ${err.message}`)
  }

  if (failures.length === 0) {
    console.log('\n✅ Smoke tests passaram.\n')
    process.exit(0)
  }

  if (attempt < MAX_ATTEMPTS) {
    console.log(`\n  ${failures.length} verificação(ões) falharam; nova tentativa em ${RETRY_DELAY_MS / 1000}s...\n`)
    await sleep(RETRY_DELAY_MS)
  } else {
    console.error('\n❌ Smoke tests FALHARAM após todas as tentativas:')
    for (const f of failures) console.error(`   - ${f}`)
    console.error('')
    process.exit(1)
  }
}
