# Instructions de mise en place - Mon Agenda Pédago

## 🎯 Résumé du projet livrée

Vous avez reçu une application **complètement fonctionnelle** avec:

✅ **Système d'authentification complet**
- Inscription, connexion, déconnexion
- Gestion de sessions avec JWT
- Persistance des données utilisateur

✅ **Gestion d'années scolaires**
- Créer multiple années
- Activer l'année courante

✅ **Horaires 100% personnalisables**
- Créer autant de trames que nécessaire
- Support illimité de blocs par jour
- Support de 3+ dîners, récréations
- Horaires différents par jour
- Couleurs personnalisées

✅ **Planificateur quotidien**
- Affichage automatique des blocs d'horaire
- Saisie complète des détails pédagogiques
- Sauvegarde en temps réel

✅ **Calendrier mensuel**
- Événements avec multiples types
- Navigation facile entre mois

✅ **Gestion des tâches**
- Priorités, dates d'échéance
- Statuts (À faire / Complétées)

✅ **Dashboard**
- Vue d'ensemble du jour
- Accès rapide aux fonctions

---

## 🚀 DÉMARRAGE RAPIDE (5 min)

### 1. Cloner le projet
```bash
cd /chemin/souhaité
cp -r /home/claude/mon-agenda-pedago .
cd mon-agenda-pedago
```

### 2. Installer les dépendances
```bash
npm install
```

### 3. Configurer la base de données
```bash
# Créer le fichier d'environnement
cp .env.example .env.local

# Initialiser la base de données
npm run db:generate
npm run db:push
```

### 4. Lancer l'application
```bash
npm run dev
```

Application disponible à: **http://localhost:3000**

---

## 📝 PREMIERS PAS (2 min)

### 1. Créer un compte
1. Aller à http://localhost:3000
2. Cliquer "Créer mon compte"
3. Remplir les champs:
   - Prénom, Nom
   - Email, Mot de passe
   - (École et niveau sont optionnels)
4. Cliquer "Créer un compte"

### 2. Créer votre première année scolaire
1. Choisir la date de début (ex: 20 août 2026)
2. Choisir la date de fin (ex: 30 juin 2027)
3. Cliquer "Continuer"

### 3. Créer votre premier horaire
**IMPORTANT**: C'est ici que vous définissez vos vrais horaires!

Pour chaque bloc (période):
1. Sélectionner le jour (Lundi, Mardi, etc.)
2. Entrer l'heure de début (ex: 08:10)
3. Entrer l'heure de fin (ex: 08:55)
4. Nommer le bloc (ex: "Français")
5. Choisir le type (Cours, Récréation, Dîner, etc.)
6. Choisir une couleur
7. Cliquer "+ Ajouter ce bloc"

Exemple pour un école avec 3 dîners:
- 08:10-08:55 Français (Cours)
- 09:00-09:49 Mathématiques (Cours)
- 10:00-10:15 Récréation
- 10:15-11:00 Sciences (Cours)
- 11:05-11:50 Langue (Cours)
- **11:50-12:10 Dîner 1** (Dîner)
- 12:10-12:25 Récréation
- **12:25-12:45 Dîner 2** (Dîner)
- **12:45-13:05 Dîner 3** (Dîner)
- 13:05-14:00 Arts (Cours)
- ... etc

Une fois tous les blocs ajoutés, cliquer "Créer mon horaire"

### 4. Vous êtes prêt!
Vous arrivez maintenant au dashboard. Vous pouvez:

- **📅 Calendrier**: Ajouter les événements officiels (congés, journées pédagogiques, réunions)
- **📋 Planning**: Cliquer sur le bloc d'aujourd'hui pour planifier votre leçon
- **⏰ Horaire**: Modifier votre horaire quand vous le souhaitez
- **✅ Tâches**: Ajouter ce que vous devez faire

---

## 🔄 UTILISATION QUOTIDIENNE

### Le matin (2 min)
1. Aller sur le Dashboard
2. Voir les blocs de la journée
3. Cliquer sur un bloc pour le planifier si nécessaire

