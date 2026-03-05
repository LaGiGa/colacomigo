import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/** Combina classes Tailwind sem conflitos */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Formata valor monetário em BRL */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

/** Gera slug a partir de uma string */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}

/** Trunca texto com reticências */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength).trim() + '…'
}
