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
    const parentId = searchParams.get('parentId')

    const resources = await prisma.resource.findMany({
      where: {
        userId: payload.userId,
        parentId: parentId || null
      },
      include: { children: true },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ resources })
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
    const { title, type, parentId, url, content, tags, isFavorite } = body

    if (!title || !type) {
      return NextResponse.json({ error: 'Titre et type requis' }, { status: 400 })
    }

    const resource = await prisma.resource.create({
      data: {
        title,
        type,
        parentId: parentId || null,
        url: url || null,
        content: content || null,
        tags: tags ? JSON.stringify(tags) : null,
        isFavorite: isFavorite || false,
        userId: payload.userId
      }
    })

    return NextResponse.json({ resource }, { status: 201 })
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
    const resourceId = searchParams.get('resourceId')
    const body = await request.json()

    if (!resourceId) {
      return NextResponse.json({ error: 'resourceId requis' }, { status: 400 })
    }

    const resource = await prisma.resource.findUnique({
      where: { id: resourceId }
    })

    if (!resource || resource.userId !== payload.userId) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    }

    const updated = await prisma.resource.update({
      where: { id: resourceId },
      data: {
        ...(body.title && { title: body.title }),
        ...(body.type && { type: body.type }),
        ...(body.url !== undefined && { url: body.url }),
        ...(body.content !== undefined && { content: body.content }),
        ...(body.tags && { tags: JSON.stringify(body.tags) }),
        ...(body.isFavorite !== undefined && { isFavorite: body.isFavorite })
      }
    })

    return NextResponse.json({ resource: updated })
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
    const resourceId = searchParams.get('resourceId')

    if (!resourceId) {
      return NextResponse.json({ error: 'resourceId requis' }, { status: 400 })
    }

    const resource = await prisma.resource.findUnique({
      where: { id: resourceId }
    })

    if (!resource || resource.userId !== payload.userId) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    }

    await prisma.resource.delete({
      where: { id: resourceId }
    })

    return NextResponse.json({ message: 'Ressource supprimée' })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
