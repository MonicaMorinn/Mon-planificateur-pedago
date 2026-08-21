# Mon Agenda Pédago — Guide de déploiement

Ce guide explique comment installer, lancer et déployer le projet à partir de cette archive.

---

## 1. Installer le projet

Prérequis : Node.js 18 ou plus récent, npm.

```bash
cd mon-agenda-pedago
npm install
```

## 2. Configurer l'environnement

Crée un fichier `.env.local` à la racine du projet (basé sur `.env.example`) :

```env
JWT_SECRET="remplace-par-une-longue-chaine-aleatoire-et-secrete"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

**`JWT_SECRET` est la seule variable obligatoire.** C'est la clé qui sécurise les sessions de connexion — mets une chaîne longue et aléatoire (30+ caractères), différente de celle utilisée en développement. Tu peux en générer une avec :

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## 3. Lancer le projet en développement

```bash
npm run dev
```

Ouvre http://localhost:3000

## 4. Faire le build de production

```bash
npm run build
npm start
```

---

## 5. Base de données

Le projet utilise **SQLite** via `better-sqlite3` — un simple fichier `prisma/dev.db`, déjà présent dans l'archive (vide, sans données personnelles, prêt à l'emploi).

### Particularité importante : pas de Prisma Client généré

Ce projet **n'utilise pas Prisma comme moteur** (les Prisma Engines ne sont pas nécessaires). `lib/db.ts` réimplémente une API compatible Prisma directement au-dessus de `better-sqlite3`. Le fichier `prisma/schema.prisma` est conservé uniquement comme **documentation** du schéma — il n'a pas besoin d'être généré ni migré avec `prisma generate` ou `prisma migrate`.

### (Re)créer la base de données à partir de zéro

Si tu veux repartir d'une base complètement vide :

```bash
npm run db:init
```

Ce script (`scripts/init-db.ts`) recrée toutes les tables SQLite nécessaires. Aucune "migration Prisma" n'est requise — ce script fait tout.

### Particularité critique : SQLite et plateformes serverless

Un fichier SQLite doit vivre sur un **disque persistant**. Sur une plateforme *serverless* (Vercel, AWS Lambda, etc.), le système de fichiers est en lecture seule (sauf `/tmp`, réinitialisé à chaque redémarrage à froid) : **les données ne persisteraient pas**.

➡️ **Pour que tes données persistent réellement, choisis une plateforme avec disque persistant** (voir section suivante). Vercel est donc déconseillé pour un usage réel, sauf si tu migres vers une base hébergée (hors périmètre de cette archive).

---

## 6. Déployer sur Railway (recommandé — disque persistant, SQLite fonctionne tel quel)

1. Pousse le contenu de cette archive sur un dépôt GitHub :
   ```bash
   cd mon-agenda-pedago
   git init
   git add .
   git commit -m "Mon Agenda Pédago"
   git remote add origin https://github.com/TON_USERNAME/mon-agenda-pedago.git
   git push -u origin main
   ```
2. Va sur **https://railway.app**, connecte-toi (GitHub par exemple).
3. **New Project → Deploy from GitHub repo** → sélectionne le dépôt.
4. Railway détecte Next.js automatiquement :
   - Build : `npm install && npm run build`
   - Start : `npm start`
5. Dans les paramètres du service, onglet **Variables**, ajoute :
   - `JWT_SECRET` = ta chaîne secrète générée à l'étape 2
6. **Étape essentielle pour la persistance des données** : onglet **Volumes** → crée un volume et monte-le sur `/app/prisma`. Sans ce volume, `dev.db` serait recréé vide à chaque redéploiement.
7. Déploie. Railway te donne une URL publique (`https://xxxx.up.railway.app`).

### Alternative : Render.com
Même principe : service Web Node.js, build `npm install && npm run build`, start `npm start`, variable `JWT_SECRET`, et un **Persistent Disk** monté sur `/opt/render/project/src/prisma`.

---

## 7. Sécurité — rien à faire de spécial

Aucun mot de passe, token ou secret n'est inclus dans cette archive. Le seul secret à définir est **`JWT_SECRET`**, que toi seul choisis au moment du déploiement.

---

## Résumé rapide

| Élément | Valeur |
|---|---|
| Variable obligatoire | `JWT_SECRET` |
| Base de données | SQLite (`prisma/dev.db`), via `better-sqlite3` — pas de Prisma Client |
| Recréer la DB | `npm run db:init` |
| Build | `npm run build` |
| Démarrage | `npm start` |
| Plateforme recommandée | Railway ou Render (disque persistant obligatoire) |
| Plateforme à éviter pour usage réel | Vercel (pas de disque persistant) |
