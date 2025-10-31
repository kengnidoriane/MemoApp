# Script de démarrage rapide pour MemoApp (PowerShell)
# Ce script configure et lance l'application en mode développement

param(
    [switch]$SkipInstall,
    [switch]$ResetDB,
    [switch]$Help
)

if ($Help) {
    Write-Host "Script de démarrage rapide pour MemoApp" -ForegroundColor Green
    Write-Host ""
    Write-Host "Usage: .\start-local.ps1 [options]"
    Write-Host ""
    Write-Host "Options:"
    Write-Host "  -SkipInstall    Ignorer l'installation des dépendances"
    Write-Host "  -ResetDB        Réinitialiser la base de données"
    Write-Host "  -Help           Afficher cette aide"
    Write-Host ""
    Write-Host "Prérequis:"
    Write-Host "  - Node.js 18+"
    Write-Host "  - PostgreSQL 14+"
    Write-Host "  - Redis 6+ (optionnel)"
    exit 0
}

# Couleurs pour l'affichage
function Write-Info {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor Blue
}

function Write-Success {
    param([string]$Message)
    Write-Host "[SUCCESS] $Message" -ForegroundColor Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "[WARNING] $Message" -ForegroundColor Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

Write-Info "🚀 Démarrage de MemoApp en mode développement..."

# Vérification des prérequis
Write-Info "Vérification des prérequis..."

# Node.js
try {
    $nodeVersion = node --version
    Write-Success "Node.js détecté: $nodeVersion"
} catch {
    Write-Error "Node.js n'est pas installé. Veuillez installer Node.js 18+ depuis https://nodejs.org/"
    exit 1
}

# npm
try {
    $npmVersion = npm --version
    Write-Success "npm détecté: $npmVersion"
} catch {
    Write-Error "npm n'est pas disponible"
    exit 1
}

# PostgreSQL (optionnel - peut être avec Docker)
try {
    $pgVersion = pg_config --version 2>$null
    if ($pgVersion) {
        Write-Success "PostgreSQL détecté: $pgVersion"
    }
} catch {
    Write-Warning "PostgreSQL non détecté localement (vous pouvez utiliser Docker)"
}

# Installation des dépendances
if (-not $SkipInstall) {
    Write-Info "Installation des dépendances..."
    npm run install:all
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Échec de l'installation des dépendances"
        exit 1
    }
    Write-Success "Dépendances installées avec succès"
} else {
    Write-Info "Installation des dépendances ignorée"
}

# Configuration des fichiers d'environnement
Write-Info "Configuration des fichiers d'environnement..."

if (-not (Test-Path "apps/backend/.env")) {
    Copy-Item "apps/backend/.env.example" "apps/backend/.env"
    Write-Success "Fichier apps/backend/.env créé"
    Write-Warning "⚠️  Veuillez configurer la DATABASE_URL dans apps/backend/.env"
} else {
    Write-Info "Fichier apps/backend/.env existe déjà"
}

if (-not (Test-Path "apps/frontend/.env")) {
    Copy-Item "apps/frontend/.env.example" "apps/frontend/.env"
    Write-Success "Fichier apps/frontend/.env créé"
} else {
    Write-Info "Fichier apps/frontend/.env existe déjà"
}

# Configuration de la base de données
Write-Info "Configuration de la base de données..."

# Vérifier si Docker est disponible pour PostgreSQL
$useDocker = $false
try {
    docker --version | Out-Null
    $useDocker = $true
    Write-Info "Docker détecté - option PostgreSQL avec Docker disponible"
} catch {
    Write-Info "Docker non détecté - utilisation de PostgreSQL local requis"
}

# Proposer de lancer PostgreSQL avec Docker si disponible
if ($useDocker) {
    $response = Read-Host "Voulez-vous lancer PostgreSQL avec Docker ? (y/N)"
    if ($response -match "^[Yy]") {
        Write-Info "Lancement de PostgreSQL avec Docker..."
        
        # Arrêter le conteneur existant s'il existe
        docker stop memo-postgres 2>$null
        docker rm memo-postgres 2>$null
        
        # Lancer PostgreSQL
        docker run --name memo-postgres `
            -e POSTGRES_DB=memo_app `
            -e POSTGRES_USER=memo_user `
            -e POSTGRES_PASSWORD=memo_pass `
            -p 5432:5432 `
            -d postgres:15
        
        if ($LASTEXITCODE -eq 0) {
            Write-Success "PostgreSQL lancé avec Docker"
            Write-Info "Attente du démarrage de PostgreSQL..."
            Start-Sleep -Seconds 5
            
            # Mettre à jour le fichier .env avec la bonne URL
            $envContent = Get-Content "apps/backend/.env"
            $envContent = $envContent -replace 'DATABASE_URL=".*"', 'DATABASE_URL="postgresql://memo_user:memo_pass@localhost:5432/memo_app"'
            $envContent | Set-Content "apps/backend/.env"
            Write-Success "DATABASE_URL mise à jour dans apps/backend/.env"
        } else {
            Write-Error "Échec du lancement de PostgreSQL avec Docker"
            Write-Info "Veuillez configurer PostgreSQL manuellement"
        }
    }
}

# Initialisation de la base de données
Write-Info "Initialisation de la base de données..."

Set-Location "apps/backend"

try {
    # Générer le client Prisma
    npx prisma generate
    Write-Success "Client Prisma généré"
    
    if ($ResetDB) {
        Write-Info "Réinitialisation de la base de données..."
        npx prisma migrate reset --force
    } else {
        # Exécuter les migrations
        npx prisma migrate dev --name init
    }
    Write-Success "Migrations de base de données appliquées"
    
    # Peupler la base de données
    npx prisma db seed
    Write-Success "Base de données peuplée avec des données de test"
    
} catch {
    Write-Error "Erreur lors de l'initialisation de la base de données: $_"
    Write-Info "Vérifiez que PostgreSQL fonctionne et que la DATABASE_URL est correcte"
    Set-Location "../.."
    exit 1
}

Set-Location "../.."

# Lancer Redis avec Docker si disponible
if ($useDocker) {
    $response = Read-Host "Voulez-vous lancer Redis avec Docker ? (y/N)"
    if ($response -match "^[Yy]") {
        Write-Info "Lancement de Redis avec Docker..."
        
        # Arrêter le conteneur existant s'il existe
        docker stop memo-redis 2>$null
        docker rm memo-redis 2>$null
        
        # Lancer Redis
        docker run --name memo-redis -p 6379:6379 -d redis:7-alpine
        
        if ($LASTEXITCODE -eq 0) {
            Write-Success "Redis lancé avec Docker"
        } else {
            Write-Warning "Échec du lancement de Redis (optionnel)"
        }
    }
}

# Lancement de l'application
Write-Info "🎉 Configuration terminée ! Lancement de l'application..."
Write-Info ""
Write-Info "L'application sera accessible à :"
Write-Info "  Frontend: http://localhost:3000"
Write-Info "  Backend:  http://localhost:3001"
Write-Info "  Health:   http://localhost:3001/health"
Write-Info ""
Write-Info "Appuyez sur Ctrl+C pour arrêter l'application"
Write-Info ""

# Lancer l'application
npm run dev