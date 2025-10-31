# MemoApp Backup and Disaster Recovery Script (PowerShell)
# This script handles database backups, file backups, and recovery procedures

param(
    [Parameter(Position=0)]
    [ValidateSet("backup", "restore", "list", "verify", "cleanup")]
    [string]$Command = "backup",
    
    [Parameter(Position=1)]
    [string]$BackupFile = ""
)

# Configuration
$BackupDir = "./backups"
$ComposeFile = "docker-compose.prod.yml"
$EnvFile = ".env"
$RetentionDays = 30
$S3Bucket = $env:BACKUP_S3_BUCKET
$EncryptionKey = $env:BACKUP_ENCRYPTION_KEY

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

# Create backup directory structure
function New-BackupStructure {
    $backupDate = Get-Date -Format "yyyyMMdd_HHmmss"
    $backupPath = Join-Path $BackupDir $backupDate
    
    New-Item -ItemType Directory -Path "$backupPath/database" -Force | Out-Null
    New-Item -ItemType Directory -Path "$backupPath/files" -Force | Out-Null
    New-Item -ItemType Directory -Path "$backupPath/config" -Force | Out-Null
    
    return $backupPath
}

# Backup database
function Backup-Database {
    param([string]$BackupPath)
    
    Write-Info "Creating database backup..."
    
    # Load environment variables
    $envVars = @{}
    Get-Content $EnvFile | Where-Object { $_ -match "^[^#].*=" } | ForEach-Object {
        $parts = $_ -split "=", 2
        $envVars[$parts[0]] = $parts[1]
    }
    
    $dbBackupFile = Join-Path "$BackupPath/database" "memo_app_$(Get-Date -Format 'yyyyMMdd_HHmmss').sql"
    
    try {
        $postgresStatus = docker-compose -f $ComposeFile ps postgres
        if ($postgresStatus -match "Up") {
            # Create database dump
            $dumpCommand = "docker-compose -f $ComposeFile exec -T postgres pg_dump -U $($envVars.POSTGRES_USER) -d $($envVars.POSTGRES_DB) --verbose --no-owner --no-privileges"
            Invoke-Expression $dumpCommand | Out-File -FilePath $dbBackupFile -Encoding UTF8
            
            # Compress the backup
            Compress-Archive -Path $dbBackupFile -DestinationPath "$dbBackupFile.zip" -Force
            Remove-Item $dbBackupFile
            $dbBackupFile = "$dbBackupFile.zip"
            
            Write-Success "Database backup created: $dbBackupFile"
            return $dbBackupFile
        } else {
            Write-Error "Database container is not running"
            return $null
        }
    } catch {
        Write-Error "Failed to create database backup: $_"
        return $null
    }
}

# Backup Redis data
function Backup-Redis {
    param([string]$BackupPath)
    
    Write-Info "Creating Redis backup..."
    
    $redisBackupFile = Join-Path "$BackupPath/database" "redis_$(Get-Date -Format 'yyyyMMdd_HHmmss').rdb"
    
    try {
        $redisStatus = docker-compose -f $ComposeFile ps redis
        if ($redisStatus -match "Up") {
            # Create Redis backup
            docker-compose -f $ComposeFile exec -T redis redis-cli BGSAVE
            
            # Wait for backup to complete
            Start-Sleep -Seconds 5
            
            # Copy the RDB file
            docker-compose -f $ComposeFile exec -T redis cat /data/dump.rdb | Set-Content -Path $redisBackupFile -Encoding Byte
            
            # Compress the backup
            Compress-Archive -Path $redisBackupFile -DestinationPath "$redisBackupFile.zip" -Force
            Remove-Item $redisBackupFile
            $redisBackupFile = "$redisBackupFile.zip"
            
            Write-Success "Redis backup created: $redisBackupFile"
            return $redisBackupFile
        } else {
            Write-Warning "Redis container is not running, skipping Redis backup"
            return $null
        }
    } catch {
        Write-Warning "Failed to create Redis backup: $_"
        return $null
    }
}

# Backup configuration files
function Backup-Config {
    param([string]$BackupPath)
    
    Write-Info "Creating configuration backup..."
    
    try {
        # Copy important configuration files
        Copy-Item $EnvFile "$BackupPath/config/" -Force
        Copy-Item $ComposeFile "$BackupPath/config/" -Force
        
        if (Test-Path "nginx") {
            Copy-Item "nginx" "$BackupPath/config/" -Recurse -Force
        }
        
        if (Test-Path "monitoring") {
            Copy-Item "monitoring" "$BackupPath/config/" -Recurse -Force
        }
        
        # Create a manifest of what was backed up
        $manifest = @"
Backup created: $(Get-Date)
Environment: $(if (Test-Path $EnvFile) { (Get-Content $EnvFile | Where-Object { $_ -match "NODE_ENV" }) } else { "NODE_ENV not set" })
Database: $(if (Test-Path $EnvFile) { (Get-Content $EnvFile | Where-Object { $_ -match "POSTGRES_DB" }) } else { "POSTGRES_DB not set" })
Version: $(if (Test-Path ".git") { git rev-parse HEAD } else { "Not a git repository" })
"@
        
        $manifest | Out-File -FilePath "$BackupPath/config/manifest.txt" -Encoding UTF8
        
        Write-Success "Configuration backup created"
    } catch {
        Write-Error "Failed to create configuration backup: $_"
    }
}

