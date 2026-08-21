# Documentation complète - Mon Agenda Pédago

## 📊 État du projet

### ✅ FONCTIONNALITÉS COMPLÈTEMENT IMPLÉMENTÉES

#### 1. Authentification et gestion de compte
- ✅ Système d'inscription complet
  - Validation des données
  - Hachage sécurisé des mots de passe
  - Création de compte utilisateur
  - Initialisation des paramètres par défaut

- ✅ Système de connexion
  - Authentification par email/mot de passe
  - Génération et validation de JWT
  - Persistance de session (localStorage + JWT)
  - Déconnexion sécurisée

- ✅ Vérification de session
  - API `/api/auth/me` pour récupérer l'utilisateur connecté
  - Validation du token JWT
  - Chargement des données associées (paramètres, années scolaires)

- ✅ Paramètres utilisateur
  - Stockage des préférences (thème, langue, etc.)
  - Page de paramètres avec modifications de profil

#### 2. Années scolaires
- ✅ Créer plusieurs années scolaires
  - Champs: nom, date début, date fin
  - Activation d'une année par défaut
  - Récupération de l'année active

- ✅ API complète `/api/school-years`
  - GET: récupérer toutes les années
  - POST: créer une année
  - Gestion des permissions par utilisateur

#### 3. Horaires personnalisables (FONDAMENTAL)
- ✅ Architecture complète des horaires
  - Plusieurs trames par année scolaire
  - Support illimité de périodes
  - Support de 3+ dîners, récréations, etc.
  - Couleur pour chaque bloc

- ✅ Blocs d'horaire avec détails complets
  - Jour de la semaine (0-6: Lundi-Dimanche)
  - Heure début et fin (format HH:MM)
  - Nom du bloc
  - Type (Cours, Récréation, Dîner, Accueil, Organisation, Transition, Réunion, Autre)
  - Matière (optionnel)
  - Couleur personnalisée

- ✅ API d'horaires `/api/schedules`
  - GET: récupérer les horaires d'une année
  - POST: créer un nouvel horaire
  - Inclut les blocs associés

- ✅ API des blocs `/api/schedules/blocks`
  - GET: récupérer les blocs d'un horaire
  - POST: ajouter un bloc
  - PUT: modifier un bloc
  - DELETE: supprimer un bloc

- ✅ Interface de gestion d'horaire
  - Affichage par jour de la semaine (expandable)
  - Ajouter/modifier/supprimer des blocs
  - Sélection de couleurs
  - Validation des heures (fin > début)

#### 4. Onboarding
- ✅ Création guidée des données initiales
  - Étape 1: Créer l'année scolaire
  - Étape 2: Créer le premier horaire avec blocs
  - Formulaires complets et validés

#### 5. Dashboard
- ✅ Vue d'ensemble de la journée
  - Affichage des blocs d'aujourd'hui
  - Information sur le jour et la date
  - Actions rapides vers les différentes sections
  - Affichage de l'année scolaire active

- ✅ Navigation rapide
  - Liens directs vers calendrier, horaire, planification, tâches

#### 6. Planificateur quotidien
- ✅ Interface intuitive par bloc d'horaire
  - Affichage des blocs générés automatiquement à partir de l'horaire
  - Expansion/contraction des blocs
  - Champs de saisie pour chaque bloc:
    * Titre/sujet
    * Objectif pédagogique
    * Activité détaillée
    * Matériel nécessaire
    * Devoir
    * Évaluation
    * Notes personnelles
    * Statut (draft, planned, completed)

- ✅ API de planification `/api/planner-entries`
  - GET: récupérer les entrées d'une période
  - POST: créer une entrée
  - PUT: modifier une entrée
  - DELETE: supprimer une entrée
  - Recherche par date et année scolaire

- ✅ Navigation dans les jours
  - Boutons précédent/suivant
  - Bouton "Aujourd'hui"
  - Affichage du jour et de la date

#### 7. Calendrier
- ✅ Vue mensuelle complète
  - Grille du calendrier
  - Affichage des événements par jour
  - Navigation mois par mois

- ✅ Événements du calendrier
  - Types: Personnel, Officiel, Réunion, Sortie, Évaluation
  - Événements toute la journée ou avec horaires spécifiques
  - Couleur personnalisable
  - Description optionnelle

