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

    const where: any = { userId: payload.userId }
    if (schoolYearId) where.schoolYearId = schoolYearId

    const assessments = await prisma.assessment.findMany({
      where,
      orderBy: { date: 'desc' }
    })

    return NextResponse.json({ assessments })
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
    const { schoolYearId, title, subject, competency, date, classroomId, notes } = body

    if (!schoolYearId || !title || !subject || !date) {
      return NextResponse.json({ error: 'Données incomplètes' }, { status: 400 })
    }

    const assessment = await prisma.assessment.create({
      data: {
        userId: payload.userId,
        schoolYearId,
        title,
        subject,
        competency: competency || null,
        date: new Date(date),
        classroomId: classroomId || null,
        notes: notes || null
      }
    })

    return NextResponse.json({ assessment }, { status: 201 })
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
    const assessmentId = searchParams.get('assessmentId')
    const body = await request.json()

    if (!assessmentId) {
      return NextResponse.json({ error: 'assessmentId requis' }, { status: 400 })
    }

    const assessment = await prisma.assessment.findUnique({ where: { id: assessmentId } })
    if (!assessment || assessment.userId !== payload.userId) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    }

    const updated = await prisma.assessment.update({
      where: { id: assessmentId },
      data: {
        ...(body.title && { title: body.title }),
        ...(body.subject && { subject: body.subject }),
        ...(body.competency !== undefined && { competency: body.competency }),
        ...(body.date && { date: new Date(body.date) }),
        ...(body.classroomId !== undefined && { classroomId: body.classroomId }),
        ...(body.notes !== undefined && { notes: body.notes })
      }
    })

    return NextResponse.json({ assessment: updated })
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
    const assessmentId = searchParams.get('assessmentId')

    if (!assessmentId) {
      return NextResponse.json({ error: 'assessmentId requis' }, { status: 400 })
    }

    const assessment = await prisma.assessment.findUnique({ where: { id: assessmentId } })
    if (!assessment || assessment.userId !== payload.userId) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    }

    await prisma.assessment.delete({ where: { id: assessmentId } })

    return NextResponse.json({ message: 'Évaluation supprimée' })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
