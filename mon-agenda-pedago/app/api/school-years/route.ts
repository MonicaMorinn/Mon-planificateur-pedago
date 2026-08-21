import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyToken, getTokenFromRequest } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request) || request.cookies.get('token')?.value
    if (!token) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

    const payload = await verifyToken(token)
    if (!payload) return NextResponse.json({ error: 'Token invalide' }, { status: 401 })

    const schoolYears = await prisma.schoolYear.findMany({
      where: { userId: payload.userId },
      orderBy: { startDate: 'desc' },
      include: { schedules: true }
    })

    return NextResponse.json({ schoolYears })
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
    const { name, startDate, endDate } = body

    if (!name || !startDate || !endDate) {
      return NextResponse.json({ error: 'Données incomplètes' }, { status: 400 })
    }

    // Désactiver les autres années
    if (body.isActive) {
      await prisma.schoolYear.updateMany({
        where: { userId: payload.userId },
        data: { isActive: false }
      })
    }

    const schoolYear = await prisma.schoolYear.create({
      data: {
        name,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        isActive: body.isActive || false,
        userId: payload.userId
      }
    })

    return NextResponse.json({ schoolYear }, { status: 201 })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
