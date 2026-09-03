import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // ─── Otimizações para Cloudflare 25MB Limit ───────────────────────────────
  productionBrowserSourceMaps: false,

  // Redirects de domínio (non-www → www) são gerenciados pelo Cloudflare na
  // camada de rede via "Custom Domains". Mantê-los aqui causaria loop no Worker.

  async rewrites() {
    return [
      {
        source: '/supabase-images/:path*',
        destination:
          'https://ygdlmathcksuhnybkcpy.supabase.co/storage/v1/object/public/:path*',
      },
    ]
  },

  images: {
    minimumCacheTTL: 2592000,
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 768, 1024, 1280],
    imageSizes: [128, 256, 384],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: 'cdn.colacomigoshop.com.br',
      },
      {
        protocol: 'https',
        hostname: '*.r2.dev',
      },
      {
        protocol: 'https',
        hostname: '*.r2.cloudflarestorage.com',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'via.placeholder.com',
      },
    ],
  },

  // ─── Excluir pacotes pesados do bundle do servidor ───────────────────────
  serverExternalPackages: ['source-map-support', 'sharp', '@aws-sdk/client-s3'],
  
  bundlePagesRouterDependencies: true,

  experimental: {
    optimizePackageImports: [
      '@supabase/supabase-js',
      '@supabase/ssr',
      'zod',
      'react-hook-form',
      'radix-ui',
      'embla-carousel-react',
      'embla-carousel-autoplay',
      '@hookform/resolvers',
      'class-variance-authority',
      'clsx',
      'tailwind-merge',
      'lucide-react',
      'next-themes',
      'zustand',
    ],
  },
  
  turbopack: {
    resolveAlias: {
      '@': './src',
    },
  },
}

export default nextConfig
