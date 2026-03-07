import type { MetadataRoute } from 'next'

const SITE_URL = 'https://www.colacomigoshop.com.br'

const STATIC_ROUTES = [
    '/',
    '/produtos',
    '/categorias',
    '/colecoes',
    '/marcas',
    '/checkout',
    '/institucional/pagamento-e-frete',
    '/institucional/trocas-e-devolucoes',
    '/institucional/politica-de-privacidade',
]

export default function sitemap(): MetadataRoute.Sitemap {
    const now = new Date()

    return STATIC_ROUTES.map((route) => ({
        url: `${SITE_URL}${route}`,
        lastModified: now,
        changeFrequency: route === '/' ? 'daily' : 'weekly',
        priority: route === '/' ? 1 : 0.7,
    }))
}

