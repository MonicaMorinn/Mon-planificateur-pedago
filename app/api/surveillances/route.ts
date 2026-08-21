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
    const from = searchParams.get('from')
    const to = searchParams.get('to')

    const where: any = { userId: payload.userId }
    if (schoolYearId) where.schoolYearId = schoolYearId

    let surveillances = await prisma.surveillance.findMany({
      where,
      orderBy: { date: 'asc' }
    })

    if (from) surveillances = surveillances.filter((s: any) => new Date(s.date) >= new Date(from))
    if (to) surveillances = surveillances.filter((s: any) => new Date(s.date) <= new Date(to))

    return NextResponse.json({ surveillances })
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
    const { schoolYearId, title, date, time, location, notes } = body

    if (!schoolYearId || !title || !date) {
      return NextResponse.json({ error: 'Données incomplètes' }, { status: 400 })
    }

    const surveillance = await prisma.surveillance.create({
      data: {
        userId: payload.userId,
        schoolYearId,
        title,
        date: new Date(date),
        time: time || null,
        location: location || null,
        notes: notes || null
      }
    })

    return NextResponse.json({ surveillance }, { status: 201 })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request) || request.cookies.get('token')?.value
    if (!token) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    const payload = await verifyToken(token)
    if (!payload) return NextResponse.json({ error: 'Token invalide' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('surveillanceId')
    const body = await request.json()
    if (!id) return NextResponse.json({ error: 'surveillanceId requis' }, { status: 400 })

    const existing = await prisma.surveillance.findUnique({ where: { id } })
    if (!existing || existing.userId !== payload.userId) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    }

    const updated = await prisma.surveillance.update({
      where: { id },
      data: {
        ...(body.title && { title: body.title }),
        ...(body.date && { date: new Date(body.date) }),
        ...(body.time !== undefined && { time: body.time }),
        ...(body.location !== undefined && { location: body.location }),
        ...(body.notes !== undefined && { notes: body.notes })
      }
    })

    return NextResponse.json({ surveillance: updated })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request) || request.cookies.get('token')?.value
    if (!token) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    const payload = await verifyToken(token)
    if (!payload) return NextResponse.json({ error: 'Token invalide' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('surveillanceId')
    if (!id) return NextResponse.json({ error: 'surveillanceId requis' }, { status: 400 })

    const existing = await prisma.surveillance.findUnique({ where: { id } })
    if (!existing || existing.userId !== payload.userId) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    }

    await prisma.surveillance.delete({ where: { id } })
    return NextResponse.json({ message: 'Surveillance supprimée' })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
