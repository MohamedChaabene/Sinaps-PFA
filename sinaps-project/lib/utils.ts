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

const AGENT_AVATAR_PALETTES = [
  { bg: "bg-blue-500/15 dark:bg-blue-500/20", text: "text-blue-700 dark:text-blue-300", ring: "ring-blue-500/30" },
  { bg: "bg-emerald-500/15 dark:bg-emerald-500/20", text: "text-emerald-700 dark:text-emerald-300", ring: "ring-emerald-500/30" },
  { bg: "bg-violet-500/15 dark:bg-violet-500/20", text: "text-violet-700 dark:text-violet-300", ring: "ring-violet-500/30" },
  { bg: "bg-amber-500/15 dark:bg-amber-500/20", text: "text-amber-700 dark:text-amber-300", ring: "ring-amber-500/30" },
  { bg: "bg-indigo-500/15 dark:bg-indigo-500/20", text: "text-indigo-700 dark:text-indigo-300", ring: "ring-indigo-500/30" },
  { bg: "bg-rose-500/15 dark:bg-rose-500/20", text: "text-rose-700 dark:text-rose-300", ring: "ring-rose-500/30" },
  { bg: "bg-cyan-500/15 dark:bg-cyan-500/20", text: "text-cyan-700 dark:text-cyan-300", ring: "ring-cyan-500/30" },
]

export function getAgentAvatarColor(identifier?: string): { bg: string; text: string; ring: string } {
  if (!identifier) return AGENT_AVATAR_PALETTES[0]
  let hash = 0
  for (let i = 0; i < identifier.length; i++) {
    hash = (hash << 5) - hash + identifier.charCodeAt(i)
    hash |= 0
  }
  const index = Math.abs(hash) % AGENT_AVATAR_PALETTES.length
  return AGENT_AVATAR_PALETTES[index]
}


/**
 * Safely format a timestamp for display.
 * Handles missing, null, malformed, or invalid date values.
 * Returns "Date inconnue" for invalid/missing timestamps.
 */
export function formatTimestamp(timestamp: any, options?: Intl.DateTimeFormatOptions): string {
  if (!timestamp) return "Date inconnue"
  
  let date: Date
  try {
    date = new Date(timestamp)
    // Check if date is invalid
    if (isNaN(date.getTime())) {
      return "Date inconnue"
    }
  } catch {
    return "Date inconnue"
  }
  
  try {
    return date.toLocaleDateString("fr-FR", options)
  } catch {
    return "Date inconnue"
  }
}

/**
 * Safely format a time for display.
 * Handles missing, null, malformed, or invalid date values.
 * Returns "Date inconnue" for invalid/missing timestamps.
 */
export function formatTime(timestamp: any, options?: Intl.DateTimeFormatOptions): string {
  if (!timestamp) return "Date inconnue"
  
  let date: Date
  try {
    date = new Date(timestamp)
    // Check if date is invalid
    if (isNaN(date.getTime())) {
      return "Date inconnue"
    }
  } catch {
    return "Date inconnue"
  }
  
  try {
    return date.toLocaleTimeString("fr-FR", options)
  } catch {
    return "Date inconnue"
  }
}
