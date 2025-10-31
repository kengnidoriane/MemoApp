#!/bin/bash

# Script de démarrage rapide pour MemoApp (Bash)
# Ce script configure et lance l'application en mode développement

set -e

# Couleurs pour l'affichage
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Fonctions d'affichage
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Affichage de l'aide
show_help() {
    echo -e "${GREEN}Script de démarrage rapide pour MemoApp${NC}"
    echo ""
    echo "Usage: ./start-local.sh [options]"
    echo ""
    echo "Options:"
    echo "  --skip-install    Ignorer l'installation des dépendances"
    echo "  --reset-db        Réinitialiser la base de données"
    echo "  --help            Afficher cette aide"
    echo ""
    echo "Prérequis:"
    echo "  - Node.js 18+"
    echo "  - PostgreSQL 14+"
    echo "  - Redis 6+ (optionnel)"
    exit 0
}

# Traitement des arguments
SKIP_INSTALL=false
RESET_DB=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --skip-install)
            SKIP_INSTALL=true
            shift
            ;;
        --reset-db)
            RESET_DB=true
            shift
            ;;
        --help)
            show_help
            ;;
        *)
            echo "Option inconnue: $1"
            show_help
            ;;
    esac
done

log_info "🚀 Démarrage de MemoApp en mode développement..."

# Vérification des prérequis
log_info "Vérification des prérequis..."

# Node.js
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    log_success "Node.js détecté: $NODE_VERSION"
else
    log_error "Node.js n'est pas installé. Veuillez installer Node.js 18+ depuis https://nodejs.org/"
    exit 1
fi

# npm
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm --version)
    log_success "npm détecté: $NPM_VERSION"
else
    log_error "npm n'est pas disponible"
    exit 1
fi

# PostgreSQL (optionnel - peut être avec Docker)
if command -v pg_config &> /dev/null; then
    PG_VERSION=$(pg_config --version)
    log_success "PostgreSQL détecté: $PG_VERSION"
else
    log_warning "PostgreSQL non détecté localement (vous pouvez utiliser Docker)"
fi

# Installation des dépendances
if [ "$SKIP_INSTALL" = false ]; then
    log_info "Installation des dépendances..."
    npm run install:all
    log_success "Dépendances installées avec succès"
else
    log_info "Installation des dépendances ignorée"
fi

# Configuration des fichiers d'environnement
log_info "Configuration des fichiers d'environnement..."

if [ ! -f "apps/backend/.env" ]; then
    cp "apps/backend/.env.example" "apps/backend/.env"
    log_success "Fichier apps/backend/.env créé"
    log_warning "⚠️  Veuillez configurer la DATABASE_URL dans apps/backend/.env"
else
    log_info "Fichier apps/backend/.env existe déjà"
fi

if [ ! -f "apps/frontend/.env" ]; then
    cp "apps/frontend/.env.example" "apps/frontend/.env"
    log_success "Fichier apps/frontend/.env créé"
else
    log_info "Fichier apps/frontend/.env existe déjà"
fi

# Configuration de la base de données
log_info "Configuration de la base de données..."

# Vérifier si Docker est disponible pour PostgreSQL
USE_DOCKER=false
if command -v docker &> /dev/null; then
    USE_DOCKER=true
    log_info "Docker détecté - option PostgreSQL avec Docker disponible"
else
    log_info "Docker non détecté - utilisation de PostgreSQL local requis"
fi

# Proposer de lancer PostgreSQL avec Docker si disponible
if [ "$USE_DOCKER" = true ]; then
    read -p "Voulez-vous lancer PostgreSQL avec Docker ? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        log_info "Lancement de PostgreSQL avec Docker..."
        
        # Arrêter le conteneur existant s'il existe
        docker stop memo-postgres 2>/dev/null || true
        docker rm memo-postgres 2>/dev/null || true
        
        # Lancer PostgreSQL
        docker run --name memo-postgres \
            -e POSTGRES_DB=memo_app \
            -e POSTGRES_USER=memo_user \
            -e POSTGRES_PASSWORD=memo_pass \
            -p 5432:5432 \
            -d postgres:15
        
        if [ $? -eq 0 ]; then
            log_success "PostgreSQL lancé avec Docker"
            log_info "Attente du démarrage de PostgreSQL..."
            sleep 5
            
            # Mettre à jour le fichier .env avec la bonne URL
            sed -i 's|DATABASE_URL=".*"|DATABASE_URL="postgresql://memo_user:memo_pass@localhost:5432/memo_app"|' apps/backend/.env
            log_success "DATABASE_URL mise à jour dans apps/backend/.env"
        else
            log_error "Échec du lancement de PostgreSQL avec Docker"
            log_info "Veuillez configurer PostgreSQL manuellement"
        fi
    fi
fi

# Initialisation de la base de données
log_info "Initialisation de la base de données..."

cd apps/backend

# Générer le client Prisma
npx prisma generate
log_success "Client Prisma généré"

if [ "$RESET_DB" = true ]; then
    log_info "Réinitialisation de la base de données..."
    npx prisma migrate reset --force
else
    # Exécuter les migrations
    npx prisma migrate dev --name init
fi
log_success "Migrations de base de données appliquées"

# Peupler la base de données
npx prisma db seed
log_success "Base de données peuplée avec des données de test"

cd ../..

# Lancer Redis avec Docker si disponible
if [ "$USE_DOCKER" = true ]; then
    read -p "Voulez-vous lancer Redis avec Docker ? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        log_info "Lancement de Redis avec Docker..."
        
        # Arrêter le conteneur existant s'il existe
        docker stop memo-redis 2>/dev/null || true
        docker rm memo-redis 2>/dev/null || true
        
        # Lancer Redis
        docker run --name memo-redis -p 6379:6379 -d redis:7-alpine
        
        if [ $? -eq 0 ]; then
            log_success "Redis lancé avec Docker"
        else
            log_warning "Échec du lancement de Redis (optionnel)"
        fi
    fi
fi

# Lancement de l'application
log_info "🎉 Configuration terminée ! Lancement de l'application..."
echo ""
log_info "L'application sera accessible à :"
log_info "  Frontend: http://localhost:3000"
log_info "  Backend:  http://localhost:3001"
log_info "  Health:   http://localhost:3001/health"
echo ""
log_info "Appuyez sur Ctrl+C pour arrêter l'application"
echo ""

# Lancer l'application
npm run dev