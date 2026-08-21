'use client'

import { getDayName, getMonthName, formatDate, getWeekDays, isSameDay, addDays } from '@/lib/utils'

interface ScheduleBlock {
  id: string
  dayOfWeek: number
  name: string
  startTime: string
  endTime: string
  type: string
  subject?: string
  color?: string
}

interface CalEvent {
  id: string
  title: string
  date: string
  startTime?: string
  color?: string
}

interface PlannerEntry {
  id: string
  date: string
  timeBlock: string
  subject: string
  title: string
  notes?: string
}

interface Surveillance {
  id: string
  title: string
  date: string
  time?: string
  location?: string
  notes?: string
}

interface Props {
  monday: Date
  schedule: { blocks: ScheduleBlock[] } | null
  events: CalEvent[]
  dsfsEvents: CalEvent[]
  plannerEntries: PlannerEntry[]
  surveillances: Surveillance[]
  notesLocation: string // 'aucune' | 'sous' | 'cote' | 'les-deux'
  colorMode: string // 'couleur' | 'noir-et-blanc'
  primaryColor?: string
  fonts?: { days?: string; dates?: string; titles?: string; schedule?: string; events?: string; notes?: string; calendar?: string }
  weekNotesValue?: string
  onWeekNotesChange?: (value: string) => void
  editable?: boolean
}

const DAY_INDEXES = [0, 1, 2, 3, 4] // Lundi..Vendredi

