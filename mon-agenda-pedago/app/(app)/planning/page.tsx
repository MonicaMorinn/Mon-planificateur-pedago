'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuthStore } from '@/lib/store'
import Layout from '@/components/Layout'
import toast from 'react-hot-toast'
import { Calendar, ChevronLeft, ChevronRight, Save } from 'lucide-react'
import { formatDate, isSameDay } from '@/lib/utils'

interface ScheduleBlock {
  id: string
  name: string
  startTime: string
  endTime: string
  type: string
  subject?: string
  color: string
  dayOfWeek: number
}

interface PlannerEntry {
  id: string
  timeBlock: string
  title: string
  objective?: string
  activity?: string
  materials?: string
  homework?: string
  evaluation?: string
  notes?: string
  status: string
}

const DAYS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche']

export default function DailyPlannerPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, token } = useAuthStore()

  const [currentDate, setCurrentDate] = useState<Date>(
    searchParams.get('date')
      ? new Date(searchParams.get('date')!)
      : new Date()
  )
  const [blocks, setBlocks] = useState<ScheduleBlock[]>([])
  const [entries, setEntries] = useState<PlannerEntry[]>([])
  const [schoolYearId, setSchoolYearId] = useState('')
  const [loading, setLoading] = useState(true)
  const [expandedBlock, setExpandedBlock] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const [editingEntry, setEditingEntry] = useState<PlannerEntry | null>(null)
  const [formData, setFormData] = useState({
    title: '',
    objective: '',
    activity: '',
    materials: '',
    homework: '',
    evaluation: '',
    notes: '',
    status: 'draft'
  })

  useEffect(() => {
    if (!user || !token) {
      router.push('/auth')
      return
    }
    loadData()
  }, [user, token, router])

  const loadData = async () => {
    try {
      // Récupérer l'année scolaire
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

      setSchoolYearId(activeYear.id)

      // Récupérer les horaires
      const schedulesResponse = await fetch(
        `/api/schedules?schoolYearId=${activeYear.id}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      )

      if (schedulesResponse.ok) {
        const schedulesData = await schedulesResponse.json()
        const defaultSchedule = schedulesData.schedules.find((s: any) => s.isDefault)

        if (defaultSchedule) {
          const dayOfWeek = currentDate.getDay() === 0 ? 6 : currentDate.getDay() - 1
          const blocksForDay = defaultSchedule.blocks
            .filter((b: any) => b.dayOfWeek === dayOfWeek)
            .sort((a: any, b: any) => a.startTime.localeCompare(b.startTime))
          setBlocks(blocksForDay)
        }
      }

      // Récupérer les entrées de planification
      const dateStr = currentDate.toISOString().split('T')[0]
      const nextDay = new Date(currentDate)
      nextDay.setDate(nextDay.getDate() + 1)

      const entriesResponse = await fetch(
        `/api/planner-entries?schoolYearId=${activeYear.id}&startDate=${dateStr}T00:00:00Z&endDate=${dateStr}T23:59:59Z`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      )

      if (entriesResponse.ok) {
        const entriesData = await entriesResponse.json()
        setEntries(entriesData.entries || [])
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Erreur lors du chargement')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveEntry = async (block: ScheduleBlock) => {
    if (!formData.title) {
      toast.error('Veuillez entrer un titre')
      return
    }

    setSaving(true)
    try {
      const timeBlock = `${block.startTime}-${block.endTime}`
      const existingEntry = entries.find(e => e.timeBlock === timeBlock)

      if (existingEntry) {
        // Mettre à jour
        const response = await fetch(
          `/api/planner-entries?entryId=${existingEntry.id}`,
          {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(formData)
          }
        )

        if (!response.ok) throw new Error('Erreur')

        const data = await response.json()
        setEntries(entries.map(e => e.id === existingEntry.id ? data.entry : e))
      } else {
        // Créer une nouvelle
        const response = await fetch('/api/planner-entries', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            date: currentDate.toISOString(),
            timeBlock,
            subject: block.subject || block.name,
            ...formData,
            schoolYearId
          })
        })

        if (!response.ok) throw new Error('Erreur')

        const data = await response.json()
        setEntries([...entries, data.entry])
      }

      setFormData({
        title: '',
        objective: '',
        activity: '',
        materials: '',
        homework: '',
        evaluation: '',
        notes: '',
        status: 'draft'
      })
      setEditingEntry(null)
      setExpandedBlock(null)
      toast.success('Planification sauvegardée')
    } catch (error) {
      console.error(error)
      toast.error('Erreur lors de la sauvegarde')
    } finally {
      setSaving(false)
    }
  }

  const getEntryForBlock = (block: ScheduleBlock) => {
    const timeBlock = `${block.startTime}-${block.endTime}`
    return entries.find(e => e.timeBlock === timeBlock)
  }

  const handleEditBlock = (block: ScheduleBlock) => {
    const entry = getEntryForBlock(block)
    if (entry) {
      setFormData({
        title: entry.title || '',
        objective: entry.objective || '',
        activity: entry.activity || '',
        materials: entry.materials || '',
        homework: entry.homework || '',
        evaluation: entry.evaluation || '',
        notes: entry.notes || '',
        status: entry.status || 'draft'
      })
      setEditingEntry(entry)
    } else {
      setFormData({
        title: '',
        objective: '',
        activity: '',
        materials: '',
        homework: '',
        evaluation: '',
        notes: '',
        status: 'draft'
      })
      setEditingEntry(null)
    }
    setExpandedBlock(block.id)
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

  const dayOfWeek = currentDate.getDay() === 0 ? 6 : currentDate.getDay() - 1
  const dayName = DAYS[dayOfWeek]

  return (
    <Layout authenticated={true}>
      <div className="space-y-8 max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Calendar className="text-primary" size={32} />
            <div>
              <h1 className="text-3xl font-bold">{dayName}</h1>
              <p className="text-gray-600">{formatDate(currentDate)}</p>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex gap-2">
            <button
              onClick={() => {
                const prev = new Date(currentDate)
                prev.setDate(prev.getDate() - 1)
                setCurrentDate(prev)
              }}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <ChevronLeft size={24} />
            </button>
            <button
              onClick={() => setCurrentDate(new Date())}
              className="px-4 py-2 hover:bg-gray-100 rounded-lg font-semibold text-sm"
            >
              Aujourd'hui
            </button>
            <button
              onClick={() => {
                const next = new Date(currentDate)
                next.setDate(next.getDate() + 1)
                setCurrentDate(next)
              }}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <ChevronRight size={24} />
            </button>
          </div>
        </div>

        {/* Blocs de la journée */}
        <div className="space-y-3">
          {blocks.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center shadow-lg">
              <p className="text-gray-500 mb-4">Aucun bloc d'horaire pour ce jour</p>
              <button
                onClick={() => router.push('/schedule')}
                className="text-primary hover:underline"
              >
                Gérer l'horaire →
              </button>
            </div>
          ) : (
            blocks.map((block) => {
              const entry = getEntryForBlock(block)
              const isExpanded = expandedBlock === block.id

              return (
                <div key={block.id} className="bg-white rounded-xl shadow-lg overflow-hidden">
                  <button
                    onClick={() => handleEditBlock(block)}
                    className="w-full p-4 hover:bg-gray-50 transition-colors text-left"
                  >
                    <div className="flex items-start gap-4">
                      <div
                        className="w-6 h-24 rounded flex-shrink-0"
                        style={{ backgroundColor: block.color }}
                      ></div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-bold text-lg">{block.name}</p>
                            <p className="text-sm text-gray-600">
                              {block.startTime} - {block.endTime}
                            </p>
                          </div>
                          {entry && (
                            <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full">
                              Planifié
                            </span>
                          )}
                        </div>
                        {entry && (
                          <p className="text-sm text-gray-700 mt-2 line-clamp-1">{entry.title}</p>
                        )}
                      </div>
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="border-t border-gray-200 p-4 bg-gray-50">
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium mb-1">Titre/Sujet *</label>
                          <input
                            type="text"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                            placeholder="Ex: Lecture compréhension"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium mb-1">Objectif pédagogique</label>
                          <textarea
                            value={formData.objective}
                            onChange={(e) => setFormData({ ...formData, objective: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                            rows={2}
                            placeholder="Ex: Comprendre l'idée principale d'un texte"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium mb-1">Activité</label>
                          <textarea
                            value={formData.activity}
                            onChange={(e) => setFormData({ ...formData, activity: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                            rows={2}
                            placeholder="Description de l'activité"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium mb-1">Matériel</label>
                            <input
                              type="text"
                              value={formData.materials}
                              onChange={(e) => setFormData({ ...formData, materials: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                              placeholder="Ex: Manuel p. 45-46"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-1">Devoir</label>
                            <input
                              type="text"
                              value={formData.homework}
                              onChange={(e) => setFormData({ ...formData, homework: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                              placeholder="Ex: Ex. 5-8 p. 50"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium mb-1">Évaluation</label>
                          <input
                            type="text"
                            value={formData.evaluation}
                            onChange={(e) => setFormData({ ...formData, evaluation: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                            placeholder="Ex: Quiz formatif"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium mb-1">Notes</label>
                          <textarea
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                            rows={2}
                            placeholder="Notes personnelles"
                          />
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={() => handleSaveEntry(block)}
                            disabled={saving}
                            className="flex-1 flex items-center justify-center gap-2 bg-primary text-white py-2 rounded-lg hover:bg-primary/90 disabled:opacity-50"
                          >
                            <Save size={18} />
                            {saving ? 'Sauvegarde...' : 'Enregistrer'}
                          </button>
                          <button
                            onClick={() => setExpandedBlock(null)}
                            className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400"
                          >
                            Fermer
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
      </div>
    </Layout>
  )
}
