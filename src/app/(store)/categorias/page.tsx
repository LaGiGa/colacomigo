import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Categorias | Cola Comigo Shop',
    description: 'Explore todas as categorias da Cola Comigo Shop: Camisas, Calças, Tênis, Bonés, Bags, Casacos, Short\'s e Chinelos.',
}

const CATEGORIAS = [
    {
        nome: 'Camisas',
        slug: 'camisas',
        descricao: 'Camisas grife e streetwear das melhores marcas.',
        subcategorias: ['Camisa Grife', 'Camisa Streetwear'],
        count: '',
    },
    {
        nome: 'Calças',
        slug: 'calcas',
        descricao: 'Baggy, Cargo, Jogger e muito mais.',
        subcategorias: ['Calça Baggy', 'Calça Cargo', 'Calça Jogger'],
        count: '',
    },
    {
        nome: 'Short\'s',
        slug: 'shorts',
        descricao: 'Bermudas premium para o dia a dia.',
        subcategorias: ['Short Trip Side', 'Short Premium'],
        count: '',
    },
    {
        nome: 'Tênis',
        slug: 'tenis',
        descricao: 'Sneakers das marcas que rolam.',
        subcategorias: ['Nike', 'Adidas', 'New Balance'],
        count: '',
    },
    {
        nome: 'Bonés',
        slug: 'bones',
        descricao: 'Caps e headwear das melhores grrifes.',
        subcategorias: ['Snapback', 'Trucker', 'Bucket Hat'],
        count: '',
    },
    {
        nome: 'Bags',
        slug: 'bags',
        descricao: 'Mochilas, pochetes e bags grife.',
        subcategorias: ['Bag Grife', 'Bag Streetwear'],
        count: '',
    },
    {
        nome: 'Casacos',
        slug: 'casacos',
        descricao: 'Moletons, jaquetas e corta-ventos.',
        subcategorias: ['Moletom', 'Jaqueta', 'Corta-Vento'],
        count: '',
    },
    {
        nome: 'Chinelos',
        slug: 'chinelos',
        descricao: 'Slides e sandálias das melhores marcas.',
        subcategorias: ['Slides', 'Sandálias'],
        count: '',
    },
]

export default function CategoriasPage() {
    return (
        <main className="min-h-screen bg-black">
            {/* Hero da página */}
            <div className="border-b border-white/5 py-16 px-4 sm:px-6 lg:px-8 max-w-[1400px] mx-auto">
                <h1 className="text-[clamp(3rem,7vw,6rem)] font-black tracking-tighter uppercase leading-none text-white">
                    CATEGORIAS
                </h1>
                <p className="text-neutral-500 mt-4 font-bold tracking-widest uppercase text-xs">
                    {CATEGORIAS.length} DEPARTAMENTOS
                </p>
            </div>

            {/* Grid de Categorias */}
            <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {CATEGORIAS.map((cat) => (
                        <Link
                            key={cat.slug}
                            href={`/categorias/${cat.slug}`}
                            className="group relative bg-zinc-950 border border-white/8 p-6 overflow-hidden transition-all duration-500 hover:border-primary/50 flex flex-col min-h-[220px]"
                        >
                            {/* Hover overlay */}
                            <div className="absolute inset-0 bg-primary/5 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out" />

                            {/* Arrow */}
                            <ArrowRight className="absolute top-6 right-6 h-5 w-5 text-neutral-600 opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />

                            <div className="relative z-10 flex flex-col h-full">
                                <h2 className="text-2xl font-black uppercase tracking-tight group-hover:text-primary transition-colors mb-2">
                                    {cat.nome}
                                </h2>
                                <p className="text-xs text-neutral-500 mb-4 leading-relaxed">
                                    {cat.descricao}
                                </p>

                                {/* Subcategorias */}
                                <div className="mt-auto flex flex-wrap gap-1.5">
                                    {cat.subcategorias.map((sub) => (
                                        <span
                                            key={sub}
                                            className="text-[10px] font-bold uppercase tracking-wider text-neutral-600 border border-white/8 px-2 py-0.5"
                                        >
                                            {sub}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </main>
    )
}
