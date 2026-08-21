'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/store'
import Layout from '@/components/Layout'
import toast from 'react-hot-toast'
import { Clock, Plus, Edit2, Trash2, ChevronDown } from 'lucide-react'

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

interface Schedule {
  id: string
  name: string
  description?: string
  blocks: ScheduleBlock[]
  isDefault: boolean
  createdAt: string
}

const DAYS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche']
const TYPES = ['Cours', 'Récréation', 'Dîner', 'Accueil', 'Organisation', 'Transition', 'Réunion', 'Autre']
const COLORS = [
  '#6366f1', '#ec4899', '#f59e0b', '#10b981', '#06b6d4',
  '#8b5cf6', '#ef4444', '#f97316', '#eab308', '#14b8a6'
]

export default function SchedulePage() {
  const router = useRouter()
  const { user, token } = useAuthStore()
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(null)
  const [loading, setLoading] = useState(true)
  const [expandedDay, setExpandedDay] = useState<number | null>(0)
  const [showNewBlockForm, setShowNewBlockForm] = useState(false)
  const [editingBlock, setEditingBlock] = useState<(ScheduleBlock & { scheduleId: string }) | null>(null)

  const [newBlock, setNewBlock] = useState<ScheduleBlock>({
    id: '',
    name: '',
    startTime: '09:00',
    endTime: '09:45',
    type: 'Cours',
    color: '#6366f1',
    dayOfWeek: 0,
  })

  useEffect(() => {
    if (!user || !token) {
      router.push('/auth')
      return
    }
    loadSchedules()
  }, [user, token, router])

  const loadSchedules = async () => {
    try {
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

      const schedulesResponse = await fetch(`/api/schedules?schoolYearId=${activeYear.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      const schedulesData = await schedulesResponse.json()
      setSchedules(schedulesData.schedules)
      setSelectedSchedule(schedulesData.schedules[0] || null)
    } catch (error) {
      console.error('Error loading schedules:', error)
      toast.error('Erreur lors du chargement')
    } finally {
      setLoading(false)
    }
  }

  const handleAddBlock = async () => {
    if (!newBlock.name || !selectedSchedule) {
      toast.error('Veuillez remplir tous les champs')
      return
    }

    if (newBlock.startTime >= newBlock.endTime) {
      toast.error('L\'heure de fin doit être après l\'heure de début')
      return
    }

    try {
      const response = await fetch('/api/schedules/blocks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          scheduleId: selectedSchedule.id,
          ...newBlock
        })
      })

      if (!response.ok) throw new Error('Erreur')

      const data = await response.json()
      setSelectedSchedule({
        ...selectedSchedule,
        blocks: [...selectedSchedule.blocks, data.block]
      })

      setNewBlock({
        id: '',
        name: '',
        startTime: '09:00',
        endTime: '09:45',
        type: 'Cours',
        color: '#6366f1',
        dayOfWeek: 0,
      })
      setShowNewBlockForm(false)
      toast.success('Bloc ajouté')
    } catch (error) {
      console.error(error)
      toast.error('Erreur lors de l\'ajout')
    }
  }

  const handleUpdateBlock = async () => {
    if (!editingBlock || !selectedSchedule) {
      toast.error('Erreur')
      return
    }

    try {
      const response = await fetch(`/api/schedules/blocks?blockId=${editingBlock.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(editingBlock)
      })

      if (!response.ok) throw new Error('Erreur')

      setSelectedSchedule({
        ...selectedSchedule,
        blocks: selectedSchedule.blocks.map(b => b.id === editingBlock.id ? editingBlock : b)
      })

      setEditingBlock(null)
      toast.success('Bloc modifié')
    } catch (error) {
      console.error(error)
      toast.error('Erreur lors de la modification')
    }
  }

  const handleDeleteBlock = async (blockId: string) => {
    if (!selectedSchedule) return

    try {
      const response = await fetch(`/api/schedules/blocks?blockId=${blockId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (!response.ok) throw new Error('Erreur')

      setSelectedSchedule({
        ...selectedSchedule,
        blocks: selectedSchedule.blocks.filter(b => b.id !== blockId)
      })

      toast.success('Bloc supprimé')
    } catch (error) {
      console.error(error)
      toast.error('Erreur lors de la suppression')
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

  const getBlocksForDay = (dayIndex: number) => {
    if (!selectedSchedule) return []
    return selectedSchedule.blocks
      .filter(b => b.dayOfWeek === dayIndex)
      .sort((a, b) => a.startTime.localeCompare(b.startTime))
  }

  return (
    <Layout authenticated={true}>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Clock className="text-primary" size={32} />
            <h1 className="text-3xl font-bold">Mes horaires</h1>
          </div>
        </div>

        {/* Sélection de l'horaire */}
        <div className="bg-white rounded-2xl p-6 shadow-lg">
          <h2 className="font-semibold mb-4">Sélectionner un horaire</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {schedules.map((schedule) => (
              <button
                key={schedule.id}
                onClick={() => setSelectedSchedule(schedule)}
                className={`p-4 rounded-lg border-2 transition-all text-left ${
                  selectedSchedule?.id === schedule.id
                    ? 'border-primary bg-primary/5'
                    : 'border-gray-200 hover:border-primary/50'
                }`}
              >
                <p className="font-semibold">{schedule.name}</p>
                {schedule.isDefault && (
                  <p className="text-xs text-primary">Par défaut</p>
                )}
              </button>
            ))}
          </div>
        </div>

        {selectedSchedule && (
          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">{selectedSchedule.name}</h2>
              <button
                onClick={() => setShowNewBlockForm(!showNewBlockForm)}
                className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90"
              >
                <Plus size={20} /> Ajouter un bloc
              </button>
            </div>

            {/* Formulaire d'ajout */}
            {showNewBlockForm && (
              <div className="mb-8 p-6 bg-gray-50 rounded-lg border border-gray-200">
                <h3 className="font-semibold mb-4">Nouveau bloc</h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Jour</label>
                      <select
                        value={newBlock.dayOfWeek}
                        onChange={(e) => setNewBlock({ ...newBlock, dayOfWeek: parseInt(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      >
                        {DAYS.map((day, i) => (
                          <option key={i} value={i}>{day}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Type</label>
                      <select
                        value={newBlock.type}
                        onChange={(e) => setNewBlock({ ...newBlock, type: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      >
                        {TYPES.map((type) => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Nom</label>
                    <input
                      type="text"
                      value={newBlock.name}
                      onChange={(e) => setNewBlock({ ...newBlock, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      placeholder="Ex: Français"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Heure début</label>
                      <input
                        type="time"
                        value={newBlock.startTime}
                        onChange={(e) => setNewBlock({ ...newBlock, startTime: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Heure fin</label>
                      <input
                        type="time"
                        value={newBlock.endTime}
                        onChange={(e) => setNewBlock({ ...newBlock, endTime: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Couleur</label>
                    <div className="flex gap-2 flex-wrap">
                      {COLORS.map((color) => (
                        <button
                          key={color}
                          onClick={() => setNewBlock({ ...newBlock, color })}
                          className={`w-8 h-8 rounded-full border-2 ${newBlock.color === color ? 'border-gray-800' : 'border-transparent'}`}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={handleAddBlock}
                      className="flex-1 bg-primary text-white py-2 rounded-lg hover:bg-primary/90"
                    >
                      Ajouter
                    </button>
                    <button
                      onClick={() => setShowNewBlockForm(false)}
                      className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300"
                    >
                      Annuler
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Bloc d'édition */}
            {editingBlock && (
              <div className="mb-8 p-6 bg-blue-50 rounded-lg border border-blue-200">
                <h3 className="font-semibold mb-4">Modifier le bloc</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Nom</label>
                    <input
                      type="text"
                      value={editingBlock.name}
                      onChange={(e) => setEditingBlock({ ...editingBlock, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Heure début</label>
                      <input
                        type="time"
                        value={editingBlock.startTime}
                        onChange={(e) => setEditingBlock({ ...editingBlock, startTime: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Heure fin</label>
                      <input
                        type="time"
                        value={editingBlock.endTime}
                        onChange={(e) => setEditingBlock({ ...editingBlock, endTime: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={handleUpdateBlock}
                      className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
                    >
                      Enregistrer
                    </button>
                    <button
                      onClick={() => setEditingBlock(null)}
                      className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300"
                    >
                      Annuler
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Affichage des blocs par jour */}
            <div className="space-y-3">
              {DAYS.map((day, dayIndex) => {
                const blocksForDay = getBlocksForDay(dayIndex)
                const isExpanded = expandedDay === dayIndex

                return (
                  <div key={dayIndex} className="border border-gray-200 rounded-lg">
                    <button
                      onClick={() => setExpandedDay(isExpanded ? null : dayIndex)}
                      className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="text-left">
                        <p className="font-semibold">{day}</p>
                        <p className="text-sm text-gray-600">{blocksForDay.length} bloc(s)</p>
                      </div>
                      <ChevronDown
                        size={20}
                        className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                      />
                    </button>

                    {isExpanded && (
                      <div className="border-t border-gray-200 p-4 space-y-2 bg-gray-50">
                        {blocksForDay.length === 0 ? (
                          <p className="text-gray-500 text-sm">Aucun bloc pour ce jour</p>
                        ) : (
                          blocksForDay.map((block) => (
                            <div key={block.id} className="flex items-center gap-3 p-3 bg-white rounded-lg hover:shadow-md transition-shadow">
                              <div
                                className="w-4 h-full rounded"
                                style={{ backgroundColor: block.color }}
                              ></div>
                              <div className="flex-1">
                                <p className="font-semibold text-sm">{block.name}</p>
                                <p className="text-xs text-gray-600">
                                  {block.startTime} - {block.endTime} • {block.type}
                                </p>
                              </div>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => setEditingBlock({ ...block, scheduleId: selectedSchedule.id })}
                                  className="p-2 hover:bg-blue-100 text-blue-600 rounded-lg"
                                  title="Modifier"
                                >
                                  <Edit2 size={16} />
                                </button>
                                <button
                                  onClick={() => handleDeleteBlock(block.id)}
                                  className="p-2 hover:bg-red-100 text-red-600 rounded-lg"
                                  title="Supprimer"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}
