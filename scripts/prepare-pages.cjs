const fs = require('fs')
const path = require('path')

const rootDir = path.resolve(__dirname, '..')
const openNextDir = path.join(rootDir, '.open-next')
const assetsDir = path.join(openNextDir, 'assets')

function copyDirRecursive(src, dest) {
    fs.mkdirSync(dest, { recursive: true })
    for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
        const srcPath = path.join(src, entry.name)
        const destPath = path.join(dest, entry.name)
        if (entry.isDirectory()) {
            copyDirRecursive(srcPath, destPath)
        } else {
            fs.copyFileSync(srcPath, destPath)
        }
    }
}

console.log('⚡ [PAGES] Preparando estrutura completa para Cloudflare Pages...')

if (!fs.existsSync(openNextDir)) {
    console.error('❌ Diretório .open-next não encontrado. Rode opennextjs-cloudflare build primeiro.')
    process.exit(1)
}

// 1. Copiar worker.js → _worker.js (entry point do CF Pages)
const workerSrc = path.join(openNextDir, 'worker.js')
const workerDest = path.join(assetsDir, '_worker.js')
if (fs.existsSync(workerSrc)) {
    fs.copyFileSync(workerSrc, workerDest)
    console.log('✅ worker.js → assets/_worker.js')
} else {
    console.error('❌ .open-next/worker.js não encontrado!')
    process.exit(1)
}

// 2. Copiar todos os diretórios de suporte que o _worker.js referencia
//    (exceto 'assets' para evitar recursão infinita)
const dirsToSync = ['cloudflare', 'middleware', '.build', 'server-functions']

for (const dir of dirsToSync) {
    const src = path.join(openNextDir, dir)
    if (fs.existsSync(src)) {
        const dest = path.join(assetsDir, dir)
        copyDirRecursive(src, dest)
        console.log(`✅ ${dir}/ → assets/${dir}/`)
    } else {
        console.warn(`⚠️  ${dir}/ não encontrado, pulando...`)
    }
}

console.log('\n🚀 [PAGES] Estrutura pronta! O Cloudflare Pages resolverá todos os imports.')
