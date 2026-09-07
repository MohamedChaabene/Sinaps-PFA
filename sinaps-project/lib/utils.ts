import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getInitials(name?: string): string {
  if (!name || typeof name !== 'string') return 'CL'
  const parts = name.trim().split(/\s+/)
  if (parts.length === 0 || !parts[0]) return 'CL'
  return parts
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}
