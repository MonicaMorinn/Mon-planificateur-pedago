'use client'

import Link from 'next/link'
import { Calendar, Clock, Users, BookOpen, Brain, FileText, Share2, ArrowRight } from 'lucide-react'

export default function HomePage() {
  const features = [
    {
      icon: Clock,
      title: 'Horaires personnalisés',
      description: 'Crée ton propre horaire avec autant de dîners et périodes que tu veux'
    },
    {
      icon: Calendar,
      title: 'Calendrier complet',
      description: 'Planifie ton année scolaire avec tous les événements officiels'
    },
    {
      icon: BookOpen,
      title: 'Planification pédagogique',
      description: 'Organise tes leçons par jour, semaine, mois ou année'
    },
    {
      icon: Users,
      title: 'Gestion de classe',
      description: 'Ajoute tes élèves, crée des groupes et gère les présences'
    },
    {
      icon: Brain,
      title: 'Assistant IA',
      description: 'Des idées de leçons, activités et évaluations sur demande'
    },
    {
      icon: FileText,
      title: 'Export complet',
      description: 'Imprime ou exporte ton agenda en PDF et Word'
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 via-white to-pink-50">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="font-bold text-xl text-primary">Mon Agenda Pédago</div>
          <Link
            href="/auth"
            className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
          >
            Connexion
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            Ton agenda. Tes horaires. Ta classe. Ton année.
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            La plateforme de planification pédagogique française conçue pour les enseignantes du Nouveau-Brunswick
          </p>
          <Link
            href="/auth"
            className="inline-flex items-center gap-2 px-8 py-4 bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors text-lg font-semibold"
          >
            Créer mon compte <ArrowRight size={20} />
          </Link>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-16 text-gray-900">
            Tout ce dont tu as besoin
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, i) => {
              const Icon = feature.icon
              return (
                <div key={i} className="p-8 rounded-xl border border-gray-200 hover:border-primary/50 hover:shadow-lg transition-all">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                    <Icon className="text-primary" size={24} />
                  </div>
                  <h3 className="font-bold text-lg mb-2">{feature.title}</h3>
                  <p className="text-gray-600">{feature.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto bg-gradient-to-r from-primary/10 to-secondary/10 rounded-2xl p-12 text-center">
          <h2 className="text-3xl font-bold mb-4">Prête à démarrer?</h2>
          <p className="text-gray-600 mb-8 text-lg">
            Crée gratuitement un compte et commence à organiser ton année
          </p>
          <Link
            href="/auth"
            className="inline-flex items-center gap-2 px-8 py-4 bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors font-semibold"
          >
            Créer mon compte <ArrowRight size={20} />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-6">
        <div className="max-w-6xl mx-auto text-center">
          <p className="mb-4">&copy; 2026 Mon Agenda Pédago. Tous droits réservés.</p>
          <p className="text-gray-400">Conçu avec ❤️ pour les enseignantes du Nouveau-Brunswick</p>
        </div>
      </footer>
    </div>
  )
}
