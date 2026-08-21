'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/store'
import Layout from '@/components/Layout'
import toast from 'react-hot-toast'
import { Settings, Save, LogOut, Upload, Trash2, Link as LinkIcon, Plus } from 'lucide-react'

export default function SettingsPage() {
  const router = useRouter()
  const { user, token, logout, setUser } = useAuthStore()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    schoolId: '',
    district: '',
    province: '',
    level: ''
  })

  const [plannerSettings, setPlannerSettings] = useState({
    notesLocation: 'sous',
    colorMode: 'couleur',
    primaryColor: '#6366f1',
    fontDays: '',
    fontDates: '',
    fontTitles: '',
    fontSchedule: '',
    fontEvents: '',
    fontNotes: '',
    fontCalendar: ''
  })
  const [savingPrefs, setSavingPrefs] = useState(false)
  const [fonts, setFonts] = useState<any[]>([])
  const [uploadingFont, setUploadingFont] = useState(false)
  const [quickLinks, setQuickLinks] = useState<{ label: string; url: string }[]>([])
  const [newLink, setNewLink] = useState({ label: '', url: '' })

  const loadPreferences = async () => {
    try {
      const res = await fetch('/api/settings', { headers: { 'Authorization': `Bearer ${token}` } })
      if (res.ok) {
        const data = await res.json()
        setPlannerSettings({
          notesLocation: data.settings.notesLocation || 'sous',
          colorMode: data.settings.colorMode || 'couleur',
          primaryColor: data.settings.primaryColor || '#6366f1',
          fontDays: data.settings.fontDays || '',
          fontDates: data.settings.fontDates || '',
          fontTitles: data.settings.fontTitles || '',
          fontSchedule: data.settings.fontSchedule || '',
          fontEvents: data.settings.fontEvents || '',
          fontNotes: data.settings.fontNotes || '',
          fontCalendar: data.settings.fontCalendar || ''
        })
        if (data.settings.quickLinks) {
          try { setQuickLinks(JSON.parse(data.settings.quickLinks)) } catch {}
        }
      }
      const fontsRes = await fetch('/api/fonts', { headers: { 'Authorization': `Bearer ${token}` } })
      if (fontsRes.ok) {
        const data = await fontsRes.json()
        setFonts(data.fonts)
      }
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    if (token) loadPreferences()
  }, [token])

  const handleSavePrefs = async () => {
    setSavingPrefs(true)
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ ...plannerSettings, quickLinks: JSON.stringify(quickLinks) })
      })
      if (!res.ok) throw new Error()
      toast.success('Préférences enregistrées')
    } catch {
      toast.error('Erreur lors de la sauvegarde des préférences')
    } finally {
      setSavingPrefs(false)
    }
  }

  const handleFontUpload = async (file: File) => {
    const ext = file.name.split('.').pop()?.toLowerCase() || ''
    if (!['ttf', 'otf', 'woff', 'woff2'].includes(ext)) {
      toast.error('Format non supporté (.ttf, .otf, .woff, .woff2)')
      return
    }
    setUploadingFont(true)
    try {
      const dataUrl: string = await new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result as string)
        reader.onerror = reject
        reader.readAsDataURL(file)
      })

      const res = await fetch('/api/fonts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ name: file.name.replace(/\.[^.]+$/, ''), format: ext, dataUrl })
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Erreur')
      }
      toast.success('Police importée')
      loadPreferences()
    } catch (e: any) {
      toast.error(e.message || 'Erreur lors de l\'import')
    } finally {
      setUploadingFont(false)
    }
  }

  const handleDeleteFont = async (fontId: string) => {
    try {
      const res = await fetch(`/api/fonts?fontId=${fontId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (!res.ok) throw new Error()
      toast.success('Police supprimée')
      loadPreferences()
    } catch {
      toast.error('Erreur lors de la suppression')
    }
  }

  const handleAddQuickLink = () => {
    if (!newLink.label || !newLink.url) {
      toast.error('Nom et lien requis')
      return
    }
    setQuickLinks([...quickLinks, newLink])
    setNewLink({ label: '', url: '' })
  }

  const handleRemoveQuickLink = (idx: number) => {
    setQuickLinks(quickLinks.filter((_, i) => i !== idx))
  }

  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        schoolId: user.schoolId || '',
        district: user.district || '',
        province: user.province || '',
        level: user.level || ''
      })
    }
  }, [user])

  const handleSave = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      })

      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.error || 'Erreur')
      }

      const data = await response.json()
      setUser({ ...user!, ...data.user })
      toast.success('Paramètres enregistrés')
    } catch (error) {
      console.error(error)
      toast.error('Erreur lors de la sauvegarde')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    logout()
    router.push('/auth')
  }

  if (!user) {
    return (
      <Layout authenticated={true}>
        <div>Chargement...</div>
      </Layout>
    )
  }

  return (
    <Layout authenticated={true}>
      <div className="max-w-2xl space-y-8">
        <div className="flex items-center gap-3">
          <Settings className="text-primary" size={32} />
          <h1 className="text-3xl font-bold">Paramètres</h1>
        </div>

        {/* Profil */}
        <div className="bg-white rounded-2xl p-8 shadow-lg">
          <h2 className="text-2xl font-bold mb-6">Profil</h2>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Prénom</label>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Nom</label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <input
                type="email"
                value={user.email}
                disabled
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">École</label>
              <input
                type="text"
                value={formData.schoolId}
                onChange={(e) => setFormData({ ...formData, schoolId: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                placeholder="Ex: École Pas-de-Calais"
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Province</label>
                <input
                  type="text"
                  value={formData.province}
                  onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">District</label>
                <input
                  type="text"
                  value={formData.district}
                  onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Niveau</label>
                <select
                  value={formData.level}
                  onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="">Sélectionner</option>
                  <option value="prescolaire">Préscolaire</option>
                  <option value="1ere">1ère année</option>
                  <option value="2e">2e année</option>
                  <option value="3e">3e année</option>
                  <option value="4e">4e année</option>
                  <option value="5e">5e année</option>
                  <option value="6e">6e année</option>
                </select>
              </div>
            </div>

            <button
              onClick={handleSave}
              disabled={loading}
              className="flex items-center gap-2 w-full bg-primary text-white py-3 rounded-lg hover:bg-primary/90 disabled:opacity-50 font-semibold"
            >
              <Save size={20} />
              {loading ? 'Sauvegarde...' : 'Enregistrer les modifications'}
            </button>
          </div>
        </div>

        {/* Style du planner */}
        <div className="bg-white rounded-2xl p-8 shadow-lg">
          <h2 className="text-2xl font-bold mb-6">Style du planner</h2>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-3">Style</label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setPlannerSettings({ ...plannerSettings, colorMode: 'couleur' })}
                  className={`flex items-center gap-2 px-4 py-2 border-2 rounded-lg font-semibold ${
                    plannerSettings.colorMode === 'couleur' ? 'border-primary bg-primary/10 text-primary' : 'border-gray-300 text-gray-700'
                  }`}
                >
                  🎨 Couleur
                </button>
                <button
                  onClick={() => setPlannerSettings({ ...plannerSettings, colorMode: 'noir-et-blanc' })}
                  className={`flex items-center gap-2 px-4 py-2 border-2 rounded-lg font-semibold ${
                    plannerSettings.colorMode === 'noir-et-blanc' ? 'border-primary bg-primary/10 text-primary' : 'border-gray-300 text-gray-700'
                  }`}
                >
                  ⚫⚪ Noir et blanc
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                En noir et blanc, les espaces d'écriture restent blancs pour vos surligneurs.
              </p>
            </div>

            {plannerSettings.colorMode === 'couleur' && (
              <div>
                <label className="block text-sm font-medium mb-3">Couleur primaire</label>
                <div className="flex gap-2">
                  {['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#06b6d4'].map(color => (
                    <button
                      key={color}
                      onClick={() => setPlannerSettings({ ...plannerSettings, primaryColor: color })}
                      className={`w-10 h-10 rounded-full border-2 ${plannerSettings.primaryColor === color ? 'border-gray-800' : 'border-gray-300'}`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-3">Emplacement des notes</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: 'aucune', label: 'Aucune' },
                  { value: 'sous', label: 'Sous chaque journée' },
                  { value: 'cote', label: 'Sur le côté' },
                  { value: 'les-deux', label: 'Les deux' },
                ].map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setPlannerSettings({ ...plannerSettings, notesLocation: opt.value })}
                    className={`px-3 py-2 rounded-lg text-sm font-semibold border-2 ${
                      plannerSettings.notesLocation === opt.value ? 'border-primary bg-primary/10 text-primary' : 'border-gray-300 text-gray-700'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleSavePrefs}
              disabled={savingPrefs}
              className="flex items-center gap-2 w-full bg-primary text-white py-3 rounded-lg hover:bg-primary/90 disabled:opacity-50 font-semibold"
            >
              <Save size={20} />
              {savingPrefs ? 'Sauvegarde...' : 'Enregistrer le style'}
            </button>
          </div>
        </div>

        {/* Polices personnalisées */}
        <div className="bg-white rounded-2xl p-8 shadow-lg">
          <h2 className="text-2xl font-bold mb-2">Polices</h2>
          <p className="text-sm text-gray-500 mb-6">
            Les polices installées dans Word ne sont pas automatiquement accessibles au navigateur.
            Importez directement le fichier de police (.ttf, .otf, .woff, .woff2).
          </p>

          <label className="flex items-center justify-center gap-2 border-2 border-dashed border-gray-300 rounded-lg py-6 cursor-pointer hover:border-primary transition-colors mb-6">
            <Upload size={20} className="text-gray-500" />
            <span className="text-gray-600">
              {uploadingFont ? 'Import en cours...' : 'Importer une police (.ttf, .otf, .woff, .woff2)'}
            </span>
            <input
              type="file"
              accept=".ttf,.otf,.woff,.woff2"
              className="hidden"
              disabled={uploadingFont}
              onChange={(e) => e.target.files?.[0] && handleFontUpload(e.target.files[0])}
            />
          </label>

          {fonts.length > 0 && (
            <div className="mb-6">
              <h3 className="font-semibold mb-2 text-sm">Mes polices</h3>
              <style>{fonts.map(f => `@font-face { font-family: "custom-${f.id}"; src: url(${f.dataUrl}); }`).join('\n')}</style>
              <div className="space-y-2">
                {fonts.map(f => (
                  <div key={f.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span style={{ fontFamily: `custom-${f.id}` }} className="text-lg">{f.name} — Aperçu Aa Bb Cc</span>
                    <button onClick={() => handleDeleteFont(f.id)} className="text-red-600 hover:bg-red-100 p-1 rounded">
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {fonts.length > 0 && (
            <div className="grid grid-cols-2 gap-4">
              {[
                { key: 'fontDays', label: 'Police des jours' },
                { key: 'fontDates', label: 'Police des dates' },
                { key: 'fontTitles', label: 'Police des titres' },
                { key: 'fontSchedule', label: "Police de l'horaire" },
                { key: 'fontEvents', label: 'Police des événements' },
                { key: 'fontNotes', label: 'Police des notes' },
                { key: 'fontCalendar', label: 'Police du calendrier' },
              ].map(item => (
                <div key={item.key}>
                  <label className="block text-xs font-medium mb-1">{item.label}</label>
                  <select
                    value={(plannerSettings as any)[item.key]}
                    onChange={(e) => setPlannerSettings({ ...plannerSettings, [item.key]: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  >
                    <option value="">Police par défaut</option>
                    {fonts.map(f => (
                      <option key={f.id} value={`custom-${f.id}`}>{f.name}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          )}

          <button
            onClick={handleSavePrefs}
            disabled={savingPrefs}
            className="flex items-center gap-2 w-full bg-primary text-white py-3 rounded-lg hover:bg-primary/90 disabled:opacity-50 font-semibold mt-6"
          >
            <Save size={20} />
            Enregistrer les polices
          </button>
        </div>

        {/* Liens rapides */}
        <div className="bg-white rounded-2xl p-8 shadow-lg">
          <h2 className="text-2xl font-bold mb-6">Liens rapides</h2>

          <div className="space-y-2 mb-4">
            {quickLinks.map((link, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <a href={link.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-primary hover:underline">
                  <LinkIcon size={16} /> {link.label}
                </a>
                <button onClick={() => handleRemoveQuickLink(idx)} className="text-red-600 hover:bg-red-100 p-1 rounded">
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
            {quickLinks.length === 0 && (
              <p className="text-sm text-gray-400">Aucun lien pour l'instant. Ex: Seesaw, Canva, Google Drive, Kahoot...</p>
            )}
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Nom (ex: Seesaw)"
              value={newLink.label}
              onChange={(e) => setNewLink({ ...newLink, label: e.target.value })}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
            <input
              type="url"
              placeholder="https://..."
              value={newLink.url}
              onChange={(e) => setNewLink({ ...newLink, url: e.target.value })}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
            <button onClick={handleAddQuickLink} className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90">
              <Plus size={18} />
            </button>
          </div>

          <button
            onClick={handleSavePrefs}
            disabled={savingPrefs}
            className="flex items-center gap-2 w-full bg-primary text-white py-3 rounded-lg hover:bg-primary/90 disabled:opacity-50 font-semibold mt-4"
          >
            <Save size={20} />
            Enregistrer les liens
          </button>
        </div>

        {/* Compte */}
        <div className="bg-white rounded-2xl p-8 shadow-lg border-2 border-red-100">
          <h2 className="text-2xl font-bold mb-6 text-red-600">Compte</h2>

          <button
            onClick={handleLogout}
            className="flex items-center gap-2 w-full bg-red-600 text-white py-3 rounded-lg hover:bg-red-700 font-semibold"
          >
            <LogOut size={20} />
            Se déconnecter
          </button>
        </div>
      </div>
    </Layout>
  )
}
