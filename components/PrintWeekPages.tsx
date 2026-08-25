'use client'

import { getDayName, getMonthName, formatDate, getWeekDays, isSameDay, addDays } from '@/lib/utils'
import { HOLIDAY_GRAY, HOLIDAY_GRAY_BORDER } from '@/lib/colors'
import { buildWeekRows, formatTimeFr, NO_STUDENT_TYPES, buildMonthCells, type WeekRow } from '@/lib/weekPlanner'

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
  type?: string
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

type SectionKey = 'notes' | 'calendar' | 'surveillances'

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
  sectionsOrder?: SectionKey[]
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
  primaryColor = '#E79897',
  fonts = {},
  weekNotesValue,
  onWeekNotesChange,
  editable = false,
  sectionsOrder = ['calendar', 'notes', 'surveillances']
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

  // Types DSFS qui indiquent une journée sans élèves : toute la colonne
  // doit alors être grisée (gris très pâle), à l'écran et à l'impression.
  const isDayOff = (day: Date) =>
    dsfsForDay(day).some(e => e.type && NO_STUDENT_TYPES.includes(e.type))

  const showBottomNotes = notesLocation === 'sous' || notesLocation === 'les-deux'
  const showSideNotes = notesLocation === 'cote' || notesLocation === 'les-deux'

  const borderColor = bw ? 'border-black' : 'border-gray-300'
  const headerBg = bw ? '#fff' : '#F7F5F1'

  // Construction des rangées : logique partagée avec les exports PDF/Word
  // (lib/weekPlanner.ts) pour que site, impression, PDF et Word montrent
  // toujours exactement la même chose.
  const buildRows = (dayIndexes: number[]): WeekRow[] => buildWeekRows(schedule?.blocks || [], dayIndexes)

  const ScheduleTable = ({ dayIndexes }: { dayIndexes: number[] }) => {
    const rows = buildRows(dayIndexes)
    const cols = dayIndexes.length

    if (rows.length === 0) {
      return (
        <div className={`border ${borderColor} rounded p-3 text-center text-xs text-gray-400`}>
          Aucun horaire défini pour ces journées. Configure ton horaire dans « Horaire ».
        </div>
      )
    }

    return (
      <table className="w-full border-collapse text-xs table-fixed">
        <thead>
          <tr>
            <th className={`border ${borderColor} p-1 w-[70px]`} style={{ backgroundColor: headerBg }}></th>
            {dayIndexes.map(di => {
              const day = weekDays[di]
              const dayOff = isDayOff(day)
              return (
                <th
                  key={di}
                  className={`border ${borderColor} p-1 text-center font-bold`}
                  style={{
                    backgroundColor: dayOff ? HOLIDAY_GRAY : headerBg,
                    color: !bw ? primaryColor : undefined
                  }}
                >
                  <div style={fonts.days ? { fontFamily: fonts.days } : undefined}>{getDayName(di)}</div>
                  <div className="font-normal text-[10px]" style={fonts.dates ? { fontFamily: fonts.dates } : undefined}>
                    {day.getDate()}
                  </div>
                </th>
              )
            })}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => {
            if (row.fullWidth) {
              return (
                <tr key={ri}>
                  <td
                    colSpan={cols + 1}
                    className={`border ${borderColor} px-2 py-1 text-center font-semibold`}
                    style={{ backgroundColor: headerBg }}
                  >
                    {row.name} — {formatTimeFr(row.startTime)} à {formatTimeFr(row.endTime)}
                  </td>
                </tr>
              )
            }

            return (
              <tr key={ri}>
                <td className={`border ${borderColor} p-1 align-top`} style={{ backgroundColor: headerBg }}>
                  <div className="font-semibold leading-tight" style={fonts.schedule ? { fontFamily: fonts.schedule } : undefined}>{row.name}</div>
                  <div className="text-[9px] text-gray-600 leading-tight">
                    {formatTimeFr(row.startTime)} à {formatTimeFr(row.endTime)}
                  </div>
                </td>
                {dayIndexes.map(di => {
                  const day = weekDays[di]
                  const dayOff = isDayOff(day)
                  const block = row.perDay[di]
                  const dayEntries = entriesForDay(day).filter(e => e.timeBlock === `${row.startTime}-${row.endTime}`)
                  return (
                    <td
                      key={di}
                      className={`border ${borderColor} p-1 align-top h-14`}
                      style={dayOff ? { backgroundColor: HOLIDAY_GRAY } : undefined}
                    >
                      {block?.subject && (
                        <div className="text-[10px] font-medium mb-0.5">{block.subject}</div>
                      )}
                      {dayEntries.map(e => (
                        <div key={e.id} className="text-[10px] text-gray-700">{e.title}</div>
                      ))}
                    </td>
                  )
                })}
              </tr>
            )
          })}
        </tbody>
      </table>
    )
  }

  const DayInfoStrip = ({ dayIndexes }: { dayIndexes: number[] }) => {
    const hasAny = dayIndexes.some(di => dsfsForDay(weekDays[di]).length > 0 || eventsForDay(weekDays[di]).length > 0)
    if (!hasAny) return null
    return (
      <div className="flex gap-1 mt-1">
        {dayIndexes.map(di => {
          const day = weekDays[di]
          return (
            <div key={di} className="flex-1 text-[9px] space-y-0.5">
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
            </div>
          )
        })}
      </div>
    )
  }

  const BottomNotes = ({ dayIndexes }: { dayIndexes: number[] }) => {
    if (!showBottomNotes) return null
    return (
      <div className="flex gap-1 mt-2">
        {dayIndexes.map(di => (
          <div key={di} className={`flex-1 border-t pt-1 ${bw ? 'border-black' : 'border-gray-200'}`}>
            <div className="text-[9px] uppercase tracking-wide text-gray-500 mb-1">Notes</div>
            {[0, 1, 2].map(i => (
              <div key={i} className={`border-b bw-keep-line ${bw ? 'border-black' : 'border-gray-200'}`} style={{ height: '16px' }} />
            ))}
          </div>
        ))}
      </div>
    )
  }

  // ── Mini calendrier du mois ────────────────────────────────────────
  // Utilise la même fonction que PDF et Word (lib/weekPlanner.ts) pour
  // garantir un rendu identique partout : mêmes 3 raisons réelles de
  // surlignage (semaine affichée, congé, événement officiel).
  const { monthLabel: monthDate, cells: sharedMonthCells } = buildMonthCells(monday, weekDays, dsfsEvents)

  const CalendarSection = () => (
    <div className={`border ${borderColor} rounded p-2 print-avoid-break`}>
      <div className="text-center font-bold text-sm mb-1" style={fonts.calendar ? { fontFamily: fonts.calendar } : undefined}>
        {getMonthName(monthDate.getMonth())} {monthDate.getFullYear()}
      </div>
      <div className="grid grid-cols-7 gap-0.5 text-[9px] text-center">
        {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((d, i) => (
          <div key={i} className="font-semibold">{d}</div>
        ))}
        {sharedMonthCells.map((cell, i) => {
          if (!cell.day) return <div key={i} />
          return (
            <div
              key={i}
              className={`relative p-0.5 rounded ${cell.isCurrentWeek ? `border ${bw ? 'border-black' : ''}` : ''}`}
              style={{
                backgroundColor: cell.isDayOff ? HOLIDAY_GRAY : undefined,
                borderColor: cell.isCurrentWeek && !bw ? primaryColor : undefined
              }}
            >
              {cell.day}
              {cell.hasOfficialEvent && (
                <span
                  className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full"
                  style={{ backgroundColor: bw ? '#000' : primaryColor }}
                />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )

  const NotesSection = () => (
    <div className={`border ${borderColor} rounded p-2 print-avoid-break flex-1`}>
      <div className="font-bold text-sm mb-1" style={fonts.titles ? { fontFamily: fonts.titles } : undefined}>Notes de la semaine</div>
      {editable ? (
        <textarea
          className="w-full h-24 text-xs border-0 focus:outline-none resize-none no-print-border"
          style={fonts.notes ? { fontFamily: fonts.notes } : undefined}
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
  )

  const surveillanceWeekdays = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi']
  const surveillancesForWeekdayIndex = (di: number) => {
    const day = weekDays[di]
    return surveillances.filter(s => isSameDay(new Date(s.date), day))
  }

  const SurveillancesSection = () => (
    <div className={`border ${borderColor} rounded p-2 print-avoid-break`}>
      <div className="font-bold text-sm mb-1" style={fonts.titles ? { fontFamily: fonts.titles } : undefined}>Surveillances</div>
      <div className="space-y-1 text-xs">
        {surveillanceWeekdays.map((label, di) => {
          const dayEntries = surveillancesForWeekdayIndex(di)
          return (
            <div key={label} className={`flex gap-1 border-b ${bw ? 'border-black' : 'border-gray-200'} pb-1`}>
              <span className="font-semibold w-14 flex-shrink-0">{label}</span>
              <span className="flex-1 text-gray-700">
                {dayEntries.length > 0
                  ? dayEntries.map(s => `${s.time ? s.time + ' ' : ''}${s.title}${s.location ? ' (' + s.location + ')' : ''}`).join(', ')
                  : ''}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )

  const CliniquesSection = () => (
    <div className={`border ${borderColor} rounded p-2 print-avoid-break`}>
      <div className="font-bold text-sm mb-1" style={fonts.titles ? { fontFamily: fonts.titles } : undefined}>Cliniques / évaluations</div>
      <div className="space-y-2 text-xs">
        {[0, 1, 2, 3, 4].map(i => (
          <div key={i} className="flex items-center gap-1">
            <span>→</span>
            <div className={`flex-1 border-b bw-keep-line ${bw ? 'border-black' : 'border-gray-200'}`} style={{ height: '14px' }} />
          </div>
        ))}
      </div>
    </div>
  )

  const SECTION_COMPONENTS: Record<SectionKey, () => JSX.Element> = {
    calendar: CalendarSection,
    notes: NotesSection,
    surveillances: SurveillancesSection
  }

  return (
    <>
      {/* PAGE 1 : Lundi, Mardi, Mercredi */}
      <div className={`print-page bg-white p-4 ${bw ? 'bw-mode' : ''}`}>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold" style={!bw ? { color: primaryColor } : undefined}>Mon Agenda Pédago</h2>
          <span className="text-sm text-gray-600">
            Semaine du {formatDate(weekDays[0])} au {formatDate(weekDays[4])}
          </span>
        </div>
        <ScheduleTable dayIndexes={[0, 1, 2]} />
        <DayInfoStrip dayIndexes={[0, 1, 2]} />
        <BottomNotes dayIndexes={[0, 1, 2]} />
      </div>

      {/* PAGE 2 : Jeudi, Vendredi + colonne latérale (ordre personnalisable) */}
      <div className={`print-page bg-white p-4 ${bw ? 'bw-mode' : ''}`}>
        <div className="flex gap-3">
          <div className="flex-[2]">
            <ScheduleTable dayIndexes={[3, 4]} />
            <DayInfoStrip dayIndexes={[3, 4]} />
            <BottomNotes dayIndexes={[3, 4]} />
          </div>

          <div className="flex-1 flex flex-col gap-2">
            {sectionsOrder.map(key => (
              <div key={key}>
                {(() => {
                  const Section = SECTION_COMPONENTS[key]
                  return Section ? <Section /> : null
                })()}
                {/* Cliniques/évaluations suit toujours les Notes, comme dans le template original */}
                {key === 'notes' && <div className="mt-2"><CliniquesSection /></div>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