# Backup application files
function Backup-Files {
    param([string]$BackupPath)
    
    Write-Info "Creating application files backup..."
    
    try {
        $filesBackup = Join-Path "$BackupPath/files" "application_$(Get-Date -Format 'yyyyMMdd_HHmmss').zip"
        
        # Create zip archive of important directories, excluding unnecessary files
        $excludePatterns = @("node_modules", "dist", "build", ".git", "backups", "e2e-results")
        
        $filesToBackup = Get-ChildItem -Path "." -Recurse | Where-Object {
            $file = $_
            $shouldExclude = $false
            foreach ($pattern in $excludePatterns) {
                if ($file.FullName -like "*$pattern*") {
                    $shouldExclude = $true
                    break
                }
            }
            return -not $shouldExclude
        }
        
        Compress-Archive -Path $filesToBackup.FullName -DestinationPath $filesBackup -Force
        
        Write-Success "Application files backup created"
    } catch {
        Write-Error "Failed to create application files backup: $_"
    }
}

# Upload to S3 if configured
function Upload-ToS3 {
    param([string]$BackupPath)
    
    if ($S3Bucket) {
        Write-Info "Uploading backup to S3..."
        
        if (Get-Command aws -ErrorAction SilentlyContinue) {
            $backupName = Split-Path $BackupPath -Leaf
            aws s3 sync $BackupPath "s3://$S3Bucket/memo-app-backups/$backupName" --delete
            Write-Success "Backup uploaded to S3: s3://$S3Bucket/memo-app-backups/$backupName"
        } else {
            Write-Warning "AWS CLI not found, skipping S3 upload"
        }
    }
}

# Clean old backups
function Remove-OldBackups {
    Write-Info "Cleaning up old backups (older than $RetentionDays days)..."
    
    try {
        $cutoffDate = (Get-Date).AddDays(-$RetentionDays)
        
        Get-ChildItem -Path $BackupDir -Directory | Where-Object {
            $_.Name -match "^\d{8}_\d{6}$" -and $_.CreationTime -lt $cutoffDate
        } | Remove-Item -Recurse -Force
        
        # Clean S3 backups if configured
        if ($S3Bucket -and (Get-Command aws -ErrorAction SilentlyContinue)) {
            $s3Backups = aws s3 ls "s3://$S3Bucket/memo-app-backups/" | ConvertFrom-String
            foreach ($backup in $s3Backups) {
                $backupDate = [DateTime]::ParseExact($backup.P2, "yyyyMMdd_HHmmss", $null)
                if ($backupDate -lt $cutoffDate) {
                    aws s3 rm "s3://$S3Bucket/memo-app-backups/$($backup.P2)" --recursive
                    Write-Info "Removed old S3 backup: $($backup.P2)"
                }
            }
        }
        
        Write-Success "Old backups cleaned up"
    } catch {
        Write-Warning "Failed to clean old backups: $_"
    }
}

# Restore database from backup
function Restore-Database {
    param([string]$BackupFile)
    
    if (-not (Test-Path $BackupFile)) {
        Write-Error "Backup file not found: $BackupFile"
        return
    }
    
    $confirmation = Read-Host "This will replace the current database. Are you sure? (y/N)"
    if ($confirmation -notmatch "^[Yy]$") {
        Write-Info "Database restore cancelled"
        return
    }
    
    Write-Info "Restoring database from: $BackupFile"
    
    try {
        # Load environment variables
        $envVars = @{}
        Get-Content $EnvFile | Where-Object { $_ -match "^[^#].*=" } | ForEach-Object {
            $parts = $_ -split "=", 2
            $envVars[$parts[0]] = $parts[1]
        }
        
        # Extract if compressed
        $restoreFile = $BackupFile
        if ($BackupFile -like "*.zip") {
            $tempDir = Join-Path $env:TEMP "memo-restore-$(Get-Date -Format 'yyyyMMdd_HHmmss')"
            Expand-Archive -Path $BackupFile -DestinationPath $tempDir -Force
            $restoreFile = Get-ChildItem -Path $tempDir -Filter "*.sql" | Select-Object -First 1 -ExpandProperty FullName
        }
        
        # Stop application containers
        docker-compose -f $ComposeFile stop backend frontend
        
        # Restore database
        Get-Content $restoreFile | docker-compose -f $ComposeFile exec -T postgres psql -U $envVars.POSTGRES_USER -d $envVars.POSTGRES_DB
        
        # Start application containers
        docker-compose -f $ComposeFile start backend frontend
        
        # Clean up temporary files
        if ($BackupFile -like "*.zip" -and (Test-Path $tempDir)) {
            Remove-Item $tempDir -Recurse -Force
        }
        
        Write-Success "Database restored successfully"
    } catch {
        Write-Error "Failed to restore database: $_"
    }
}

