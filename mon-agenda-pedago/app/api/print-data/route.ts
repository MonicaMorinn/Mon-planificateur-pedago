import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyToken, getTokenFromRequest } from '@/lib/auth'

// Agrège horaire, événements (personnels + DSFS), notes du planificateur,
// tâches et surveillances pour une plage de dates donnée, afin que la vue
// d'impression n'ait besoin que d'un seul appel réseau.

export async function GET(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request) || request.cookies.get('token')?.value
    if (!token) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    const payload = await verifyToken(token)
    if (!payload) return NextResponse.json({ error: 'Token invalide' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const schoolYearId = searchParams.get('schoolYearId')
    const from = searchParams.get('from')
    const to = searchParams.get('to')

    if (!schoolYearId || !from || !to) {
      return NextResponse.json({ error: 'schoolYearId, from et to requis' }, { status: 400 })
    }

    const year = await prisma.schoolYear.findUnique({ where: { id: schoolYearId } })
    if (!year || year.userId !== payload.userId) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    }

    const fromDate = new Date(from)
    const toDate = new Date(to)

    const schedule = await prisma.schedule.findFirst({
      where: { userId: payload.userId, schoolYearId, isDefault: true },
      include: { blocks: { orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }] } }
    })

    const allEvents = await prisma.calendarEvent.findMany({
      where: { userId: payload.userId, schoolYearId },
      orderBy: { date: 'asc' }
    })
    const events = allEvents.filter((e: any) => {
      const d = new Date(e.date)
      return d >= fromDate && d <= toDate
    })

    const allDsfsEvents = await prisma.dsfsEvent.findMany({
      where: { schoolYearId },
      orderBy: { date: 'asc' }
    })
    const dsfsEvents = allDsfsEvents.filter((e: any) => {
      const d = new Date(e.date)
      return d >= fromDate && d <= toDate
    })

    const allEntries = await prisma.plannerEntry.findMany({
      where: { userId: payload.userId, schoolYearId },
      orderBy: { date: 'asc' }
    })
    const plannerEntries = allEntries.filter((e: any) => {
      const d = new Date(e.date)
      return d >= fromDate && d <= toDate
    })

    const allTasks = await prisma.task.findMany({
      where: { userId: payload.userId, schoolYearId },
      orderBy: { dueDate: 'asc' }
    })
    const tasks = allTasks.filter((t: any) => {
      if (!t.dueDate) return false
      const d = new Date(t.dueDate)
      return d >= fromDate && d <= toDate
    })

    const allSurveillances = await prisma.surveillance.findMany({
      where: { userId: payload.userId, schoolYearId },
      orderBy: { date: 'asc' }
    })
    const surveillances = allSurveillances.filter((s: any) => {
      const d = new Date(s.date)
      return d >= fromDate && d <= toDate
    })

    const settings = await prisma.userSettings.findUnique({ where: { userId: payload.userId } })

    return NextResponse.json({
      schoolYear: year,
      schedule,
      events,
      dsfsEvents,
      plannerEntries,
      tasks,
      surveillances,
      settings
    })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