export default function PrintWeekPages({
  monday,
  schedule,
  events,
  dsfsEvents,
  plannerEntries,
  surveillances,
  notesLocation,
  colorMode,
  primaryColor = '#6366f1',
  fonts = {},
  weekNotesValue,
  onWeekNotesChange,
  editable = false
}: Props) {
  const weekDays = getWeekDays(monday)
  const bw = colorMode === 'noir-et-blanc'

  const eventsForDay = (day: Date) =>
    events.filter(e => isSameDay(new Date(e.date), day))
  const dsfsForDay = (day: Date) =>
    dsfsEvents.filter(e => isSameDay(new Date(e.date), day))
  const blocksForDay = (dayIndex: number) =>
    (schedule?.blocks || []).filter(b => b.dayOfWeek === dayIndex)
      .sort((a, b) => a.startTime.localeCompare(b.startTime))
  const entriesForDay = (day: Date) =>
    plannerEntries.filter(e => isSameDay(new Date(e.date), day))

  const showBottomNotes = notesLocation === 'sous' || notesLocation === 'les-deux'
  const showSideNotes = notesLocation === 'cote' || notesLocation === 'les-deux'

  const DayColumn = ({ day, dayIndex }: { day: Date; dayIndex: number }) => (
    <div className={`flex-1 border ${bw ? 'border-black' : 'border-gray-300'} rounded-lg p-2 flex flex-col min-h-[220px]`}>
      <div className={`text-center font-bold mb-1 pb-1 border-b ${bw ? 'border-black' : 'border-gray-300'}`} style={!bw ? { color: primaryColor } : undefined}>
        <div className="text-sm" style={fonts.days ? { fontFamily: fonts.days } : undefined}>{getDayName(dayIndex)}</div>
        <div className="text-xs font-normal" style={fonts.dates ? { fontFamily: fonts.dates } : undefined}>{formatDate(day)}</div>
      </div>

      <div className="flex-1 space-y-1 text-xs overflow-visible">
        {blocksForDay(dayIndex).map(block => (
          <div key={block.id} className={`${bw ? '' : 'bg-opacity-10'} rounded px-1 py-0.5`}
            style={!bw ? { backgroundColor: (block.color || '#6366f1') + '22' } : undefined}>
            <span className="font-semibold">{block.startTime}-{block.endTime}</span> {block.name}
          </div>
        ))}
        {dsfsForDay(day).map(e => (
          <div key={e.id} className={`px-1 py-0.5 rounded font-semibold ${bw ? 'border border-black' : 'bg-pink-100 text-pink-800'}`}>
            🏫 {e.title}
          </div>
        ))}
        {eventsForDay(day).map(e => (
          <div key={e.id} className={`px-1 py-0.5 rounded ${bw ? 'border border-black' : 'bg-indigo-100 text-indigo-800'}`}>
            {e.startTime ? `${e.startTime} ` : ''}{e.title}
          </div>
        ))}
        {entriesForDay(day).map(e => (
          <div key={e.id} className={`px-1 py-0.5 ${bw ? '' : 'text-gray-700'}`}>
            📝 <span className="font-medium">{e.subject}:</span> {e.title}
          </div>
        ))}
      </div>

      {showBottomNotes && (
        <div className={`mt-2 pt-1 border-t ${bw ? 'border-black' : 'border-gray-200'}`}>
          <div className="text-[10px] uppercase tracking-wide text-gray-500 mb-1">Notes</div>
          <div className="h-16 space-y-1.5">
            {[0, 1, 2].map(i => (
              <div key={i} className={`border-b bw-keep-line ${bw ? 'border-black' : 'border-gray-200'}`} style={{ height: '18px' }} />
            ))}
          </div>
        </div>
      )}
    </div>
  )

  // Mini calendrier du mois (mois du lundi de la semaine)
  const monthDate = addDays(monday, 3)
  const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1)
  const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0)
  const firstWeekday = (monthStart.getDay() + 6) % 7 // 0 = Lundi
  const daysInMonth = monthEnd.getDate()
  const monthCells: (number | null)[] = [
    ...Array(firstWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1)
  ]
  const allMonthEvents = [...events, ...dsfsEvents].filter(e => {
    const d = new Date(e.date)
    return d.getMonth() === monthDate.getMonth() && d.getFullYear() === monthDate.getFullYear()
  })

  return (
    <>
      {/* PAGE 1 : Lundi, Mardi, Mercredi */}
      <div className={`print-page bg-white p-4 ${bw ? 'bw-mode' : ''}`}>
        <div className="flex items-center justify-between mb-3">
          <h2 className={`text-lg font-bold ${bw ? '' : 'text-primary'}`}>Mon Agenda Pédago</h2>
          <span className="text-sm text-gray-600">
            Semaine du {formatDate(weekDays[0])} au {formatDate(weekDays[4])}
          </span>
        </div>
        <div className="flex gap-2">
          {[0, 1, 2].map(i => (
            <DayColumn key={i} day={weekDays[i]} dayIndex={DAY_INDEXES[i]} />
          ))}
        </div>
      </div>

      {/* PAGE 2 : Jeudi, Vendredi, Calendrier du mois, Notes, Surveillances */}
      <div className={`print-page bg-white p-4 ${bw ? 'bw-mode' : ''}`}>
        <div className="flex gap-2 mb-3">
          {[3, 4].map(i => (
            <DayColumn key={i} day={weekDays[i]} dayIndex={DAY_INDEXES[i]} />
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3">
          {/* Calendrier du mois */}
          <div className={`border rounded-lg p-2 print-avoid-break ${bw ? 'border-black' : 'border-gray-300'}`}>
            <div className="text-center font-bold text-sm mb-1">
              {getMonthName(monthDate.getMonth())} {monthDate.getFullYear()}
            </div>
            <div className="grid grid-cols-7 gap-0.5 text-[9px] text-center">
              {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((d, i) => (
                <div key={i} className="font-semibold">{d}</div>
              ))}
              {monthCells.map((day, i) => {
                const hasEvent = day && allMonthEvents.some(e => new Date(e.date).getDate() === day)
                const isCurrentWeek = day && weekDays.some(w => w.getDate() === day && w.getMonth() === monthDate.getMonth())
                return (
                  <div key={i} className={`p-0.5 rounded ${isCurrentWeek ? (bw ? 'border border-black' : 'bg-indigo-100') : ''} ${hasEvent && !bw ? 'font-bold text-primary' : ''}`}>
                    {day || ''}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Notes hebdomadaires */}
          <div className={`border rounded-lg p-2 print-avoid-break ${bw ? 'border-black' : 'border-gray-300'}`}>
            <div className="font-bold text-sm mb-1">Notes de la semaine</div>
            {editable ? (
              <textarea
                className="w-full h-24 text-xs border-0 focus:outline-none resize-none no-print-border"
                value={weekNotesValue || ''}
                onChange={(e) => onWeekNotesChange && onWeekNotesChange(e.target.value)}
                placeholder="Écrire ici..."
              />
            ) : (
              <div className="h-24 space-y-2">
                {[0, 1, 2, 3].map(i => (
                  <div key={i} className={`border-b ${bw ? 'border-black' : 'border-gray-200'}`} style={{ height: '16px' }}>
                    {weekNotesValue && i === 0 ? <span className="text-xs">{weekNotesValue}</span> : null}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Surveillances */}
        <div className={`border rounded-lg p-2 mt-3 print-avoid-break ${bw ? 'border-black' : 'border-gray-300'}`}>
          <div className="font-bold text-sm mb-1">Surveillances</div>
          {surveillances.length === 0 ? (
            <p className="text-xs text-gray-400">Aucune surveillance cette semaine.</p>
          ) : (
            <table className="w-full text-xs">
              <thead>
                <tr className={`text-left border-b ${bw ? 'border-black' : 'border-gray-300'}`}>
                  <th className="py-1 pr-2">Date</th>
                  <th className="py-1 pr-2">Heure</th>
                  <th className="py-1 pr-2">Titre</th>
                  <th className="py-1 pr-2">Lieu</th>
                </tr>
              </thead>
              <tbody>
                {surveillances.map(s => (
                  <tr key={s.id} className={`border-b ${bw ? 'border-black' : 'border-gray-100'}`}>
                    <td className="py-1 pr-2">{formatDate(new Date(s.date))}</td>
                    <td className="py-1 pr-2">{s.time || '—'}</td>
                    <td className="py-1 pr-2">{s.title}</td>
                    <td className="py-1 pr-2">{s.location || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  )
}
