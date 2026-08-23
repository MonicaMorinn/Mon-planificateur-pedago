'use client'

import { ReactNode, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/store'
import {
  Calendar,
  Clock,
  BookOpen,
  Users,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  Home,
  CheckSquare,
  FileText,
  Share2,
  Download,
} from 'lucide-react'

interface LayoutProps {
  children: ReactNode
  authenticated?: boolean
}

export default function Layout({ children, authenticated = false }: LayoutProps) {
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [isMobile, setIsMobile] = useState(false)
  const { user, logout } = useAuthStore()

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768)
      if (window.innerWidth < 768) {
        setSidebarOpen(false)
      }
    }

    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const handleLogout = () => {
    logout()
    router.push('/')
  }

  if (!authenticated) {
    return <>{children}</>
  }

  const navItems = [
    { icon: Home, label: 'Tableau de bord', href: '/dashboard' },
    { icon: Calendar, label: 'Calendrier', href: '/calendar' },
    { icon: Clock, label: 'Horaire', href: '/schedule' },
    { icon: BookOpen, label: 'Planification', href: '/planning' },
    { icon: CheckSquare, label: 'Tâches', href: '/tasks' },
    { icon: Users, label: 'Ma classe', href: '/classroom' },
    { icon: BarChart3, label: 'Évaluations', href: '/assessments' },
    { icon: FileText, label: 'Ressources', href: '/resources' },
    { icon: Share2, label: 'Partage', href: '/shared' },
    { icon: FileText, label: 'Exporter', href: '/export' },
    { icon: Download, label: 'Impression', href: '/print' },
    { icon: Settings, label: 'Paramètres', href: '/settings' },
  ]

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Overlay mobile */}
      {isMobile && sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`${
          sidebarOpen ? 'w-64' : 'w-0'
        } fixed md:relative transition-all duration-300 h-full bg-white shadow-lg z-40 overflow-hidden flex flex-col`}
      >
        <div className="p-6 border-b flex-shrink-0">
          <h1 className="text-xl font-bold text-primary whitespace-nowrap">Mon Agenda Pédago</h1>
        </div>

        <nav className="flex-1 min-h-0 overflow-y-auto p-6 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => { if (isMobile) setSidebarOpen(false) }}
                className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-100 transition-colors whitespace-nowrap"
              >
                <Icon size={20} className="text-primary flex-shrink-0" />
                <span className="text-gray-700">{item.label}</span>
              </Link>
            )
          })}
        </nav>

        <div className="flex-shrink-0 p-6 border-t bg-white">
          <div className="mb-4 pb-4 border-b">
            <p className="text-sm font-semibold text-gray-700 truncate">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="text-xs text-gray-500 truncate">{user?.email}</p>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors whitespace-nowrap"
          >
            <LogOut size={18} className="flex-shrink-0" />
            <span>Déconnexion</span>
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <div className="bg-white shadow-sm px-4 md:px-6 py-4 flex items-center gap-4">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-gray-100 rounded-lg md:hidden flex-shrink-0"
          >
            {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
          <div className="flex-1" />
          <div className="text-sm text-gray-600 truncate">
            Bienvenue, {user?.firstName}!
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 overflow-auto p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
