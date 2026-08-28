'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/store'
import Layout from '@/components/Layout'
import toast from 'react-hot-toast'
import { Presentation as PresentationIcon, Upload, Trash2, Download } from 'lucide-react'
import { formatDate } from '@/lib/utils'

interface PresentationItem {
  id: string
  title: string
  subject?: string
  fileName: string
  createdAt: string
}

export default function PresentationsPage() {
  const router = useRouter()
  const { user, token } = useAuthStore()
  const [items, setItems] = useState<PresentationItem[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const [title, setTitle] = useState('')
  const [subject, setSubject] = useState('')

  useEffect(() => {
    if (!user || !token) { router.push('/auth'); return }
    loadData()
  }, [user, token, router])

  const loadData = async () => {
    try {
      const res = await fetch('/api/presentations', { headers: { Authorization: `Bearer ${token}` } })
      if (res.ok) {
        const data = await res.json()
        setItems(data.presentations || [])
      }
    } catch (e) {
      console.error(e)
      toast.error('Erreur lors du chargement')
    } finally {
      setLoading(false)
    }
  }

  const handleFileSelect = (file: File) => {
    const ext = file.name.split('.').pop()?.toLowerCase() || ''
    if (!['ppt', 'pptx'].includes(ext)) {
      toast.error('Seuls les fichiers .ppt et .pptx sont acceptés')
      return
    }
    if (file.size > 15_000_000) {
      toast.error('Fichier trop volumineux (max 15 Mo)')
      return
    }
    setPendingFile(file)
    setTitle(file.name.replace(/\.[^.]+$/, ''))
  }

  const handleUpload = async () => {
    if (!pendingFile || !title) {
      toast.error('Choisis un fichier et un titre')
      return
    }
    setUploading(true)
    try {
      const dataUrl: string = await new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result as string)
        reader.onerror = reject
        reader.readAsDataURL(pendingFile)
      })

      const res = await fetch('/api/presentations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ title, subject: subject || undefined, fileName: pendingFile.name, dataUrl })
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Erreur')
      }
      toast.success('PowerPoint ajouté')
      setPendingFile(null)
      setTitle('')
      setSubject('')
      loadData()
    } catch (e: any) {
      toast.error(e.message || 'Erreur lors de l\'ajout')
    } finally {
      setUploading(false)
    }
  }

  const handleDownload = async (item: PresentationItem) => {
    try {
      const res = await fetch(`/api/presentations/${item.id}`, { headers: { Authorization: `Bearer ${token}` } })
      if (!res.ok) throw new Error('Erreur')
      const data = await res.json()
      const dataUrl: string = data.presentation.dataUrl

      // Conversion dataURL -> blob pour un vrai téléchargement/partage fiable
      const res2 = await fetch(dataUrl)
      const blob = await res2.blob()
      const file = new File([blob], item.fileName, { type: blob.type })

      const nav = navigator as any
      if (typeof nav.canShare === 'function' && nav.canShare({ files: [file] })) {
        await nav.share({ files: [file], title: item.fileName }).catch(() => {})
      } else {
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = item.fileName
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }
    } catch (e) {
      console.error(e)
      toast.error('Erreur lors du téléchargement')
    }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Supprimer ce PowerPoint ?')) return
    try {
      const res = await fetch(`/api/presentations?presentationId=${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      })
      if (!res.ok) throw new Error('Erreur')
      toast.success('Supprimé')
      loadData()
    } catch (e) {
      console.error(e)
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
      <div className="space-y-6 max-w-4xl">
        <div className="flex items-center gap-3">
          <PresentationIcon className="text-primary" size={32} />
          <div>
            <h1 className="text-3xl font-bold">Mes PowerPoints</h1>
            <p className="text-gray-600 text-sm">Conserve et retrouve tes présentations utilisées en classe</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-lg space-y-4">
          <h2 className="text-xl font-bold">Ajouter un PowerPoint</h2>

          <label className="flex items-center justify-center gap-2 border-2 border-dashed border-gray-300 rounded-lg p-6 cursor-pointer hover:border-primary transition-colors">
            <Upload size={20} className="text-gray-400" />
            <span className="text-gray-600">{pendingFile ? pendingFile.name : 'Choisir un fichier .pptx ou .ppt'}</span>
            <input
              type="file"
              accept=".ppt,.pptx"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
            />
          </label>

          {pendingFile && (
            <>
              <div>
                <label className="block text-sm font-medium mb-1">Titre *</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Matière (facultatif)</label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="Ex: Mathématiques"
                />
              </div>
              <button
                onClick={handleUpload}
                disabled={uploading}
                className="w-full bg-primary text-white py-2 rounded-lg hover:bg-primary/90 disabled:opacity-50"
              >
                {uploading ? 'Envoi en cours...' : 'Enregistrer'}
              </button>
            </>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {items.length === 0 ? (
            <div className="p-12 text-center">
              <PresentationIcon size={48} className="mx-auto mb-4 text-gray-300" />
              <p className="text-gray-500">Aucun PowerPoint ajouté pour l'instant.</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr className="text-left">
                  <th className="px-4 py-2">Titre</th>
                  <th className="px-4 py-2">Matière</th>
                  <th className="px-4 py-2">Ajouté le</th>
                  <th className="px-4 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {items.map(item => (
                  <tr key={item.id} className="border-t border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-2 font-medium">{item.title}</td>
                    <td className="px-4 py-2 text-gray-600">{item.subject || '—'}</td>
                    <td className="px-4 py-2 text-gray-600">{formatDate(new Date(item.createdAt))}</td>
                    <td className="px-4 py-2 text-right whitespace-nowrap">
                      <button onClick={() => handleDownload(item)} className="p-1 hover:bg-gray-100 text-gray-600 rounded mr-1" title="Télécharger">
                        <Download size={16} />
                      </button>
                      <button onClick={() => handleDelete(item.id)} className="p-1 hover:bg-red-100 text-red-600 rounded" title="Supprimer">
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
