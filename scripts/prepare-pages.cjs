const fs = require('fs')
const path = require('path')

const rootDir = path.resolve(__dirname, '..')
const openNextDir = path.join(rootDir, '.open-next')
const assetsDir = path.join(openNextDir, 'assets')

console.log('⚡ [PAGES] Preparando estrutura completa para Cloudflare Pages...')

if (!fs.existsSync(openNextDir)) {
    console.error('❌ Diretório .open-next não encontrado. Rode opennextjs-cloudflare build primeiro.')
    process.exit(1)
}

// 1. Copiar worker.js → _worker.js (entry point do CF Pages)
const workerSrc = path.join(openNextDir, 'worker.js')
const workerDest = path.join(assetsDir, '_worker.js')
if (!fs.existsSync(workerSrc)) {
    console.error('❌ .open-next/worker.js não encontrado!')
    process.exit(1)
}
fs.copyFileSync(workerSrc, workerDest)
console.log('✅ worker.js → assets/_worker.js')

// 2. Copiar os diretórios de suporte que o _worker.js referencia
//    Usando fs.cpSync com dereference:true para resolver symlinks do node_modules
const dirsToSync = ['cloudflare', 'middleware', '.build', 'server-functions']

for (const dir of dirsToSync) {
    const src = path.join(openNextDir, dir)
    if (!fs.existsSync(src)) {
        console.warn(`⚠️  ${dir}/ não encontrado, pulando...`)
        continue
    }
    const dest = path.join(assetsDir, dir)
    fs.cpSync(src, dest, {
        recursive: true,
        dereference: true,   // resolve symlinks (ex: node_modules scoped packages)
        force: true,
    })
    console.log(`✅ ${dir}/ → assets/${dir}/`)
}

console.log('\n🚀 [PAGES] Estrutura pronta! O Cloudflare Pages resolverá todos os imports.')
