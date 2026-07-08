import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

// Helper de shadcn: combina clases condicionales (clsx) y resuelve conflictos
// de Tailwind (tailwind-merge). Ej: cn('p-2', isActive && 'bg-spotify', props.className)
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
