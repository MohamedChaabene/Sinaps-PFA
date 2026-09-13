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
