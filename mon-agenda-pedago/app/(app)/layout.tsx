'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/store'

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const { user, setUser, setToken, isLoading, setLoading } = useAuthStore()
  const [isInitialized, setIsInitialized] = useState(false)

  useEffect(() => {
    const verifyAuth = async () => {
      try {
        const storedToken = localStorage.getItem('token')
        
        if (!storedToken) {
          setLoading(false)
          setIsInitialized(true)
          router.push('/auth')
          return
        }

        const response = await fetch('/api/auth/me', {
          headers: {
            'Authorization': `Bearer ${storedToken}`
          }
        })

        if (!response.ok) {
          localStorage.removeItem('token')
          setLoading(false)
          setIsInitialized(true)
          router.push('/auth')
          return
        }

        const data = await response.json()
        setUser(data.user)
        setToken(storedToken)
        setLoading(false)
        setIsInitialized(true)
      } catch (error) {
        console.error('Auth verification error:', error)
        setLoading(false)
        setIsInitialized(true)
        router.push('/auth')
      }
    }

    if (!isInitialized) {
      verifyAuth()
    }
  }, [isInitialized, router, setUser, setToken, setLoading])

  if (!isInitialized || isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-indigo-100 via-white to-pink-100">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement de votre agenda...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return children
}
