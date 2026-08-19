const fs = require('fs')
const path = require('path')

const rootDir = path.resolve(__dirname, '..')
const workerSrc = path.join(rootDir, '.open-next', 'worker.js')
const assetsDir = path.join(rootDir, '.open-next', 'assets')
const workerDest = path.join(assetsDir, '_worker.js')

console.log('⚡ [PAGES] Preparando _worker.js para Cloudflare Pages...')

if (fs.existsSync(workerSrc)) {
    if (!fs.existsSync(assetsDir)) {
        fs.mkdirSync(assetsDir, { recursive: true })
    }
    fs.copyFileSync(workerSrc, workerDest)
    console.log('✅ [PAGES] _worker.js copiado para .open-next/assets/_worker.js com sucesso!')
} else {
    console.warn('⚠️ [PAGES] .open-next/worker.js não foi encontrado. Verifique a saída do build.')
}
