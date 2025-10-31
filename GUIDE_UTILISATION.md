# Guide d'Utilisation - MemoApp

Ce guide vous explique comment utiliser toutes les fonctionnalités de MemoApp une fois l'application lancée.

## 🎯 Vue d'ensemble

MemoApp est une application de gestion des connaissances personnelles qui utilise la répétition espacée pour améliorer la mémorisation. Elle combine la prise de notes avec un système intelligent de révision.

## 🚪 Première Connexion

### Création de Compte

1. **Accédez à l'application** : http://localhost:3000
2. **Cliquez sur "S'inscrire"** dans le coin supérieur droit
3. **Remplissez le formulaire** :
   - **Nom complet** : Votre nom d'affichage
   - **Email** : Votre adresse email (sera votre identifiant)
   - **Mot de passe** : Minimum 8 caractères, avec majuscules, minuscules et chiffres
4. **Cliquez sur "Créer un compte"**
5. **Vérifiez votre email** (si la configuration SMTP est activée)

### Connexion

1. **Cliquez sur "Se connecter"**
2. **Entrez vos identifiants** :
   - Email
   - Mot de passe
3. **Cliquez sur "Se connecter"**

## 📝 Gestion des Mémos

### Créer un Mémo

1. **Cliquez sur le bouton "+" ou "Nouveau Mémo"**
2. **Remplissez les informations** :
   - **Titre** : Nom descriptif de votre mémo
   - **Contenu** : Le texte que vous voulez retenir
   - **Catégorie** : Sélectionnez ou créez une catégorie
   - **Tags** : Ajoutez des mots-clés (séparés par des virgules)
   - **Difficulté** : Facile, Moyen, Difficile (affecte la fréquence de révision)
3. **Options avancées** :
   - **Répétition espacée** : Activez pour les révisions automatiques
   - **Rappels** : Configurez des notifications
   - **Couleur** : Personnalisez l'apparence
4. **Cliquez sur "Sauvegarder"**

### Organiser vos Mémos

#### Catégories
- **Créer une catégorie** : Cliquez sur "Gérer les catégories" → "Nouvelle catégorie"
- **Personnaliser** : Choisissez un nom, une couleur et une description
- **Organiser** : Glissez-déposez les mémos entre catégories

#### Tags
- **Ajouter des tags** : Tapez dans le champ "Tags" et appuyez sur Entrée
- **Gérer les tags** : Allez dans "Paramètres" → "Gestion des tags"
- **Recherche par tags** : Cliquez sur un tag pour filtrer

#### Recherche et Filtres
- **Barre de recherche** : Recherchez dans le titre et le contenu
- **Filtres** :
  - Par catégorie
  - Par tags
  - Par date de création
  - Par statut de révision
  - Par difficulté

### Modifier un Mémo

1. **Cliquez sur un mémo** pour l'ouvrir
2. **Cliquez sur "Modifier"** (icône crayon)
3. **Apportez vos modifications**
4. **Sauvegardez** les changements

### Supprimer un Mémo

1. **Ouvrez le mémo**
2. **Cliquez sur "Supprimer"** (icône poubelle)
3. **Confirmez la suppression**

## 🧠 Système de Répétition Espacée

### Principe

La répétition espacée est une technique d'apprentissage qui programme les révisions à des intervalles optimaux pour maximiser la rétention à long terme.

### Activation

1. **Lors de la création/modification d'un mémo** :
   - Cochez "Activer la répétition espacée"
   - Choisissez la difficulté initiale
2. **Le système planifie automatiquement** les prochaines révisions

### Algorithme

- **Première révision** : 1 jour
- **Deuxième révision** : 3 jours
- **Révisions suivantes** : Intervalle multiplié selon votre performance
  - **Facile** : ×2.5 (intervalle augmenté)
  - **Moyen** : ×1.3 (intervalle normal)
  - **Difficile** : ×0.8 (révision plus fréquente)

### Révisions

1. **Accédez à "Révisions"** dans le menu principal
2. **Voyez les mémos à réviser** aujourd'hui
3. **Pour chaque mémo** :
   - Lisez le contenu
   - Essayez de vous rappeler
   - Évaluez votre performance (Facile/Moyen/Difficile)
4. **Le système ajuste** automatiquement les prochaines révisions

## 🎯 Mode Quiz

### Types de Quiz

#### Quiz de Révision
- **Mémos à réviser** : Uniquement les mémos programmés pour aujourd'hui
- **Adaptatif** : L'algorithme s'ajuste selon vos réponses

#### Quiz par Catégorie
- **Sélectionnez une catégorie** spécifique
- **Nombre de questions** : Choisissez combien de mémos inclure

