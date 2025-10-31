#!/bin/bash

# MemoApp Backup and Disaster Recovery Script
# This script handles database backups, file backups, and recovery procedures

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BACKUP_DIR="./backups"
COMPOSE_FILE="docker-compose.prod.yml"
ENV_FILE=".env"
RETENTION_DAYS=30
S3_BUCKET="${BACKUP_S3_BUCKET:-}"
ENCRYPTION_KEY="${BACKUP_ENCRYPTION_KEY:-}"

# Functions
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

# Create backup directory structure
create_backup_structure() {
    local backup_date=$(date +%Y%m%d_%H%M%S)
    local backup_path="$BACKUP_DIR/$backup_date"
    
    mkdir -p "$backup_path/database"
    mkdir -p "$backup_path/files"
    mkdir -p "$backup_path/config"
    
    echo "$backup_path"
}

# Backup database
backup_database() {
    local backup_path=$1
    log_info "Creating database backup..."
    
    # Source environment variables
    source "$ENV_FILE"
    
    # Create database dump
    local db_backup_file="$backup_path/database/memo_app_$(date +%Y%m%d_%H%M%S).sql"
    
    if docker-compose -f "$COMPOSE_FILE" ps postgres | grep -q "Up"; then
        docker-compose -f "$COMPOSE_FILE" exec -T postgres pg_dump \
            -U "$POSTGRES_USER" \
            -d "$POSTGRES_DB" \
            --verbose \
            --no-owner \
            --no-privileges > "$db_backup_file"
        
        # Compress the backup
        gzip "$db_backup_file"
        db_backup_file="${db_backup_file}.gz"
        
        # Encrypt if encryption key is provided
        if [ -n "$ENCRYPTION_KEY" ]; then
            openssl enc -aes-256-cbc -salt -in "$db_backup_file" -out "${db_backup_file}.enc" -k "$ENCRYPTION_KEY"
            rm "$db_backup_file"
            db_backup_file="${db_backup_file}.enc"
        fi
        
        log_success "Database backup created: $db_backup_file"
        echo "$db_backup_file"
    else
        log_error "Database container is not running"
        return 1
    fi
}

# Backup Redis data
backup_redis() {
    local backup_path=$1
    log_info "Creating Redis backup..."
    
    local redis_backup_file="$backup_path/database/redis_$(date +%Y%m%d_%H%M%S).rdb"
    
    if docker-compose -f "$COMPOSE_FILE" ps redis | grep -q "Up"; then
        # Create Redis backup
        docker-compose -f "$COMPOSE_FILE" exec -T redis redis-cli BGSAVE
        
        # Wait for backup to complete
        sleep 5
        
        # Copy the RDB file
        docker-compose -f "$COMPOSE_FILE" exec -T redis cat /data/dump.rdb > "$redis_backup_file"
        
        # Compress the backup
        gzip "$redis_backup_file"
        redis_backup_file="${redis_backup_file}.gz"
        
        log_success "Redis backup created: $redis_backup_file"
        echo "$redis_backup_file"
    else
        log_warning "Redis container is not running, skipping Redis backup"
    fi
}

# Backup configuration files
backup_config() {
    local backup_path=$1
    log_info "Creating configuration backup..."
    
    # Copy important configuration files
    cp "$ENV_FILE" "$backup_path/config/"
    cp "$COMPOSE_FILE" "$backup_path/config/"
    cp -r nginx/ "$backup_path/config/" 2>/dev/null || true
    cp -r monitoring/ "$backup_path/config/" 2>/dev/null || true
    
    # Create a manifest of what was backed up
    cat > "$backup_path/config/manifest.txt" << EOF
Backup created: $(date)
Environment: $(grep NODE_ENV "$ENV_FILE" || echo "NODE_ENV not set")
Database: $(grep POSTGRES_DB "$ENV_FILE" || echo "POSTGRES_DB not set")
Version: $(git rev-parse HEAD 2>/dev/null || echo "Not a git repository")
EOF
    
    log_success "Configuration backup created"
}

