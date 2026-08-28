import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyToken, getTokenFromRequest } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request) || request.cookies.get('token')?.value
    if (!token) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    const payload = await verifyToken(token)
    if (!payload) return NextResponse.json({ error: 'Token invalide' }, { status: 401 })

    const presentations = await prisma.presentation.findMany({
      where: { userId: payload.userId },
      orderBy: { createdAt: 'desc' }
    })

    // Ne pas renvoyer dataUrl dans la liste (fichiers potentiellement lourds) :
    // seulement les métadonnées, le fichier complet est récupéré au clic sur télécharger.
    const list = presentations.map((p: any) => ({
      id: p.id, title: p.title, subject: p.subject, fileName: p.fileName, createdAt: p.createdAt
    }))

    return NextResponse.json({ presentations: list })
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
    const { title, subject, fileName, dataUrl } = body

    if (!title || !fileName || !dataUrl) {
      return NextResponse.json({ error: 'Données incomplètes' }, { status: 400 })
    }

    // Limite raisonnable pour éviter de saturer la base SQLite (~15MB en base64)
    if (dataUrl.length > 20_000_000) {
      return NextResponse.json({ error: 'Fichier trop volumineux (max ~15MB)' }, { status: 400 })
    }

    const presentation = await prisma.presentation.create({
      data: {
        userId: payload.userId,
        title,
        subject: subject || null,
        fileName,
        dataUrl
      }
    })

    return NextResponse.json({
      presentation: { id: presentation.id, title: presentation.title, subject: presentation.subject, fileName: presentation.fileName, createdAt: presentation.createdAt }
    }, { status: 201 })
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
    const id = searchParams.get('presentationId')
    if (!id) return NextResponse.json({ error: 'presentationId requis' }, { status: 400 })

    const existing = await prisma.presentation.findUnique({ where: { id } })
    if (!existing || existing.userId !== payload.userId) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    }

    await prisma.presentation.delete({ where: { id } })
    return NextResponse.json({ message: 'PowerPoint supprimé' })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
