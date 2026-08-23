'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/store'
import Layout from '@/components/Layout'
import toast from 'react-hot-toast'
import { FileText, Download } from 'lucide-react'

interface SchoolYear {
  id: string
  name: string
}

export default function ExportPage() {
  const router = useRouter()
  const { user, token } = useAuthStore()
  const [schoolYears, setSchoolYears] = useState<SchoolYear[]>([])
  const [selectedYear, setSelectedYear] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [options, setOptions] = useState({
    format: 'pdf', // 'pdf' ou 'word'
    orientation: 'portrait', // 'portrait' ou 'landscape'
    color: true,
    includeCover: true,
    includeSchedule: true,
    includeNotes: true,
  })

  useEffect(() => {
    if (!user || !token) {
      router.push('/auth')
      return
    }
    loadSchoolYears()
  }, [user, token, router])

  const loadSchoolYears = async () => {
    try {
      const response = await fetch('/api/school-years', {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      const data = await response.json()
      setSchoolYears(data.schoolYears)
      setSelectedYear(data.schoolYears.find((y: any) => y.isActive)?.id || data.schoolYears[0]?.id || '')
    } catch (error) {
      console.error(error)
      toast.error('Erreur lors du chargement')
    } finally {
      setLoading(false)
    }
  }

  const handleGenerate = async () => {
    if (!selectedYear) {
      toast.error('Veuillez sélectionner une année scolaire')
      return
    }

    setGenerating(true)
    try {
      const endpoint = options.format === 'pdf' ? '/api/export/pdf' : '/api/export/word'
      const filename = options.format === 'pdf'
        ? `agenda-${selectedYear}.pdf`
        : `Mon-Agenda-Pedago_${selectedYear}.docx`
      const mimeType = options.format === 'pdf'
        ? 'application/pdf'
        : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          schoolYearId: selectedYear,
          ...options
        })
      })

      if (!response.ok) {
        throw new Error('Erreur lors de la génération')
      }

      const blob = await response.blob()

      // Sur iPhone/iPad (et certains Android), le téléchargement via lien
      // <a download> est peu fiable dans Safari (le fichier s'ouvre en
      // aperçu ou disparaît silencieusement). On utilise donc en priorité
      // le partage natif du système, qui propose « Enregistrer dans
      // Fichiers » de façon fiable. On revient au téléchargement classique
      // si le partage de fichiers n'est pas disponible (desktop, etc.).
      const file = new File([blob], filename, { type: mimeType })
      const nav = navigator as any
      const canUseShare = typeof nav.canShare === 'function' && nav.canShare({ files: [file] })

      if (canUseShare) {
        try {
          await nav.share({
            files: [file],
            title: filename
          })
          toast.success('Choisis « Enregistrer dans Fichiers » dans le menu')
        } catch (shareErr: any) {
          // L'utilisateur a annulé le partage : ce n'est pas une erreur.
          if (shareErr?.name !== 'AbortError') {
            throw shareErr
          }
        }
      } else {
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = filename
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        toast.success('Fichier téléchargé!')
      }
    } catch (error) {
      console.error(error)
      toast.error('Erreur lors de la génération du fichier')
    } finally {
      setGenerating(false)
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
      <div className="max-w-2xl space-y-8">
        <div className="flex items-center gap-3">
          <FileText className="text-primary" size={32} />
          <h1 className="text-3xl font-bold">Générer mon agenda</h1>
        </div>

        <div className="bg-white rounded-2xl p-8 shadow-lg space-y-6">
          {/* Sélection de l'année */}
          <div>
            <label className="block text-sm font-medium mb-2">Année scolaire</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            >
              {schoolYears.map(year => (
                <option key={year.id} value={year.id}>
                  {year.name}
                </option>
              ))}
            </select>
          </div>

          {/* Format */}
          <div>
            <label className="block text-sm font-medium mb-3">Format</label>
            <div className="flex gap-4">
              <button
                onClick={() => setOptions({ ...options, format: 'pdf' })}
                className={`flex-1 py-2 px-4 rounded-lg font-semibold transition-colors ${
                  options.format === 'pdf'
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                📄 PDF
              </button>
              <button
                onClick={() => setOptions({ ...options, format: 'word' })}
                className={`flex-1 py-2 px-4 rounded-lg font-semibold transition-colors ${
                  options.format === 'word'
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                📝 Word
              </button>
            </div>
          </div>

          {/* Orientation (seulement pour PDF) */}
          {options.format === 'pdf' && (
            <div>
              <label className="block text-sm font-medium mb-3">Orientation</label>
              <div className="flex gap-4">
                <button
                  onClick={() => setOptions({ ...options, orientation: 'portrait' })}
                  className={`flex-1 py-2 px-4 rounded-lg font-semibold transition-colors ${
                    options.orientation === 'portrait'
                      ? 'bg-primary text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  📊 Portrait
                </button>
                <button
                  onClick={() => setOptions({ ...options, orientation: 'landscape' })}
                  className={`flex-1 py-2 px-4 rounded-lg font-semibold transition-colors ${
                    options.orientation === 'landscape'
                      ? 'bg-primary text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  📈 Paysage
                </button>
              </div>
            </div>
          )}

          {/* Couleur */}
          <div>
            <label className="block text-sm font-medium mb-3">Couleur</label>
            <div className="flex gap-4">
              <button
                onClick={() => setOptions({ ...options, color: true })}
                className={`flex-1 py-2 px-4 rounded-lg font-semibold transition-colors ${
                  options.color
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                🌈 Couleur
              </button>
              <button
                onClick={() => setOptions({ ...options, color: false })}
                className={`flex-1 py-2 px-4 rounded-lg font-semibold transition-colors ${
                  !options.color
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                ⚫ Noir et blanc
              </button>
            </div>
          </div>

          {/* Contenu */}
          <div>
            <label className="block text-sm font-medium mb-3">Contenu</label>
            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={options.includeCover}
                  onChange={(e) => setOptions({ ...options, includeCover: e.target.checked })}
                  className="w-4 h-4"
                />
                <span>Couverture</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={options.includeSchedule}
                  onChange={(e) => setOptions({ ...options, includeSchedule: e.target.checked })}
                  className="w-4 h-4"
                />
                <span>Horaire</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={options.includeNotes}
                  onChange={(e) => setOptions({ ...options, includeNotes: e.target.checked })}
                  className="w-4 h-4"
                />
                <span>Pages de notes</span>
              </label>
            </div>
          </div>

          {/* Bouton de génération */}
          <button
            onClick={handleGenerate}
            disabled={generating || !selectedYear}
            className="w-full flex items-center justify-center gap-2 bg-primary text-white py-3 rounded-lg hover:bg-primary/90 disabled:opacity-50 font-semibold"
          >
            <Download size={20} />
            {generating ? 'Génération en cours...' : 'Télécharger'}
          </button>

          {/* Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-900">
              <strong>💡 Conseil:</strong> Le fichier contient votre horaire réel avec les heures et périodes que vous avez définis. Vous pouvez l'éditer après téléchargement pour ajouter vos planifications détaillées.
            </p>
          </div>
        </div>

        {/* Guide d'utilisation */}
        <div className="bg-gray-50 rounded-2xl p-8 border border-gray-200">
          <h2 className="text-xl font-bold mb-4">Guide d'utilisation</h2>
          
          <div className="space-y-4 text-sm text-gray-700">
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">📄 PDF</h3>
              <p>Parfait pour imprimer. Inclut votre horaire exact avec les heures que vous avez définis. Prêt à imprimer immédiatement.</p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-1">📝 Word</h3>
              <p>Entièrement éditable. Vous pouvez modifier, ajouter des détails, changer les couleurs après téléchargement.</p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-1">🎨 Options</h3>
              <ul className="list-disc list-inside space-y-1">
                <li><strong>Orientation:</strong> Portrait (standard) ou Paysage (grille hebdomadaire)</li>
                <li><strong>Couleur:</strong> En couleur (comme dans l'app) ou noir/blanc (économe en encre)</li>
                <li><strong>Contenu:</strong> Choisissez ce que vous voulez imprimer</li>
              </ul>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
              <p className="text-yellow-900">
                <strong>⚠️ Important:</strong> Le fichier utilise <strong>vos vraies heures d'horaire</strong>. Si vous avez un dîner de 11h50 à 12h10, il apparaîtra correctement dans le document.
              </p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}