#### Quiz Aléatoire
- **Sélection aléatoire** parmi tous vos mémos
- **Personnalisable** : Filtrez par tags ou difficulté

### Lancer un Quiz

1. **Cliquez sur "Quiz"** dans le menu
2. **Choisissez le type de quiz**
3. **Configurez les options** :
   - Nombre de questions
   - Catégories à inclure
   - Mode de présentation
4. **Cliquez sur "Commencer le quiz"**

### Pendant le Quiz

1. **Lisez la question/mémo**
2. **Réfléchissez à la réponse**
3. **Cliquez sur "Révéler la réponse"**
4. **Évaluez votre performance** :
   - ✅ **Correct** : Vous connaissiez la réponse
   - ❌ **Incorrect** : Vous ne connaissiez pas la réponse
   - 🤔 **Partiellement** : Vous connaissiez une partie
5. **Passez à la question suivante**

### Résultats du Quiz

- **Score global** : Pourcentage de bonnes réponses
- **Temps total** : Durée du quiz
- **Détails par mémo** : Performance individuelle
- **Recommandations** : Mémos à réviser plus souvent

## 📊 Suivi des Progrès

### Tableau de Bord

Accédez au tableau de bord pour voir :

#### Statistiques Générales
- **Mémos créés** : Total et cette semaine
- **Révisions effectuées** : Aujourd'hui et cette semaine
- **Streak de révision** : Jours consécutifs de révision
- **Taux de réussite** : Pourcentage moyen aux quiz

#### Graphiques de Progression
- **Activité quotidienne** : Mémos créés et révisés par jour
- **Performance par catégorie** : Taux de réussite par thème
- **Courbe d'apprentissage** : Évolution de vos performances

#### Mémos en Difficulté
- **Liste des mémos** les plus difficiles
- **Suggestions de révision** supplémentaire
- **Liens directs** pour réviser

### Analytics Détaillées

1. **Cliquez sur "Analytics"** dans le menu
2. **Explorez les différentes vues** :
   - **Vue d'ensemble** : Métriques principales
   - **Par catégorie** : Performance détaillée par thème
   - **Tendances temporelles** : Évolution sur le temps
   - **Heatmap d'activité** : Visualisation de votre régularité

## 🔄 Fonctionnalités Hors Ligne

### Synchronisation Automatique

- **Travail hors ligne** : Créez et modifiez des mémos sans connexion
- **Synchronisation automatique** : Dès que la connexion revient
- **Résolution de conflits** : Interface pour gérer les conflits de données

### Indicateurs de Statut

- **🟢 En ligne** : Synchronisé avec le serveur
- **🟡 Synchronisation** : Envoi des données en cours
- **🔴 Hors ligne** : Travail en mode local
- **⚠️ Conflit** : Résolution manuelle nécessaire

### Gestion des Conflits

1. **Notification de conflit** : Alerte quand des conflits sont détectés
2. **Interface de résolution** :
   - Voir les deux versions (locale et serveur)
   - Choisir la version à conserver
   - Fusionner manuellement si nécessaire
3. **Résolution automatique** : Pour les conflits simples

## 📱 Progressive Web App (PWA)

### Installation

#### Sur Mobile
1. **Ouvrez l'app** dans votre navigateur mobile
2. **Cherchez "Ajouter à l'écran d'accueil"** dans le menu du navigateur
3. **Confirmez l'installation**
4. **L'icône apparaît** sur votre écran d'accueil

#### Sur Desktop
1. **Cherchez l'icône d'installation** dans la barre d'adresse
2. **Cliquez sur "Installer MemoApp"**
3. **L'application s'ouvre** dans sa propre fenêtre

### Avantages PWA
- **Lancement rapide** : Comme une app native
- **Notifications push** : Rappels même app fermée
- **Fonctionnement hors ligne** : Accès complet sans internet
- **Mises à jour automatiques** : Toujours la dernière version

## 🔔 Notifications et Rappels

### Configuration des Notifications

1. **Allez dans "Paramètres"** → "Notifications"
2. **Activez les notifications push**
3. **Autorisez** dans votre navigateur
4. **Configurez** :
   - Heures de notification (ex: 9h-21h)
   - Fréquence des rappels
   - Types de notifications

### Types de Notifications

- **Rappels de révision** : Mémos à réviser aujourd'hui
- **Streak de révision** : Encouragement à maintenir la régularité
- **Nouveaux mémos** : Rappel de créer du contenu
- **Objectifs atteints** : Félicitations pour les progrès

### Gestion des Rappels

