// Source de vérité unique pour la structure du planner hebdomadaire.
// Utilisé par components/PrintWeekPages.tsx (affichage site + impression
// navigateur) ET par app/api/export/pdf et app/api/export/word, pour que
// les quatre représentations (site, impression, PDF, Word) montrent
// exactement les mêmes informations, organisées de la même façon.

export interface ScheduleBlockLike {
  id: string
  dayOfWeek: number
  name: string
  startTime: string
  endTime: string
  type: string
  subject?: string | null
  color?: string | null
}

export interface WeekRow {
  startTime: string
  endTime: string
  name: string
  type: string
  fullWidth: boolean
  perDay: Record<number, ScheduleBlockLike | undefined>
}

// Types de blocs qui occupent toute la largeur (partagés entre toutes les
// journées affichées), comme dans le template original : récréation,
// dîners multiples, période d'organisation, accueil/transition.
export const FULL_WIDTH_TYPES = ['Récréation', 'Dîner', 'Organisation', 'Transition', 'Accueil']

// Types d'événements DSFS qui indiquent une journée sans élèves : la
// colonne complète doit alors être grisée, partout (site, impression, PDF,
// Word).
export const NO_STUDENT_TYPES = ['conge', 'pedagogique', 'administrative', 'perfectionnement']

// Convertit "08:15" -> "8h15", "09:00" -> "9h", "14:55" -> "14h55"
export function formatTimeFr(hhmm: string): string {
  const [hStr, mStr] = hhmm.split(':')
  const h = parseInt(hStr, 10)
  return mStr === '00' ? `${h}h` : `${h}h${mStr}`
}

export function isDayOff(
  dsfsEvents: Array<{ date: string | Date; type?: string }>,
  day: Date
): boolean {
  return dsfsEvents.some(e => {
    const d = new Date(e.date)
    return (
      d.getFullYear() === day.getFullYear() &&
      d.getMonth() === day.getMonth() &&
      d.getDate() === day.getDate() &&
      e.type &&
      NO_STUDENT_TYPES.includes(e.type)
    )
  })
}

// Construit les rangées du tableau horaire pour un ensemble de journées
// (ex: [0,1,2] pour Lundi-Mardi-Mercredi, [3,4] pour Jeudi-Vendredi).
// Une rangée = un créneau horaire. Si TOUS les blocs présents à ce créneau
// sont d'un type "pleine largeur" (récré, dîner, organisation...), la
// rangée s'affiche en une seule bande sur toute la largeur. Sinon, chaque
// journée a sa propre cellule pour ce créneau.
export function buildWeekRows(
  blocks: ScheduleBlockLike[],
  dayIndexes: number[]
): WeekRow[] {
  const blocksForDay = (di: number) =>
    blocks.filter(b => b.dayOfWeek === di).sort((a, b) => a.startTime.localeCompare(b.startTime))

  const allBlocks = dayIndexes.flatMap(di => blocksForDay(di))
  const startTimes = Array.from(new Set(allBlocks.map(b => b.startTime))).sort()

  return startTimes.map(st => {
    const perDay: Record<number, ScheduleBlockLike | undefined> = {}
    dayIndexes.forEach(di => {
      perDay[di] = blocksForDay(di).find(b => b.startTime === st)
    })
    const present = Object.values(perDay).filter(Boolean) as ScheduleBlockLike[]
    const reference = present[0]
    const fullWidth = present.length > 0 && present.every(b => FULL_WIDTH_TYPES.includes(b.type))
    return {
      startTime: st,
      endTime: reference?.endTime || st,
      name: reference?.name || '',
      type: reference?.type || '',
      fullWidth,
      perDay
    }
  })
}

export function mondayOf(d: Date): Date {
  const date = new Date(d)
  const day = date.getDay()
  const diff = date.getDate() - day + (day === 0 ? -6 : 1)
  return new Date(date.setDate(diff))
}

export function addDays(d: Date, n: number): Date {
  const r = new Date(d)
  r.setDate(r.getDate() + n)
  return r
}

export function schoolYearMondays(start: Date, end: Date): Date[] {
  const weeks: Date[] = []
  let cursor = mondayOf(start)
  while (cursor <= end) {
    weeks.push(new Date(cursor))
    cursor = addDays(cursor, 7)
  }
  return weeks
}

export function isSameDate(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

export const DAY_NAMES = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche']

// ── Mini-calendrier du mois (colonne latérale, page 2) ─────────────────
// Utilisé par le site, l'impression, le PDF ET le Word pour que le mini-
// calendrier soit identique partout : mêmes 3 raisons de mise en évidence
// (semaine affichée, congé, événement officiel), jamais de surlignage
// arbitraire.
export interface MonthCell {
  day: number | null
  isCurrentWeek: boolean
  isDayOff: boolean
  hasOfficialEvent: boolean
}

export function buildMonthCells(
  monday: Date,
  weekDates: Date[],
  dsfsEvents: Array<{ date: string | Date; type?: string }>
): { monthLabel: Date; cells: MonthCell[] } {
  // Le mois affiché est celui du jeudi de la semaine (milieu de semaine),
  // pour rester cohérent même si la semaine chevauche deux mois.
  const monthDate = addDays(monday, 3)
  const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1)
  const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0)
  const firstWeekday = (monthStart.getDay() + 6) % 7 // 0 = Lundi
  const daysInMonth = monthEnd.getDate()

  const cells: MonthCell[] = []
  for (let i = 0; i < firstWeekday; i++) cells.push({ day: null, isCurrentWeek: false, isDayOff: false, hasOfficialEvent: false })

  for (let day = 1; day <= daysInMonth; day++) {
    const cellDate = new Date(monthDate.getFullYear(), monthDate.getMonth(), day)
    const dayOff = isDayOff(dsfsEvents, cellDate)
    const isCurrentWeek = weekDates.some(w => isSameDate(w, cellDate))
    const hasOfficialEvent = !dayOff && dsfsEvents.some(e => isSameDate(new Date(e.date), cellDate))
    cells.push({ day, isCurrentWeek, isDayOff: dayOff, hasOfficialEvent })
  }

  return { monthLabel: monthDate, cells }
}

export const MONTH_NAMES_FR = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
]

// Ordre par défaut des sections de la colonne latérale (page 2), utilisé
// si l'utilisateur n'a jamais personnalisé l'ordre.
export type SectionKey = 'calendar' | 'notes' | 'surveillances'
export const DEFAULT_SECTIONS_ORDER: SectionKey[] = ['calendar', 'notes', 'surveillances']

// Lit l'ordre des sections personnalisé depuis UserSettings.quickLinks
// (où il est stocké en JSON sous la clé layoutSections), avec repli sur
// l'ordre par défaut si rien n'a été personnalisé. Utilisé côté serveur
// (PDF, Word) pour respecter le même ordre que le site.
export function parseSectionsOrder(quickLinksRaw: string | null | undefined): SectionKey[] {
  if (!quickLinksRaw) return DEFAULT_SECTIONS_ORDER
  try {
    const parsed = JSON.parse(quickLinksRaw)
    if (parsed && Array.isArray(parsed.layoutSections)) {
      const valid = parsed.layoutSections.filter((k: string) => DEFAULT_SECTIONS_ORDER.includes(k as SectionKey))
      if (valid.length === DEFAULT_SECTIONS_ORDER.length) return valid
    }
  } catch {
    // ignore, repli sur l'ordre par défaut
  }
  return DEFAULT_SECTIONS_ORDER
}
