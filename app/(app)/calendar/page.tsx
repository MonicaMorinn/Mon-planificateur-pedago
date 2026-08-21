'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/store'
import Layout from '@/components/Layout'
import toast from 'react-hot-toast'
import { Calendar, ChevronLeft, ChevronRight, Plus, X } from 'lucide-react'
import { getMonthName, startOfMonth, endOfMonth } from '@/lib/utils'

interface CalendarEvent {
  id: string
  title: string
  description?: string
  date: string
  startTime?: string
  endTime?: string
  type: string
  color: string
  isAllDay: boolean
}

export default function CalendarPage() {
  const router = useRouter()
  const { user, token } = useAuthStore()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [schoolYearId, setSchoolYearId] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [showNewEvent, setShowNewEvent] = useState(false)
  const [selectedDate, setSelectedDate] = useState<string>('')
  const [eventFormData, setEventFormData] = useState({
    title: '',
    description: '',
    startTime: '09:00',
    endTime: '10:00',
    type: 'Personnel',
    color: '#6366f1',
    isAllDay: false
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
      await loadEvents(activeYear.id)
    } catch (error) {
      console.error('Error:', error)
      toast.error('Erreur lors du chargement')
    } finally {
      setLoading(false)
    }
  }

  const loadEvents = async (yearId: string) => {
    try {
      const startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
      const endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)

      const response = await fetch(
        `/api/calendar-events?schoolYearId=${yearId}&startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`,
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      )

      const data = await response.json()
      setEvents(data.events || [])
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const handleAddEvent = async () => {
    if (!selectedDate || !eventFormData.title) {
      toast.error('Veuillez remplir les champs requis')
      return
    }

    try {
      const response = await fetch('/api/calendar-events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...eventFormData,
          date: selectedDate,
          schoolYearId
        })
      })

      if (!response.ok) throw new Error('Erreur')

      const data = await response.json()
      setEvents([...events, data.event])
      setShowNewEvent(false)
      setEventFormData({
        title: '',
        description: '',
        startTime: '09:00',
        endTime: '10:00',
        type: 'Personnel',
        color: '#6366f1',
        isAllDay: false
      })
      toast.success('Événement ajouté')
    } catch (error) {
      console.error(error)
      toast.error('Erreur lors de l\'ajout')
    }
  }

  const handleDeleteEvent = async (eventId: string) => {
    try {
      const response = await fetch(`/api/calendar-events?eventId=${eventId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (!response.ok) throw new Error('Erreur')

      setEvents(events.filter(e => e.id !== eventId))
      toast.success('Événement supprimé')
    } catch (error) {
      console.error(error)
      toast.error('Erreur lors de la suppression')
    }
  }

  const getDaysInMonth = () => {
    return new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate()
  }

  const getFirstDayOfMonth = () => {
    const day = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay()
    return day === 0 ? 6 : day - 1
  }

  const getEventsForDate = (day: number) => {
    const dateStr = new Date(currentDate.getFullYear(), currentDate.getMonth(), day)
      .toISOString().split('T')[0]
    return events.filter(e => e.date.split('T')[0] === dateStr)
  }

  const daysInMonth = getDaysInMonth()
  const firstDay = getFirstDayOfMonth()
  const days = []

  for (let i = 0; i < firstDay; i++) {
    days.push(null)
  }

  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i)
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

  const DAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']
  const monthName = getMonthName(currentDate.getMonth(), 'fr')

  return (
    <Layout authenticated={true}>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Calendar className="text-primary" size={32} />
            <h1 className="text-3xl font-bold">Calendrier</h1>
          </div>
          <button
            onClick={() => {
              setSelectedDate(new Date().toISOString().split('T')[0])
              setShowNewEvent(true)
            }}
            className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90"
          >
            <Plus size={20} /> Ajouter un événement
          </button>
        </div>

        {/* Navigation */}
        <div className="bg-white rounded-2xl p-6 shadow-lg">
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <ChevronLeft size={24} />
            </button>
            <h2 className="text-2xl font-bold min-w-64 text-center">
              {monthName} {currentDate.getFullYear()}
            </h2>
            <button
              onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <ChevronRight size={24} />
            </button>
          </div>

          {/* Grille du calendrier */}
          <div className="grid grid-cols-7 gap-0.5 md:gap-1">
            {/* En-têtes des jours */}
            {DAYS.map(day => (
              <div key={day} className="p-1 md:p-3 text-center font-semibold text-gray-600 text-[10px] md:text-base truncate">
                {day}
              </div>
            ))}

            {/* Cases du calendrier */}
            {days.map((day, i) => {
              const dateStr = day
                ? new Date(currentDate.getFullYear(), currentDate.getMonth(), day)
                    .toISOString().split('T')[0]
                : ''
              const dayEvents = day ? getEventsForDate(day) : []
              const isToday = day &&
                new Date().getFullYear() === currentDate.getFullYear() &&
                new Date().getMonth() === currentDate.getMonth() &&
                new Date().getDate() === day

              return (
                <div
                  key={i}
                  onClick={() => {
                    if (day) {
                      setSelectedDate(dateStr)
                      setShowNewEvent(true)
                    }
                  }}
                  className={`min-h-16 md:min-h-32 p-1 md:p-2 border rounded-lg cursor-pointer transition-colors ${
                    day
                      ? `hover:bg-gray-50 ${isToday ? 'bg-blue-50 border-blue-300' : 'border-gray-200'}`
                      : 'bg-gray-50'
                  }`}
                >
                  {day && (
                    <>
                      <p className={`font-semibold mb-1 text-xs md:text-base ${isToday ? 'text-blue-600' : 'text-gray-700'}`}>
                        {day}
                      </p>
                      <div className="space-y-1 hidden sm:block">
                        {dayEvents.slice(0, 2).map(event => (
                          <div
                            key={event.id}
                            className="text-xs p-1 rounded bg-opacity-20 truncate"
                            style={{ backgroundColor: event.color + '33' }}
                          >
                            {event.title}
                          </div>
                        ))}
                        {dayEvents.length > 2 && (
                          <p className="text-xs text-gray-500">+{dayEvents.length - 2} plus</p>
                        )}
                      </div>
                      {dayEvents.length > 0 && (
                        <div className="sm:hidden w-1.5 h-1.5 rounded-full bg-primary mx-auto mt-1" />
                      )}
                    </>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Formulaire d'ajout d'événement */}
        {showNewEvent && (
          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold">Nouvel événement</h2>
              <button
                onClick={() => setShowNewEvent(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Date</label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Titre *</label>
                <input
                  type="text"
                  value={eventFormData.title}
                  onChange={(e) => setEventFormData({ ...eventFormData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="Ex: Réunion parents"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  value={eventFormData.description}
                  onChange={(e) => setEventFormData({ ...eventFormData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  rows={3}
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={eventFormData.isAllDay}
                  onChange={(e) => setEventFormData({ ...eventFormData, isAllDay: e.target.checked })}
                  className="w-4 h-4"
                />
                <label className="text-sm font-medium">Événement toute la journée</label>
              </div>

              {!eventFormData.isAllDay && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Heure début</label>
                    <input
                      type="time"
                      value={eventFormData.startTime}
                      onChange={(e) => setEventFormData({ ...eventFormData, startTime: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Heure fin</label>
                    <input
                      type="time"
                      value={eventFormData.endTime}
                      onChange={(e) => setEventFormData({ ...eventFormData, endTime: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-2">Type</label>
                <select
                  value={eventFormData.type}
                  onChange={(e) => setEventFormData({ ...eventFormData, type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="Personnel">Personnel</option>
                  <option value="Officiel">Officiel</option>
                  <option value="Réunion">Réunion</option>
                  <option value="Sortie">Sortie</option>
                  <option value="Évaluation">Évaluation</option>
                </select>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleAddEvent}
                  className="flex-1 bg-primary text-white py-2 rounded-lg hover:bg-primary/90"
                >
                  Ajouter l'événement
                </button>
                <button
                  onClick={() => setShowNewEvent(false)}
                  className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300"
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Événements du mois */}
        <div className="bg-white rounded-2xl p-6 shadow-lg">
          <h2 className="text-xl font-bold mb-4">Événements du mois</h2>
          {events.length === 0 ? (
            <p className="text-gray-500 text-center py-8">Aucun événement ce mois-ci</p>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {events.map(event => (
                <div key={event.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div
                    className="w-4 h-4 rounded mt-1 flex-shrink-0"
                    style={{ backgroundColor: event.color }}
                  ></div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">{event.title}</p>
                    <p className="text-sm text-gray-600">
                      {new Date(event.date).toLocaleDateString('fr-FR')}
                      {!event.isAllDay && event.startTime && ` • ${event.startTime}`}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDeleteEvent(event.id)}
                    className="p-2 hover:bg-red-100 text-red-600 rounded-lg flex-shrink-0"
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}
