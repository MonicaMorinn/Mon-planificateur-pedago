import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyToken, getTokenFromRequest } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request) || request.cookies.get('token')?.value
    if (!token) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

    const payload = await verifyToken(token)
    if (!payload) return NextResponse.json({ error: 'Token invalide' }, { status: 401 })

    // Partages envoyés (je suis le propriétaire)
    const sent = await prisma.sharedResource.findMany({
      where: { ownerId: payload.userId },
      orderBy: { createdAt: 'desc' }
    })

    // Partages reçus (je suis le destinataire)
    const received = await prisma.sharedResource.findMany({
      where: { recipientId: payload.userId },
      orderBy: { createdAt: 'desc' }
    })

    // Enrichir avec les infos de ressource et d'utilisateur
    const enrich = async (list: any[]) => {
      const results = []
      for (const share of list) {
        const resource = await prisma.resource.findUnique({ where: { id: share.resourceId } })
        const owner = await prisma.user.findUnique({ where: { id: share.ownerId } })
        const recipient = await prisma.user.findUnique({ where: { id: share.recipientId } })
        results.push({
          ...share,
          resourceTitle: resource?.title || 'Ressource supprimée',
          resourceType: resource?.type || '',
          ownerName: owner ? `${owner.firstName} ${owner.lastName}` : '',
          ownerEmail: owner?.email || '',
          recipientName: recipient ? `${recipient.firstName} ${recipient.lastName}` : '',
          recipientEmail: recipient?.email || ''
        })
      }
      return results
    }

    const sentEnriched = await enrich(sent)
    const receivedEnriched = await enrich(received)

    return NextResponse.json({ sent: sentEnriched, received: receivedEnriched })
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
    const { resourceId, email, type } = body

    if (!resourceId || !email) {
      return NextResponse.json({ error: 'Ressource et email requis' }, { status: 400 })
    }

    // Vérifier que la ressource appartient à l'utilisateur
    const resource = await prisma.resource.findUnique({ where: { id: resourceId } })
    if (!resource || resource.userId !== payload.userId) {
      return NextResponse.json({ error: 'Ressource non trouvée ou non autorisée' }, { status: 403 })
    }

    // Trouver le destinataire par email
    const recipient = await prisma.user.findUnique({ where: { email } })
    if (!recipient) {
      return NextResponse.json({ error: 'Aucune enseignante trouvée avec cet email' }, { status: 404 })
    }

    if (recipient.id === payload.userId) {
      return NextResponse.json({ error: 'Vous ne pouvez pas partager avec vous-même' }, { status: 400 })
    }

    const shared = await prisma.sharedResource.create({
      data: {
        resourceId,
        ownerId: payload.userId,
        recipientId: recipient.id,
        type: type || 'view'
      }
    })

    return NextResponse.json({ shared }, { status: 201 })
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
    const shareId = searchParams.get('shareId')

    if (!shareId) {
      return NextResponse.json({ error: 'shareId requis' }, { status: 400 })
    }

    const share = await prisma.sharedResource.findUnique({ where: { id: shareId } })
    if (!share || (share.ownerId !== payload.userId && share.recipientId !== payload.userId)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    }

    await prisma.sharedResource.delete({ where: { id: shareId } })

    return NextResponse.json({ message: 'Partage supprimé' })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
