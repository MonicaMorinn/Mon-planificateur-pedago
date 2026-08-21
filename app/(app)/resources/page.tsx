'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/store'
import Layout from '@/components/Layout'
import toast from 'react-hot-toast'
import { FileText, Plus, Trash2, Star, Folder, Link as LinkIcon } from 'lucide-react'

interface Resource {
  id: string
  title: string
  type: string
  url?: string
  content?: string
  isFavorite: boolean
  tags?: string
}

export default function ResourcesPage() {
  const router = useRouter()
  const { user, token } = useAuthStore()
  const [resources, setResources] = useState<Resource[]>([])
  const [loading, setLoading] = useState(true)
  const [showNewForm, setShowNewForm] = useState(false)
  const [filterType, setFilterType] = useState('all')

  const [formData, setFormData] = useState({
    title: '',
    type: 'file',
    url: '',
    tags: ''
  })

  useEffect(() => {
    if (!user || !token) {
      router.push('/auth')
      return
    }
    loadResources()
  }, [user, token, router])

  const loadResources = async () => {
    try {
      const response = await fetch('/api/resources', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (response.ok) {
        const data = await response.json()
        setResources(data.resources)
      }
    } catch (error) {
      console.error(error)
      toast.error('Erreur lors du chargement')
    } finally {
      setLoading(false)
    }
  }

  const handleAddResource = async () => {
    if (!formData.title) {
      toast.error('Le titre est requis')
      return
    }

    try {
      const tagsArray = formData.tags
        ? formData.tags.split(',').map(t => t.trim()).filter(Boolean)
        : []

      const response = await fetch('/api/resources', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: formData.title,
          type: formData.type,
          url: formData.url || undefined,
          tags: tagsArray
        })
      })

      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.error || 'Erreur')
      }

      toast.success('Ressource créée')
      setFormData({ title: '', type: 'file', url: '', tags: '' })
      setShowNewForm(false)
      loadResources()
    } catch (error) {
      console.error(error)
      toast.error('Erreur lors de l\'ajout')
    }
  }

  const handleToggleFavorite = async (resource: Resource) => {
    try {
      const response = await fetch(`/api/resources?resourceId=${resource.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ isFavorite: !resource.isFavorite })
      })

      if (!response.ok) throw new Error('Erreur')

      setResources(resources.map(r =>
        r.id === resource.id ? { ...r, isFavorite: !r.isFavorite } : r
      ))
    } catch (error) {
      console.error(error)
      toast.error('Erreur lors de la mise à jour')
    }
  }

  const handleDeleteResource = async (resourceId: string) => {
    if (!window.confirm('Supprimer cette ressource?')) return

    try {
      const response = await fetch(`/api/resources?resourceId=${resourceId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (!response.ok) throw new Error('Erreur')

      toast.success('Ressource supprimée')
      loadResources()
    } catch (error) {
      console.error(error)
      toast.error('Erreur lors de la suppression')
    }
  }

  const TYPES = [
    { value: 'file', label: '📄 Fichier', icon: FileText },
    { value: 'link', label: '🔗 Lien', icon: LinkIcon },
    { value: 'folder', label: '📁 Dossier', icon: Folder },
  ]

  if (loading) {
    return (
      <Layout authenticated={true}>
        <div className="flex items-center justify-center h-96">
          <div className="text-gray-500">Chargement...</div>
        </div>
      </Layout>
    )
  }

  const filteredResources = filterType === 'all'
    ? resources
    : filterType === 'favorites'
    ? resources.filter(r => r.isFavorite)
    : resources.filter(r => r.type === filterType)

  return (
    <Layout authenticated={true}>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileText className="text-primary" size={32} />
            <h1 className="text-3xl font-bold">Ma bibliothèque</h1>
          </div>
          <button
            onClick={() => setShowNewForm(!showNewForm)}
            className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90"
          >
            <Plus size={20} /> Ajouter une ressource
          </button>
        </div>

        {/* Formulaire */}
        {showNewForm && (
          <div className="bg-white rounded-2xl p-6 shadow-lg space-y-4">
            <h2 className="text-xl font-bold">Nouvelle ressource</h2>
            <div>
              <label className="block text-sm font-medium mb-1">Titre *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="Ex: Activité sur les fractions"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Type</label>
              <div className="grid grid-cols-3 gap-2">
                {TYPES.map(type => (
                  <button
                    key={type.value}
                    onClick={() => setFormData({ ...formData, type: type.value })}
                    className={`p-3 rounded-lg font-semibold transition-colors text-sm ${
                      formData.type === type.value
                        ? 'bg-primary text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
            </div>

            {formData.type === 'link' && (
              <div>
                <label className="block text-sm font-medium mb-1">URL</label>
                <input
                  type="url"
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="https://..."
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-1">Tags (séparés par des virgules)</label>
              <input
                type="text"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="Ex: mathématiques, fractions, 3e année"
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleAddResource}
                className="flex-1 bg-primary text-white py-2 rounded-lg hover:bg-primary/90"
              >
                Ajouter
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

        {/* Filtres */}
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setFilterType('all')}
            className={`px-4 py-2 rounded-lg font-semibold ${
              filterType === 'all'
                ? 'bg-primary text-white'
                : 'bg-gray-200 text-gray-700'
            }`}
          >
            Tous
          </button>
          <button
            onClick={() => setFilterType('favorites')}
            className={`px-4 py-2 rounded-lg font-semibold text-sm flex items-center gap-1 ${
              filterType === 'favorites'
                ? 'bg-primary text-white'
                : 'bg-gray-200 text-gray-700'
            }`}
          >
            <Star size={14} /> Favoris
          </button>
          {TYPES.map(type => (
            <button
              key={type.value}
              onClick={() => setFilterType(type.value)}
              className={`px-4 py-2 rounded-lg font-semibold text-sm ${
                filterType === type.value
                  ? 'bg-primary text-white'
                  : 'bg-gray-200 text-gray-700'
              }`}
            >
              {type.label}
            </button>
          ))}
        </div>

        {/* Liste des ressources */}
        {filteredResources.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center shadow-lg">
            <FileText size={48} className="mx-auto mb-4 text-gray-300" />
            <p className="text-gray-500 mb-4">Aucune ressource pour l'instant</p>
            <p className="text-sm text-gray-500">Commencez à organiser votre bibliothèque pédagogique!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredResources.map(resource => (
              <div key={resource.id} className="bg-white rounded-lg p-4 shadow hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold flex-1">{resource.title}</h3>
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleToggleFavorite(resource)}
                      className={resource.isFavorite ? 'text-yellow-500' : 'text-gray-400 hover:text-yellow-500'}
                    >
                      <Star size={18} fill={resource.isFavorite ? 'currentColor' : 'none'} />
                    </button>
                    <button
                      onClick={() => handleDeleteResource(resource.id)}
                      className="text-gray-400 hover:text-red-600"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mb-3">{resource.type}</p>
                {resource.url && (
                  <a
                    href={resource.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 truncate block mb-2 hover:underline"
                  >
                    {resource.url}
                  </a>
                )}
                {resource.tags && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {(() => {
                      try {
                        const tags = JSON.parse(resource.tags)
                        return tags.map((tag: string, i: number) => (
                          <span key={i} className="text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full">
                            {tag}
                          </span>
                        ))
                      } catch {
                        return null
                      }
                    })()}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-900">
            <strong>💡 Conseil:</strong> Organisez votre bibliothèque avec des tags pour retrouver facilement vos ressources par niveau, matière ou type d'activité.
          </p>
        </div>
      </div>
    </Layout>
  )
}
