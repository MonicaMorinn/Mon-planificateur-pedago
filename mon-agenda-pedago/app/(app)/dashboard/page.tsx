'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuthStore } from '@/lib/store'
import Layout from '@/components/Layout'
import toast from 'react-hot-toast'
import { Calendar, Clock, BookOpen, CheckSquare, Plus, ArrowRight } from 'lucide-react'
import { formatDate } from '@/lib/utils'

interface SchoolYear {
  id: string
  name: string
  startDate: string
  endDate: string
  isActive: boolean
}

interface ScheduleBlock {
  id: string
  name: string
  startTime: string
  endTime: string
  type: string
  subject?: string
  color?: string
  dayOfWeek: number
}

export default function DashboardPage() {
  const router = useRouter()
  const { user, token } = useAuthStore()
  const [schoolYear, setSchoolYear] = useState<SchoolYear | null>(null)
  const [todayBlocks, setTodayBlocks] = useState<ScheduleBlock[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user || !token) {
      router.push('/auth')
      return
    }

    loadDashboardData()
  }, [user, token, router])

  const loadDashboardData = async () => {
    try {
      // Récupérer l'année scolaire active
      const yearResponse = await fetch('/api/school-years', {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (!yearResponse.ok) {
        router.push('/onboarding')
        return
      }

      const yearData = await yearResponse.json()
      const activeYear = yearData.schoolYears.find((y: any) => y.isActive)

      if (!activeYear) {
        router.push('/onboarding')
        return
      }

      setSchoolYear(activeYear)

      // Récupérer les blocs d'aujourd'hui
      const today = new Date()
      const dayOfWeek = today.getDay() === 0 ? 6 : today.getDay() - 1

      const schedulesResponse = await fetch(`/api/schedules?schoolYearId=${activeYear.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (schedulesResponse.ok) {
        const schedulesData = await schedulesResponse.json()
        const defaultSchedule = schedulesData.schedules.find((s: any) => s.isDefault)

        if (defaultSchedule) {
          const blocksForToday = defaultSchedule.blocks.filter(
            (b: any) => b.dayOfWeek === dayOfWeek
          )
          setTodayBlocks(blocksForToday.sort((a: any, b: any) => a.startTime.localeCompare(b.startTime)))
        }
      }
    } catch (error) {
      console.error('Error loading dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Layout authenticated={true}>
        <div className="flex items-center justify-center h-96">
          <div className="text-gray-500">Chargement...</div>
        </div>
      </Layout>
    )
  }

  const DAYS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche']
  const today = new Date()
  const dayName = DAYS[today.getDay() === 0 ? 6 : today.getDay() - 1]

  const quickActions = [
    { icon: BookOpen, label: 'Ajouter une planification', href: '/planning/new', color: 'from-blue-500 to-blue-600' },
    { icon: CheckSquare, label: 'Ajouter une tâche', href: '/tasks/new', color: 'from-green-500 to-green-600' },
    { icon: Calendar, label: 'Ajouter un événement', href: '/calendar/new', color: 'from-pink-500 to-pink-600' },
    { icon: Clock, label: 'Gérer l\'horaire', href: '/schedule', color: 'from-purple-500 to-purple-600' },
  ]

  return (
    <Layout authenticated={true}>
      <div className="space-y-8">
        {/* Welcome */}
        <div className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-2xl p-8">
          <h1 className="text-4xl font-bold mb-2">Bienvenue, {user?.firstName}! 👋</h1>
          <p className="text-gray-600">
            {dayName} {today.getDate()} {new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
          </p>
          {schoolYear && (
            <p className="text-sm text-gray-500 mt-2">Année scolaire: {schoolYear.name}</p>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Aujourd'hui */}
          <div className="lg:col-span-2 bg-white rounded-2xl p-8 shadow-lg">
            <h2 className="text-2xl font-bold mb-6">Aujourd'hui</h2>

            {todayBlocks.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Clock size={48} className="mx-auto mb-4 opacity-50" />
                <p>Aucun bloc d'horaire prévu pour aujourd'hui</p>
                <Link
                  href="/schedule"
                  className="text-primary hover:underline text-sm mt-2 inline-block"
                >
                  Gérer l'horaire →
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {todayBlocks.map((block) => (
                  <div key={block.id} className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="w-12 h-12 rounded-lg" style={{ backgroundColor: block.color || '#6366f1' }}></div>
                    <div className="flex-1">
                      <p className="font-semibold">{block.name}</p>
                      <p className="text-sm text-gray-600">{block.startTime} - {block.endTime}</p>
                      <p className="text-xs text-gray-500">{block.type}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Actions rapides */}
          <div className="bg-white rounded-2xl p-8 shadow-lg">
            <h2 className="text-2xl font-bold mb-6">Actions rapides</h2>
            <div className="space-y-3">
              {quickActions.map((action) => {
                const Icon = action.icon
                return (
                  <Link
                    key={action.href}
                    href={action.href}
                    className={`flex items-center gap-3 p-4 rounded-lg bg-gradient-to-r ${action.color} text-white hover:shadow-lg transition-all`}
                  >
                    <Icon size={20} />
                    <div className="flex-1 text-sm font-semibold">{action.label}</div>
                    <ArrowRight size={18} />
                  </Link>
                )
              })}
            </div>
          </div>
        </div>

        {/* Navigation rapide */}
        <div className="bg-white rounded-2xl p-8 shadow-lg">
          <h2 className="text-2xl font-bold mb-6">Accès rapide</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: Calendar, label: 'Calendrier', href: '/calendar' },
              { icon: Clock, label: 'Horaire', href: '/schedule' },
              { icon: BookOpen, label: 'Planification', href: '/planning' },
              { icon: CheckSquare, label: 'Tâches', href: '/tasks' },
            ].map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex flex-col items-center justify-center p-6 bg-gray-50 rounded-lg hover:bg-primary/10 hover:text-primary transition-all group"
                >
                  <Icon size={32} className="mb-2 group-hover:scale-110 transition-transform" />
                  <span className="text-sm font-semibold text-center">{item.label}</span>
                </Link>
              )
            })}
          </div>
        </div>
      </div>
    </Layout>
  )
}
