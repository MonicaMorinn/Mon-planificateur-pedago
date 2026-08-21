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
    const initializeAuth = async () => {
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
        localStorage.removeItem('token')
        setLoading(false)
        setIsInitialized(true)
        router.push('/auth')
      }
    }

    if (!isInitialized && !user) {
      initializeAuth()
    } else {
      setIsInitialized(true)
    }
  }, [user, router, setUser, setToken, setLoading, isInitialized])

  if (!isInitialized || (isLoading && !user)) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-indigo-100 via-white to-pink-100">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Chargement...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return children
}
