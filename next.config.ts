import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // ─── Otimizações para Cloudflare 25MB Limit ───────────────────────────────
  productionBrowserSourceMaps: false,

  async redirects() {
    return [
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'colacomigoshop.com.br' }],
        destination: 'https://www.colacomigoshop.com.br/:path*',
        permanent: true,
      },
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'colacomigoshop.com' }],
        destination: 'https://www.colacomigoshop.com.br/:path*',
        permanent: true,
      },
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'www.colacomigoshop.com' }],
        destination: 'https://www.colacomigoshop.com.br/:path*',
        permanent: true,
      },
    ]
  },

  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
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
  serverExternalPackages: ['source-map-support', 'sharp'],
  
  bundlePagesRouterDependencies: false,

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