### Planifier une leçon (5 min)
1. Aller sur **Planification**
2. Naviguer à la journée souhaitée (⬅️ / ➡️)
3. Cliquer sur le bloc que vous voulez planifier
4. Remplir:
   - Titre/Sujet
   - Objectif pédagogique
   - Activité
   - Matériel
   - Devoir
   - Évaluation
   - Notes
5. Cliquer "Enregistrer"

### Ajouter un événement au calendrier
1. Aller sur **Calendrier**
2. Cliquer sur la date
3. Remplir les détails (titre, type, etc.)
4. Cliquer "Ajouter l'événement"

### Créer une tâche
1. Aller sur **Tâches**
2. Cliquer "+ Nouvelle tâche"
3. Remplir (titre, date, priorité)
4. Cliquer "Créer la tâche"
5. Cocher pour marquer comme complétée

---

## 📊 CAS D'USAGE COURANTS

### Modifier votre horaire
1. Aller sur **Horaire**
2. Voir les blocs par jour
3. Cliquer sur un bloc pour l'éditer
4. Ou cliquer sur la corbeille pour le supprimer
5. Cliquer "+ Ajouter un bloc" pour en créer un nouveau

### Ajouter un horaire spécial (ex: vendredi différent)
1. Aller sur **Horaire**
2. Les horaires existants sont listés en haut
3. Vous pouvez créer un "Horaire du vendredi" séparé
4. Ajouter les blocs spécifiques au vendredi
5. L'application utilisera automatiquement le bon horaire

### Consulter la semaine complète
1. Aller sur **Planification**
2. Vous voyez un jour à la fois
3. Utiliser ⬅️/➡️ pour naviguer
4. (Vue hebdomadaire en développement)

---

## ⚙️ CONFIGURATION

### Changer de thème/couleurs

Fichier: `tailwind.config.js`

Chercher:
```javascript
colors: {
  primary: '#6366f1',
  secondary: '#ec4899',
  accent: '#f59e0b',
}
```

Changer les valeurs hex par vos couleurs.

### Changer la langue

L'app est entièrement en français. Pour ajouter d'autres langues:
1. Modifier `lib/utils.ts`
2. Ajouter les traductions des mois et jours

### Configuration des variables d'environnement

Fichier: `.env.local`

