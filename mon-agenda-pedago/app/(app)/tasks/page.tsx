'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/store'
import Layout from '@/components/Layout'
import toast from 'react-hot-toast'
import { CheckSquare, Plus, Trash2, Edit2, Flag } from 'lucide-react'
import { formatDate } from '@/lib/utils'

interface Task {
  id: string
  title: string
  description?: string
  dueDate?: string
  priority: string
  category?: string
  status: string
}

const PRIORITIES = {
  low: { label: 'Faible', color: 'bg-blue-100 text-blue-700' },
  normal: { label: 'Normal', color: 'bg-gray-100 text-gray-700' },
  high: { label: 'Élevée', color: 'bg-orange-100 text-orange-700' },
  urgent: { label: 'Urgent', color: 'bg-red-100 text-red-700' }
}

export default function TasksPage() {
  const router = useRouter()
  const { user, token } = useAuthStore()
  const [tasks, setTasks] = useState<Task[]>([])
  const [schoolYearId, setSchoolYearId] = useState('')
  const [loading, setLoading] = useState(true)
  const [showNewForm, setShowNewForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [filterStatus, setFilterStatus] = useState('all')

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    dueDate: '',
    priority: 'normal',
    category: ''
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

      if (!activeYear) {
        router.push('/onboarding')
        return
      }

      setSchoolYearId(activeYear.id)

      const tasksResponse = await fetch(
        `/api/tasks?schoolYearId=${activeYear.id}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      )

      const tasksData = await tasksResponse.json()
      setTasks(tasksData.tasks || [])
    } catch (error) {
      console.error('Error:', error)
      toast.error('Erreur lors du chargement')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveTask = async () => {
    if (!formData.title) {
      toast.error('Le titre est requis')
      return
    }

    try {
      if (editingId) {
        const response = await fetch(`/api/tasks?taskId=${editingId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(formData)
        })

        if (!response.ok) throw new Error('Erreur')

        const data = await response.json()
        setTasks(tasks.map(t => t.id === editingId ? data.task : t))
        toast.success('Tâche modifiée')
      } else {
        const response = await fetch('/api/tasks', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            ...formData,
            schoolYearId
          })
        })

        if (!response.ok) throw new Error('Erreur')

        const data = await response.json()
        setTasks([...tasks, data.task])
        toast.success('Tâche créée')
      }

      setFormData({
        title: '',
        description: '',
        dueDate: '',
        priority: 'normal',
        category: ''
      })
      setEditingId(null)
      setShowNewForm(false)
    } catch (error) {
      console.error(error)
      toast.error('Erreur lors de la sauvegarde')
    }
  }

  const handleDeleteTask = async (taskId: string) => {
    if (!window.confirm('Êtes-vous sûr?')) return

    try {
      const response = await fetch(`/api/tasks?taskId=${taskId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (!response.ok) throw new Error('Erreur')

      setTasks(tasks.filter(t => t.id !== taskId))
      toast.success('Tâche supprimée')
    } catch (error) {
      console.error(error)
      toast.error('Erreur lors de la suppression')
    }
  }

  const handleToggleStatus = async (task: Task) => {
    const newStatus = task.status === 'completed' ? 'pending' : 'completed'
    try {
      const response = await fetch(`/api/tasks?taskId=${task.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      })

      if (!response.ok) throw new Error('Erreur')

      const data = await response.json()
      setTasks(tasks.map(t => t.id === task.id ? data.task : t))
    } catch (error) {
      console.error(error)
      toast.error('Erreur lors de la mise à jour')
    }
  }

  const handleEditTask = (task: Task) => {
    setFormData({
      title: task.title,
      description: task.description || '',
      dueDate: task.dueDate ? task.dueDate.split('T')[0] : '',
      priority: task.priority,
      category: task.category || ''
    })
    setEditingId(task.id)
    setShowNewForm(true)
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

  const filteredTasks = filterStatus === 'all'
    ? tasks
    : tasks.filter(t => t.status === filterStatus)

  const pendingTasks = filteredTasks.filter(t => t.status === 'pending')
    .sort((a, b) => {
      const priorityOrder = { urgent: 0, high: 1, normal: 2, low: 3 }
      return priorityOrder[a.priority as keyof typeof priorityOrder] -
             priorityOrder[b.priority as keyof typeof priorityOrder]
    })

  const completedTasks = filteredTasks.filter(t => t.status === 'completed')

  return (
    <Layout authenticated={true}>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CheckSquare className="text-primary" size={32} />
            <h1 className="text-3xl font-bold">Mes tâches</h1>
          </div>
          <button
            onClick={() => {
              setFormData({
                title: '',
                description: '',
                dueDate: '',
                priority: 'normal',
                category: ''
              })
              setEditingId(null)
              setShowNewForm(true)
            }}
            className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90"
          >
            <Plus size={20} /> Nouvelle tâche
          </button>
        </div>

        {/* Filtres */}
        <div className="flex gap-2">
          {[
            { value: 'all', label: 'Toutes' },
            { value: 'pending', label: 'À faire' },
            { value: 'completed', label: 'Complétées' }
          ].map(filter => (
            <button
              key={filter.value}
              onClick={() => setFilterStatus(filter.value)}
              className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                filterStatus === filter.value
                  ? 'bg-primary text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>

        {/* Formulaire */}
        {showNewForm && (
          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <h2 className="text-xl font-bold mb-4">
              {editingId ? 'Modifier la tâche' : 'Nouvelle tâche'}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Titre *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="Ex: Corriger les copies"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Date d'échéance</label>
                  <input
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Priorité</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="low">Faible</option>
                    <option value="normal">Normal</option>
                    <option value="high">Élevée</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleSaveTask}
                  className="flex-1 bg-primary text-white py-2 rounded-lg hover:bg-primary/90"
                >
                  {editingId ? 'Mettre à jour' : 'Créer la tâche'}
                </button>
                <button
                  onClick={() => setShowNewForm(false)}
                  className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300"
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tâches à faire */}
        {pendingTasks.length > 0 && (
          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <h2 className="text-xl font-bold mb-4">À faire ({pendingTasks.length})</h2>
            <div className="space-y-2">
              {pendingTasks.map(task => {
                const priorityInfo = PRIORITIES[task.priority as keyof typeof PRIORITIES] || PRIORITIES.normal
                return (
                  <div key={task.id} className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <button
                      onClick={() => handleToggleStatus(task)}
                      className="mt-1 w-6 h-6 rounded border-2 border-gray-300 hover:border-primary flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold">{task.title}</p>
                      {task.description && (
                        <p className="text-sm text-gray-600 line-clamp-1">{task.description}</p>
                      )}
                      <div className="flex items-center gap-2 mt-2">
                        <span className={`text-xs px-2 py-1 rounded-full ${priorityInfo.color}`}>
                          {priorityInfo.label}
                        </span>
                        {task.dueDate && (
                          <span className="text-xs text-gray-500">
                            {formatDate(new Date(task.dueDate))}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <button
                        onClick={() => handleEditTask(task)}
                        className="p-2 hover:bg-blue-100 text-blue-600 rounded-lg"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteTask(task.id)}
                        className="p-2 hover:bg-red-100 text-red-600 rounded-lg"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Tâches complétées */}
        {completedTasks.length > 0 && (
          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <h2 className="text-xl font-bold mb-4 text-green-600">Complétées ({completedTasks.length})</h2>
            <div className="space-y-2">
              {completedTasks.map(task => (
                <div key={task.id} className="flex items-start gap-3 p-4 bg-green-50 rounded-lg">
                  <button
                    onClick={() => handleToggleStatus(task)}
                    className="mt-1 w-6 h-6 rounded border-2 border-green-500 bg-green-500 flex-shrink-0 flex items-center justify-center text-white text-sm"
                  >
                    ✓
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold line-through text-gray-500">{task.title}</p>
                  </div>
                  <button
                    onClick={() => handleDeleteTask(task.id)}
                    className="p-2 hover:bg-red-100 text-red-600 rounded-lg flex-shrink-0"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {filteredTasks.length === 0 && (
          <div className="bg-white rounded-2xl p-12 text-center shadow-lg">
            <CheckSquare size={48} className="mx-auto mb-4 text-gray-300" />
            <p className="text-gray-500">Aucune tâche dans cette catégorie</p>
          </div>
        )}
      </div>
    </Layout>
  )
}
