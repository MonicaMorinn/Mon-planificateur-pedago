import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date, format: string = 'dd/MM/yyyy'): string {
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = date.getFullYear()
  
  switch(format) {
    case 'dd/MM/yyyy':
      return `${day}/${month}/${year}`
    case 'yyyy-MM-dd':
      return `${year}-${month}-${day}`
    case 'MM/dd/yyyy':
      return `${month}/${day}/${year}`
    default:
      return `${day}/${month}/${year}`
  }
}

export function formatTime(time: string, format: string = '24h'): string {
  if (!time) return ''
  const [hours, minutes] = time.split(':')
  
  if (format === '12h') {
    const hour = parseInt(hours)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const hour12 = hour % 12 || 12
    return `${hour12}:${minutes} ${ampm}`
  }
  
  return time
}

export function getDayName(dayIndex: number, locale: string = 'fr'): string {
  const days: { [key: string]: string[] } = {
    fr: ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'],
    en: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
  }
  return days[locale]?.[dayIndex] || 'Jour'
}

export function getMonthName(monthIndex: number, locale: string = 'fr'): string {
  const months: { [key: string]: string[] } = {
    fr: ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
         'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'],
    en: ['January', 'February', 'March', 'April', 'May', 'June',
         'July', 'August', 'September', 'October', 'November', 'December']
  }
  return months[locale]?.[monthIndex] || 'Mois'
}

export function timeStringToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}

export function minutesToTimeString(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`
}

export function getDayOfWeek(date: Date): number {
  const day = date.getDay()
  return day === 0 ? 6 : day - 1
}

export function startOfWeek(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  return new Date(d.setDate(diff))
}

export function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

export function endOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0)
}

export function isSameDay(date1: Date, date2: Date): boolean {
  return date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
}

export function addDays(date: Date, days: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

/** Retourne les 5 dates (Lundi à Vendredi) de la semaine contenant `date`. */
export function getWeekDays(date: Date): Date[] {
  const monday = startOfWeek(date)
  return Array.from({ length: 5 }, (_, i) => addDays(monday, i))
}

/**
 * Retourne le lundi de chaque semaine (au moins un jour ouvrable) comprise
 * entre startDate et endDate, dans l'ordre chronologique. Utilise les
 * vraies dates de l'année scolaire — ne génère jamais un nombre fixe de
 * semaines arbitraire.
 */
export function getSchoolYearWeeks(startDate: Date, endDate: Date): Date[] {
  const weeks: Date[] = []
  let cursor = startOfWeek(startDate)
  const end = new Date(endDate)
  while (cursor <= end) {
    weeks.push(new Date(cursor))
    cursor = addDays(cursor, 7)
  }
  return weeks
}

export function toISODate(date: Date): string {
  return date.toISOString().split('T')[0]
}
