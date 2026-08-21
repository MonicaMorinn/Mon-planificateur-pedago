import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyToken, getTokenFromRequest } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request) || request.cookies.get('token')?.value
    if (!token) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

    const payload = await verifyToken(token)
    if (!payload) return NextResponse.json({ error: 'Token invalide' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const schoolYearId = searchParams.get('schoolYearId')

    const schedules = await prisma.schedule.findMany({
      where: {
        userId: payload.userId,
        schoolYearId: schoolYearId || undefined
      },
      include: { blocks: { orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }] } },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ schedules })
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
