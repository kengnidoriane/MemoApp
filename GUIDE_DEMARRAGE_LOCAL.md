# Guide de Démarrage Local - MemoApp

Ce guide vous explique comment lancer et utiliser MemoApp en local sur votre machine.

## 🚀 Démarrage Rapide

### Prérequis

Avant de commencer, assurez-vous d'avoir installé :

- **Node.js 18+** et **npm 9+**
- **PostgreSQL 14+** 
- **Redis 6+** (optionnel pour le développement de base)

### Installation et Configuration

#### 1. Installation des dépendances

```bash
# Installer toutes les dépendances du monorepo
npm run install:all
```

#### 2. Configuration de l'environnement

```bash
# Copier les fichiers d'environnement
cp apps/backend/.env.example apps/backend/.env
cp apps/frontend/.env.example apps/frontend/.env
```

#### 3. Configuration de la base de données

**Option A : PostgreSQL local**
```bash
# Créer une base de données PostgreSQL
createdb memo_app

# Modifier apps/backend/.env avec vos paramètres :
DATABASE_URL="postgresql://votre_utilisateur:votre_mot_de_passe@localhost:5432/memo_app"
```

**Option B : PostgreSQL avec Docker**
```bash
# Lancer PostgreSQL avec Docker
docker run --name memo-postgres -e POSTGRES_DB=memo_app -e POSTGRES_USER=memo_user -e POSTGRES_PASSWORD=memo_pass -p 5432:5432 -d postgres:15

# Utiliser cette URL dans apps/backend/.env :
DATABASE_URL="postgresql://memo_user:memo_pass@localhost:5432/memo_app"
```

#### 4. Initialisation de la base de données

```bash
# Aller dans le dossier backend
cd apps/backend

# Générer le client Prisma
npx prisma generate

# Exécuter les migrations
npx prisma migrate dev

# Peupler la base avec des données de test
npx prisma db seed

# Retourner à la racine
cd ../..
```

#### 5. Configuration Redis (optionnel)

**Avec Docker :**
```bash
docker run --name memo-redis -p 6379:6379 -d redis:7-alpine
```

**Ou installer Redis localement selon votre OS**

### Lancement de l'application

#### Démarrage complet (recommandé)
```bash
# Lance frontend et backend simultanément
npm run dev
```

L'application sera accessible à :
- **Frontend** : http://localhost:3000
- **Backend API** : http://localhost:3001
- **Health Check** : http://localhost:3001/health

#### Démarrage séparé
```bash
# Frontend seulement
npm run dev:frontend

# Backend seulement  
npm run dev:backend
```

## 📱 Utilisation de l'Application

### Première Connexion

1. **Ouvrez votre navigateur** à http://localhost:3000
2. **Créez un compte** en cliquant sur "S'inscrire"
3. **Remplissez le formulaire** avec :
   - Nom complet
   - Email
   - Mot de passe (minimum 8 caractères)

### Fonctionnalités Principales

#### 📝 Gestion des Mémos

**Créer un mémo :**
1. Cliquez sur "Nouveau Mémo" ou le bouton "+"
2. Remplissez :
   - **Titre** : Nom de votre mémo
   - **Contenu** : Le texte à retenir
   - **Catégorie** : Organisez vos mémos
   - **Tags** : Mots-clés pour la recherche
3. Cliquez sur "Sauvegarder"

**Organiser vos mémos :**
- **Catégories** : Créez des catégories thématiques
- **Tags** : Ajoutez des mots-clés multiples
- **Recherche** : Utilisez la barre de recherche
- **Filtres** : Filtrez par catégorie, tags, ou date

#### 🧠 Répétition Espacée

**Activer les rappels :**
1. Dans un mémo, activez "Répétition espacée"
2. L'algorithme planifiera automatiquement les révisions
3. Vous recevrez des notifications pour réviser

**Réviser vos mémos :**
1. Allez dans "Révisions" ou "Quiz"
2. Répondez aux questions
3. Évaluez votre performance :
   - **Facile** : Intervalle augmenté
   - **Moyen** : Intervalle normal
   - **Difficile** : Révision plus fréquente

#### 🎯 Mode Quiz

**Lancer un quiz :**
1. Cliquez sur "Quiz" dans le menu
2. Sélectionnez :
   - Catégories à inclure
   - Nombre de questions
   - Type de quiz
3. Commencez le quiz

