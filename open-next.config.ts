import { defineCloudflareConfig } from "@opennextjs/cloudflare";

export default defineCloudflareConfig({
    // ─── Cloudflare Worker Optimization ──────────────────────────────────────
    // Para manter o worker dentro do limite de 3MB, as seguintes otimizações estão ativas:
    // 1. Source Maps desativados em produção (next.config.ts: productionBrowserSourceMaps: false)
    // 2. Tree-shaking de dependências (optimizePackageImports no next.config.ts)
    // 3. Lazy loading de módulos pesados (Mercado Pago, Email)
    // 4. Webpack otimizado com sideEffects: true para remover código morto
});