1. **Par mémo** : Configurez des rappels individuels
2. **Par catégorie** : Rappels pour réviser une catégorie
3. **Rappels personnalisés** : Créez vos propres rappels

## ⚙️ Paramètres et Personnalisation

### Profil Utilisateur

1. **Cliquez sur votre avatar** → "Profil"
2. **Modifiez** :
   - Nom d'affichage
   - Email
   - Photo de profil
   - Mot de passe

### Préférences d'Interface

#### Thème
- **Thème clair** : Interface claire (par défaut)
- **Thème sombre** : Interface sombre pour les yeux
- **Automatique** : Suit les préférences système

#### Langue
- **Français** : Interface en français
- **Anglais** : Interface en anglais
- **Autres langues** : Selon disponibilité

#### Accessibilité
- **Taille de police** : Ajustez pour votre confort
- **Contraste élevé** : Pour une meilleure lisibilité
- **Raccourcis clavier** : Navigation au clavier
- **Lecteur d'écran** : Support pour les technologies d'assistance

### Paramètres d'Apprentissage

#### Répétition Espacée
- **Algorithme** : Choisissez la méthode (SM-2, Anki, personnalisé)
- **Intervalles initiaux** : Personnalisez les délais de base
- **Facteurs de difficulté** : Ajustez les multiplicateurs

#### Quiz
- **Mode par défaut** : Type de quiz préféré
- **Nombre de questions** : Valeur par défaut
- **Affichage des réponses** : Immédiat ou à la fin

## 📤 Import/Export de Données

### Export

1. **Allez dans "Paramètres"** → "Données"
2. **Choisissez le format** :
   - **JSON** : Format complet avec métadonnées
   - **CSV** : Format tableur simple
   - **Markdown** : Format texte lisible
3. **Sélectionnez les données** à exporter
4. **Téléchargez** le fichier

### Import

1. **Préparez votre fichier** au bon format
2. **Cliquez sur "Importer"**
3. **Sélectionnez votre fichier**
4. **Configurez l'import** :
   - Gestion des doublons
   - Catégories de destination
   - Préservation des dates
5. **Lancez l'import**

### Formats Supportés

#### Import depuis d'autres apps
- **Anki** : Fichiers .apkg
- **Quizlet** : Export CSV
- **Notion** : Export Markdown
- **Obsidian** : Fichiers .md

## 🔒 Sécurité et Confidentialité

### Sécurité des Données

- **Chiffrement** : Toutes les données sont chiffrées
- **Authentification sécurisée** : JWT avec refresh tokens
- **Sessions** : Expiration automatique des sessions
- **HTTPS** : Toutes les communications sont sécurisées

### Confidentialité

- **Données personnelles** : Stockées localement et sur serveur sécurisé
- **Pas de tracking** : Aucun suivi publicitaire
- **Analytics anonymes** : Statistiques d'usage anonymisées (optionnel)
- **Contrôle total** : Vous pouvez exporter/supprimer vos données

### Gestion du Compte

#### Suppression de Compte
1. **Paramètres** → "Compte" → "Supprimer le compte"
2. **Confirmez** avec votre mot de passe
3. **Toutes vos données** sont supprimées définitivement

#### Déconnexion Sécurisée
- **Déconnexion simple** : Garde les données locales
- **Déconnexion complète** : Efface toutes les données locales

## 🆘 Aide et Support

### Raccourcis Clavier

- **Ctrl+N** : Nouveau mémo
- **Ctrl+S** : Sauvegarder
- **Ctrl+F** : Rechercher
- **Ctrl+Q** : Lancer un quiz
- **Esc** : Fermer les modales
- **Tab/Shift+Tab** : Navigation au clavier

### Résolution de Problèmes

#### Problèmes de Synchronisation
1. **Vérifiez votre connexion** internet
2. **Rafraîchissez la page** (F5)
3. **Déconnectez/reconnectez-vous**
4. **Contactez le support** si le problème persiste

#### Données Manquantes
1. **Vérifiez les filtres** actifs
2. **Regardez dans "Corbeille"** (si disponible)
3. **Vérifiez la synchronisation**
4. **Restaurez depuis une sauvegarde**

#### Performance Lente
1. **Fermez les autres onglets**
2. **Videz le cache** du navigateur
3. **Redémarrez le navigateur**
4. **Vérifiez les ressources système**

### Contact Support

- **Email** : support@memoapp.com
- **GitHub Issues** : Pour les bugs techniques
- **Documentation** : Consultez les guides détaillés
- **FAQ** : Questions fréquemment posées

---

🎉 **Bon apprentissage avec MemoApp !**

N'hésitez pas à explorer toutes les fonctionnalités et à personnaliser l'application selon vos besoins d'apprentissage.