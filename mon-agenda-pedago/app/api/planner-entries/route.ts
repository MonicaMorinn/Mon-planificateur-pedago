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

    const entries = await prisma.plannerEntry.findMany({
      where,
      orderBy: { date: 'desc' }
    })

    return NextResponse.json({ entries })
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
    const { date, timeBlock, subject, title, objective, activity, materials, homework, evaluation, notes, resources, status, schoolYearId } = body

    if (!date || !timeBlock || !subject || !schoolYearId) {
      return NextResponse.json({ error: 'Données incomplètes' }, { status: 400 })
    }

    const entry = await prisma.plannerEntry.create({
      data: {
        date: new Date(date),
        timeBlock,
        subject,
        title: title || '',
        objective: objective || null,
        activity: activity || null,
        materials: materials || null,
        homework: homework || null,
        evaluation: evaluation || null,
        notes: notes || null,
        resources: resources ? JSON.stringify(resources) : null,
        status: status || 'draft',
        userId: payload.userId,
        schoolYearId
      }
    })

    return NextResponse.json({ entry }, { status: 201 })
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
    const entryId = searchParams.get('entryId')
    const body = await request.json()

    if (!entryId) {
      return NextResponse.json({ error: 'entryId requis' }, { status: 400 })
    }

    const entry = await prisma.plannerEntry.findUnique({
      where: { id: entryId }
    })

    if (!entry || entry.userId !== payload.userId) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    }

    const updated = await prisma.plannerEntry.update({
      where: { id: entryId },
      data: {
        ...(body.title !== undefined && { title: body.title }),
        ...(body.objective !== undefined && { objective: body.objective }),
        ...(body.activity !== undefined && { activity: body.activity }),
        ...(body.materials !== undefined && { materials: body.materials }),
        ...(body.homework !== undefined && { homework: body.homework }),
        ...(body.evaluation !== undefined && { evaluation: body.evaluation }),
        ...(body.notes !== undefined && { notes: body.notes }),
        ...(body.status !== undefined && { status: body.status }),
        ...(body.resources !== undefined && { resources: body.resources ? JSON.stringify(body.resources) : null }),
      }
    })

    return NextResponse.json({ entry: updated })
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
    const entryId = searchParams.get('entryId')

    if (!entryId) {
      return NextResponse.json({ error: 'entryId requis' }, { status: 400 })
    }

    const entry = await prisma.plannerEntry.findUnique({
      where: { id: entryId }
    })

    if (!entry || entry.userId !== payload.userId) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    }

    await prisma.plannerEntry.delete({
      where: { id: entryId }
    })

    return NextResponse.json({ message: 'Entrée supprimée' })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
