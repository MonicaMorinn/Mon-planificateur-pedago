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

    const body = await request.json()
    const { schoolYearId } = body

    if (!schoolYearId) {
      return NextResponse.json({ error: 'schoolYearId requis' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({ where: { id: payload.userId } })
    const schoolYear = await prisma.schoolYear.findUnique({ where: { id: schoolYearId } })
    const schedule = await prisma.schedule.findFirst({
      where: { userId: payload.userId, schoolYearId, isDefault: true },
      include: { blocks: { orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }] } }
    })

    if (!user || !schoolYear) {
      return NextResponse.json({ error: 'Données manquantes' }, { status: 404 })
    }

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

    // Page de notes
    newPageIfNeeded(50)
    y -= 15
    page.drawLine({
      start: { x: margin, y }, end: { x: width - margin, y },
      thickness: 1, color: lightGray
    })
    y -= 25
    page.drawText('Notes', {
      x: margin, y, size: 14, font: fontBold, color: rgb(0.1, 0.1, 0.1)
    })
    y -= 20

    for (let i = 0; i < 15; i++) {
      newPageIfNeeded(20)
      page.drawLine({
        start: { x: margin, y }, end: { x: width - margin, y },
        thickness: 0.5, color: rgb(0.85, 0.85, 0.85)
      })
      y -= 22
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
