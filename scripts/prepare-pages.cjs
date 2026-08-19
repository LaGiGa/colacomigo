const fs = require('fs')
const path = require('path')

const rootDir = path.resolve(__dirname, '..')
const openNextDir = path.join(rootDir, '.open-next')
const assetsDir = path.join(openNextDir, 'assets')

console.log('⚡ [PAGES] Preparando estrutura para Cloudflare Pages...')

if (!fs.existsSync(openNextDir)) {
    console.error('❌ Diretório .open-next não encontrado.')
    process.exit(1)
}

// ─── 1. worker.js → _worker.js ────────────────────────────────────────────
const workerSrc = path.join(openNextDir, 'worker.js')
const workerDest = path.join(assetsDir, '_worker.js')
if (!fs.existsSync(workerSrc)) {
    console.error('❌ .open-next/worker.js não encontrado!')
    process.exit(1)
}
fs.copyFileSync(workerSrc, workerDest)
console.log('✅ worker.js → assets/_worker.js')

// ─── 2. Copiar pastas pequenas que o worker.js referencia diretamente ─────
// cloudflare/ e middleware/ são pequenos e autocontidos
const smallDirs = ['cloudflare', 'middleware']
for (const dir of smallDirs) {
    const src = path.join(openNextDir, dir)
    if (!fs.existsSync(src)) {
        console.warn(`⚠️  ${dir}/ não encontrado, pulando...`)
        continue
    }
    const dest = path.join(assetsDir, dir)
    fs.cpSync(src, dest, { recursive: true, dereference: true, force: true })
    console.log(`✅ ${dir}/ → assets/${dir}/`)
}

// ─── 3. Copiar apenas os arquivos JS de .build/durable-objects ─────────────
// (já são bundles autocontidos — sem node_modules)
const buildSrc = path.join(openNextDir, '.build', 'durable-objects')
const buildDest = path.join(assetsDir, '.build', 'durable-objects')
if (fs.existsSync(buildSrc)) {
    fs.mkdirSync(buildDest, { recursive: true })
    for (const file of fs.readdirSync(buildSrc)) {
        if (file.endsWith('.js')) {
            fs.copyFileSync(
                path.join(buildSrc, file),
                path.join(buildDest, file)
            )
        }
    }
    console.log('✅ .build/durable-objects/*.js → assets/.build/durable-objects/')
}

// ─── 4. Copiar APENAS o handler.mjs bundlado (não o node_modules inteiro!) ─
// handler.mjs já foi bundlado pelo esbuild — é autocontido
// Copiar server-functions/default/node_modules causaria estouro do limite de
// 20.000 arquivos do Cloudflare Pages, quebrando o upload dos _next/static/
const handlerSrc = path.join(openNextDir, 'server-functions', 'default', 'handler.mjs')
const handlerDest = path.join(assetsDir, 'server-functions', 'default', 'handler.mjs')
if (fs.existsSync(handlerSrc)) {
    fs.mkdirSync(path.dirname(handlerDest), { recursive: true })
    fs.copyFileSync(handlerSrc, handlerDest)
    console.log('✅ server-functions/default/handler.mjs → assets/server-functions/default/handler.mjs')
} else {
    console.warn('⚠️  handler.mjs não encontrado em server-functions/default/')
}

console.log('\n🚀 [PAGES] Estrutura pronta! _next/static/ está intacto para servir os chunks JS/CSS.')
