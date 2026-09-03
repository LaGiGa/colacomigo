#!/usr/bin/env node
/**
 * prepare-pages.cjs
 *
 * Prepara o diretório .open-next/assets/ para deploy no Cloudflare Pages (Advanced Mode).
 * 
 * Copia os arquivos de runtime necessários e cria o _worker.js com resolução
 * direta de assets estáticos via env.ASSETS.fetch(), garantindo que chunks JS/CSS
 * e arquivos públicos sejam entregues instantaneamente pela CDN sem erro 404.
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

console.log('📦 Preparando assets e _worker.js para Cloudflare Pages...\n');

// 1. Gerar _worker.js customizado com fallback de assets para Pages
const workerContent = `// Generated for Cloudflare Pages Advanced Mode with Static Asset Support
import { handleCdnCgiImageRequest, handleImageRequest } from "./cloudflare/images.js";
import { runWithCloudflareRequestContext } from "./cloudflare/init.js";
import { maybeGetSkewProtectionResponse } from "./cloudflare/skew-protection.js";
import { handler as middlewareHandler } from "./middleware/handler.mjs";

export { DOQueueHandler } from "./.build/durable-objects/queue.js";
export { DOShardedTagCache } from "./.build/durable-objects/sharded-tag-cache.js";
export { BucketCachePurge } from "./.build/durable-objects/bucket-cache-purge.js";

export default {
    async fetch(request, env, ctx) {
        return runWithCloudflareRequestContext(request, env, ctx, async () => {
            const url = new URL(request.url);

            // 1. Tentar servir assets estáticos diretamente via env.ASSETS se for chunk ou arquivo estático (nunca rotas administrativas ou proxy de imagens)
            if (env.ASSETS && !url.pathname.startsWith('/admin') && !url.pathname.startsWith('/api/admin') && !url.pathname.startsWith('/supabase-images') && (url.pathname.startsWith('/_next/static/') || /\\.[a-zA-Z0-9]+$/.test(url.pathname))) {
                const assetResponse = await env.ASSETS.fetch(request);
                if (assetResponse.status !== 404) {
                    return assetResponse;
                }
            }

            const response = maybeGetSkewProtectionResponse(request);
            if (response) {
                return response;
            }

            // Next image optimization handlers
            if (url.pathname.startsWith("/cdn-cgi/image/")) {
                return handleCdnCgiImageRequest(url, env);
            }
            if (url.pathname === \`\${globalThis.__NEXT_BASE_PATH__ || ''}/_next/image\${globalThis.__TRAILING_SLASH__ ? "/" : ""}\`) {
                return await handleImageRequest(url, request.headers, env);
            }

            // Middleware handler
            const reqOrResp = await middlewareHandler(request, env, ctx);
            if (reqOrResp instanceof Response) {
                return reqOrResp;
            }

            // Next.js Server App Handler
            const { handler } = await import("./server-functions/default/handler.mjs");
            return handler(reqOrResp, env, ctx, request.signal);
        });
    },
};
`;

fs.writeFileSync(path.join(assetsDir, '_worker.js'), workerContent);
console.log('✓ _worker.js gerado com suporte a env.ASSETS');

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

// 6. cloudflare-templates/shims/ → shims de substituição
const n6 = copyDirSync(
  path.join(openNextDir, 'cloudflare-templates', 'shims'),
  path.join(assetsDir, 'cloudflare-templates', 'shims')
);
console.log(`✓ cloudflare-templates/shims/ copiado (${n6} arquivo(s))`);

const total = 1 + n2 + n3 + n4 + n5 + n6;
console.log(`\n✅ Pronto! ${total} arquivos de runtime configurados em assets/ para Cloudflare Pages.`);
