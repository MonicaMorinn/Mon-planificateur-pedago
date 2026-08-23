'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore, useSettingsStore } from '@/lib/store'
import Layout from '@/components/Layout'
import PrintWeekPages from '@/components/PrintWeekPages'
import toast from 'react-hot-toast'
import { Printer } from 'lucide-react'
import { startOfWeek, getSchoolYearWeeks, toISODate, addDays, getMonthName } from '@/lib/utils'

interface SchoolYear {
  id: string
  name: string
  startDate: string
  endDate: string
  isActive: boolean
}

export default function PrintPage() {
  const router = useRouter()
  const { user, token } = useAuthStore()
  const { sectionsOrder, loadFromLocal } = useSettingsStore()

  useEffect(() => {
    loadFromLocal()
  }, [])

  const [schoolYears, setSchoolYears] = useState<SchoolYear[]>([])
  const [schoolYearId, setSchoolYearId] = useState('')
  const [mode, setMode] = useState<'semaine' | 'mois' | 'annee'>('semaine')
  const [weekDate, setWeekDate] = useState(toISODate(new Date()))
  const [monthDate, setMonthDate] = useState(toISODate(new Date()))
  const [colorMode, setColorMode] = useState('couleur')
  const [notesLocation, setNotesLocation] = useState('sous')
  const [primaryColor, setPrimaryColor] = useState('#6366f1')
  const [fonts, setFonts] = useState<any[]>([])
  const [fontChoices, setFontChoices] = useState<any>({})

  const [loading, setLoading] = useState(false)
  const [printData, setPrintData] = useState<any[]>([])
  const [monthEvents, setMonthEvents] = useState<any[]>([])
  const [monthDsfsEvents, setMonthDsfsEvents] = useState<any[]>([])
  const [monthGenerated, setMonthGenerated] = useState(false)

  useEffect(() => {
    if (!user || !token) {
      router.push('/auth')
      return
    }
    loadInitial()
  }, [user, token, router])

  const loadInitial = async () => {
    const yearsRes = await fetch('/api/school-years', { headers: { 'Authorization': `Bearer ${token}` } })
    if (yearsRes.ok) {
      const data = await yearsRes.json()
      setSchoolYears(data.schoolYears)
      const active = data.schoolYears.find((y: SchoolYear) => y.isActive)
      if (active) setSchoolYearId(active.id)
    }

    const settingsRes = await fetch('/api/settings', { headers: { 'Authorization': `Bearer ${token}` } })
    if (settingsRes.ok) {
      const data = await settingsRes.json()
      setColorMode(data.settings.colorMode || 'couleur')
      setNotesLocation(data.settings.notesLocation || 'sous')
      setPrimaryColor(data.settings.primaryColor || '#6366f1')
      setFontChoices({
        days: data.settings.fontDays || undefined,
        dates: data.settings.fontDates || undefined,
        titles: data.settings.fontTitles || undefined,
        schedule: data.settings.fontSchedule || undefined,
        events: data.settings.fontEvents || undefined,
        notes: data.settings.fontNotes || undefined,
        calendar: data.settings.fontCalendar || undefined,
      })
    }

    const fontsRes = await fetch('/api/fonts', { headers: { 'Authorization': `Bearer ${token}` } })
    if (fontsRes.ok) {
      const data = await fontsRes.json()
      setFonts(data.fonts)
    }
  }

  const fetchWeekData = async (monday: Date) => {
    const from = toISODate(monday)
    const to = toISODate(addDays(monday, 4))
    const res = await fetch(`/api/print-data?schoolYearId=${schoolYearId}&from=${from}&to=${to}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    if (!res.ok) return null
    const data = await res.json()
    return { monday, ...data }
  }

  const handleGenerateWeek = async () => {
    if (!schoolYearId) { toast.error('Sélectionnez une année scolaire'); return }
    setLoading(true)
    try {
      const monday = startOfWeek(new Date(weekDate))
      const weekData = await fetchWeekData(monday)
      if (!weekData) throw new Error()
      setPrintData([weekData])
      setMonthGenerated(false)
      toast.success('Semaine prête pour impression')
    } catch {
      toast.error('Erreur lors de la génération')
    } finally {
      setLoading(false)
    }
  }

  const handleGenerateYear = async () => {
    if (!schoolYearId) { toast.error('Sélectionnez une année scolaire'); return }
    const year = schoolYears.find(y => y.id === schoolYearId)
    if (!year) return
    setLoading(true)
    try {
      const weeks = getSchoolYearWeeks(new Date(year.startDate), new Date(year.endDate))
      const results = []
      for (const monday of weeks) {
        const weekData = await fetchWeekData(monday)
        if (weekData) results.push(weekData)
      }
      setPrintData(results)
      setMonthGenerated(false)
      toast.success(`${results.length} semaines prêtes pour impression`)
    } catch {
      toast.error('Erreur lors de la génération')
    } finally {
      setLoading(false)
    }
  }

  const handleGenerateMonth = async () => {
    if (!schoolYearId) { toast.error('Sélectionnez une année scolaire'); return }
    setLoading(true)
    try {
      const d = new Date(monthDate)
      const from = toISODate(new Date(d.getFullYear(), d.getMonth(), 1))
      const to = toISODate(new Date(d.getFullYear(), d.getMonth() + 1, 0))
      const res = await fetch(`/api/print-data?schoolYearId=${schoolYearId}&from=${from}&to=${to}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setMonthEvents(data.events || [])
        setMonthDsfsEvents(data.dsfsEvents || [])
        setPrintData([])
        setMonthGenerated(true)
      }
      toast.success('Mois prêt pour impression')
    } catch {
      toast.error('Erreur lors de la génération')
    } finally {
      setLoading(false)
    }
  }

  const handlePrint = () => window.print()

  const renderMonthCalendar = () => {
    const d = new Date(monthDate)
    const monthStart = new Date(d.getFullYear(), d.getMonth(), 1)
    const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0)
    const firstWeekday = (monthStart.getDay() + 6) % 7
    const daysInMonth = monthEnd.getDate()
    const cells: (number | null)[] = [...Array(firstWeekday).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)]
    const allEvents = [...monthEvents, ...monthDsfsEvents]
    const bw = colorMode === 'noir-et-blanc'

    return (
      <div className={`print-page bg-white p-6 ${bw ? 'bw-mode' : ''}`}>
        <h2 className={`text-xl font-bold mb-4 text-center ${bw ? '' : 'text-primary'}`}>
          {getMonthName(d.getMonth())} {d.getFullYear()}
        </h2>
        <div className="grid grid-cols-7 gap-1 text-center text-sm font-semibold mb-1">
          {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map((day, i) => <div key={i}>{day}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {cells.map((day, i) => {
            const dayEvents = day ? allEvents.filter(e => new Date(e.date).getDate() === day) : []
            return (
              <div key={i} className={`min-h-20 border rounded p-1 text-xs ${bw ? 'border-black' : 'border-gray-200'} ${!day ? 'bg-gray-50' : ''}`}>
                {day && <div className="font-semibold mb-1">{day}</div>}
                {dayEvents.slice(0, 3).map(e => (
                  <div key={e.id} className="truncate">{e.title}</div>
                ))}
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <Layout authenticated={true}>
      <div className="space-y-6">
        <div className="no-print space-y-6">
          <div className="flex items-center gap-3">
            <Printer className="text-primary" size={32} />
            <h1 className="text-3xl font-bold">Impression</h1>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Année scolaire</label>
              <select
                value={schoolYearId}
                onChange={(e) => setSchoolYearId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="">Sélectionner</option>
                {schoolYears.map(y => <option key={y.id} value={y.id}>{y.name}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Que voulez-vous imprimer?</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: 'semaine', label: 'Une semaine' },
                  { value: 'mois', label: 'Un mois' },
                  { value: 'annee', label: "L'année complète" },
                ].map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setMode(opt.value as any)}
                    className={`p-3 rounded-lg font-semibold text-sm ${mode === opt.value ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {mode === 'semaine' && (
              <div>
                <label className="block text-sm font-medium mb-1">Choisir une date de la semaine</label>
                <input
                  type="date"
                  value={weekDate}
                  onChange={(e) => setWeekDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
            )}

            {mode === 'mois' && (
              <div>
                <label className="block text-sm font-medium mb-1">Choisir un mois</label>
                <input
                  type="date"
                  value={monthDate}
                  onChange={(e) => setMonthDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
            )}

            {mode === 'annee' && (
              <p className="text-sm text-gray-600">
                Toutes les semaines de l'année scolaire sélectionnée seront générées, en double-page, dans l'ordre chronologique. Cela peut prendre quelques instants.
              </p>
            )}

            <div>
              <label className="block text-sm font-medium mb-2">Style</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setColorMode('couleur')}
                  className={`p-3 rounded-lg font-semibold text-sm ${colorMode === 'couleur' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700'}`}
                >
                  🎨 Couleur
                </button>
                <button
                  onClick={() => setColorMode('noir-et-blanc')}
                  className={`p-3 rounded-lg font-semibold text-sm ${colorMode === 'noir-et-blanc' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700'}`}
                >
                  ⚫⚪ Noir et blanc
                </button>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={mode === 'semaine' ? handleGenerateWeek : mode === 'mois' ? handleGenerateMonth : handleGenerateYear}
                disabled={loading || !schoolYearId}
                className="flex-1 bg-primary text-white py-2 rounded-lg hover:bg-primary/90 disabled:opacity-50"
              >
                {loading ? 'Génération...' : "Générer l'aperçu"}
              </button>
              {(printData.length > 0 || monthGenerated) && (
                <button
                  onClick={handlePrint}
                  className="flex-1 flex items-center justify-center gap-2 bg-gray-800 text-white py-2 rounded-lg hover:bg-gray-700"
                >
                  <Printer size={18} /> Imprimer
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Zone imprimable */}
        <div>
          {fonts.length > 0 && (
            <style>{fonts.map(f => `@font-face { font-family: "custom-${f.id}"; src: url(${f.dataUrl}); }`).join('\n')}</style>
          )}
          {mode === 'mois' && monthGenerated && renderMonthCalendar()}
          {mode !== 'mois' && printData.map((week, idx) => (
            <PrintWeekPages
              key={idx}
              monday={new Date(week.monday)}
              schedule={week.schedule}
              events={week.events || []}
              dsfsEvents={week.dsfsEvents || []}
              plannerEntries={week.plannerEntries || []}
              surveillances={week.surveillances || []}
              notesLocation={notesLocation}
              colorMode={colorMode}
              primaryColor={primaryColor}
              fonts={fontChoices}
              sectionsOrder={sectionsOrder}
            />
          ))}
        </div>
      </div>
    </Layout>
  )
}
