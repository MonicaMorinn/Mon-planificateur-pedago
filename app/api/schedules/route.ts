import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyToken, getTokenFromRequest } from '@/lib/auth'

const DEFAULT_BLOCK_TIMES = [
  ['08:10', '08:55'],
  ['09:00', '09:45'],
  ['09:55', '10:40'],
  ['10:40', '11:20'],
  ['11:20', '12:00'],
  ['12:30', '13:10'],
  ['13:10', '13:50'],
  ['13:55', '14:35'],
  ['14:40', '15:20']
]

export async function GET(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request) || request.cookies.get('token')?.value
    if (!token) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

    const payload = await verifyToken(token)
    if (!payload) return NextResponse.json({ error: 'Token invalide' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const schoolYearId = searchParams.get('schoolYearId')

    // Try to find existing schedules for this user and school year
    const schedules = await prisma.schedule.findMany({
      where: {
        userId: payload.userId,
        schoolYearId: schoolYearId || undefined
      },
      include: { blocks: { orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }] } },
      orderBy: { createdAt: 'desc' }
    })

    if (schedules && schedules.length > 0) {
      return NextResponse.json({ schedules })
    }

    // If no schedules, check the school year and auto-create default for 2026-2027
    if (!schoolYearId) {
      return NextResponse.json({ schedules: [] })
    }

    const schoolYear = await prisma.schoolYear.findUnique({ where: { id: schoolYearId } })
    if (!schoolYear) {
      return NextResponse.json({ schedules: [] })
    }

    const startYear = new Date(schoolYear.startDate).getFullYear()
    const endYear = new Date(schoolYear.endDate).getFullYear()
    const is2026_2027 = (startYear === 2026 && endYear === 2027) || (typeof schoolYear.name === 'string' && schoolYear.name.includes('2026'))

    if (!is2026_2027) {
      return NextResponse.json({ schedules: [] })
    }

    // Create default schedule for the user for this school year
    const schedule = await prisma.schedule.create({
      data: {
        userId: payload.userId,
        schoolYearId,
        name: 'Horaire 2026-2027',
        description: 'Horaire par défaut importé depuis le template 2026-2027',
        isDefault: 1
      }
    })

    // Create ScheduleBlocks for Monday(0) to Friday(4)
    for (let day = 0; day <= 4; day++) {
      for (let i = 0; i < DEFAULT_BLOCK_TIMES.length; i++) {
        const [startTime, endTime] = DEFAULT_BLOCK_TIMES[i]
        await prisma.scheduleBlock.create({
          data: {
            scheduleId: schedule.id,
            dayOfWeek: day,
            name: `Cours ${i + 1}`,
            startTime,
            endTime,
            type: 'Enseignement',
            subject: null,
            color: '#6366f1'
          }
        })
      }
    }

    // Re-fetch schedule with blocks ordered
    const scheduleWithBlocks = await prisma.schedule.findUnique({ where: { id: schedule.id }, include: { blocks: { orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }] } } })

    return NextResponse.json({ schedules: scheduleWithBlocks ? [scheduleWithBlocks] : [] })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request) || request.cookies.get('token')?.value
    if (!token) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

    const payload = await verifyToken(token)
    if (!payload) return NextResponse.json({ error: 'Token invalide' }, { status: 401 })

    const body = await request.json()
    const { name, description, schoolYearId, isDefault, effectiveFromDate, effectiveToDate } = body

    if (!name || !schoolYearId) {
      return NextResponse.json({ error: 'Données incomplètes' }, { status: 400 })
    }

    const schedule = await prisma.schedule.create({
      data: {
        name,
        description: description || null,
        schoolYearId,
        userId: payload.userId,
        isDefault: isDefault || false,
        effectiveFromDate: effectiveFromDate ? new Date(effectiveFromDate) : null,
        effectiveToDate: effectiveToDate ? new Date(effectiveToDate) : null,
      },
      include: { blocks: true }
    })

    return NextResponse.json({ schedule }, { status: 201 })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