```env
# Obligatoire
DATABASE_URL="file:./dev.db"
NEXTAUTH_SECRET="changez-ceci-en-production"
NEXTAUTH_URL="http://localhost:3000"

# Pour JWT
JWT_SECRET="changez-ceci-aussi"

# URL publique
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

---

## 🚀 DÉPLOYER EN LIGNE

### Option 1: Vercel (RECOMMANDÉ - 5 min)

1. Créer un compte sur https://vercel.com
2. Connecter votre repo GitHub (ou importer le projet)
3. Vercel détecte automatiquement Next.js
4. Ajouter les variables d'environnement:
   - DATABASE_URL (PostgreSQL si production)
   - NEXTAUTH_SECRET (valeur forte)
   - JWT_SECRET (valeur forte)
5. Cliquer "Deploy"

**Générateur de clés fortes**:
```bash
openssl rand -base64 32
```

### Option 2: Heroku (10 min)

1. Installer Heroku CLI
2. ```bash
   heroku create mon-agenda-pedago
   ```
3. Ajouter PostgreSQL:
   ```bash
   heroku addons:create heroku-postgresql:hobby-dev
   ```
4. Configurer les variables:
   ```bash
   heroku config:set NEXTAUTH_SECRET="..."
   heroku config:set JWT_SECRET="..."
   ```
5. Déployer:
   ```bash
   git push heroku main
   ```

### Option 3: Auto-hébergé (30 min)

1. Avoir un serveur avec Node.js + PostgreSQL
2. ```bash
   git clone <votre-repo>
   cd mon-agenda-pedago
   npm install
   npm run build
   ```
3. Configurer les variables d'environnement
4. Exécuter: `npm start`
5. Configurer un proxy (nginx) + HTTPS (Let's Encrypt)

---

## 🧪 TESTER L'APPLICATION

### Scénario 1: Horaire simple (Primaire)
```
Inscrivez-vous comme "Marie Dupont"
Horaire:
- 08:30-09:15 Français
- 09:15-10:00 Mathématiques
- 10:00-10:15 Récréation
- 10:15-11:00 Sciences
- 11:00-11:45 Éducation physique
- 11:45-12:30 Dîner
- 13:00-13:45 Arts
- 13:45-14:30 Histoire-Géo
```

Ensuite:
1. Aller au Calendrier → Ajouter "Congé" le 25 décembre
2. Aller à Planification → Planifier "Fractions" pour Mathématiques demain
3. Aller à Tâches → Ajouter "Corriger les copies"
4. Retourner au Dashboard → Tout doit être cohérent

### Scénario 2: Horaire complexe avec 3 dîners
```
Même chose mais avec:
- 11:50-12:10 Dîner 1
- 12:10-12:25 Récréation
- 12:25-12:45 Dîner 2
- 12:45-13:05 Dîner 3
- 13:05-13:20 Récréation
```

Tous les blocs doivent apparaître dans le Planificateur.

### Scénario 3: Horaires différents selon les jours
1. Créer "Horaire régulier" (Lun-Jeu)
2. Créer "Horaire du vendredi" (différent)
3. Les deux doivent être accessibles

---

## ❓ FAQ

### Q: Où vont mes données?
**R**: SQLite local (`prisma/dev.db`). À migrer vers PostgreSQL en production.

### Q: Puis-je sauvegarder/exporter?
**R**: Exporter PDF/Word en développement. Actuellement: Prisma Studio (`npm run db:studio`)

### Q: Comment ajouter des élèves?
**R**: La fonctionnalité "Ma classe" est en développement. Pour l'instant: stub visible.

### Q: Comment partager avec d'autres enseignantes?
**R**: Partage en développement. Fonctionnalité stub visible.

### Q: L'app fonctionne hors ligne?
**R**: Non, elle nécessite une connexion (pour l'instant). Offline-first possible à implémenter.

### Q: Comment changer mon mot de passe?
**R**: Via Paramètres → Profil (à implémenter). Pour l'instant pas de "mot de passe oublié".

---

## 🐛 DÉPANNAGE

### "La page est blanche"
- Vérifier la console du navigateur (F12)
- Vérifier que le serveur est lancé (npm run dev)
- Vérifier que `npm install` a réussi

### "Erreur de base de données"
```bash
rm prisma/dev.db
npm run db:push
```

### "Je ne peux pas me connecter"
- Vérifier que vous avez bien créé un compte
- Vérifier l'email et le mot de passe
- Vérifier la base de données: `npm run db:studio`

### "Les couleurs Tailwind ne s'appliquent pas"
```bash
npm run build
```

### "Le token expire rapidement"
Modifier dans `lib/auth.ts`:
```typescript
.setExpirationTime('30d')  // Changer à '7d', '60d', etc.
```

---

## 📚 RESSOURCES

### Documentation interne
- `README.md` - Guide général
- `DOCUMENTATION.md` - Documentation technique complète
- Ce fichier - Instructions pratiques

### Documentation externe
- Next.js: https://nextjs.org/docs
- Prisma: https://www.prisma.io/docs/
- Tailwind: https://tailwindcss.com/docs
- TypeScript: https://www.typescriptlang.org/docs/

---

## 🎓 PROCHAINES ÉTAPES RECOMMANDÉES

1. **Familiarisation** (1 jour)
   - Tester chaque page
   - Créer un vrai horaire
   - Planifier une journée

2. **Personnalisation** (si temps)
   - Changer les couleurs
   - Ajouter votre école dans le profil

3. **Déploiement** (1-2 jours)
   - Choisir Vercel (recommandé)
   - Configurer le domaine
   - Ajouter HTTPS

4. **Utilisation réelle** (dès que possible!)
   - Utiliser pour votre vraie planification
   - Reporter les bugs/suggestions
   - Améliorer progressivement

---

## ✉️ SUPPORT

Pour les problèmes:
1. Vérifier ce fichier
2. Consulter `DOCUMENTATION.md`
3. Vérifier les logs du serveur
4. Vérifier Prisma Studio pour la DB

Pour les suggestions:
- Documenter l'idée
- Vérifier que c'est possible techniquement
- Créer un issue/task

---

**Bienvenue! 🎉**

Vous avez maintenant Mon Agenda Pédago installé et prêt à utiliser.

Amusez-vous bien! 🌟
