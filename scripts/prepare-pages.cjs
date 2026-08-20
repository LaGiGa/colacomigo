#!/usr/bin/env node
/**
 * prepare-pages.cjs
 *
 * Bundla o .open-next/worker.js (e todos os seus imports) em um único
 * .open-next/assets/_worker.js para deploy no Cloudflare Pages (advanced mode).
 *
 * Isso replica exatamente o que `wrangler deploy` faz internamente, mas
 * em vez de fazer deploy, gera o bundle no diretório de assets do CF Pages.
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const projectRoot = process.cwd();
const workerSrc = path.join(projectRoot, '.open-next', 'worker.js');
const assetsDir = path.join(projectRoot, '.open-next', 'assets');
const workerDst = path.join(assetsDir, '_worker.js');

// Verificar se o worker existe
if (!fs.existsSync(workerSrc)) {
  console.error('❌ .open-next/worker.js não encontrado. Execute opennextjs-cloudflare build primeiro.');
  process.exit(1);
}

// Verificar se o diretório assets existe
if (!fs.existsSync(assetsDir)) {
  console.error('❌ .open-next/assets/ não encontrado. Execute opennextjs-cloudflare build primeiro.');
  process.exit(1);
}

console.log('📦 Bundlando worker.js para Cloudflare Pages...');

const esbuildBin = path.join(projectRoot, 'node_modules', '.bin', 'esbuild');

// esbuild bundla worker.js + todos os imports relativos em um único arquivo ESM
// node:* e cloudflare:* são mantidos como externos (disponíveis no runtime do Worker)
const cmd = [
  `"${esbuildBin}"`,
  `"${workerSrc}"`,
  '--bundle',
  '--format=esm',
  `--outfile="${workerDst}"`,
  '--external:node:*',
  '--external:cloudflare:*',
  '--platform=node',
  '--target=esnext',
  '--log-level=info',
].join(' ');

try {
  execSync(cmd, { stdio: 'inherit', cwd: projectRoot });
  const sizeKB = Math.round(fs.statSync(workerDst).size / 1024);
  console.log(`✅ _worker.js gerado com sucesso! (${sizeKB} KB)`);
} catch (e) {
  console.error('❌ Falha ao bundlar worker.js:', e.message);
  process.exit(1);
}
