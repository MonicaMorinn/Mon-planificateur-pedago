import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyToken, getTokenFromRequest } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request) || request.cookies.get('token')?.value
    if (!token) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    const payload = await verifyToken(token)
    if (!payload) return NextResponse.json({ error: 'Token invalide' }, { status: 401 })

    const fonts = await prisma.customFont.findMany({
      where: { userId: payload.userId },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ fonts })
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
    const { name, format, dataUrl } = body

    if (!name || !format || !dataUrl) {
      return NextResponse.json({ error: 'Données incomplètes' }, { status: 400 })
    }

    const allowedFormats = ['ttf', 'otf', 'woff', 'woff2']
    if (!allowedFormats.includes(format.toLowerCase())) {
      return NextResponse.json({ error: 'Format de police non supporté' }, { status: 400 })
    }

    // Limite raisonnable (5MB en base64 ~ 6.6MB de texte)
    if (dataUrl.length > 7_000_000) {
      return NextResponse.json({ error: 'Fichier de police trop volumineux (max ~5MB)' }, { status: 400 })
    }

    const font = await prisma.customFont.create({
      data: {
        userId: payload.userId,
        name,
        format: format.toLowerCase(),
        dataUrl
      }
    })

    return NextResponse.json({ font }, { status: 201 })
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
    const id = searchParams.get('fontId')
    if (!id) return NextResponse.json({ error: 'fontId requis' }, { status: 400 })

    const existing = await prisma.customFont.findUnique({ where: { id } })
    if (!existing || existing.userId !== payload.userId) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    }

    await prisma.customFont.delete({ where: { id } })
    return NextResponse.json({ message: 'Police supprimée' })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
