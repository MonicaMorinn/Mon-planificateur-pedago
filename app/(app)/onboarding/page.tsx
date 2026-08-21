'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/store'
import Layout from '@/components/Layout'
import toast from 'react-hot-toast'
import { Calendar, Clock, Plus, X } from 'lucide-react'

interface ScheduleBlock {
  dayOfWeek: number
  name: string
  startTime: string
  endTime: string
  type: string
  subject?: string
  color?: string
}

const DAYS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche']
const TYPES = ['Cours', 'Récréation', 'Dîner', 'Accueil', 'Organisation', 'Transition', 'Réunion', 'Autre']

export default function OnboardingPage() {
  const router = useRouter()
  const { user, token } = useAuthStore()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)

  const [schoolYear, setSchoolYear] = useState({
    name: '2026-2027',
    startDate: '2026-08-20',
    endDate: '2027-06-30',
  })

  const [scheduleInfo, setScheduleInfo] = useState({
    name: 'Horaire régulier',
    description: '',
  })

  const [blocks, setBlocks] = useState<ScheduleBlock[]>([
    {
      dayOfWeek: 0,
      name: 'Accueil',
      startTime: '08:00',
      endTime: '08:15',
      type: 'Accueil',
      color: '#ec4899',
    },
    {
      dayOfWeek: 0,
      name: 'Français',
      startTime: '08:15',
      endTime: '09:45',
      type: 'Cours',
      subject: 'Français',
      color: '#6366f1',
    },
  ])

  const [newBlock, setNewBlock] = useState<ScheduleBlock>({
    dayOfWeek: 0,
    name: '',
    startTime: '10:00',
    endTime: '10:30',
    type: 'Cours',
    color: '#6366f1',
  })

  useEffect(() => {
    if (!user || !token) {
      router.push('/auth')
    }
  }, [user, token, router])

  const handleAddBlock = () => {
    if (!newBlock.name || !newBlock.startTime || !newBlock.endTime) {
      toast.error('Tous les champs sont requis')
      return
    }

    if (newBlock.startTime >= newBlock.endTime) {
      toast.error('L\'heure de fin doit être après l\'heure de début')
      return
    }

    setBlocks([...blocks, { ...newBlock }])
    setNewBlock({
      dayOfWeek: 0,
      name: '',
      startTime: '10:00',
      endTime: '10:30',
      type: 'Cours',
      color: '#6366f1',
    })
    toast.success('Bloc ajouté')
  }

  const handleRemoveBlock = (index: number) => {
    setBlocks(blocks.filter((_, i) => i !== index))
  }

  const handleCreateSchoolYear = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/school-years', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...schoolYear,
          isActive: true
        })
      })

      if (!response.ok) throw new Error('Erreur')

      const data = await response.json()
      setSchoolYear({ ...schoolYear })
      toast.success('Année scolaire créée')
      setStep(2)
    } catch (error) {
      toast.error('Erreur lors de la création')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateSchedule = async () => {
    setLoading(true)
    try {
      // Récupérer l'année scolaire active
      const yearResponse = await fetch('/api/school-years', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const yearData = await yearResponse.json()
      const activeYear = yearData.schoolYears.find((y: any) => y.isActive) || yearData.schoolYears[0]

      if (!activeYear) {
        toast.error('Aucune année scolaire trouvée')
        return
      }

      // Créer l'horaire
      const scheduleResponse = await fetch('/api/schedules', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...scheduleInfo,
          schoolYearId: activeYear.id,
          isDefault: true
        })
      })

      if (!scheduleResponse.ok) throw new Error('Erreur')

      const schedule = await scheduleResponse.json()

      // Ajouter tous les blocs
      for (const block of blocks) {
        const blockResponse = await fetch('/api/schedules/blocks', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            scheduleId: schedule.schedule.id,
            ...block
          })
        })

        if (!blockResponse.ok) throw new Error('Erreur bloc')
      }

      toast.success('Horaire créé avec succès!')
      router.push('/dashboard')
    } catch (error) {
      console.error(error)
      toast.error('Erreur lors de la création')
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
    return <Layout authenticated={true}>Chargement...</Layout>
  }

  return (
    <Layout authenticated={true}>
      <div className="max-w-4xl mx-auto py-12">
        {/* Progress */}
        <div className="flex items-center justify-center gap-4 mb-12">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${step >= 1 ? 'bg-primary text-white' : 'bg-gray-300'}`}>
            1
          </div>
          <div className={`h-1 w-20 ${step >= 2 ? 'bg-primary' : 'bg-gray-300'}`}></div>
          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${step >= 2 ? 'bg-primary text-white' : 'bg-gray-300'}`}>
            2
          </div>
        </div>

        {step === 1 ? (
          // Étape 1: Année scolaire
          <div className="bg-white rounded-2xl p-8 shadow-lg">
            <div className="flex items-center gap-3 mb-6">
              <Calendar className="text-primary" size={32} />
              <h1 className="text-3xl font-bold">Créer ton année scolaire</h1>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">Année scolaire</label>
                <input
                  type="text"
                  value={schoolYear.name}
                  onChange={(e) => setSchoolYear({ ...schoolYear, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Ex: 2026-2027"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Date de début</label>
                  <input
                    type="date"
                    value={schoolYear.startDate}
                    onChange={(e) => setSchoolYear({ ...schoolYear, startDate: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Date de fin</label>
                  <input
                    type="date"
                    value={schoolYear.endDate}
                    onChange={(e) => setSchoolYear({ ...schoolYear, endDate: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              <button
                onClick={handleCreateSchoolYear}
                disabled={loading}
                className="w-full bg-primary text-white py-3 rounded-lg font-semibold hover:bg-primary/90 disabled:opacity-50"
              >
                {loading ? 'Création...' : 'Continuer'}
              </button>
            </div>
          </div>
        ) : (
          // Étape 2: Horaire
          <div className="bg-white rounded-2xl p-8 shadow-lg">
            <div className="flex items-center gap-3 mb-6">
              <Clock className="text-primary" size={32} />
              <h1 className="text-3xl font-bold">Créer ton horaire</h1>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">Nom de l'horaire</label>
                <input
                  type="text"
                  value={scheduleInfo.name}
                  onChange={(e) => setScheduleInfo({ ...scheduleInfo, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Ex: Horaire régulier"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Description (optionnel)</label>
                <textarea
                  value={scheduleInfo.description}
                  onChange={(e) => setScheduleInfo({ ...scheduleInfo, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Ex: Horaire de base du lundi au vendredi"
                  rows={2}
                />
              </div>

              {/* Ajouter un bloc */}
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                <h3 className="font-semibold mb-4">Ajouter un bloc</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Jour</label>
                    <select
                      value={newBlock.dayOfWeek}
                      onChange={(e) => setNewBlock({ ...newBlock, dayOfWeek: parseInt(e.target.value) })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    >
                      {DAYS.map((day, i) => (
                        <option key={i} value={i}>{day}</option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Nom</label>
                      <input
                        type="text"
                        value={newBlock.name}
                        onChange={(e) => setNewBlock({ ...newBlock, name: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                        placeholder="Ex: Français"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Type</label>
                      <select
                        value={newBlock.type}
                        onChange={(e) => setNewBlock({ ...newBlock, type: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      >
                        {TYPES.map((type) => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Heure début</label>
                      <input
                        type="time"
                        value={newBlock.startTime}
                        onChange={(e) => setNewBlock({ ...newBlock, startTime: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Heure fin</label>
                      <input
                        type="time"
                        value={newBlock.endTime}
                        onChange={(e) => setNewBlock({ ...newBlock, endTime: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                  </div>

                  <button
                    onClick={handleAddBlock}
                    className="w-full flex items-center justify-center gap-2 bg-secondary/10 text-secondary py-2 rounded-lg hover:bg-secondary/20 font-semibold"
                  >
                    <Plus size={20} /> Ajouter ce bloc
                  </button>
                </div>
              </div>

              {/* Blocs créés */}
              <div>
                <h3 className="font-semibold mb-3">Blocs de l'horaire ({blocks.length})</h3>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {blocks.map((block, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-semibold">{block.name}</p>
                        <p className="text-sm text-gray-600">
                          {DAYS[block.dayOfWeek]} • {block.startTime}-{block.endTime} • {block.type}
                        </p>
                      </div>
                      <button
                        onClick={() => handleRemoveBlock(i)}
                        className="p-2 hover:bg-red-100 text-red-600 rounded-lg"
                      >
                        <X size={20} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={handleCreateSchedule}
                disabled={loading || blocks.length === 0}
                className="w-full bg-primary text-white py-3 rounded-lg font-semibold hover:bg-primary/90 disabled:opacity-50"
              >
                {loading ? 'Création...' : 'Créer mon horaire'}
              </button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}
