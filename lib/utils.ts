import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return n.toString()
}

export function formatDate(date: string | Date): string {
  const d = new Date(date)
  return d.toLocaleDateString('he-IL', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function timeAgo(date: string | Date): string {
  const diff = Date.now() - new Date(date).getTime()
  const days = Math.floor(diff / 86400000)
  const hours = Math.floor(diff / 3600000)
  const minutes = Math.floor(diff / 60000)

  if (days > 30) return `${Math.floor(days / 30)} חודשים`
  if (days > 0) return `${days} ימים`
  if (hours > 0) return `${hours} שעות`
  if (minutes > 0) return `${minutes} דקות`
  return 'עכשיו'
}
