import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyToken, getTokenFromRequest } from '@/lib/auth'

export async function PUT(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request) || request.cookies.get('token')?.value
    if (!token) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

    const payload = await verifyToken(token)
    if (!payload) return NextResponse.json({ error: 'Token invalide' }, { status: 401 })

    const body = await request.json()
    const { firstName, lastName, schoolId, district, province, level } = body

    const updated = await prisma.user.update({
      where: { id: payload.userId },
      data: {
        ...(firstName && { firstName }),
        ...(lastName && { lastName }),
        ...(schoolId !== undefined && { schoolId }),
        ...(district !== undefined && { district }),
        ...(province !== undefined && { province }),
        ...(level !== undefined && { level })
      }
    })

    return NextResponse.json({
      user: {
        id: updated.id,
        email: updated.email,
        firstName: updated.firstName,
        lastName: updated.lastName,
        schoolId: updated.schoolId,
        district: updated.district,
        province: updated.province,
        level: updated.level
      }
    })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