# Backup application files
backup_files() {
    local backup_path=$1
    log_info "Creating application files backup..."
    
    # Create tar archive of important directories
    tar -czf "$backup_path/files/application_$(date +%Y%m%d_%H%M%S).tar.gz" \
        --exclude=node_modules \
        --exclude=dist \
        --exclude=build \
        --exclude=.git \
        --exclude=backups \
        --exclude=e2e-results \
        . 2>/dev/null || true
    
    log_success "Application files backup created"
}

# Upload to S3 if configured
upload_to_s3() {
    local backup_path=$1
    
    if [ -n "$S3_BUCKET" ]; then
        log_info "Uploading backup to S3..."
        
        if command -v aws &> /dev/null; then
            local backup_name=$(basename "$backup_path")
            aws s3 sync "$backup_path" "s3://$S3_BUCKET/memo-app-backups/$backup_name" --delete
            log_success "Backup uploaded to S3: s3://$S3_BUCKET/memo-app-backups/$backup_name"
        else
            log_warning "AWS CLI not found, skipping S3 upload"
        fi
    fi
}

# Clean old backups
cleanup_old_backups() {
    log_info "Cleaning up old backups (older than $RETENTION_DAYS days)..."
    
    find "$BACKUP_DIR" -type d -name "20*" -mtime +$RETENTION_DAYS -exec rm -rf {} + 2>/dev/null || true
    
    # Clean S3 backups if configured
    if [ -n "$S3_BUCKET" ] && command -v aws &> /dev/null; then
        local cutoff_date=$(date -d "$RETENTION_DAYS days ago" +%Y%m%d)
        aws s3 ls "s3://$S3_BUCKET/memo-app-backups/" | while read -r line; do
            local backup_date=$(echo "$line" | awk '{print $2}' | cut -d'_' -f1)
            if [[ "$backup_date" < "$cutoff_date" ]]; then
                local backup_name=$(echo "$line" | awk '{print $2}')
                aws s3 rm "s3://$S3_BUCKET/memo-app-backups/$backup_name" --recursive
                log_info "Removed old S3 backup: $backup_name"
            fi
        done
    fi
    
    log_success "Old backups cleaned up"
}

# Restore database from backup
restore_database() {
    local backup_file=$1
    
    if [ ! -f "$backup_file" ]; then
        log_error "Backup file not found: $backup_file"
        return 1
    fi
    
    log_warning "This will replace the current database. Are you sure? (y/N)"
    read -r confirmation
    if [[ ! "$confirmation" =~ ^[Yy]$ ]]; then
        log_info "Database restore cancelled"
        return 0
    fi
    
    log_info "Restoring database from: $backup_file"
    
    # Source environment variables
    source "$ENV_FILE"
    
    # Decrypt if needed
    local restore_file="$backup_file"
    if [[ "$backup_file" == *.enc ]]; then
        if [ -z "$ENCRYPTION_KEY" ]; then
            log_error "Encryption key required to restore encrypted backup"
            return 1
        fi
        restore_file="${backup_file%.enc}"
        openssl enc -aes-256-cbc -d -in "$backup_file" -out "$restore_file" -k "$ENCRYPTION_KEY"
    fi
    
    # Decompress if needed
    if [[ "$restore_file" == *.gz ]]; then
        gunzip -c "$restore_file" > "${restore_file%.gz}"
        restore_file="${restore_file%.gz}"
    fi
    
    # Stop application containers
    docker-compose -f "$COMPOSE_FILE" stop backend frontend
    
    # Restore database
    docker-compose -f "$COMPOSE_FILE" exec -T postgres psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" < "$restore_file"
    
    # Start application containers
    docker-compose -f "$COMPOSE_FILE" start backend frontend
    
    # Clean up temporary files
    if [[ "$backup_file" == *.enc ]] || [[ "$backup_file" == *.gz ]]; then
        rm -f "$restore_file"
    fi
    
    log_success "Database restored successfully"
}

