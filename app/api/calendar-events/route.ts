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
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    const where: any = { userId: payload.userId }

    if (schoolYearId) where.schoolYearId = schoolYearId
    if (startDate && endDate) {
      where.date = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      }
    }

    const events = await prisma.calendarEvent.findMany({
      where,
      orderBy: { date: 'asc' }
    })

    return NextResponse.json({ events })
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
    const { title, description, date, startTime, endTime, type, color, isAllDay, schoolYearId } = body

    if (!title || !date || !schoolYearId) {
      return NextResponse.json({ error: 'Données incomplètes' }, { status: 400 })
    }

    const event = await prisma.calendarEvent.create({
      data: {
        title,
        description: description || null,
        date: new Date(date),
        startTime: startTime || null,
        endTime: endTime || null,
        type: type || 'Personnel',
        color: color || '#6366f1',
        isAllDay: isAllDay || false,
        userId: payload.userId,
        schoolYearId
      }
    })

    return NextResponse.json({ event }, { status: 201 })
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
    const eventId = searchParams.get('eventId')
    const body = await request.json()

    if (!eventId) {
      return NextResponse.json({ error: 'eventId requis' }, { status: 400 })
    }

    const event = await prisma.calendarEvent.findUnique({
      where: { id: eventId }
    })

    if (!event || event.userId !== payload.userId) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    }

    const updated = await prisma.calendarEvent.update({
      where: { id: eventId },
      data: {
        ...(body.title && { title: body.title }),
        ...(body.description !== undefined && { description: body.description }),
        ...(body.date && { date: new Date(body.date) }),
        ...(body.startTime && { startTime: body.startTime }),
        ...(body.endTime && { endTime: body.endTime }),
        ...(body.type && { type: body.type }),
        ...(body.color && { color: body.color }),
        ...(body.isAllDay !== undefined && { isAllDay: body.isAllDay }),
      }
    })

    return NextResponse.json({ event: updated })
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
    const eventId = searchParams.get('eventId')

    if (!eventId) {
      return NextResponse.json({ error: 'eventId requis' }, { status: 400 })
    }

    const event = await prisma.calendarEvent.findUnique({
      where: { id: eventId }
    })

    if (!event || event.userId !== payload.userId) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    }

    await prisma.calendarEvent.delete({
      where: { id: eventId }
    })

    return NextResponse.json({ message: 'Événement supprimé' })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
