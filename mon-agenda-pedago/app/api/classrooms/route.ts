import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyToken, getTokenFromRequest } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request) || request.cookies.get('token')?.value
    if (!token) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

    const payload = await verifyToken(token)
    if (!payload) return NextResponse.json({ error: 'Token invalide' }, { status: 401 })

    const classrooms = await prisma.classroom.findMany({
      where: { userId: payload.userId },
      include: { students: true, groups: true }
    })

    return NextResponse.json({ classrooms })
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
    const { name, level, period } = body

    if (!name) {
      return NextResponse.json({ error: 'Nom requis' }, { status: 400 })
    }

    const classroom = await prisma.classroom.create({
      data: {
        name,
        level: level || null,
        period: period || null,
        userId: payload.userId
      }
    })

    return NextResponse.json({ classroom }, { status: 201 })
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
    const classroomId = searchParams.get('classroomId')
    const body = await request.json()

    if (!classroomId) {
      return NextResponse.json({ error: 'classroomId requis' }, { status: 400 })
    }

    const classroom = await prisma.classroom.findUnique({
      where: { id: classroomId }
    })

    if (!classroom || classroom.userId !== payload.userId) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    }

    const updated = await prisma.classroom.update({
      where: { id: classroomId },
      data: {
        ...(body.name && { name: body.name }),
        ...(body.level !== undefined && { level: body.level }),
        ...(body.period !== undefined && { period: body.period }),
      }
    })

    return NextResponse.json({ classroom: updated })
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
    const classroomId = searchParams.get('classroomId')

    if (!classroomId) {
      return NextResponse.json({ error: 'classroomId requis' }, { status: 400 })
    }

    const classroom = await prisma.classroom.findUnique({
      where: { id: classroomId }
    })

    if (!classroom || classroom.userId !== payload.userId) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    }

    await prisma.classroom.delete({
      where: { id: classroomId }
    })

    return NextResponse.json({ message: 'Classe supprimée' })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
