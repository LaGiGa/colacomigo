#!/usr/bin/env node
/**
 * prepare-pages.cjs
 *
 * Copia apenas os arquivos de RUNTIME necessários do .open-next/ para
 * .open-next/assets/, permitindo que o bundler do Cloudflare Pages (Wrangler)
 * resolva todos os imports — incluindo .wasm — corretamente.
 *
 * Estrutura gerada em assets/:
 *   _worker.js          ← entry point do Worker
 *   cloudflare/         ← runtime do Cloudflare (images, init, skew-protection)
 *   middleware/         ← middleware handler
 *   server-functions/   ← handler.mjs do Next.js (bundlado pelo OpenNext)
 *   .build/             ← Durable Objects
 *   cloudflare-templates/shims/  ← shims de substituição
 */

const fs = require('fs');
const path = require('path');

const projectRoot = process.cwd();
const openNextDir = path.join(projectRoot, '.open-next');
const assetsDir = path.join(openNextDir, 'assets');

function copyDirSync(src, dst, { exclude = [] } = {}) {
  if (!fs.existsSync(src)) {
    console.log(`  ⚠ Diretório não encontrado (pulando): ${path.relative(projectRoot, src)}`);
    return 0;
  }
  fs.mkdirSync(dst, { recursive: true });
  let count = 0;
  for (const entry of fs.readdirSync(src)) {
    if (exclude.includes(entry)) continue;
    const srcPath = path.join(src, entry);
    const dstPath = path.join(dst, entry);
    const stat = fs.lstatSync(srcPath);
    if (stat.isSymbolicLink()) {
      // Resolver symlinks (evita EISDIR)
      const realPath = fs.realpathSync(srcPath);
      const realStat = fs.statSync(realPath);
      if (realStat.isDirectory()) {
        count += copyDirSync(realPath, dstPath, { exclude });
      } else {
        fs.copyFileSync(realPath, dstPath);
        count++;
      }
    } else if (stat.isDirectory()) {
      count += copyDirSync(srcPath, dstPath, { exclude });
    } else {
      fs.copyFileSync(srcPath, dstPath);
      count++;
    }
  }
  return count;
}

console.log('📦 Preparando assets do CF Pages...\n');

// 1. worker.js → assets/_worker.js (entry point do CF Pages advanced mode)
const workerSrc = path.join(openNextDir, 'worker.js');
if (!fs.existsSync(workerSrc)) {
  console.error('❌ .open-next/worker.js não encontrado. Execute opennextjs-cloudflare build primeiro.');
  process.exit(1);
}
fs.copyFileSync(workerSrc, path.join(assetsDir, '_worker.js'));
console.log('✓ _worker.js copiado');

// 2. cloudflare/ → runtime handlers (images, init, skew-protection)
const n2 = copyDirSync(
  path.join(openNextDir, 'cloudflare'),
  path.join(assetsDir, 'cloudflare')
);
console.log(`✓ cloudflare/ copiado (${n2} arquivo(s))`);

// 3. middleware/ → middleware handler
const n3 = copyDirSync(
  path.join(openNextDir, 'middleware'),
  path.join(assetsDir, 'middleware')
);
console.log(`✓ middleware/ copiado (${n3} arquivo(s))`);

// 4. server-functions/default/ → handler do Next.js
//    EXCLUIR .next/ — é apenas o output do build, não é necessário em runtime
//    (handler.mjs já inclui tudo inline via esbuild do OpenNext)
const n4 = copyDirSync(
  path.join(openNextDir, 'server-functions'),
  path.join(assetsDir, 'server-functions'),
  { exclude: ['.next'] }
);
console.log(`✓ server-functions/ copiado (${n4} arquivo(s), sem .next/)`);

// 5. .build/ → Durable Objects
const n5 = copyDirSync(
  path.join(openNextDir, '.build'),
  path.join(assetsDir, '.build')
);
console.log(`✓ .build/ copiado (${n5} arquivo(s))`);

// 6. cloudflare-templates/shims/ → shims de substituição usados como aliases
const n6 = copyDirSync(
  path.join(openNextDir, 'cloudflare-templates', 'shims'),
  path.join(assetsDir, 'cloudflare-templates', 'shims')
);
console.log(`✓ cloudflare-templates/shims/ copiado (${n6} arquivo(s))`);

const total = 1 + n2 + n3 + n4 + n5 + n6;
console.log(`\n✅ Pronto! ${total} arquivos de runtime copiados para assets/`);
console.log('   O bundler do CF Pages (Wrangler) irá resolver os imports restantes.');
