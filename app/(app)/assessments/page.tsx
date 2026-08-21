'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/store'
import Layout from '@/components/Layout'
import toast from 'react-hot-toast'
import { BarChart3, Plus, Trash2, Edit2 } from 'lucide-react'
import { formatDate } from '@/lib/utils'

interface Assessment {
  id: string
  title: string
  subject: string
  competency?: string
  date: string
  notes?: string
}

export default function AssessmentsPage() {
  const router = useRouter()
  const { user, token } = useAuthStore()
  const [assessments, setAssessments] = useState<Assessment[]>([])
  const [schoolYearId, setSchoolYearId] = useState('')
  const [loading, setLoading] = useState(true)
  const [showNewForm, setShowNewForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    title: '',
    subject: '',
    competency: '',
    date: new Date().toISOString().split('T')[0],
    notes: ''
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
      const yearResponse = await fetch('/api/school-years', {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (!yearResponse.ok) {
        router.push('/onboarding')
        return
      }

      const yearData = await yearResponse.json()
      const activeYear = yearData.schoolYears.find((y: any) => y.isActive)

      if (activeYear) {
        setSchoolYearId(activeYear.id)

        const assessmentsResponse = await fetch(`/api/assessments?schoolYearId=${activeYear.id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        if (assessmentsResponse.ok) {
          const assessmentsData = await assessmentsResponse.json()
          setAssessments(assessmentsData.assessments)
        }
      }
    } catch (error) {
      console.error(error)
      toast.error('Erreur lors du chargement')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveAssessment = async () => {
    if (!formData.title || !formData.subject || !formData.date) {
      toast.error('Veuillez remplir tous les champs requis')
      return
    }

    if (!schoolYearId) {
      toast.error('Aucune année scolaire active')
      return
    }

    try {
      const url = editingId ? `/api/assessments?assessmentId=${editingId}` : '/api/assessments'
      const method = editingId ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ ...formData, schoolYearId })
      })

      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.error || 'Erreur')
      }

      toast.success(editingId ? 'Évaluation modifiée' : 'Évaluation créée')
      setFormData({
        title: '',
        subject: '',
        competency: '',
        date: new Date().toISOString().split('T')[0],
        notes: ''
      })
      setEditingId(null)
      setShowNewForm(false)
      loadData()
    } catch (error) {
      console.error(error)
      toast.error('Erreur lors de la sauvegarde')
    }
  }

  const handleDeleteAssessment = async (assessmentId: string) => {
    if (!window.confirm('Êtes-vous sûr?')) return

    try {
      const response = await fetch(`/api/assessments?assessmentId=${assessmentId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (!response.ok) throw new Error('Erreur')

      toast.success('Évaluation supprimée')
      loadData()
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

  return (
    <Layout authenticated={true}>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BarChart3 className="text-primary" size={32} />
            <h1 className="text-3xl font-bold">Mes évaluations</h1>
          </div>
          <button
            onClick={() => {
              setFormData({
                title: '',
                subject: '',
                competency: '',
                date: new Date().toISOString().split('T')[0],
                notes: ''
              })
              setEditingId(null)
              setShowNewForm(true)
            }}
            className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90"
          >
            <Plus size={20} /> Nouvelle évaluation
          </button>
        </div>

        {/* Formulaire */}
        {showNewForm && (
          <div className="bg-white rounded-2xl p-6 shadow-lg space-y-4">
            <h2 className="text-xl font-bold">
              {editingId ? 'Modifier l\'évaluation' : 'Nouvelle évaluation'}
            </h2>

            <div>
              <label className="block text-sm font-medium mb-1">Titre *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="Ex: Test sur les fractions"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Matière *</label>
                <input
                  type="text"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="Ex: Mathématiques"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Compétence</label>
                <input
                  type="text"
                  value={formData.competency}
                  onChange={(e) => setFormData({ ...formData, competency: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="Ex: Opérations avec fractions"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Date *</label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Notes</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                rows={3}
                placeholder="Remarques sur l'évaluation"
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleSaveAssessment}
                className="flex-1 bg-primary text-white py-2 rounded-lg hover:bg-primary/90"
              >
                {editingId ? 'Mettre à jour' : 'Créer'}
              </button>
              <button
                onClick={() => setShowNewForm(false)}
                className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300"
              >
                Annuler
              </button>
            </div>
          </div>
        )}

        {/* Liste des évaluations */}
        {assessments.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center shadow-lg">
            <BarChart3 size={48} className="mx-auto mb-4 text-gray-300" />
            <p className="text-gray-500 mb-4">Aucune évaluation créée</p>
            <button
              onClick={() => setShowNewForm(true)}
              className="text-primary hover:underline font-semibold"
            >
              Créer votre première évaluation →
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {assessments.map(assessment => (
              <div key={assessment.id} className="bg-white rounded-lg p-4 shadow hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold flex-1">{assessment.title}</h3>
                  <div className="flex gap-1">
                    <button
                      onClick={() => {
                        setFormData({
                          title: assessment.title,
                          subject: assessment.subject,
                          competency: assessment.competency || '',
                          date: new Date(assessment.date).toISOString().split('T')[0],
                          notes: (assessment as any).notes || ''
                        })
                        setEditingId(assessment.id)
                        setShowNewForm(true)
                      }}
                      className="p-1 hover:bg-gray-100 text-gray-600 rounded"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => handleDeleteAssessment(assessment.id)}
                      className="p-1 hover:bg-red-100 text-red-600 rounded"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-1">{assessment.subject}</p>
                {assessment.competency && (
                  <p className="text-xs text-gray-500 mb-2">{assessment.competency}</p>
                )}
                <p className="text-xs text-gray-400">{formatDate(new Date(assessment.date))}</p>
              </div>
            ))}
          </div>
        )}

        {/* Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-900">
            <strong>💡 Conseil:</strong> Créez vos évaluations directement dans votre planning pour une meilleure intégration de votre enseignement.
          </p>
        </div>
      </div>
    </Layout>
  )
}
