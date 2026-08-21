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
    const scheduleId = searchParams.get('scheduleId')

    if (!scheduleId) {
      return NextResponse.json({ error: 'scheduleId requis' }, { status: 400 })
    }

    const schedule = await prisma.schedule.findUnique({
      where: { id: scheduleId },
      include: { blocks: { orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }] } }
    })

    if (!schedule || schedule.userId !== payload.userId) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    }

    return NextResponse.json({ blocks: schedule.blocks })
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
    const { scheduleId, dayOfWeek, name, startTime, endTime, type, subject, color } = body

    if (!scheduleId || dayOfWeek === undefined || !name || !startTime || !endTime || !type) {
      return NextResponse.json({ error: 'Données incomplètes' }, { status: 400 })
    }

    // Vérifier que le schedule appartient à l'utilisateur
    const schedule = await prisma.schedule.findUnique({
      where: { id: scheduleId }
    })

    if (!schedule || schedule.userId !== payload.userId) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    }

    const block = await prisma.scheduleBlock.create({
      data: {
        scheduleId,
        dayOfWeek,
        name,
        startTime,
        endTime,
        type,
        subject: subject || null,
        color: color || '#6366f1',
      }
    })

    return NextResponse.json({ block }, { status: 201 })
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
    const blockId = searchParams.get('blockId')
    const body = await request.json()

    if (!blockId) {
      return NextResponse.json({ error: 'blockId requis' }, { status: 400 })
    }

    // Vérifier les permissions
    const block = await prisma.scheduleBlock.findUnique({
      where: { id: blockId },
      include: { schedule: true }
    })

    if (!block || block.schedule.userId !== payload.userId) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    }

    const updatedBlock = await prisma.scheduleBlock.update({
      where: { id: blockId },
      data: {
        ...(body.name && { name: body.name }),
        ...(body.startTime && { startTime: body.startTime }),
        ...(body.endTime && { endTime: body.endTime }),
        ...(body.type && { type: body.type }),
        ...(body.subject !== undefined && { subject: body.subject }),
        ...(body.color && { color: body.color }),
      }
    })

    return NextResponse.json({ block: updatedBlock })
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
    const blockId = searchParams.get('blockId')

    if (!blockId) {
      return NextResponse.json({ error: 'blockId requis' }, { status: 400 })
    }

    const block = await prisma.scheduleBlock.findUnique({
      where: { id: blockId },
      include: { schedule: true }
    })

    if (!block || block.schedule.userId !== payload.userId) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    }

    await prisma.scheduleBlock.delete({
      where: { id: blockId }
    })

    return NextResponse.json({ message: 'Bloc supprimé' })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