# Verify backup integrity
verify_backup() {
    local backup_path=$1
    log_info "Verifying backup integrity..."
    
    local errors=0
    
    # Check if database backup exists and is valid
    local db_backup=$(find "$backup_path/database" -name "*.sql*" | head -n1)
    if [ -n "$db_backup" ]; then
        if [[ "$db_backup" == *.gz ]]; then
            if ! gzip -t "$db_backup"; then
                log_error "Database backup is corrupted: $db_backup"
                ((errors++))
            fi
        fi
        log_success "Database backup verified"
    else
        log_warning "No database backup found"
    fi
    
    # Check if configuration backup exists
    if [ -f "$backup_path/config/$ENV_FILE" ]; then
        log_success "Configuration backup verified"
    else
        log_warning "No configuration backup found"
    fi
    
    # Check if application files backup exists
    local files_backup=$(find "$backup_path/files" -name "*.tar.gz" | head -n1)
    if [ -n "$files_backup" ]; then
        if tar -tzf "$files_backup" >/dev/null 2>&1; then
            log_success "Application files backup verified"
        else
            log_error "Application files backup is corrupted: $files_backup"
            ((errors++))
        fi
    else
        log_warning "No application files backup found"
    fi
    
    if [ $errors -eq 0 ]; then
        log_success "Backup verification completed successfully"
        return 0
    else
        log_error "Backup verification failed with $errors errors"
        return 1
    fi
}

# Main backup function
create_full_backup() {
    log_info "Starting full backup process..."
    
    # Create backup directory structure
    local backup_path=$(create_backup_structure)
    log_info "Backup location: $backup_path"
    
    # Perform backups
    backup_database "$backup_path"
    backup_redis "$backup_path"
    backup_config "$backup_path"
    backup_files "$backup_path"
    
    # Verify backup
    verify_backup "$backup_path"
    
    # Upload to S3 if configured
    upload_to_s3 "$backup_path"
    
    # Clean old backups
    cleanup_old_backups
    
    log_success "Full backup completed: $backup_path"
}

# List available backups
list_backups() {
    log_info "Available backups:"
    
    if [ -d "$BACKUP_DIR" ]; then
        ls -la "$BACKUP_DIR" | grep "^d" | grep "20" | while read -r line; do
            local backup_name=$(echo "$line" | awk '{print $9}')
            local backup_date=$(echo "$line" | awk '{print $6, $7, $8}')
            echo "  $backup_name ($backup_date)"
        done
    else
        log_warning "No backup directory found"
    fi
    
    # List S3 backups if configured
    if [ -n "$S3_BUCKET" ] && command -v aws &> /dev/null; then
        log_info "S3 backups:"
        aws s3 ls "s3://$S3_BUCKET/memo-app-backups/" | while read -r line; do
            echo "  $(echo "$line" | awk '{print $2}')"
        done
    fi
}

# Main function
main() {
    case "${1:-backup}" in
        "backup")
            create_full_backup
            ;;
        "restore")
            if [ -z "$2" ]; then
                log_error "Please specify backup file to restore"
                echo "Usage: $0 restore <backup_file>"
                exit 1
            fi
            restore_database "$2"
            ;;
        "list")
            list_backups
            ;;
        "verify")
            if [ -z "$2" ]; then
                log_error "Please specify backup path to verify"
                echo "Usage: $0 verify <backup_path>"
                exit 1
            fi
            verify_backup "$2"
            ;;
        "cleanup")
            cleanup_old_backups
            ;;
        *)
            echo "Usage: $0 {backup|restore|list|verify|cleanup}"
            echo ""
            echo "Commands:"
            echo "  backup           - Create full backup (default)"
            echo "  restore <file>   - Restore database from backup file"
            echo "  list             - List available backups"
            echo "  verify <path>    - Verify backup integrity"
            echo "  cleanup          - Clean old backups"
            exit 1
            ;;
    esac
}

# Run main function with all arguments
main "$@"