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
    const status = searchParams.get('status')

    const where: any = { userId: payload.userId }

    if (schoolYearId) where.schoolYearId = schoolYearId
    if (status) where.status = status

    const tasks = await prisma.task.findMany({
      where,
      orderBy: [{ dueDate: 'asc' }, { priority: 'desc' }]
    })

    return NextResponse.json({ tasks })
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
    const { title, description, dueDate, priority, category, schoolYearId } = body

    if (!title || !schoolYearId) {
      return NextResponse.json({ error: 'Données incomplètes' }, { status: 400 })
    }

    const task = await prisma.task.create({
      data: {
        title,
        description: description || null,
        dueDate: dueDate ? new Date(dueDate) : null,
        priority: priority || 'normal',
        category: category || null,
        status: 'pending',
        userId: payload.userId,
        schoolYearId
      }
    })

    return NextResponse.json({ task }, { status: 201 })
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
    const taskId = searchParams.get('taskId')
    const body = await request.json()

    if (!taskId) {
      return NextResponse.json({ error: 'taskId requis' }, { status: 400 })
    }

    const task = await prisma.task.findUnique({
      where: { id: taskId }
    })

    if (!task || task.userId !== payload.userId) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    }

    const updated = await prisma.task.update({
      where: { id: taskId },
      data: {
        ...(body.title && { title: body.title }),
        ...(body.description !== undefined && { description: body.description }),
        ...(body.dueDate !== undefined && { dueDate: body.dueDate ? new Date(body.dueDate) : null }),
        ...(body.priority && { priority: body.priority }),
        ...(body.category !== undefined && { category: body.category }),
        ...(body.status && { status: body.status }),
      }
    })

    return NextResponse.json({ task: updated })
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
    const taskId = searchParams.get('taskId')

    if (!taskId) {
      return NextResponse.json({ error: 'taskId requis' }, { status: 400 })
    }

    const task = await prisma.task.findUnique({
      where: { id: taskId }
    })

    if (!task || task.userId !== payload.userId) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    }

    await prisma.task.delete({
      where: { id: taskId }
    })

    return NextResponse.json({ message: 'Tâche supprimée' })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
