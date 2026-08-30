'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/store'
import Layout from '@/components/Layout'
import toast from 'react-hot-toast'
import { School, Plus, Trash2, Edit2, ExternalLink } from 'lucide-react'
import { formatDate } from '@/lib/utils'

interface DsfsEvent {
  id: string
  title: string
  date: string
  description?: string
  type: string
}

const TYPES = [
  { value: 'conge', label: 'Congé' },
  { value: 'pedagogique', label: 'Journée pédagogique' },
  { value: 'administrative', label: 'Journée administrative' },
  { value: 'perfectionnement', label: 'Perfectionnement' },
  { value: 'rentree-progressive', label: 'Rentrée progressive' },
  { value: 'autre', label: 'Autre' },
]

export default function DsfsPage() {
  const router = useRouter()
  const { user, token } = useAuthStore()
  const [schoolYearId, setSchoolYearId] = useState('')
  const [schoolYearName, setSchoolYearName] = useState('')
  const [events, setEvents] = useState<DsfsEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [seeding, setSeeding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    title: '',
    date: '',
    type: 'conge',
    description: ''
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
      const yearRes = await fetch('/api/school-years', { headers: { Authorization: `Bearer ${token}` } })
      if (!yearRes.ok) { router.push('/onboarding'); return }
      const yearData = await yearRes.json()
      const activeYear = yearData.schoolYears.find((y: any) => y.isActive)
      if (!activeYear) { router.push('/onboarding'); return }
      setSchoolYearId(activeYear.id)
      setSchoolYearName(activeYear.name)

      const evRes = await fetch(`/api/dsfs-events?schoolYearId=${activeYear.id}`, { headers: { Authorization: `Bearer ${token}` } })
      if (evRes.ok) {
        const evData = await evRes.json()
        setEvents((evData.events || []).sort((a: DsfsEvent, b: DsfsEvent) => new Date(a.date).getTime() - new Date(b.date).getTime()))
      }
    } catch (error) {
      console.error(error)
      toast.error('Erreur lors du chargement')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({ title: '', date: '', type: 'conge', description: '' })
    setEditingId(null)
    setShowForm(false)
  }

  const handleSave = async () => {
    if (!formData.title || !formData.date) {
      toast.error('Titre et date requis')
      return
    }
    try {
      const url = editingId ? `/api/dsfs-events?eventId=${editingId}` : '/api/dsfs-events'
      const method = editingId ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...formData, schoolYearId })
      })
      if (!res.ok) throw new Error('Erreur')
      toast.success(editingId ? 'Événement modifié' : 'Événement ajouté')
      resetForm()
      loadData()
    } catch (error) {
      console.error(error)
      toast.error('Erreur lors de la sauvegarde')
    }
  }

  const handleEdit = (e: DsfsEvent) => {
    setFormData({
      title: e.title,
      date: new Date(e.date).toISOString().split('T')[0],
      type: e.type || 'autre',
      description: e.description || ''
    })
    setEditingId(e.id)
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Supprimer cet événement officiel?')) return
    try {
      const res = await fetch(`/api/dsfs-events?eventId=${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      })
      if (!res.ok) throw new Error('Erreur')
      toast.success('Événement supprimé')
      loadData()
    } catch (error) {
      console.error(error)
      toast.error('Erreur lors de la suppression')
    }
  }

  // Dates 2026-2027 confirmées : les 8 premières viennent directement de
  // toi (chat), le reste est lu sur le calendrier officiel DSFS (image
  // "Champlain, Claudette-Bradshaw, L'Odyssée, Le Mascaret, Le Sommet,
  // Sainte-Bernadette, Saint-Henri") que tu as téléversée. Les journées
  // "horaire du vendredi" (dispersées, normal) ne sont pas incluses ici
  // car elles ne changent pas le statut congé/classe d'une journée.
  const CONFIRMED_2026_2027 = [
    { title: 'Journée administrative', date: '2026-08-31', type: 'administrative' },
    { title: 'Perfectionnement AEFNB', date: '2026-09-01', type: 'perfectionnement' },
    { title: 'PAQ', date: '2026-09-02', type: 'administrative' },
    { title: 'Fête du Travail', date: '2026-09-07', type: 'conge' },
    { title: '1ère journée de classe pour les élèves', date: '2026-09-08', type: 'autre' },
    { title: 'Rentrée progressive', date: '2026-09-09', type: 'rentree-progressive' },
    { title: 'Rentrée progressive', date: '2026-09-10', type: 'rentree-progressive' },
    { title: 'Rentrée progressive', date: '2026-09-11', type: 'rentree-progressive' },
    { title: 'Journée nationale de la vérité et de la réconciliation', date: '2026-09-30', type: 'conge' },
    { title: 'Action de grâce', date: '2026-10-12', type: 'conge' },
    { title: 'Congé pour tous les élèves', date: '2026-10-23', type: 'conge' },
    { title: 'Jour du Souvenir', date: '2026-11-11', type: 'conge' },
    { title: 'Congé pour tous les élèves', date: '2026-11-20', type: 'conge' },
    { title: 'Congé pour tous les élèves', date: '2026-12-04', type: 'conge' },
    { title: 'Vacances de Noël', date: '2026-12-21', type: 'conge' },
    { title: 'Vacances de Noël', date: '2026-12-22', type: 'conge' },
    { title: 'Vacances de Noël', date: '2026-12-23', type: 'conge' },
    { title: 'Vacances de Noël', date: '2026-12-24', type: 'conge' },
    { title: 'Vacances de Noël', date: '2026-12-25', type: 'conge' },
    { title: 'Vacances de Noël', date: '2026-12-28', type: 'conge' },
    { title: 'Vacances de Noël', date: '2026-12-29', type: 'conge' },
    { title: 'Vacances de Noël', date: '2026-12-30', type: 'conge' },
    { title: 'Vacances de Noël', date: '2026-12-31', type: 'conge' },
    { title: "Jour de l'An", date: '2027-01-01', type: 'conge' },
    { title: 'Congé pour tous les élèves', date: '2027-01-15', type: 'conge' },
    { title: 'Congé (secondaire seulement)', date: '2027-02-01', type: 'autre' },
    { title: 'Congé pour tous les élèves', date: '2027-02-12', type: 'conge' },
    { title: 'Fête de la famille', date: '2027-02-15', type: 'conge' },
    { title: 'Congé de mars', date: '2027-03-01', type: 'conge' },
    { title: 'Congé de mars', date: '2027-03-02', type: 'conge' },
    { title: 'Congé de mars', date: '2027-03-03', type: 'conge' },
    { title: 'Congé de mars', date: '2027-03-04', type: 'conge' },
    { title: 'Congé de mars', date: '2027-03-05', type: 'conge' },
    { title: 'Vendredi saint', date: '2027-04-02', type: 'conge' },
    { title: 'Congé pour tous les élèves', date: '2027-04-24', type: 'conge' },
    { title: 'Congé pour tous les élèves', date: '2027-05-07', type: 'conge' },
    { title: 'Congé pour tous les élèves', date: '2027-05-21', type: 'conge' },
    { title: 'Fête de la Reine', date: '2027-05-24', type: 'conge' },
    { title: 'Congé (primaire seulement)', date: '2027-06-18', type: 'conge' },
    { title: 'Dernière journée de classe pour les élèves', date: '2027-06-25', type: 'autre' },
  ]

  const handleSeed2026 = async () => {
    setSeeding(true)
    try {
      const existingDates = new Set(events.map(e => new Date(e.date).toISOString().split('T')[0]))
      const toAdd = CONFIRMED_2026_2027.filter(e => !existingDates.has(e.date))
      if (toAdd.length === 0) {
        toast('Ces dates sont déjà toutes présentes.')
        return
      }
      for (const e of toAdd) {
        await fetch('/api/dsfs-events', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ ...e, schoolYearId })
        })
      }
      toast.success(`${toAdd.length} date(s) ajoutée(s)`)
      loadData()
    } catch (e) {
      console.error(e)
      toast.error('Erreur lors de l\'ajout')
    } finally {
      setSeeding(false)
    }
  }

  const handleCsvImport = async (file: File) => {
    try {
      const text = await file.text()
      const lines = text.split('\n').map(l => l.trim()).filter(Boolean)
      const validTypes = TYPES.map(t => t.value)
      const rows = lines.map(line => {
        const [date, title, type] = line.split(',').map(s => s?.trim())
        return { date, title, type: validTypes.includes(type) ? type : 'autre' }
      }).filter(r => r.date && r.title && /^\d{4}-\d{2}-\d{2}$/.test(r.date))

      if (rows.length === 0) {
        toast.error('Aucune ligne valide trouvée dans le fichier (format attendu: date,titre,type)')
        return
      }

      if (!window.confirm(`${rows.length} événement(s) détecté(s). Les ajouter au calendrier ${schoolYearName} ?`)) return

      for (const r of rows) {
        await fetch('/api/dsfs-events', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ ...r, schoolYearId })
        })
      }
      toast.success(`${rows.length} événement(s) importé(s)`)
      loadData()
    } catch (e) {
      console.error(e)
      toast.error('Erreur lors de l\'import du fichier')
    }
  }

  const typeLabel = (v: string) => TYPES.find(t => t.value === v)?.label || v

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
      <div className="space-y-6 max-w-4xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <School className="text-primary" size={32} />
            <div>
              <h1 className="text-3xl font-bold">Calendrier officiel DSFS</h1>
              <p className="text-gray-600 text-sm">Année scolaire {schoolYearName}</p>
            </div>
          </div>
          <button
            onClick={() => { resetForm(); setShowForm(true) }}
            className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90"
          >
            <Plus size={20} /> Ajouter un événement
          </button>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-900">
          <p className="mb-1">
            <strong>Important :</strong> Mon Agenda Pédago n'invente jamais de date officielle. Ajoute ici les journées pédagogiques, congés, journées administratives, perfectionnement et rentrée progressive selon le calendrier officiel de ton école (publié par le District scolaire francophone Sud). Ces journées apparaîtront automatiquement en gris pâle dans ton agenda.
          </p>
          <a
            href="https://francophonesud.nbed.nb.ca/vie-scolaire/calendriers-scolaires"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 underline font-medium"
          >
            Consulter le calendrier officiel de mon école <ExternalLink size={14} />
          </a>
        </div>

        {schoolYearName === '2026-2027' && (
          <div className="bg-white rounded-2xl p-4 shadow-lg flex items-center justify-between gap-4">
            <div>
              <p className="font-semibold text-sm">Dates 2026-2027 déjà confirmées</p>
              <p className="text-xs text-gray-500">Journée administrative, PAQ, perfectionnement, rentrée progressive, Fête du travail, congé de mars, dernière journée — celles que tu m'as toi-même confirmées.</p>
            </div>
            <button
              onClick={handleSeed2026}
              disabled={seeding}
              className="flex-shrink-0 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 disabled:opacity-50 text-sm"
            >
              {seeding ? 'Ajout...' : 'Ajouter ces dates'}
            </button>
          </div>
        )}

        <div className="bg-white rounded-2xl p-4 shadow-lg">
          <p className="font-semibold text-sm mb-2">Importer une liste (CSV)</p>
          <p className="text-xs text-gray-500 mb-2">Format : <code>date,titre,type</code> par ligne (ex: <code>2026-09-07,Fête du travail,conge</code>). Types valides : conge, pedagogique, administrative, perfectionnement, rentree-progressive, autre.</p>
          <input type="file" accept=".csv,text/csv" onChange={(e) => e.target.files?.[0] && handleCsvImport(e.target.files[0])} className="text-sm" />
        </div>

        {showForm && (
          <div className="bg-white rounded-2xl p-6 shadow-lg space-y-4">
            <h2 className="text-xl font-bold">{editingId ? 'Modifier' : 'Nouvel'} événement officiel</h2>
            <div>
              <label className="block text-sm font-medium mb-1">Titre *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="Ex: Fête du travail"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
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
                <label className="block text-sm font-medium mb-1">Type *</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  {TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Description (facultatif)</label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div className="flex gap-2">
              <button onClick={handleSave} className="flex-1 bg-primary text-white py-2 rounded-lg hover:bg-primary/90">
                {editingId ? 'Enregistrer' : 'Ajouter'}
              </button>
              <button onClick={resetForm} className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300">
                Annuler
              </button>
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {events.length === 0 ? (
            <div className="p-12 text-center">
              <School size={48} className="mx-auto mb-4 text-gray-300" />
              <p className="text-gray-500">Aucun événement officiel ajouté pour {schoolYearName}.</p>
              <p className="text-sm text-gray-400 mt-1">Ajoute les journées pédagogiques, congés et rentrée progressive de ton calendrier scolaire.</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr className="text-left">
                  <th className="px-4 py-2">Date</th>
                  <th className="px-4 py-2">Titre</th>
                  <th className="px-4 py-2">Type</th>
                  <th className="px-4 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {events.map(e => (
                  <tr key={e.id} className="border-t border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-2">{formatDate(new Date(e.date))}</td>
                    <td className="px-4 py-2 font-medium">{e.title}</td>
                    <td className="px-4 py-2">
                      <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full">{typeLabel(e.type)}</span>
                    </td>
                    <td className="px-4 py-2 text-right">
                      <button onClick={() => handleEdit(e)} className="p-1 hover:bg-gray-100 text-gray-600 rounded mr-1">
                        <Edit2 size={16} />
                      </button>
                      <button onClick={() => handleDelete(e.id)} className="p-1 hover:bg-red-100 text-red-600 rounded">
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </Layout>
  )
}