**Types de quiz disponibles :**
- **Révision** : Mémos à réviser
- **Aléatoire** : Sélection aléatoire
- **Catégorie** : Quiz thématique

#### 📊 Suivi des Progrès

**Tableau de bord :**
- Statistiques d'apprentissage
- Mémos créés/révisés
- Performance aux quiz
- Tendances de progression

**Analytics :**
- Temps d'étude
- Taux de réussite
- Mémos les plus difficiles
- Progression par catégorie

### 🔄 Fonctionnalités Avancées

#### Mode Hors Ligne

L'application fonctionne hors ligne :
1. **Création** : Créez des mémos sans connexion
2. **Révision** : Révisez vos mémos existants
3. **Synchronisation** : Tout se synchronise au retour en ligne

#### PWA (Progressive Web App)

**Installation sur mobile/desktop :**
1. Ouvrez l'app dans votre navigateur
2. Cliquez sur "Installer l'application"
3. L'app s'installe comme une app native

#### Notifications Push

**Activer les notifications :**
1. Allez dans "Paramètres"
2. Activez "Notifications push"
3. Autorisez les notifications dans votre navigateur

### ⚙️ Configuration et Personnalisation

#### Paramètres Utilisateur

**Profil :**
- Modifier nom et email
- Changer le mot de passe
- Préférences de langue

**Interface :**
- Thème sombre/clair
- Taille de police
- Paramètres d'accessibilité

**Notifications :**
- Fréquence des rappels
- Types de notifications
- Heures de notification

#### Gestion des Données

**Export :**
1. Allez dans "Paramètres" > "Export"
2. Choisissez le format (JSON, CSV)
3. Téléchargez vos données

**Import :**
1. Préparez un fichier au bon format
2. Utilisez "Paramètres" > "Import"
3. Sélectionnez votre fichier

## 🛠️ Développement et Débogage

### Outils de Développement

**React DevTools :**
- Extension navigateur pour déboguer React
- Inspectez les composants et le state

**Redux DevTools :**
- Suivez les changements d'état
- Déboguez les actions Zustand

**Network Tab :**
- Surveillez les appels API
- Vérifiez les erreurs réseau

### Commandes Utiles

```bash
# Tests
npm run test                    # Tous les tests
npm run test:frontend          # Tests frontend uniquement
npm run test:backend           # Tests backend uniquement

# Linting et formatage
npm run lint                   # Vérifier le code
npm run lint:fix              # Corriger automatiquement

# Base de données
cd apps/backend
npx prisma studio             # Interface graphique DB
npx prisma db reset           # Reset complet de la DB
npx prisma migrate reset      # Reset des migrations

# Build
npm run build                 # Build de production
npm run build:frontend        # Build frontend uniquement
npm run build:backend         # Build backend uniquement
```

### Résolution de Problèmes

#### Problèmes Courants

**Erreur de connexion à la DB :**
```bash
# Vérifiez que PostgreSQL fonctionne
pg_isready

# Vérifiez la chaîne de connexion dans .env
echo $DATABASE_URL
```

**Erreur de port déjà utilisé :**
```bash
# Trouvez le processus utilisant le port
netstat -tulpn | grep :3000

# Tuez le processus
kill -9 <PID>
```

**Problèmes de cache :**
```bash
# Nettoyez les caches
npm run clean
rm -rf node_modules
npm run install:all
```

**Erreurs de migration :**
```bash
cd apps/backend
npx prisma migrate reset
npx prisma migrate dev
npx prisma db seed
```

## 📚 Ressources Supplémentaires

### Documentation

- **API Documentation** : http://localhost:3001/api/docs
- **Storybook** : `npm run storybook` (composants UI)
- **Spécifications** : Voir `.kiro/specs/memo-app/`

### Fichiers Importants

- `package.json` : Scripts et dépendances racine
- `apps/backend/prisma/schema.prisma` : Schéma de base de données
- `apps/frontend/src/App.tsx` : Point d'entrée frontend
- `apps/backend/src/index.ts` : Point d'entrée backend

### Support

- **Issues GitHub** : Pour signaler des bugs
- **Discussions** : Pour poser des questions
- **Documentation** : Dans le dossier `docs/`

---

🎉 **Félicitations !** Vous devriez maintenant pouvoir utiliser MemoApp localement. 

Pour toute question, consultez la documentation ou créez une issue sur GitHub.