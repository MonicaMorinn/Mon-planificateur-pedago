# Mon Agenda Pédago

Application de planification pédagogique pour enseignantes du Nouveau-Brunswick (francophone).

Stack: Next.js 14 (App Router) + TypeScript + Tailwind CSS + SQLite (better-sqlite3) + JWT.

---

## 🚀 Lancer l'application en local

### Prérequis
- Node.js 18+
- npm

### Installation

```bash
cd mon-agenda-pedago
npm install
```

### Configuration

Un fichier `.env.local` est déjà présent avec des valeurs de développement. Pour un usage réel, remplacez au minimum `JWT_SECRET` par une chaîne aléatoire longue :

```env
JWT_SECRET="une-chaine-aleatoire-tres-longue-et-secrete"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### Initialiser la base de données

La base SQLite (`prisma/dev.db`) existe déjà et est vide, prête à l'emploi. Pour la recréer de zéro à tout moment :

```bash
npm run db:init
```

### Démarrer en développement

```bash
npm run dev
```

Ouvrez http://localhost:3000 — créez un compte, tout est fonctionnel dès le départ.

### Build de production (test local)

```bash
npm run build
npm start
```

---

## 🗄️ À propos de la base de données

Ce projet **n'utilise pas Prisma** (les Prisma Engines n'étaient pas téléchargeables dans l'environnement de développement — erreurs 403). À la place, `lib/db.ts` implémente une couche compatible avec l'API Prisma (`findMany`, `findUnique`, `create`, `update`, `delete`, relations via `include`, etc.) directement au-dessus de `better-sqlite3`. Toutes les routes API (`app/api/**`) utilisent cette couche exactement comme elles utiliseraient Prisma.

Le fichier de base de données se trouve à `prisma/dev.db`.

---

## ✅ Fonctionnalités opérationnelles

- Authentification (inscription, connexion, session JWT persistante)
- Année scolaire (création, activation)
- Horaire hebdomadaire + blocs d'horaire personnalisables
- Calendrier mensuel (événements)
- Planificateur quotidien (entrées liées aux blocs d'horaire)
- Tâches (priorités, statut)
- Ma classe (élèves, groupes)
- Mes évaluations (CRUD complet)
- Ressources (bibliothèque avec favoris et tags)
- Partage de ressources entre enseignantes (par email)
- Paramètres / profil enseignante
- Export **PDF** réel (via `pdf-lib`)
- Export **Word (.docx)** réel (via `docx`)
- Interface responsive (mobile et ordinateur)

---

## ☁️ Déploiement

### ⚠️ Point important avant de choisir une plateforme

La base de données est un **fichier SQLite local**. Sur une plateforme *serverless* comme **Vercel**, le système de fichiers est en lecture seule (sauf `/tmp`, qui est réinitialisé à chaque redémarrage à froid). Résultat : sur Vercel, l'application démarre et fonctionne, mais **les données ne persistent pas de façon fiable** — parfait pour une démo, pas pour un usage réel en salle de classe.

Deux options selon votre besoin :

### Option A — Démo rapide sur Vercel (données non persistantes)
1. Poussez le projet sur GitHub.
2. Importez-le dans Vercel (Next.js est détecté automatiquement, aucune configuration `vercel.json` n'est nécessaire).
3. Ajoutez la variable d'environnement `JWT_SECRET` dans les paramètres du projet Vercel.
4. Déployez. L'app fonctionne, mais les comptes créés peuvent disparaître après une période d'inactivité (cold start).

### Option B — Usage réel avec données persistantes (recommandé)
Déployez sur une plateforme avec **disque persistant**, par exemple **Railway**, **Render** ou un VPS :
1. Poussez le projet sur GitHub.
2. Créez un service Node.js sur la plateforme choisie, connecté au dépôt.
3. Commande de build : `npm install && npm run build`
4. Commande de démarrage : `npm start`
5. Variables d'environnement à définir : `JWT_SECRET`, `NEXT_PUBLIC_APP_URL`
6. Assurez-vous que le dossier `prisma/` (contenant `dev.db`) est sur un volume persistant entre les déploiements.

Pour une vraie mise à l'échelle multi-utilisateurs à long terme, la migration de `lib/db.ts` vers une base hébergée (Turso/libSQL, Postgres, etc.) serait la suite logique — l'API interne (`prisma.xxx.findMany(...)`, etc.) resterait la même pour les routes qui l'utilisent déjà.

---

## 📁 Structure du projet

```
app/
  (public)/          Landing page
  (auth)/auth/        Inscription / connexion
  (app)/               Pages protégées (dashboard, calendrier, horaire, etc.)
  api/                 Routes API (auth, school-years, schedules, tasks, etc.)
components/
  Layout.tsx           Sidebar + navigation responsive
lib/
  db.ts                Couche base de données (compatible API Prisma) sur better-sqlite3
  auth.ts               JWT, hash de mot de passe
  store.ts               État global (Zustand)
  utils.ts                Fonctions utilitaires (dates, etc.)
prisma/
  dev.db                Base de données SQLite
  schema.prisma          Conservé comme documentation du schéma de données
scripts/
  init-db.ts              Script de (re)création du schéma SQLite
```
