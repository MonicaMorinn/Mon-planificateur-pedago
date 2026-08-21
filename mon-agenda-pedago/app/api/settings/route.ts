import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyToken, getTokenFromRequest } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request) || request.cookies.get('token')?.value
    if (!token) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    const payload = await verifyToken(token)
    if (!payload) return NextResponse.json({ error: 'Token invalide' }, { status: 401 })

    let settings = await prisma.userSettings.findUnique({ where: { userId: payload.userId } })
    if (!settings) {
      settings = await prisma.userSettings.create({ data: { userId: payload.userId } })
    }

    return NextResponse.json({ settings })
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

    const body = await request.json()
    const allowedFields = [
      'notesLocation', 'colorMode', 'fontDays', 'fontDates', 'fontTitles',
      'fontSchedule', 'fontEvents', 'fontNotes', 'fontCalendar', 'quickLinks',
      'primaryColor', 'theme'
    ]

    const data: any = {}
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        data[field] = field === 'quickLinks' && typeof body[field] !== 'string'
          ? JSON.stringify(body[field])
          : body[field]
      }
    }

    let settings = await prisma.userSettings.findUnique({ where: { userId: payload.userId } })
    if (!settings) {
      settings = await prisma.userSettings.create({ data: { userId: payload.userId, ...data } })
    } else {
      settings = await prisma.userSettings.update({ where: { userId: payload.userId }, data })
    }

    return NextResponse.json({ settings })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
