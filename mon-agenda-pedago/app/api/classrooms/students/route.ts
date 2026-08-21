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
    const classroomId = searchParams.get('classroomId')

    if (!classroomId) {
      return NextResponse.json({ error: 'classroomId requis' }, { status: 400 })
    }

    // Vérifier que la classe appartient à l'utilisateur
    const classroom = await prisma.classroom.findUnique({
      where: { id: classroomId }
    })

    if (!classroom || classroom.userId !== payload.userId) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    }

    const students = await prisma.student.findMany({
      where: { classroomId },
      orderBy: { lastName: 'asc' }
    })

    return NextResponse.json({ students })
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
    const { classroomId, firstName, lastName, studentNumber, notes } = body

    if (!classroomId || !firstName || !lastName) {
      return NextResponse.json({ error: 'Données incomplètes' }, { status: 400 })
    }

    // Vérifier que la classe appartient à l'utilisateur
    const classroom = await prisma.classroom.findUnique({
      where: { id: classroomId }
    })

    if (!classroom || classroom.userId !== payload.userId) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    }

    const student = await prisma.student.create({
      data: {
        classroomId,
        firstName,
        lastName,
        studentNumber: studentNumber || null,
        notes: notes || null
      }
    })

    return NextResponse.json({ student }, { status: 201 })
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
    const studentId = searchParams.get('studentId')
    const body = await request.json()

    if (!studentId) {
      return NextResponse.json({ error: 'studentId requis' }, { status: 400 })
    }

    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: { classroom: true }
    })

    if (!student || student.classroom.userId !== payload.userId) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    }

    const updated = await prisma.student.update({
      where: { id: studentId },
      data: {
        ...(body.firstName && { firstName: body.firstName }),
        ...(body.lastName && { lastName: body.lastName }),
        ...(body.studentNumber !== undefined && { studentNumber: body.studentNumber }),
        ...(body.notes !== undefined && { notes: body.notes }),
      }
    })

    return NextResponse.json({ student: updated })
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
    const studentId = searchParams.get('studentId')

    if (!studentId) {
      return NextResponse.json({ error: 'studentId requis' }, { status: 400 })
    }

    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: { classroom: true }
    })

    if (!student || student.classroom.userId !== payload.userId) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    }

    await prisma.student.delete({
      where: { id: studentId }
    })

    return NextResponse.json({ message: 'Élève supprimé' })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
