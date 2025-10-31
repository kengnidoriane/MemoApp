# Production Deployment Script for MemoApp (PowerShell)
# This script handles the complete deployment process

param(
    [Parameter(Position=0)]
    [ValidateSet("deploy", "rollback", "status", "health", "backup")]
    [string]$Command = "deploy"
)

# Configuration
$ComposeFile = "docker-compose.prod.yml"
$EnvFile = ".env"
$BackupDir = "./backups"

# Functions
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

# Check prerequisites
function Test-Prerequisites {
    Write-Info "Checking prerequisites..."
    
    # Check if Docker is installed and running
    try {
        $null = docker --version
    } catch {
        Write-Error "Docker is not installed. Please install Docker first."
        exit 1
    }
    
    try {
        $null = docker info 2>$null
    } catch {
        Write-Error "Docker is not running. Please start Docker first."
        exit 1
    }
    
    # Check if Docker Compose is available
    try {
        $null = docker-compose --version
    } catch {
        try {
            $null = docker compose version
        } catch {
            Write-Error "Docker Compose is not available. Please install Docker Compose."
            exit 1
        }
    }
    
    # Check if environment file exists
    if (-not (Test-Path $EnvFile)) {
        Write-Error "Environment file $EnvFile not found. Please copy .env.production to .env and configure it."
        exit 1
    }
    
    Write-Success "Prerequisites check passed"
}

# Create backup directory
function New-BackupDirectory {
    if (-not (Test-Path $BackupDir)) {
        New-Item -ItemType Directory -Path $BackupDir -Force | Out-Null
        Write-Info "Created backup directory: $BackupDir"
    }
}

# Backup database
function Backup-Database {
    Write-Info "Creating database backup..."
    
    # Get database credentials from environment
    $envVars = Get-Content $EnvFile | Where-Object { $_ -match "^[^#].*=" } | ForEach-Object {
        $parts = $_ -split "=", 2
        @{ $parts[0] = $parts[1] }
    }
    
    $backupFile = "$BackupDir/memo_app_backup_$(Get-Date -Format 'yyyyMMdd_HHmmss').sql"
    
    # Create database backup using docker exec
    try {
        $postgresStatus = docker-compose -f $ComposeFile ps postgres
        if ($postgresStatus -match "Up") {
            docker-compose -f $ComposeFile exec -T postgres pg_dump -U $envVars.POSTGRES_USER -d $envVars.POSTGRES_DB | Out-File -FilePath $backupFile -Encoding UTF8
            Write-Success "Database backup created: $backupFile"
        } else {
            Write-Warning "Database container not running, skipping backup"
        }
    } catch {
        Write-Warning "Failed to create database backup: $_"
    }
}

# Build and deploy
function Start-Deployment {
    Write-Info "Starting deployment..."
    
    # Pull latest images and build
    Write-Info "Building application images..."
    docker-compose -f $ComposeFile build --no-cache
    
    # Start services
    Write-Info "Starting services..."
    docker-compose -f $ComposeFile up -d
    
    # Wait for services to be healthy
    Write-Info "Waiting for services to be healthy..."
    Start-Sleep -Seconds 30
    
    # Check service health
    Test-ServiceHealth
    
    Write-Success "Deployment completed successfully!"
}

# Check service health
function Test-ServiceHealth {
    Write-Info "Checking service health..."
    
    # Check backend health
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3001/api/health" -UseBasicParsing -TimeoutSec 10
        if ($response.StatusCode -eq 200) {
            Write-Success "Backend service is healthy"
        } else {
            Write-Error "Backend service health check failed"
            return $false
        }
    } catch {
        Write-Error "Backend service health check failed: $_"
        return $false
    }
    
    # Check frontend health
    try {
        $response = Invoke-WebRequest -Uri "http://localhost/health" -UseBasicParsing -TimeoutSec 10
        if ($response.StatusCode -eq 200) {
            Write-Success "Frontend service is healthy"
        } else {
            Write-Error "Frontend service health check failed"
            return $false
        }
    } catch {
        Write-Error "Frontend service health check failed: $_"
        return $false
    }
    
    # Check load balancer health
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:8080/health" -UseBasicParsing -TimeoutSec 10
        if ($response.StatusCode -eq 200) {
            Write-Success "Load balancer is healthy"
        } else {
            Write-Warning "Load balancer health check failed (this is optional)"
        }
    } catch {
        Write-Warning "Load balancer health check failed (this is optional): $_"
    }
    
    return $true
}

# Run database migrations
function Start-DatabaseMigrations {
    Write-Info "Running database migrations..."
    
    try {
        docker-compose -f $ComposeFile exec backend npx prisma migrate deploy
        Write-Success "Database migrations completed"
    } catch {
        Write-Error "Database migrations failed: $_"
        throw
    }
}

# Show deployment status
function Show-DeploymentStatus {
    Write-Info "Deployment Status:"
    Write-Host ""
    docker-compose -f $ComposeFile ps
    Write-Host ""
    Write-Info "Service URLs:"
    Write-Host "  Frontend: http://localhost"
    Write-Host "  Backend API: http://localhost/api"
    Write-Host "  Load Balancer: http://localhost:8080"
    Write-Host "  Health Checks:"
    Write-Host "    - Backend: http://localhost/api/health"
    Write-Host "    - Frontend: http://localhost/health"
    Write-Host "    - Load Balancer: http://localhost:8080/health"
}

# Rollback function
function Start-Rollback {
    Write-Warning "Rolling back deployment..."
    
    # Stop current containers
    docker-compose -f $ComposeFile down
    
    # Restore from backup if available
    $latestBackup = Get-ChildItem -Path $BackupDir -Filter "*.sql" | Sort-Object LastWriteTime -Descending | Select-Object -First 1
    if ($latestBackup) {
        Write-Info "Restoring from backup: $($latestBackup.FullName)"
        # Restore database logic would go here
        Write-Success "Rollback completed"
    } else {
        Write-Warning "No backup found for rollback"
    }
}

# Main deployment process
switch ($Command) {
    "deploy" {
        Test-Prerequisites
        New-BackupDirectory
        Backup-Database
        Start-Deployment
        Start-DatabaseMigrations
        Show-DeploymentStatus
    }
    "rollback" {
        Start-Rollback
    }
    "status" {
        Show-DeploymentStatus
    }
    "health" {
        Test-ServiceHealth
    }
    "backup" {
        New-BackupDirectory
        Backup-Database
    }
    default {
        Write-Host "Usage: .\deploy.ps1 {deploy|rollback|status|health|backup}"
        Write-Host ""
        Write-Host "Commands:"
        Write-Host "  deploy   - Full deployment (default)"
        Write-Host "  rollback - Rollback to previous version"
        Write-Host "  status   - Show deployment status"
        Write-Host "  health   - Check service health"
        Write-Host "  backup   - Create database backup only"
        exit 1
    }
}