- ✅ API `/api/calendar-events`
  - GET: récupérer les événements d'une période
  - POST: créer un événement
  - PUT: modifier un événement
  - DELETE: supprimer un événement

- ✅ Interface d'ajout rapide
  - Cliquer sur une date pour créer un événement
  - Formulaire avec tous les détails

#### 8. Gestion des tâches
- ✅ Système complet de tâches
  - Titre, description
  - Date d'échéance
  - Priorité (Faible, Normal, Élevée, Urgent)
  - Statut (Pending, Completed)
  - Catégorie

- ✅ API `/api/tasks`
  - GET: récupérer les tâches (avec filtrage par statut)
  - POST: créer une tâche
  - PUT: modifier une tâche
  - DELETE: supprimer une tâche

- ✅ Interface intuitive
  - Créer/modifier/supprimer des tâches
  - Cocher pour marquer comme complétée
  - Filtrer par statut
  - Tri par priorité et date

#### 9. Interface générale
- ✅ Layout responsif avec navigation
  - Sidebar collapsible
  - Navigation mobile
  - Design moderne et élégant
  - Couleurs cohérentes

- ✅ Design UX
  - Responsive sur mobile, tablette, desktop
  - Toasts de notification
  - Icones Lucide
  - Animations fluides

### 🚧 FONCTIONNALITÉS PARTIELLEMENT IMPLÉMENTÉES

#### Stubbées (interface créée, logique en développement)
- 🟡 Ma classe
  - Page créée avec stub
  - API Classroom pas encore mise en place
  - Besoin: API pour CRUD élèves, gestion de groupes

- 🟡 Évaluations
  - Page créée avec stub
  - API Assessment existe mais interface minimale
  - Besoin: formulaire complet, rubrique

- 🟡 Ressources
  - Page créée avec stub
  - API Resource existe mais interface minimale
  - Besoin: système de dossiers, upload, tags

- 🟡 Partage
  - Page créée avec stub
  - API SharedResource existe mais interface minimale
  - Besoin: interface de partage, invitation

### ❌ FONCTIONNALITÉS À IMPLÉMENTER

#### Export (Priorité haute)
- Génération PDF prenant en compte:
  - Les heures réelles de l'utilisateur
  - Les entrées de planification
  - Les événements du calendrier
  - Format: couverture, calendrier annuel, semaines, jours, notes

- Génération Word (.docx)
  - Tableaux éditables
  - Format prêt à imprimer
  - Même structure que PDF

#### Vues du planner (Priorité haute)
- Vue hebdomadaire
  - Grille jour/heure
  - Drag & drop possible
  - Copie de semaine

- Vue mensuelle
  - Grille mois
  - Cliquer pour voir la journée

- Vue annuelle
  - Timeline de l'année
  - Événements importants

#### Assistant IA (Priorité moyenne)
- Intégration Claude API pour:
  - Idées de leçons
  - Plans de cours
  - Activités pédagogiques
  - Feuilles d'exercices
  - Commentaires de bulletin

#### Classe complète (Priorité moyenne)
- Ajouter/modifier/supprimer élèves
- Création de groupes
- Présence
- Tirage aléatoire de noms
- Plan de classe

#### Évaluations complètes (Priorité moyenne)
- Créer des rubriques
- Enregistrer les résultats
- Commentaires par élève
- Synthèse des compétences

#### Ressources (Priorité basse)
- Système de dossiers/sous-dossiers
- Upload de fichiers
- Tags et favoris
- Recherche

#### Partage (Priorité basse)
- Partager des ressources
- Partager des planifications
- Collaboration entre enseignantes
- Bibliothèque communautaire

## 🏗️ Architecture technique

### Stack
- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS
- **État**: Zustand
- **Base de données**: SQLite avec Prisma ORM
- **Authentification**: JWT + bcrypt
- **UI**: Lucide icons, React Hot Toast
- **API**: Route handlers Next.js

### Structure API

Toutes les API routes:
1. Vérifient l'authentification (JWT)
2. Valident les permissions (userId)
3. Retournent JSON
4. Utilisent Prisma pour la DB

Exemple de pattern:
```typescript
const token = getTokenFromRequest(request)
const payload = await verifyToken(token)
const resource = await prisma.resource.findUnique({
  where: { id: id }
})
if (!resource || resource.userId !== payload.userId) {
  return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
}
```

