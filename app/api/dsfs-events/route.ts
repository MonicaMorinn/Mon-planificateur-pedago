import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyToken, getTokenFromRequest } from '@/lib/auth'

// Les événements DSFS sont rattachés à une année scolaire précise et ne
// sont jamais copiés automatiquement d'une année à l'autre. L'utilisateur
// les saisit lui-même (aucune date officielle n'est inventée par le système).

export async function GET(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request) || request.cookies.get('token')?.value
    if (!token) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    const payload = await verifyToken(token)
    if (!payload) return NextResponse.json({ error: 'Token invalide' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const schoolYearId = searchParams.get('schoolYearId')
    if (!schoolYearId) return NextResponse.json({ error: 'schoolYearId requis' }, { status: 400 })

    // Vérifier que l'année scolaire appartient à l'utilisateur
    const year = await prisma.schoolYear.findUnique({ where: { id: schoolYearId } })
    if (!year || year.userId !== payload.userId) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    }

    const events = await prisma.dsfsEvent.findMany({
      where: { schoolYearId },
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
    const { schoolYearId, title, date, description } = body

    if (!schoolYearId || !title || !date) {
      return NextResponse.json({ error: 'Données incomplètes' }, { status: 400 })
    }

    const year = await prisma.schoolYear.findUnique({ where: { id: schoolYearId } })
    if (!year || year.userId !== payload.userId) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    }

    const event = await prisma.dsfsEvent.create({
      data: {
        schoolYearId,
        title,
        date: new Date(date),
        description: description || null
      }
    })

    return NextResponse.json({ event }, { status: 201 })
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
    const id = searchParams.get('eventId')
    if (!id) return NextResponse.json({ error: 'eventId requis' }, { status: 400 })

    const event = await prisma.dsfsEvent.findUnique({ where: { id } })
    if (!event) return NextResponse.json({ error: 'Introuvable' }, { status: 404 })

    const year = await prisma.schoolYear.findUnique({ where: { id: event.schoolYearId } })
    if (!year || year.userId !== payload.userId) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    }

    await prisma.dsfsEvent.delete({ where: { id } })
    return NextResponse.json({ message: 'Événement DSFS supprimé' })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
