# Guide de déploiement Vercel - Mon Agenda Pédago

**Durée estimée**: 5-10 minutes

---

## 🎯 Vue d'ensemble

Mon Agenda Pédago est une application Next.js 14 prête pour Vercel. Le déploiement est simple et entièrement automatisé.

---

## 📋 Prérequis

1. **Compte GitHub** avec le code pushé
2. **Compte Vercel** (gratuit: https://vercel.com)
3. **Base de données PostgreSQL** (Vercel Postgres recommandé)

---

## 🚀 Étape 1: Préparer Vercel Postgres (5 min)

### Option A: Vercel Postgres (Recommandé)

1. Aller sur https://vercel.com/dashboard
2. Cliquer "Storage" → "Create Database" → "PostgreSQL"
3. Choisir un nom pour la DB (ex: "mon-agenda-pedago")
4. Sélectionner la région (recommandé: Montréal ou proche)
5. Cliquer "Create"
6. Copier la connection string (ressemblera à: `postgresql://...`)

### Option B: Base de données externe

Si vous utilisez une DB externe:
- Copier la connection string PostgreSQL
- Elle servira pour la variable `DATABASE_URL`

---

## 🚀 Étape 2: Créer le projet Vercel (2 min)

### Méthode A: Depuis GitHub (Recommandé)

1. Aller sur https://vercel.com/new
2. Cliquer "Import Git Repository"
3. Chercher le repo "mon-agenda-pedago"
4. Cliquer "Import"
5. Vercel détecte automatiquement Next.js
6. Continuer à l'étape 3

### Méthode B: Depuis le CLI Vercel

```bash
npm i -g vercel
cd mon-agenda-pedago
vercel
```

Suivre les prompts interactifs.

---

## 🔐 Étape 3: Configurer les variables d'environnement (3 min)

### Pour Vercel depuis le dashboard:

1. Dans le projet Vercel, aller à "Settings" → "Environment Variables"

2. **Ajouter ces variables**:

#### Variable 1: DATABASE_URL
- **Nom**: `DATABASE_URL`
- **Valeur**: Coller la connection string PostgreSQL (de Vercel Postgres ou externe)
- **Exemple**: `postgresql://user:password@host:5432/dbname`
- Cliquer "Save"

#### Variable 2: JWT_SECRET
- **Nom**: `JWT_SECRET`
- **Valeur**: Générer une clé forte:
  ```bash
  openssl rand -base64 32
  ```
  Copier la valeur affichée (ex: `abc123def456...`)
- Cliquer "Save"

#### Variable 3: NEXTAUTH_SECRET
- **Nom**: `NEXTAUTH_SECRET`
- **Valeur**: Générer une autre clé forte:
  ```bash
  openssl rand -base64 32
  ```
- Cliquer "Save"

#### Variable 4: NEXTAUTH_URL
- **Nom**: `NEXTAUTH_URL`
- **Valeur**: `https://votre-domaine.vercel.app` (temporaire) ou votre domaine custom
- Cliquer "Save"

#### Variable 5: NEXT_PUBLIC_APP_URL
- **Nom**: `NEXT_PUBLIC_APP_URL`
- **Valeur**: `https://votre-domaine.vercel.app` (même que NEXTAUTH_URL)
- Cliquer "Save"

### Pour CLI Vercel:

Lors du déploiement, Vercel demandera les variables. Entrer les mêmes valeurs.

---

## 📊 Étape 4: Initialiser la base de données (2 min)

### Avant le premier déploiement:

1. Depuis votre machine locale:
```bash
# Configurer DATABASE_URL temporairement
export DATABASE_URL="postgresql://..."

# Générer le client Prisma
npm run db:generate

# Créer les tables
npm run db:push
```

Ou après le déploiement:

1. Dans le dashboard Vercel, aller à "Deployments"
2. Cliquer sur le déploiement actif
3. Aller à "Functions" → Terminal
4. Exécuter:
```bash
npx prisma db push
```

---

## 🎬 Étape 5: Lancer le déploiement (Automatique)

### Via GitHub:

Une fois les variables configurées, Vercel déploie automatiquement quand vous pushez du code:

```bash
git add .
git commit -m "Ready for production"
git push origin main
```

Vercel build et déploie automatiquement. Attendre 2-3 minutes.

### Résultat:

Une URL Vercel vous est donnée:
- **Par défaut**: `mon-agenda-pedago-7k8j9.vercel.app`
- **Custom domain**: Configurer dans "Settings" → "Domains"

---

## ✅ Vérifier le déploiement

1. Aller sur votre URL Vercel
2. Voir la page d'accueil
3. Créer un compte (email test)
4. Naviguer dans l'app
5. Créer année scolaire et horaire
6. Vérifier les données persistent

---

## 🎨 Étape 6: Configurer un domaine custom (Optionnel)

### Ajouter votre propre domaine:

1. Dans Vercel, "Settings" → "Domains"
2. Ajouter votre domaine (ex: `monagenda.ca`)
3. Vercel affiche les records DNS à ajouter
4. Aller chez votre registraire (GoDaddy, Namecheap, etc.)
5. Ajouter les records DNS
6. Attendre 24h la propagation DNS

### Mettre à jour les variables:

Une fois le domaine actif:

1. Aller à "Settings" → "Environment Variables"
2. Modifier `NEXTAUTH_URL` → `https://monagenda.ca`
3. Modifier `NEXT_PUBLIC_APP_URL` → `https://monagenda.ca`
4. Déclencher un redéploiement (ou attendre le prochain push)

---

## 🔒 Sécurité post-déploiement

### Recommandé:

1. **HTTPS** ✅ (Vercel automatique)
2. **Rate limiting** - À implémenter avec Vercel middleware
3. **Email verification** - À implémenter pour sécurité supplémentaire
4. **CORS** - À configurer si API externe
5. **Monitoring** - Ajouter Sentry:
   ```bash
   npm install @sentry/nextjs
   ```
   Configuration dans `next.config.js`

---

## 📊 Monitoring après déploiement

### Vercel fournit:

- **Logs** (Console & Runtime): Settings → Logs
- **Analytics**: Dashboard → Analytics
- **Health checks**: Dashboard → Status
- **Usage**: Settings → Usage

### Recommandé à ajouter:

1. **Sentry** (Error tracking)
   - https://sentry.io
   - SDK gratuit

2. **Google Analytics** (Traffic)
   - https://analytics.google.com

3. **Uptime monitoring**
   - https://www.uptime.com (gratuit)

---

## 🆘 Dépannage

### Le build échoue

```
Error: Cannot find module 'prisma'
```

**Solution**:
```bash
npm install
npm run db:generate
```

### Les variables ne sont pas lues

- Vérifier les noms exactement (case-sensitive)
- Redéployer après changer les variables
- Cliquer "Redeploy" dans Vercel dashboard

### La base de données ne se crée pas

```bash
# Depuis terminal Vercel Functions:
npx prisma db push
# ou
npx prisma migrate deploy
```

### Erreur NEXTAUTH

```
Error: NEXTAUTH_SECRET not defined
```

Vérifier que `NEXTAUTH_SECRET` est dans Environment Variables (version production, pas preview).

### L'app charge mais est lente

- Vérifier les logs Vercel (tâches longues)
- Ajouter caching dans les APIs
- Optimiser les requêtes Prisma

---

## 📈 Scaling (Quand devenir populaire)

### Gratuitement jusqu'à:

- 100GB bandwidth/mois
- 50 "Serverless Function" invocations
- DBVercel: 10k rows gratuitement

### Quand passer à payant:

1. **Vercel Pro** ($20/mois):
   - Meilleures performances
   - Plus de déploiements

2. **PostgreSQL upgraded**:
   - Plus de rows DB
   - Plus de connexions

---

## 🎓 Récapitulatif du déploiement

### Avant de cliquer Deploy:

✅ Code pushé sur GitHub
✅ Vercel connecté à GitHub
✅ Database PostgreSQL créée
✅ Variables d'environnement configurées
✅ Prisma migrations planifiées

### Déploiement:

✅ Vercel build Next.js
✅ Run migrations DB
✅ Deploy to CDN
✅ Enable HTTPS

### Après Deploy:

✅ Tester inscription/connexion
✅ Vérifier les données persistent
✅ Configurer domaine custom
✅ Ajouter monitoring

---

## 📞 Support Vercel

- **Documentation**: https://vercel.com/docs
- **Status**: https://www.vercel-status.com
- **Support**: https://vercel.com/support

---

**Bienvenue en production!** 🎉

Votre application est maintenant disponible 24/7 pour tous vos utilisateurs.

Consultez régulièrement les logs Vercel pour toute anomalie.

Bonne chance! 🚀