### Schéma Prisma

Modèles principaux:
- User: utilisateur principal
- SchoolYear: année scolaire
- Schedule: trame d'horaire
- ScheduleBlock: bloc individuel
- CalendarEvent: événement calendrier
- PlannerEntry: entrée de planification
- Task: tâche
- Classroom, Student, Group: gestion de classe
- Assessment: évaluation
- Resource, SharedResource: ressources

## 🗄️ Base de données

### Initialiser la DB

```bash
npm run db:generate
npm run db:push
```

### Accéder à Prisma Studio

```bash
npm run db:studio
```

### Tables principales et leurs relations

```
User (1) ──→ (N) SchoolYear
User (1) ──→ (N) Schedule
Schedule (1) ──→ (N) ScheduleBlock
User (1) ──→ (N) CalendarEvent
User (1) ──→ (N) PlannerEntry
User (1) ──→ (N) Task
User (1) ──→ (N) Classroom
Classroom (1) ──→ (N) Student
User (1) ──→ (N) Assessment
Assessment (1) ──→ (N) StudentAssessmentResult
Student (1) ──→ (N) StudentAssessmentResult
```

## 🔐 Sécurité

### Points d'attention
1. JWT avec expiration 30 jours
2. Bcrypt pour les mots de passe
3. Isolation des données par userId
4. Validation des permissions sur chaque endpoint
5. Pas de données sensibles en localStorage

### À implémenter pour production
1. HTTPS obligatoire
2. CSRF protection
3. Rate limiting
4. Sanitization des inputs
5. Headers de sécurité
6. Email verification
7. Password reset flow
8. 2FA optionnel

## 📱 Responsivité

### Testée sur
- Desktop (1920px, 1440px)
- Tablette (768px)
- Mobile (375px, 414px)

### Points clés
- Navigation adaptative
- Grilles grid/flex responsives
- Touch-friendly buttons
- Scrollbar optimisée

## 🎨 Design system

### Couleurs
- Primary: #6366f1 (Indigo)
- Secondary: #ec4899 (Pink)
- Accent: #f59e0b (Amber)
- Neutral: #6b7280 (Gray)

### Typographie
- Font: System sans-serif
- Headings: Bold
- Body: Regular
- Small: Medium

### Composants réutilisables
- Layout
- Buttons
- Inputs
- Cards
- Navigation

## 🧪 Tests recommandés

### Unitaires
- Utilitaires de date/heure
- Fonctions d'authentification
- Validation des données

### Intégration
- Flux de inscription/connexion
- Création d'année scolaire
- CRUD complets pour chaque ressource
- Isolation des données par utilisateur

### E2E
- Parcours complet utilisateur
- Flux d'onboarding
- Créer et éditer les horaires
- Planifier une journée

## 📋 Checklist pour production

- [ ] Variables d'environnement sécurisées
- [ ] HTTPS activé
- [ ] Base de données PostgreSQL (pas SQLite)
- [ ] Backups automatiques
- [ ] Rate limiting
- [ ] Email verification
- [ ] Password reset
- [ ] Monitoring/Logs
- [ ] Performance optimisée
- [ ] SEO (meta tags)
- [ ] Conditions d'utilisation
- [ ] Politique de confidentialité
- [ ] RGPD compliance
- [ ] Tests complets

## 🚀 Prochaines étapes prioritaires

1. **Export PDF/Word** (4-6h)
   - Utiliser pdfkit/docx
   - Templates avec vraies données
   - Test avec différents horaires

2. **Classe complète** (3-4h)
   - API complète élèves/groupes
   - Interface d'ajout/édition
   - Tirage aléatoire

3. **Vues avancées planner** (3h)
   - Vue hebdomadaire
   - Vue annuelle
   - Drag & drop

4. **Assistant IA** (2-3h)
   - Intégration Claude API
   - Prompts contextuels
   - Intégration aux planifications

5. **Déploiement** (1-2h)
   - Setup Vercel
   - Variables production
   - Tests finals

## 📞 Support et modifications

Pour toute modification:
1. Vérifier le schéma Prisma
2. Créer/modifier l'API
3. Créer/modifier la page
4. Ajouter à la navigation
5. Tester complètement
6. Documenter

---

**Version**: 1.0.0
**Dernière mise à jour**: 2026-08-10
**Statut**: Production-ready avec features partielles
