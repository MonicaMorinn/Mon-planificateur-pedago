import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyToken, getTokenFromRequest } from '@/lib/auth'
import { Document, Packer, Paragraph, Table, TableCell, TableRow, BorderStyle, WidthType, UnderlineType, HeadingLevel, AlignmentType, VerticalAlign, TextRun, PageBreak } from 'docx'

function mondayOf(d: Date) {
  const date = new Date(d)
  const day = date.getDay()
  const diff = date.getDate() - day + (day === 0 ? -6 : 1)
  return new Date(date.setDate(diff))
}
function addDays(d: Date, n: number) {
  const r = new Date(d)
  r.setDate(r.getDate() + n)
  return r
}
function schoolYearMondays(start: Date, end: Date) {
  const weeks: Date[] = []
  let cursor = mondayOf(start)
  while (cursor <= end) {
    weeks.push(new Date(cursor))
    cursor = addDays(cursor, 7)
  }
  return weeks
}

export async function POST(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request) || request.cookies.get('token')?.value
    if (!token) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

    const payload = await verifyToken(token)
    if (!payload) return NextResponse.json({ error: 'Token invalide' }, { status: 401 })

    const body = await request.json()
    const { schoolYearId, mode } = body

    if (!schoolYearId) {
      return NextResponse.json({ error: 'schoolYearId requis' }, { status: 400 })
    }

    // Resolve sections order: payload -> user settings.quickLinks.layoutSections -> default
    let sectionsOrder: ('notes' | 'calendar' | 'surveillances')[] | null = null
    if (body.sectionsOrder && Array.isArray(body.sectionsOrder)) sectionsOrder = body.sectionsOrder
    if (body.layoutSections && Array.isArray(body.layoutSections)) sectionsOrder = body.layoutSections

    const user = await prisma.user.findUnique({ where: { id: payload.userId } })
    const schoolYear = await prisma.schoolYear.findUnique({ where: { id: schoolYearId } })

    if (!user || !schoolYear) {
      return NextResponse.json({ error: 'Données manquantes' }, { status: 404 })
    }

    // If no sectionsOrder from payload, try server settings
    if (!sectionsOrder) {
      const settings = await prisma.userSettings.findUnique({ where: { userId: payload.userId } })
      if (settings && settings.quickLinks) {
        try {
          const q = typeof settings.quickLinks === 'string' ? JSON.parse(settings.quickLinks) : settings.quickLinks
          if (q && Array.isArray(q.layoutSections)) sectionsOrder = q.layoutSections
        } catch (e) {
          // ignore
        }
      }
    }

    const defaultOrder: ('notes' | 'calendar' | 'surveillances')[] = ['calendar', 'notes', 'surveillances']
    const order = sectionsOrder && sectionsOrder.length ? sectionsOrder : defaultOrder

    // Common data used for sections
    const schedule = await prisma.schedule.findFirst({
      where: { userId: payload.userId, schoolYearId, isDefault: true },
      include: { blocks: { orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }] } }
    })
    const scheduleBlocks: any[] = schedule?.blocks || []
    const allEvents: any[] = await prisma.calendarEvent.findMany({ where: { userId: payload.userId, schoolYearId } })
    const allDsfsEvents: any[] = await prisma.dsfsEvent.findMany({ where: { schoolYearId } })
    const allSurveillances: any[] = await prisma.surveillance.findMany({ where: { userId: payload.userId, schoolYearId } })
    const allPlannerEntries: any[] = await prisma.plannerEntry.findMany({ where: { userId: payload.userId, schoolYearId } })

    // Helpers to build nodes
    function buildScheduleTableRows() {
      const DAYS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche']
      const blocsByDay: { [key: number]: any[] } = {}
      scheduleBlocks.forEach(block => {
        if (!blocsByDay[block.dayOfWeek]) blocsByDay[block.dayOfWeek] = []
        blocsByDay[block.dayOfWeek].push(block)
      })

      const rows: TableRow[] = [
        new TableRow({
          children: [
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Jour', bold: true })] })], shading: { fill: 'CCCCCC' } }),
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Heure', bold: true })] })], shading: { fill: 'CCCCCC' } }),
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Matière/Activité', bold: true })] })], shading: { fill: 'CCCCCC' } }),
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Type', bold: true })] })], shading: { fill: 'CCCCCC' } })
          ]
        })
      ]

      Object.keys(blocsByDay).forEach(dayIndex => {
        const day = parseInt(dayIndex)
        const blocks = blocsByDay[day]
        blocks.forEach((block, idx) => {
          rows.push(new TableRow({ children: [
            new TableCell({ children: [new Paragraph(idx === 0 ? DAYS[day] : '')], verticalAlign: VerticalAlign.CENTER }),
            new TableCell({ children: [new Paragraph(`${block.startTime}-${block.endTime}`)], verticalAlign: VerticalAlign.CENTER }),
            new TableCell({ children: [new Paragraph(block.name)], verticalAlign: VerticalAlign.CENTER }),
            new TableCell({ children: [new Paragraph(block.type)], verticalAlign: VerticalAlign.CENTER })
          ] }))
        })
      })

      return rows
    }

    function scheduleSectionNodes() {
      const nodes: any[] = []
      nodes.push(new Paragraph({ text: 'Horaire: ' + (schedule ? schedule.name : 'Aucun horaire défini'), heading: HeadingLevel.HEADING_2, spacing: { before: 400, after: 200 } }))
      if (scheduleBlocks.length > 0) {
        const table = new Table({ rows: buildScheduleTableRows(), width: { size: 100, type: WidthType.PERCENTAGE }, borders: {
          top: { style: BorderStyle.SINGLE, size: 1, color: '000000' }, bottom: { style: BorderStyle.SINGLE, size: 1, color: '000000' }, left: { style: BorderStyle.SINGLE, size: 1, color: '000000' }, right: { style: BorderStyle.SINGLE, size: 1, color: '000000' }, insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' }, insideVertical: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' }
        } })
        nodes.push(table)
      } else {
        nodes.push(new Paragraph({ text: "Aucun bloc d'horaire défini.", spacing: { after: 200 } }))
      }
      return nodes
    }

    function notesSectionNodes() {
      const nodes: any[] = []
      nodes.push(new Paragraph({ text: '\n\nPages de notes', heading: HeadingLevel.HEADING_2, spacing: { before: 200, after: 100 } }))
      nodes.push(new Paragraph({ text: '_'.repeat(80), spacing: { after: 100 } }))
      for (let i = 0; i < 30; i++) nodes.push(new Paragraph({ text: '_'.repeat(80), spacing: { after: 50 } }))
      return nodes
    }

    function surveillancesSectionNodes() {
      const nodes: any[] = []
      nodes.push(new Paragraph({ text: 'Surveillances', heading: HeadingLevel.HEADING_2, spacing: { before: 200, after: 100 } }))
      if (allSurveillances.length === 0) {
        nodes.push(new Paragraph({ text: 'Aucune surveillance cette semaine.', spacing: { after: 100 } }))
      } else {
        allSurveillances.forEach(s => {
          nodes.push(new Paragraph({ text: `${new Date(s.date).toLocaleDateString('fr-CA')}${s.time ? ' ' + s.time : ''} — ${s.title}${s.location ? ' (' + s.location + ')' : ''}`, spacing: { after: 50 } }))
        })
      }
      return nodes
    }

    // Build document children in requested order
    const children: any[] = []
    // Cover
    children.push(new Paragraph({ text: 'Mon Agenda Pédago', heading: HeadingLevel.HEADING_1, alignment: AlignmentType.CENTER, spacing: { after: 200 } }))
    children.push(new Paragraph({ text: schoolYear.name, heading: HeadingLevel.HEADING_2, alignment: AlignmentType.CENTER, spacing: { after: 200 } }))
    children.push(new Paragraph({ text: `${user.firstName} ${user.lastName}`, alignment: AlignmentType.CENTER, spacing: { after: 400 } }))
    if (user.schoolId) children.push(new Paragraph({ text: `École: ${user.schoolId}`, alignment: AlignmentType.CENTER, spacing: { after: 100 } }))
    children.push(new Paragraph({ text: `Généré le ${new Date().toLocaleDateString('fr-FR')}`, alignment: AlignmentType.CENTER, spacing: { after: 400 } }))

    // Append sections in requested order
    for (const key of order) {
      if (key === 'calendar') {
        children.push(...scheduleSectionNodes())
      } else if (key === 'notes') {
        children.push(...notesSectionNodes())
      } else if (key === 'surveillances') {
        children.push(...surveillancesSectionNodes())
      }
    }

    const doc = new Document({ sections: [{ children }] })
    const buffer = await Packer.toBuffer(doc)

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="Mon-Agenda-Pedago_${schoolYear.name}.docx"`
      }
    })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

const DAY_NAMES = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche']

function fmtDate(d: Date) {
  return d.toLocaleDateString('fr-CA') // yyyy-MM-dd
}

async function exportFullYear(userId: string, schoolYearId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } })
  const schoolYear = await prisma.schoolYear.findUnique({ where: { id: schoolYearId } })

  if (!user || !schoolYear || schoolYear.userId !== userId) {
    return NextResponse.json({ error: 'Données manquantes' }, { status: 404 })
  }

  const schedule = await prisma.schedule.findFirst({ where: { userId, schoolYearId, isDefault: true }, include: { blocks: true } })
  const blocks: any[] = schedule?.blocks || []
  const allEvents: any[] = await prisma.calendarEvent.findMany({ where: { userId, schoolYearId } })
  const allDsfsEvents: any[] = await prisma.dsfsEvent.findMany({ where: { schoolYearId } })
  const allSurveillances: any[] = await prisma.surveillance.findMany({ where: { userId, schoolYearId } })
  const allPlannerEntries: any[] = await prisma.plannerEntry.findMany({ where: { userId, schoolYearId } })

  const startDate = new Date(schoolYear.startDate)
  const endDate = new Date(schoolYear.endDate)
  const mondays = schoolYearMondays(startDate, endDate)

  const isSameDate = (a: Date, b: Date) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()

  const children: any[] = [
    new Paragraph({ text: 'Mon Agenda Pédago', heading: HeadingLevel.HEADING_1, alignment: AlignmentType.CENTER, spacing: { after: 200 } }),
    new Paragraph({ text: `Année scolaire complète — ${schoolYear.name}`, heading: HeadingLevel.HEADING_2, alignment: AlignmentType.CENTER, spacing: { after: 200 } }),
    new Paragraph({ text: `${user.firstName} ${user.lastName}`, alignment: AlignmentType.CENTER, spacing: { after: 400 } }),
    new Paragraph({ children: [new PageBreak()] })
  ]

  const dayParagraphs = (dayIndex: number, date: Date) => {
    const paras: any[] = [
      new Paragraph({ text: `${DAY_NAMES[dayIndex]} — ${fmtDate(date)}`, heading: HeadingLevel.HEADING_3, spacing: { before: 200, after: 100 } })
    ]

    const dayBlocks = blocks.filter(b => b.dayOfWeek === dayIndex).sort((a, b) => a.startTime.localeCompare(b.startTime))
    dayBlocks.forEach(b => {
      paras.push(new Paragraph({ text: `${b.startTime}-${b.endTime}  ${b.name} (${b.type})`, spacing: { after: 50 } }))
    })

    const dayDsfs = allDsfsEvents.filter(e => isSameDate(new Date(e.date), date))
    dayDsfs.forEach(e => paras.push(new Paragraph({ children: [new TextRun({ text: `🏫 ${e.title}`, bold: true })], spacing: { after: 50 } })))

    const dayEvents = allEvents.filter(e => isSameDate(new Date(e.date), date))
    dayEvents.forEach(e => paras.push(new Paragraph({ text: `• ${e.startTime ? e.startTime + ' ' : ''}${e.title}`, spacing: { after: 50 } })))

    const dayEntries = allPlannerEntries.filter(e => isSameDate(new Date(e.date), date))
    dayEntries.forEach(e => paras.push(new Paragraph({ text: `📝 ${e.subject}: ${e.title}`, spacing: { after: 50 } })))

    paras.push(new Paragraph({ text: '_'.repeat(70), spacing: { after: 50 } }))
    paras.push(new Paragraph({ text: '_'.repeat(70), spacing: { after: 200 } }))

    return paras
  }

  mondays.forEach((monday, weekIdx) => {
    const weekDates = Array.from({ length: 5 }, (_, i) => addDays(monday, i))

    // PAGE 1 : Lundi, Mardi, Mercredi
    children.push(new Paragraph({ text: `Semaine du ${fmtDate(weekDates[0])} au ${fmtDate(weekDates[4])}`, heading: HeadingLevel.HEADING_2, spacing: { after: 200 } }))
    ;[0, 1, 2].forEach(i => children.push(...dayParagraphs(i, weekDates[i])))
    children.push(new Paragraph({ children: [new PageBreak()] }))

    // PAGE 2 : Jeudi, Vendredi, Notes, Surveillances
    ;[3, 4].forEach(i => children.push(...dayParagraphs(i, weekDates[i])))

    children.push(new Paragraph({ text: 'Notes de la semaine', heading: HeadingLevel.HEADING_3, spacing: { before: 200, after: 100 } }))
    for (let i = 0; i < 4; i++) children.push(new Paragraph({ text: '_'.repeat(70), spacing: { after: 50 } }))

    const weekSurveillances = allSurveillances.filter(s => {
      const d = new Date(s.date)
      return d >= weekDates[0] && d <= weekDates[4]
    })
    children.push(new Paragraph({ text: 'Surveillances', heading: HeadingLevel.HEADING_3, spacing: { before: 200, after: 100 } }))
    if (weekSurveillances.length === 0) {
      children.push(new Paragraph({ text: 'Aucune surveillance cette semaine.', spacing: { after: 100 } }))
    } else {
      weekSurveillances.forEach(s => {
        children.push(new Paragraph({ text: `${fmtDate(new Date(s.date))}${s.time ? ' ' + s.time : ''} — ${s.title}${s.location ? ' (' + s.location + ')' : ''}`, spacing: { after: 50 } }))
      })
    }

    if (weekIdx < mondays.length - 1) {
      children.push(new Paragraph({ children: [new PageBreak()] }))
    }
  })

  const doc = new Document({ sections: [{ children }] })
  const buffer = await Packer.toBuffer(doc)

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'Content-Disposition': `attachment; filename="Mon-Agenda-Pedago_${schoolYear.name}.docx"`
    }
  })
}
