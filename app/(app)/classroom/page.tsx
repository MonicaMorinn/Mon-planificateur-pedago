'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/store'
import Layout from '@/components/Layout'
import toast from 'react-hot-toast'
import { Users, Plus, Trash2, Edit2, X } from 'lucide-react'

interface Student {
  id: string
  firstName: string
  lastName: string
  studentNumber?: string
  notes?: string
}

interface Classroom {
  id: string
  name: string
  level?: string
  period?: string
  students: Student[]
}

export default function ClassroomPage() {
  const router = useRouter()
  const { user, token } = useAuthStore()
  const [classrooms, setClassrooms] = useState<Classroom[]>([])
  const [selectedClassroom, setSelectedClassroom] = useState<Classroom | null>(null)
  const [loading, setLoading] = useState(true)
  const [showNewClassForm, setShowNewClassForm] = useState(false)
  const [showNewStudentForm, setShowNewStudentForm] = useState(false)
  const [editingStudent, setEditingStudent] = useState<string | null>(null)

  const [classFormData, setClassFormData] = useState({
    name: '',
    level: '',
    period: ''
  })

  const [studentFormData, setStudentFormData] = useState({
    firstName: '',
    lastName: '',
    studentNumber: '',
    notes: ''
  })

  useEffect(() => {
    if (!user || !token) {
      router.push('/auth')
      return
    }
    loadClassrooms()
  }, [user, token, router])

  const loadClassrooms = async () => {
    try {
      const response = await fetch('/api/classrooms', {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      const data = await response.json()
      setClassrooms(data.classrooms || [])
      if (data.classrooms.length > 0) {
        setSelectedClassroom(data.classrooms[0])
      }
    } catch (error) {
      console.error(error)
      toast.error('Erreur lors du chargement')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateClass = async () => {
    if (!classFormData.name) {
      toast.error('Le nom de la classe est requis')
      return
    }

    try {
      const response = await fetch('/api/classrooms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(classFormData)
      })

      if (!response.ok) throw new Error('Erreur')

      const data = await response.json()
      const newClassroom: Classroom = { ...data.classroom, students: [] }
      setClassrooms([...classrooms, newClassroom])
      setSelectedClassroom(newClassroom)
      setClassFormData({ name: '', level: '', period: '' })
      setShowNewClassForm(false)
      toast.success('Classe créée')
    } catch (error) {
      console.error(error)
      toast.error('Erreur lors de la création')
    }
  }

  const handleAddStudent = async () => {
    if (!selectedClassroom || !studentFormData.firstName || !studentFormData.lastName) {
      toast.error('Veuillez remplir tous les champs requis')
      return
    }

    try {
      const response = await fetch('/api/classrooms/students', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          classroomId: selectedClassroom.id,
          ...studentFormData
        })
      })

      if (!response.ok) throw new Error('Erreur')

      const data = await response.json()
      setSelectedClassroom({
        ...selectedClassroom,
        students: [...selectedClassroom.students, data.student]
      })
      setStudentFormData({ firstName: '', lastName: '', studentNumber: '', notes: '' })
      setShowNewStudentForm(false)
      toast.success('Élève ajouté')
    } catch (error) {
      console.error(error)
      toast.error('Erreur lors de l\'ajout')
    }
  }

  const handleDeleteStudent = async (studentId: string) => {
    if (!window.confirm('Êtes-vous sûr?')) return

    try {
      const response = await fetch(
        `/api/classrooms/students?studentId=${studentId}`,
        {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        }
      )

      if (!response.ok) throw new Error('Erreur')

      if (selectedClassroom) {
        setSelectedClassroom({
          ...selectedClassroom,
          students: selectedClassroom.students.filter(s => s.id !== studentId)
        })
      }
      toast.success('Élève supprimé')
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
            <Users className="text-primary" size={32} />
            <h1 className="text-3xl font-bold">Ma classe</h1>
          </div>
          <button
            onClick={() => setShowNewClassForm(true)}
            className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90"
          >
            <Plus size={20} /> Nouvelle classe
          </button>
        </div>

        {/* Formulaire nouvelle classe */}
        {showNewClassForm && (
          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <h2 className="text-xl font-bold mb-4">Créer une classe</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Nom *</label>
                <input
                  type="text"
                  value={classFormData.name}
                  onChange={(e) => setClassFormData({ ...classFormData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="Ex: 3e année A"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Niveau (optionnel)</label>
                  <input
                    type="text"
                    value={classFormData.level}
                    onChange={(e) => setClassFormData({ ...classFormData, level: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="Ex: 3e année"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Année (optionnel)</label>
                  <input
                    type="text"
                    value={classFormData.period}
                    onChange={(e) => setClassFormData({ ...classFormData, period: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="Ex: 2026-2027"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleCreateClass}
                  className="flex-1 bg-primary text-white py-2 rounded-lg hover:bg-primary/90"
                >
                  Créer
                </button>
                <button
                  onClick={() => setShowNewClassForm(false)}
                  className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300"
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
        )}

        {classrooms.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center shadow-lg">
            <Users size={48} className="mx-auto mb-4 text-gray-300" />
            <p className="text-gray-500 mb-4">Aucune classe créée</p>
            <button
              onClick={() => setShowNewClassForm(true)}
              className="text-primary hover:underline font-semibold"
            >
              Créer votre première classe →
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Liste des classes */}
            <div className="bg-white rounded-2xl p-6 shadow-lg">
              <h2 className="text-lg font-bold mb-4">Mes classes</h2>
              <div className="space-y-2">
                {classrooms.map(classroom => (
                  <button
                    key={classroom.id}
                    onClick={() => setSelectedClassroom(classroom)}
                    className={`w-full text-left p-3 rounded-lg transition-colors ${
                      selectedClassroom?.id === classroom.id
                        ? 'bg-primary/10 border border-primary'
                        : 'bg-gray-50 hover:bg-gray-100'
                    }`}
                  >
                    <p className="font-semibold">{classroom.name}</p>
                    <p className="text-sm text-gray-600">{classroom.students.length} élève(s)</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Détails de la classe */}
            {selectedClassroom && (
              <div className="md:col-span-2 bg-white rounded-2xl p-6 shadow-lg space-y-6">
                <div>
                  <h2 className="text-2xl font-bold">{selectedClassroom.name}</h2>
                  {selectedClassroom.level && (
                    <p className="text-gray-600">Niveau: {selectedClassroom.level}</p>
                  )}
                </div>

                {/* Formulaire nouvel élève */}
                {showNewStudentForm && (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                    <h3 className="font-semibold mb-3">Ajouter un élève</h3>
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <input
                            type="text"
                            placeholder="Prénom"
                            value={studentFormData.firstName}
                            onChange={(e) => setStudentFormData({ ...studentFormData, firstName: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                          />
                        </div>
                        <div>
                          <input
                            type="text"
                            placeholder="Nom"
                            value={studentFormData.lastName}
                            onChange={(e) => setStudentFormData({ ...studentFormData, lastName: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                          />
                        </div>
                      </div>
                      <input
                        type="text"
                        placeholder="Numéro d'élève (optionnel)"
                        value={studentFormData.studentNumber}
                        onChange={(e) => setStudentFormData({ ...studentFormData, studentNumber: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={handleAddStudent}
                          className="flex-1 bg-secondary text-white py-2 rounded-lg text-sm hover:bg-secondary/90"
                        >
                          Ajouter
                        </button>
                        <button
                          onClick={() => setShowNewStudentForm(false)}
                          className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg text-sm"
                        >
                          Annuler
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Liste des élèves */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold">Élèves ({selectedClassroom.students.length})</h3>
                    {!showNewStudentForm && (
                      <button
                        onClick={() => setShowNewStudentForm(true)}
                        className="text-sm bg-secondary/10 text-secondary px-3 py-1 rounded-lg hover:bg-secondary/20"
                      >
                        + Ajouter
                      </button>
                    )}
                  </div>

                  {selectedClassroom.students.length === 0 ? (
                    <p className="text-gray-500 text-sm">Aucun élève pour l'instant</p>
                  ) : (
                    <div className="space-y-2">
                      {selectedClassroom.students.map(student => (
                        <div key={student.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100">
                          <div className="flex-1">
                            <p className="font-semibold">
                              {student.firstName} {student.lastName}
                            </p>
                            {student.studentNumber && (
                              <p className="text-xs text-gray-500">#{student.studentNumber}</p>
                            )}
                          </div>
                          <button
                            onClick={() => handleDeleteStudent(student.id)}
                            className="p-2 hover:bg-red-100 text-red-600 rounded-lg"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  )
}