# Verify backup integrity
function Test-BackupIntegrity {
    param([string]$BackupPath)
    
    Write-Info "Verifying backup integrity..."
    
    $errors = 0
    
    # Check if database backup exists and is valid
    $dbBackup = Get-ChildItem -Path "$BackupPath/database" -Filter "*.sql*" | Select-Object -First 1
    if ($dbBackup) {
        if ($dbBackup.Extension -eq ".zip") {
            try {
                $null = Expand-Archive -Path $dbBackup.FullName -DestinationPath $env:TEMP -Force
                Write-Success "Database backup verified"
            } catch {
                Write-Error "Database backup is corrupted: $($dbBackup.FullName)"
                $errors++
            }
        } else {
            Write-Success "Database backup verified"
        }
    } else {
        Write-Warning "No database backup found"
    }
    
    # Check if configuration backup exists
    if (Test-Path "$BackupPath/config/$EnvFile") {
        Write-Success "Configuration backup verified"
    } else {
        Write-Warning "No configuration backup found"
    }
    
    # Check if application files backup exists
    $filesBackup = Get-ChildItem -Path "$BackupPath/files" -Filter "*.zip" | Select-Object -First 1
    if ($filesBackup) {
        try {
            $null = Expand-Archive -Path $filesBackup.FullName -DestinationPath $env:TEMP -Force
            Write-Success "Application files backup verified"
        } catch {
            Write-Error "Application files backup is corrupted: $($filesBackup.FullName)"
            $errors++
        }
    } else {
        Write-Warning "No application files backup found"
    }
    
    if ($errors -eq 0) {
        Write-Success "Backup verification completed successfully"
        return $true
    } else {
        Write-Error "Backup verification failed with $errors errors"
        return $false
    }
}

# Create full backup
function New-FullBackup {
    Write-Info "Starting full backup process..."
    
    # Create backup directory structure
    $backupPath = New-BackupStructure
    Write-Info "Backup location: $backupPath"
    
    # Perform backups
    Backup-Database $backupPath
    Backup-Redis $backupPath
    Backup-Config $backupPath
    Backup-Files $backupPath
    
    # Verify backup
    Test-BackupIntegrity $backupPath
    
    # Upload to S3 if configured
    Upload-ToS3 $backupPath
    
    # Clean old backups
    Remove-OldBackups
    
    Write-Success "Full backup completed: $backupPath"
}

# List available backups
function Get-BackupList {
    Write-Info "Available backups:"
    
    if (Test-Path $BackupDir) {
        Get-ChildItem -Path $BackupDir -Directory | Where-Object {
            $_.Name -match "^\d{8}_\d{6}$"
        } | ForEach-Object {
            Write-Host "  $($_.Name) ($($_.CreationTime))"
        }
    } else {
        Write-Warning "No backup directory found"
    }
    
    # List S3 backups if configured
    if ($S3Bucket -and (Get-Command aws -ErrorAction SilentlyContinue)) {
        Write-Info "S3 backups:"
        aws s3 ls "s3://$S3Bucket/memo-app-backups/" | ForEach-Object {
            Write-Host "  $_"
        }
    }
}

# Main function
switch ($Command) {
    "backup" {
        New-FullBackup
    }
    "restore" {
        if (-not $BackupFile) {
            Write-Error "Please specify backup file to restore"
            Write-Host "Usage: .\backup.ps1 restore <backup_file>"
            exit 1
        }
        Restore-Database $BackupFile
    }
    "list" {
        Get-BackupList
    }
    "verify" {
        if (-not $BackupFile) {
            Write-Error "Please specify backup path to verify"
            Write-Host "Usage: .\backup.ps1 verify <backup_path>"
            exit 1
        }
        Test-BackupIntegrity $BackupFile
    }
    "cleanup" {
        Remove-OldBackups
    }
    default {
        Write-Host "Usage: .\backup.ps1 {backup|restore|list|verify|cleanup}"
        Write-Host ""
        Write-Host "Commands:"
        Write-Host "  backup           - Create full backup (default)"
        Write-Host "  restore <file>   - Restore database from backup file"
        Write-Host "  list             - List available backups"
        Write-Host "  verify <path>    - Verify backup integrity"
        Write-Host "  cleanup          - Clean old backups"
        exit 1
    }
}