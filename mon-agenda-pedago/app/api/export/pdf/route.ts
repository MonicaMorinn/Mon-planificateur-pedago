import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyToken, getTokenFromRequest } from '@/lib/auth'
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'

const DAYS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche']

export async function POST(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request) || request.cookies.get('token')?.value
    if (!token) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

    const payload = await verifyToken(token)
    if (!payload) return NextResponse.json({ error: 'Token invalide' }, { status: 401 })
    const userId = payload.userId

    const body = await request.json()
    const { schoolYearId } = body

    if (!schoolYearId) {
      return NextResponse.json({ error: 'schoolYearId requis' }, { status: 400 })
    }

    // Resolve sections order: payload -> user settings.quickLinks.layoutSections -> default
    let sectionsOrder: ('notes' | 'calendar' | 'surveillances')[] | null = null
    if (body.sectionsOrder && Array.isArray(body.sectionsOrder)) sectionsOrder = body.sectionsOrder
    if (body.layoutSections && Array.isArray(body.layoutSections)) sectionsOrder = body.layoutSections

    const user = await prisma.user.findUnique({ where: { id: payload.userId } })
    const schoolYear = await prisma.schoolYear.findUnique({ where: { id: schoolYearId } })
    const schedule = await prisma.schedule.findFirst({
      where: { userId: payload.userId, schoolYearId, isDefault: true },
      include: { blocks: { orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }] } }
    })

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

    const blocks: any[] = schedule?.blocks || []

    // Créer le document PDF
    const pdfDoc = await PDFDocument.create()
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

    let page = pdfDoc.addPage([595.28, 841.89]) // A4
    const { width, height } = page.getSize()
    const margin = 50
    let y = height - margin

    const primaryColor = rgb(0.39, 0.4, 0.95) // #6366f1
    const grayColor = rgb(0.35, 0.35, 0.35)
    const lightGray = rgb(0.6, 0.6, 0.6)

    function newPageIfNeeded(spaceNeeded: number) {
      if (y - spaceNeeded < margin) {
        page = pdfDoc.addPage([595.28, 841.89])
        y = height - margin
      }
    }

    // Titre
    page.drawText('Mon Agenda Pédago', {
      x: margin, y, size: 22, font: fontBold, color: primaryColor
    })
    y -= 30

    page.drawText(schoolYear.name, {
      x: margin, y, size: 14, font, color: grayColor
    })
    y -= 25

    page.drawText(`${user.firstName} ${user.lastName}`, {
      x: margin, y, size: 12, font, color: grayColor
    })
    y -= 18

    if (user.schoolId) {
      page.drawText(`École: ${user.schoolId}`, {
        x: margin, y, size: 11, font, color: grayColor
      })
      y -= 18
    }

    page.drawText(`Généré le ${new Date().toLocaleDateString('fr-CA')}`, {
      x: margin, y, size: 10, font, color: lightGray
    })
    y -= 30

    // Ligne de séparation
    page.drawLine({
      start: { x: margin, y }, end: { x: width - margin, y },
      thickness: 1.5, color: primaryColor
    })
    y -= 25

    // Titre horaire
    page.drawText(schedule ? `Horaire: ${schedule.name}` : 'Aucun horaire défini', {
      x: margin, y, size: 15, font: fontBold, color: rgb(0.1, 0.1, 0.1)
    })
    y -= 25

    // Grouper les blocs par jour
    const blocksByDay: { [key: number]: any[] } = {}
    blocks.forEach(block => {
      if (!blocksByDay[block.dayOfWeek]) blocksByDay[block.dayOfWeek] = []
      blocksByDay[block.dayOfWeek].push(block)
    })

    for (let day = 0; day <= 6; day++) {
      const dayBlocks = blocksByDay[day]
      if (!dayBlocks || dayBlocks.length === 0) continue

      newPageIfNeeded(30)
      page.drawText(DAYS[day], {
        x: margin, y, size: 13, font: fontBold, color: primaryColor
      })
      y -= 20

      dayBlocks.forEach(block => {
        newPageIfNeeded(18)
        const label = `${block.startTime} - ${block.endTime}   ${block.name} (${block.type}${block.subject ? ', ' + block.subject : ''})`
        page.drawText(label, {
          x: margin + 15, y, size: 10, font, color: rgb(0.2, 0.2, 0.2)
        })
        y -= 16
      })

      y -= 10
    }

    // Now write remaining sections in the requested order
    async function writeCalendarSection() {
      newPageIfNeeded(60)
      // Mini calendar: build a simple grid at right column
      // For simplicity in PDF layout, we will render a compact calendar block
      const monthDate = new Date()
      const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1)
      const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0)
      const daysInMonth = monthEnd.getDate()

      page.drawText('Calendrier', { x: margin, y, size: 12, font: fontBold, color: rgb(0.1,0.1,0.1) })
      y -= 18

      // draw day numbers in a simple row-major layout
      const colWidth = 24
      const startX = margin
      let px = startX
      let py = y
      for (let d = 1; d <= daysInMonth; d++) {
        page.drawText(String(d), { x: px, y: py, size: 8, font, color: rgb(0.2,0.2,0.2) })
        px += colWidth
        if (px + colWidth > width - margin) {
          px = startX
          py -= 12
          newPageIfNeeded(24)
        }
      }
      y = py - 12
    }

    async function writeNotesSection() {
      newPageIfNeeded(40)
      y -= 15
      page.drawLine({ start: { x: margin, y }, end: { x: width - margin, y }, thickness: 1, color: lightGray })
      y -= 25
      page.drawText('Notes', { x: margin, y, size: 14, font: fontBold, color: rgb(0.1,0.1,0.1) })
      y -= 20
      for (let i = 0; i < 15; i++) {
        newPageIfNeeded(20)
        page.drawLine({ start: { x: margin, y }, end: { x: width - margin, y }, thickness: 0.5, color: rgb(0.85, 0.85, 0.85) })
        y -= 22
      }
    }

    async function writeSurveillancesSection() {
      newPageIfNeeded(40)
      y -= 10
      page.drawText('Surveillances', { x: margin, y, size: 14, font: fontBold, color: rgb(0.1,0.1,0.1) })
      y -= 18

      // fetch surveillances for the school year range
        const surveillances = await prisma.surveillance.findMany({ where: { userId, schoolYearId } })
      if (surveillances.length === 0) {
        page.drawText('Aucune surveillance cette semaine.', { x: margin, y, size: 10, font, color: rgb(0.4,0.4,0.4) })
        y -= 16
      } else {
        surveillances.forEach((s: any) => {
          newPageIfNeeded(16)
          page.drawText(`${new Date(s.date).toLocaleDateString('fr-CA')} ${s.time || ''} — ${s.title}`, { x: margin, y, size: 10, font, color: rgb(0.2,0.2,0.2) })
          y -= 16
        })
      }
    }

    for (const key of order) {
      if (key === 'calendar') await writeCalendarSection()
      if (key === 'notes') await writeNotesSection()
      if (key === 'surveillances') await writeSurveillancesSection()
    }

    const pdfBytes = await pdfDoc.save()

    return new NextResponse(Buffer.from(pdfBytes), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="agenda-${schoolYear.name}.pdf"`
      }
    })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
