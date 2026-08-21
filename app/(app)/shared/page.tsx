'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/store'
import Layout from '@/components/Layout'
import toast from 'react-hot-toast'
import { Share2, Plus, Trash2, Inbox, Send } from 'lucide-react'
import { formatDate } from '@/lib/utils'

interface SharedItem {
  id: string
  resourceTitle: string
  resourceType: string
  ownerName: string
  ownerEmail: string
  recipientName: string
  recipientEmail: string
  type: string
  createdAt: string
}

interface Resource {
  id: string
  title: string
  type: string
}

export default function SharedPage() {
  const router = useRouter()
  const { user, token } = useAuthStore()
  const [sentShares, setSentShares] = useState<SharedItem[]>([])
  const [receivedShares, setReceivedShares] = useState<SharedItem[]>([])
  const [myResources, setMyResources] = useState<Resource[]>([])
  const [loading, setLoading] = useState(true)
  const [showShareForm, setShowShareForm] = useState(false)
  const [activeTab, setActiveTab] = useState<'received' | 'sent'>('received')

  const [shareFormData, setShareFormData] = useState({
    email: '',
    resourceId: ''
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
      const [sharedRes, resourcesRes] = await Promise.all([
        fetch('/api/shared', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/resources', { headers: { 'Authorization': `Bearer ${token}` } })
      ])

      if (sharedRes.ok) {
        const data = await sharedRes.json()
        setSentShares(data.sent)
        setReceivedShares(data.received)
      }

      if (resourcesRes.ok) {
        const data = await resourcesRes.json()
        setMyResources(data.resources.filter((r: any) => r.type !== 'folder'))
      }
    } catch (error) {
      console.error(error)
      toast.error('Erreur lors du chargement')
    } finally {
      setLoading(false)
    }
  }

  const handleShare = async () => {
    if (!shareFormData.email || !shareFormData.resourceId) {
      toast.error('Veuillez sélectionner une ressource et entrer un email')
      return
    }

    try {
      const response = await fetch('/api/shared', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(shareFormData)
      })

      const data = await response.json()

      if (!response.ok) {
        toast.error(data.error || 'Erreur lors du partage')
        return
      }

      toast.success('Ressource partagée avec succès')
      setShareFormData({ email: '', resourceId: '' })
      setShowShareForm(false)
      loadData()
    } catch (error) {
      console.error(error)
      toast.error('Erreur lors du partage')
    }
  }

  const handleDeleteShare = async (shareId: string) => {
    if (!window.confirm('Retirer ce partage?')) return

    try {
      const response = await fetch(`/api/shared?shareId=${shareId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (!response.ok) throw new Error('Erreur')

      toast.success('Partage supprimé')
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

  const activeList = activeTab === 'received' ? receivedShares : sentShares

  return (
    <Layout authenticated={true}>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Share2 className="text-primary" size={32} />
            <h1 className="text-3xl font-bold">Ressources partagées</h1>
          </div>
          <button
            onClick={() => setShowShareForm(!showShareForm)}
            className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90"
          >
            <Plus size={20} /> Partager une ressource
          </button>
        </div>

        {/* Formulaire de partage */}
        {showShareForm && (
          <div className="bg-white rounded-2xl p-6 shadow-lg space-y-4">
            <h2 className="text-xl font-bold">Partager une ressource</h2>

            <div>
              <label className="block text-sm font-medium mb-1">Ressource à partager *</label>
              {myResources.length === 0 ? (
                <p className="text-sm text-gray-500">
                  Vous n'avez aucune ressource à partager. Créez-en d'abord dans la section Ressources.
                </p>
              ) : (
                <select
                  value={shareFormData.resourceId}
                  onChange={(e) => setShareFormData({ ...shareFormData, resourceId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="">Sélectionner une ressource</option>
                  {myResources.map(r => (
                    <option key={r.id} value={r.id}>{r.title}</option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Email de l'enseignante *</label>
              <input
                type="email"
                value={shareFormData.email}
                onChange={(e) => setShareFormData({ ...shareFormData, email: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="nom@exemple.com"
              />
              <p className="text-xs text-gray-500 mt-1">
                L'enseignante doit déjà avoir un compte Mon Agenda Pédago.
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleShare}
                disabled={myResources.length === 0}
                className="flex-1 bg-primary text-white py-2 rounded-lg hover:bg-primary/90 disabled:opacity-50"
              >
                Partager
              </button>
              <button
                onClick={() => setShowShareForm(false)}
                className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300"
              >
                Annuler
              </button>
            </div>
          </div>
        )}

        {/* Onglets */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab('received')}
              className={`flex-1 flex items-center justify-center gap-2 py-4 font-semibold transition-colors ${
                activeTab === 'received' ? 'text-primary border-b-2 border-primary' : 'text-gray-500'
              }`}
            >
              <Inbox size={18} /> Reçus ({receivedShares.length})
            </button>
            <button
              onClick={() => setActiveTab('sent')}
              className={`flex-1 flex items-center justify-center gap-2 py-4 font-semibold transition-colors ${
                activeTab === 'sent' ? 'text-primary border-b-2 border-primary' : 'text-gray-500'
              }`}
            >
              <Send size={18} /> Envoyés ({sentShares.length})
            </button>
          </div>

          <div className="p-8">
            {activeList.length === 0 ? (
              <div className="text-center py-12">
                <Share2 size={48} className="mx-auto mb-4 text-gray-300" />
                <p className="text-gray-500 mb-4">
                  {activeTab === 'received' ? 'Aucune ressource reçue' : 'Aucun partage envoyé'}
                </p>
                <p className="text-sm text-gray-600">
                  Partagez vos ressources pédagogiques avec d'autres enseignantes de votre école!
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {activeList.map(share => (
                  <div key={share.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="flex-1">
                      <p className="font-semibold">{share.resourceTitle}</p>
                      <p className="text-sm text-gray-600">
                        {activeTab === 'received'
                          ? `Partagé par: ${share.ownerName} (${share.ownerEmail})`
                          : `Partagé avec: ${share.recipientName} (${share.recipientEmail})`}
                      </p>
                      <p className="text-xs text-gray-500">{share.resourceType} · {formatDate(new Date(share.createdAt))}</p>
                    </div>
                    <button
                      onClick={() => handleDeleteShare(share.id)}
                      className="p-2 hover:bg-red-100 text-red-600 rounded-lg"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Guide */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-900">
            <strong>💡 Conseil:</strong> Partagez vos meilleures activités et ressources avec vos collègues pour construire une bibliothèque commune de votre école.
          </p>
        </div>
      </div>
    </Layout>
  )
}
