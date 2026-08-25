import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyToken, getTokenFromRequest } from '@/lib/auth'
import { Document, Packer, Paragraph, Table, TableCell, TableRow, BorderStyle, WidthType, HeadingLevel, AlignmentType, VerticalAlign, TextRun, PageBreak } from 'docx'
import {
  buildWeekRows,
  formatTimeFr,
  isDayOff,
  mondayOf,
  addDays,
  schoolYearMondays,
  isSameDate,
  DAY_NAMES,
  buildMonthCells,
  parseSectionsOrder,
  MONTH_NAMES_FR,
  type WeekRow,
  type SectionKey
} from '@/lib/weekPlanner'

const HOLIDAY_GRAY_HEX = 'F3F3F1'
const HEADER_BG_HEX = 'F7F5F1'
const BORDER = { style: BorderStyle.SINGLE, size: 1, color: '999999' }

export async function POST(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request) || request.cookies.get('token')?.value
    if (!token) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    const payload = await verifyToken(token)
    if (!payload) return NextResponse.json({ error: 'Token invalide' }, { status: 401 })
    const userId = payload.userId

    const body = await request.json()
    const { schoolYearId, mode, weekStart } = body

    if (!schoolYearId) {
      return NextResponse.json({ error: 'schoolYearId requis' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({ where: { id: userId } })
    const schoolYear = await prisma.schoolYear.findUnique({ where: { id: schoolYearId } })
    if (!user || !schoolYear) {
      return NextResponse.json({ error: 'Données manquantes' }, { status: 404 })
    }

    const userSettings = await prisma.userSettings.findUnique({ where: { userId } })
    const sectionsOrder = parseSectionsOrder(userSettings?.quickLinks)

    const schedule = await prisma.schedule.findFirst({
      where: { userId, schoolYearId, isDefault: true },
      include: { blocks: true }
    })
    const blocks: any[] = schedule?.blocks || []
    const allEvents: any[] = await prisma.calendarEvent.findMany({ where: { userId, schoolYearId } })
    const allDsfsEvents: any[] = await prisma.dsfsEvent.findMany({ where: { schoolYearId } })
    const allSurveillances: any[] = await prisma.surveillance.findMany({ where: { userId, schoolYearId } })
    const allPlannerEntries: any[] = await prisma.plannerEntry.findMany({ where: { userId, schoolYearId } })

    const startDate = new Date(schoolYear.startDate)
    const endDate = new Date(schoolYear.endDate)

    let mondays: Date[]
    if (mode === 'annee') {
      mondays = schoolYearMondays(startDate, endDate)
    } else if (weekStart) {
      mondays = [mondayOf(new Date(weekStart))]
    } else {
      const today = new Date()
      mondays = [today >= startDate && today <= endDate ? mondayOf(today) : mondayOf(startDate)]
    }

    const children: any[] = [
      new Paragraph({ text: 'Mon Agenda Pédago', heading: HeadingLevel.HEADING_1, alignment: AlignmentType.CENTER, spacing: { after: 100 } }),
      new Paragraph({
        text: mode === 'annee' ? `Année scolaire complète — ${schoolYear.name}` : schoolYear.name,
        heading: HeadingLevel.HEADING_2, alignment: AlignmentType.CENTER, spacing: { after: 100 }
      }),
      new Paragraph({ text: `${user.firstName} ${user.lastName}`, alignment: AlignmentType.CENTER, spacing: { after: 300 } }),
      new Paragraph({ children: [new PageBreak()] })
    ]

    mondays.forEach((monday, weekIdx) => {
      const weekDates = Array.from({ length: 5 }, (_, i) => addDays(monday, i))

      children.push(new Paragraph({
        text: `Semaine du ${weekDates[0].toLocaleDateString('fr-CA')} au ${weekDates[4].toLocaleDateString('fr-CA')}`,
        heading: HeadingLevel.HEADING_2, spacing: { after: 150 }
      }))

      // PAGE 1 : Lundi, Mardi, Mercredi
      children.push(scheduleTable(blocks, [0, 1, 2], weekDates, allDsfsEvents, allPlannerEntries))
      children.push(dayInfoParagraphs([0, 1, 2], weekDates, allDsfsEvents, allEvents))
      children.push(new Paragraph({ children: [new PageBreak()] }))

      // PAGE 2 : Jeudi, Vendredi
      children.push(scheduleTable(blocks, [3, 4], weekDates, allDsfsEvents, allPlannerEntries))
      children.push(dayInfoParagraphs([3, 4], weekDates, allDsfsEvents, allEvents))

      // Colonne latérale : ordre personnalisable (calendrier/notes/surveillances),
      // Cliniques suit toujours les Notes, comme dans le template original.
      sectionsOrder.forEach(key => {
        if (key === 'calendar') {
          children.push(...monthCalendarTable(monday, weekDates, allDsfsEvents))
        } else if (key === 'notes') {
          children.push(new Paragraph({ text: 'Notes de la semaine', heading: HeadingLevel.HEADING_3, spacing: { before: 200, after: 80 } }))
          for (let i = 0; i < 4; i++) children.push(new Paragraph({ text: '_'.repeat(70), spacing: { after: 40 } }))
          children.push(new Paragraph({ text: 'Cliniques / évaluations', heading: HeadingLevel.HEADING_3, spacing: { before: 150, after: 80 } }))
          for (let i = 0; i < 3; i++) children.push(new Paragraph({ text: '→ ' + '_'.repeat(60), spacing: { after: 40 } }))
        } else if (key === 'surveillances') {
          children.push(new Paragraph({ text: 'Surveillances', heading: HeadingLevel.HEADING_3, spacing: { before: 150, after: 80 } }))
          ;['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi'].forEach((label, di) => {
            const day = weekDates[di]
            const dayEntries = allSurveillances.filter((s: any) => isSameDate(new Date(s.date), day))
            const text = dayEntries.length > 0
              ? dayEntries.map((s: any) => `${s.time ? s.time + ' ' : ''}${s.title}`).join(', ')
              : ''
            children.push(new Paragraph({ text: `${label} : ${text}`, spacing: { after: 40 } }))
          })
        }
      })

      if (weekIdx < mondays.length - 1) {
        children.push(new Paragraph({ children: [new PageBreak()] }))
      }
    })

    const doc = new Document({ sections: [{ children }] })
    const buffer = await Packer.toBuffer(doc)

    const filename = mode === 'annee'
      ? `Mon-Agenda-Pedago_${schoolYear.name}_annee-complete.docx`
      : `Mon-Agenda-Pedago_semaine-${mondays[0].toISOString().split('T')[0]}.docx`

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="${filename}"`
      }
    })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

function scheduleTable(blocks: any[], dayIndexes: number[], weekDates: Date[], dsfsEvents: any[], plannerEntries: any[]): Table {
  const rows: WeekRow[] = buildWeekRows(blocks, dayIndexes)
  const cols = dayIndexes.length

  const headerRow = new TableRow({
    children: [
      new TableCell({ children: [new Paragraph('')], shading: { fill: HEADER_BG_HEX } }),
      ...dayIndexes.map(di => {
        const day = weekDates[di]
        const dayOff = isDayOff(dsfsEvents, day)
        return new TableCell({
          children: [new Paragraph({ children: [new TextRun({ text: `${DAY_NAMES[di]} ${day.getDate()}`, bold: true })] })],
          shading: { fill: dayOff ? HOLIDAY_GRAY_HEX : HEADER_BG_HEX }
        })
      })
    ]
  })

  const bodyRows = rows.map(row => {
    if (row.fullWidth) {
      return new TableRow({
        children: [
          new TableCell({
            children: [new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [new TextRun({ text: `${row.name} — ${formatTimeFr(row.startTime)} à ${formatTimeFr(row.endTime)}`, bold: true })]
            })],
            columnSpan: cols + 1,
            shading: { fill: HEADER_BG_HEX }
          })
        ]
      })
    }

    return new TableRow({
      children: [
        new TableCell({
          children: [
            new Paragraph({ children: [new TextRun({ text: row.name, bold: true })] }),
            new Paragraph({ children: [new TextRun({ text: `${formatTimeFr(row.startTime)} à ${formatTimeFr(row.endTime)}`, size: 16, color: '666666' })] })
          ],
          shading: { fill: HEADER_BG_HEX }
        }),
        ...dayIndexes.map(di => {
          const day = weekDates[di]
          const dayOff = isDayOff(dsfsEvents, day)
          const block = row.perDay[di]
          const dayKey = `${row.startTime}-${row.endTime}`
          const entry = plannerEntries.find((e: any) => isSameDate(new Date(e.date), day) && e.timeBlock === dayKey)
          const paras: Paragraph[] = []
          if (block?.subject) paras.push(new Paragraph({ text: block.subject }))
          if (entry) paras.push(new Paragraph({ children: [new TextRun({ text: entry.title, size: 16, color: '555555' })] }))
          if (paras.length === 0) paras.push(new Paragraph(''))
          return new TableCell({ children: paras, shading: dayOff ? { fill: HOLIDAY_GRAY_HEX } : undefined })
        })
      ]
    })
  })

  return new Table({
    rows: [headerRow, ...bodyRows],
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: BORDER, bottom: BORDER, left: BORDER, right: BORDER,
      insideHorizontal: BORDER, insideVertical: BORDER
    }
  })
}

function monthCalendarTable(monday: Date, weekDates: Date[], dsfsEvents: any[]): any[] {
  const { monthLabel, cells } = buildMonthCells(monday, weekDates, dsfsEvents)
  const rows: TableRow[] = []

  rows.push(new TableRow({
    children: ['L', 'M', 'M', 'J', 'V', 'S', 'D'].map(d =>
      new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: d, bold: true, size: 14 })] })] })
    )
  }))

  let week: typeof cells = []
  const allWeeks: (typeof cells)[] = []
  cells.forEach(cell => {
    week.push(cell)
    if (week.length === 7) { allWeeks.push(week); week = [] }
  })
  if (week.length > 0) {
    while (week.length < 7) week.push({ day: null, isCurrentWeek: false, isDayOff: false, hasOfficialEvent: false })
    allWeeks.push(week)
  }

  allWeeks.forEach(w => {
    rows.push(new TableRow({
      children: w.map(cell => new TableCell({
        children: [new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({
            text: cell.day ? String(cell.day) + (cell.hasOfficialEvent ? ' •' : '') : '',
            size: 14,
            bold: cell.isCurrentWeek
          })]
        })],
        shading: cell.isDayOff ? { fill: HOLIDAY_GRAY_HEX } : undefined
      }))
    }))
  })

  return [
    new Paragraph({ text: `${MONTH_NAMES_FR[monthLabel.getMonth()]} ${monthLabel.getFullYear()}`, heading: HeadingLevel.HEADING_3, spacing: { before: 200, after: 80 } }),
    new Table({
      rows,
      width: { size: 60, type: WidthType.PERCENTAGE },
      borders: { top: BORDER, bottom: BORDER, left: BORDER, right: BORDER, insideHorizontal: BORDER, insideVertical: BORDER }
    }) as any
  ]
}

function dayInfoParagraphs(dayIndexes: number[], weekDates: Date[], dsfsEvents: any[], events: any[]): Paragraph {
  const lines: string[] = []
  dayIndexes.forEach(di => {
    const day = weekDates[di]
    const dsfsToday = dsfsEvents.filter((e: any) => isSameDate(new Date(e.date), day))
    const eventsToday = events.filter((e: any) => isSameDate(new Date(e.date), day))
    ;[...dsfsToday, ...eventsToday].forEach((e: any) => {
      lines.push(`${DAY_NAMES[di]}: ${e.title}`)
    })
  })
  if (lines.length === 0) return new Paragraph({ text: '', spacing: { after: 100 } })
  return new Paragraph({
    children: lines.map((l, i) => new TextRun({ text: (i > 0 ? '  •  ' : '') + l, size: 16, color: '663366' })),
    spacing: { before: 100, after: 200 }
  })
}
