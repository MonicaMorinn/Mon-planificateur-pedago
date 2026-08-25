import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyToken, getTokenFromRequest } from '@/lib/auth'
import { PDFDocument, StandardFonts, rgb, PDFFont, PDFPage } from 'pdf-lib'
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

const PAGE_SIZE: [number, number] = [841.89, 595.28] // A4 paysage: plus de place pour le tableau
const MARGIN = 36

// pdf-lib (police StandardFonts + encodage WinAnsi) ne peut afficher que les
// caractères latins de base (accents français inclus). Les emojis, flèches
// et autres caractères Unicode hors de cette plage font planter drawText().
// Comme les titres/notes proviennent de saisies libres de l'utilisatrice,
// on nettoie systématiquement tout texte dynamique avant de l'envoyer au PDF.
function sanitizeForPdf(text: string): string {
  return text.replace(/[^\x00-\xFF]/g, '').replace(/\s{2,}/g, ' ').trim()
}

function hexToRgb(hex: string) {
  const h = hex.replace('#', '')
  const r = parseInt(h.substring(0, 2), 16) / 255
  const g = parseInt(h.substring(2, 4), 16) / 255
  const b = parseInt(h.substring(4, 6), 16) / 255
  return rgb(r, g, b)
}

const HOLIDAY_GRAY = hexToRgb('#F3F3F1')
const HEADER_BG = hexToRgb('#F7F5F1')
const BORDER = rgb(0.6, 0.6, 0.6)

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

    const pdfDoc = await PDFDocument.create()
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

    for (const monday of mondays) {
      const weekDates = Array.from({ length: 5 }, (_, i) => addDays(monday, i))
      drawWeekPage(pdfDoc, font, fontBold, [0, 1, 2], weekDates, monday, blocks, allDsfsEvents, allEvents, allPlannerEntries, schoolYear.name, sectionsOrder)
      drawWeekPage(pdfDoc, font, fontBold, [3, 4], weekDates, monday, blocks, allDsfsEvents, allEvents, allPlannerEntries, schoolYear.name, sectionsOrder, allSurveillances)
    }

    const pdfBytes = await pdfDoc.save()
    const filename = mode === 'annee'
      ? `Mon-Agenda-Pedago_${schoolYear.name}_annee-complete.pdf`
      : `agenda-semaine-${mondays[0].toISOString().split('T')[0]}.pdf`

    return new NextResponse(Buffer.from(pdfBytes), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`
      }
    })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

function drawWeekPage(
  pdfDoc: PDFDocument,
  font: PDFFont,
  fontBold: PDFFont,
  dayIndexes: number[],
  weekDates: Date[],
  monday: Date,
  blocks: any[],
  dsfsEvents: any[],
  events: any[],
  plannerEntries: any[],
  schoolYearName: string,
  sectionsOrder: SectionKey[],
  surveillances?: any[]
) {
  const page = pdfDoc.addPage(PAGE_SIZE)
  const { width, height } = page.getSize()
  let y = height - MARGIN

  page.drawText('Mon Agenda Pédago', { x: MARGIN, y, size: 16, font: fontBold, color: rgb(0.9, 0.6, 0.6) })
  page.drawText(
    `Semaine du ${weekDates[0].toLocaleDateString('fr-CA')} au ${weekDates[4].toLocaleDateString('fr-CA')} — ${schoolYearName}`,
    { x: width - MARGIN - 260, y, size: 10, font, color: rgb(0.4, 0.4, 0.4) }
  )
  y -= 24

  const rows: WeekRow[] = buildWeekRows(blocks, dayIndexes)
  const tableWidth = width - 2 * MARGIN
  const labelColWidth = 90
  const dayColWidth = (tableWidth - labelColWidth) / dayIndexes.length
  const headerHeight = 26
  const rowHeight = 46

  // En-têtes des journées
  let x = MARGIN + labelColWidth
  page.drawRectangle({ x: MARGIN, y: y - headerHeight, width: tableWidth, height: headerHeight, color: HEADER_BG, borderColor: BORDER, borderWidth: 0.75 })
  dayIndexes.forEach(di => {
    const day = weekDates[di]
    const dayOff = isDayOff(dsfsEvents, day)
    if (dayOff) {
      page.drawRectangle({ x, y: y - headerHeight, width: dayColWidth, height: headerHeight, color: HOLIDAY_GRAY })
    }
    page.drawText(`${DAY_NAMES[di]}  ${day.getDate()}`, { x: x + 6, y: y - 17, size: 10, font: fontBold, color: rgb(0.2, 0.2, 0.2) })
    x += dayColWidth
  })
  y -= headerHeight

  // Rangées horaire
  rows.forEach(row => {
    const thisRowHeight = row.fullWidth ? 18 : rowHeight
    if (y - thisRowHeight < 160) return // sécurité: on ne déborde pas dans la colonne latérale (page 2)

    if (row.fullWidth) {
      page.drawRectangle({ x: MARGIN, y: y - thisRowHeight, width: tableWidth, height: thisRowHeight, color: HEADER_BG, borderColor: BORDER, borderWidth: 0.75 })
      page.drawText(sanitizeForPdf(`${row.name} - ${formatTimeFr(row.startTime)} a ${formatTimeFr(row.endTime)}`), {
        x: MARGIN + tableWidth / 2 - 90, y: y - 13, size: 9, font: fontBold, color: rgb(0.2, 0.2, 0.2)
      })
    } else {
      page.drawRectangle({ x: MARGIN, y: y - thisRowHeight, width: labelColWidth, height: thisRowHeight, color: HEADER_BG, borderColor: BORDER, borderWidth: 0.75 })
      page.drawText(sanitizeForPdf(row.name), { x: MARGIN + 4, y: y - 14, size: 9, font: fontBold, color: rgb(0.2, 0.2, 0.2) })
      page.drawText(`${formatTimeFr(row.startTime)} à ${formatTimeFr(row.endTime)}`, { x: MARGIN + 4, y: y - 26, size: 7, font, color: rgb(0.45, 0.45, 0.45) })

      let cx = MARGIN + labelColWidth
      dayIndexes.forEach(di => {
        const day = weekDates[di]
        const dayOff = isDayOff(dsfsEvents, day)
        page.drawRectangle({
          x: cx, y: y - thisRowHeight, width: dayColWidth, height: thisRowHeight,
          color: dayOff ? HOLIDAY_GRAY : undefined, borderColor: BORDER, borderWidth: 0.75
        })
        const block = row.perDay[di]
        if (block?.subject) {
          page.drawText(sanitizeForPdf(block.subject), { x: cx + 4, y: y - 14, size: 8, font, color: rgb(0.2, 0.2, 0.2) })
        }
        const dayKey = `${row.startTime}-${row.endTime}`
        const entry = plannerEntries.find((e: any) => isSameDate(new Date(e.date), day) && e.timeBlock === dayKey)
        if (entry) {
          page.drawText(sanitizeForPdf(entry.title), { x: cx + 4, y: y - 26, size: 7, font, color: rgb(0.35, 0.35, 0.35) })
        }
        cx += dayColWidth
      })
    }
    y -= thisRowHeight
  })

  // Bandeau congés/événements DSFS + personnels sous le tableau
  y -= 16
  page.drawText('Journées spéciales cette semaine :', { x: MARGIN, y, size: 8, font: fontBold, color: rgb(0.3, 0.3, 0.3) })
  y -= 12
  dayIndexes.forEach(di => {
    const day = weekDates[di]
    const dsfsToday = dsfsEvents.filter((e: any) => isSameDate(new Date(e.date), day))
    const eventsToday = events.filter((e: any) => isSameDate(new Date(e.date), day))
    ;[...dsfsToday, ...eventsToday].forEach((e: any) => {
      if (y < 130) return
      page.drawText(sanitizeForPdf(`${DAY_NAMES[di]}: ${e.title}`), { x: MARGIN, y, size: 8, font, color: rgb(0.4, 0.2, 0.4) })
      y -= 11
    })
  })

  // Colonne latérale (seulement sur la page Jeudi/Vendredi = page 2)
  if (surveillances) {
    const sideX = width - MARGIN - 220
    const sideWidth = 220
    let sy = height - MARGIN - headerHeight - 24

    const drawCalendar = () => {
      const { monthLabel, cells } = buildMonthCells(monday, weekDates, dsfsEvents)
      page.drawText(`${MONTH_NAMES_FR[monthLabel.getMonth()]} ${monthLabel.getFullYear()}`, { x: sideX, y: sy, size: 10, font: fontBold, color: rgb(0.1, 0.1, 0.1) })
      sy -= 12
      const cellW = sideWidth / 7
      const cellH = 12
      ;['L', 'M', 'M', 'J', 'V', 'S', 'D'].forEach((d, i) => {
        page.drawText(d, { x: sideX + i * cellW + 2, y: sy, size: 6, font: fontBold, color: rgb(0.4, 0.4, 0.4) })
      })
      sy -= cellH
      let col = 0
      cells.forEach(cell => {
        if (cell.day) {
          if (cell.isDayOff) {
            page.drawRectangle({ x: sideX + col * cellW, y: sy - 2, width: cellW, height: cellH, color: HOLIDAY_GRAY })
          }
          if (cell.isCurrentWeek) {
            page.drawRectangle({ x: sideX + col * cellW, y: sy - 2, width: cellW, height: cellH, borderColor: rgb(0.9, 0.6, 0.6), borderWidth: 0.75 })
          }
          page.drawText(String(cell.day), { x: sideX + col * cellW + 2, y: sy, size: 6.5, font, color: rgb(0.2, 0.2, 0.2) })
        }
        col++
        if (col === 7) { col = 0; sy -= cellH }
      })
      if (col !== 0) sy -= cellH
      sy -= 10
    }

    const drawNotes = () => {
      page.drawText('Notes de la semaine', { x: sideX, y: sy, size: 11, font: fontBold, color: rgb(0.1, 0.1, 0.1) })
      sy -= 14
      for (let i = 0; i < 3; i++) {
        page.drawLine({ start: { x: sideX, y: sy }, end: { x: sideX + sideWidth, y: sy }, thickness: 0.5, color: rgb(0.85, 0.85, 0.85) })
        sy -= 14
      }
      sy -= 4
    }

    const drawCliniques = () => {
      page.drawText('Cliniques / évaluations', { x: sideX, y: sy, size: 11, font: fontBold, color: rgb(0.1, 0.1, 0.1) })
      sy -= 14
      for (let i = 0; i < 3; i++) {
        page.drawText('-', { x: sideX, y: sy, size: 8, font, color: rgb(0.5, 0.5, 0.5) })
        page.drawLine({ start: { x: sideX + 12, y: sy }, end: { x: sideX + sideWidth, y: sy }, thickness: 0.5, color: rgb(0.85, 0.85, 0.85) })
        sy -= 14
      }
      sy -= 4
    }

    const drawSurveillances = () => {
      page.drawText('Surveillances', { x: sideX, y: sy, size: 11, font: fontBold, color: rgb(0.1, 0.1, 0.1) })
      sy -= 16
      ;['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi'].forEach((label, di) => {
        const day = weekDates[di]
        const dayEntries = surveillances!.filter((s: any) => isSameDate(new Date(s.date), day))
        const text = dayEntries.length > 0
          ? dayEntries.map((s: any) => `${s.time ? s.time + ' ' : ''}${s.title}`).join(', ')
          : ''
        page.drawText(sanitizeForPdf(`${label}: ${text}`), { x: sideX, y: sy, size: 8, font, color: rgb(0.3, 0.3, 0.3) })
        sy -= 13
      })
    }

    const SECTION_DRAWERS: Record<SectionKey, () => void> = {
      calendar: drawCalendar,
      notes: drawNotes,
      surveillances: drawSurveillances
    }

    sectionsOrder.forEach(key => {
      SECTION_DRAWERS[key]()
      if (key === 'notes') drawCliniques() // Cliniques suit toujours les Notes, comme dans le template original
    })
  }
}
