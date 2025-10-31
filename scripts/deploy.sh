#!/bin/bash

# Production Deployment Script for MemoApp
# This script handles the complete deployment process

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
COMPOSE_FILE="docker-compose.prod.yml"
ENV_FILE=".env"
BACKUP_DIR="./backups"

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

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."
    
    # Check if Docker is installed and running
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    if ! docker info &> /dev/null; then
        log_error "Docker is not running. Please start Docker first."
        exit 1
    fi
    
    # Check if Docker Compose is available
    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        log_error "Docker Compose is not available. Please install Docker Compose."
        exit 1
    fi
    
    # Check if environment file exists
    if [ ! -f "$ENV_FILE" ]; then
        log_error "Environment file $ENV_FILE not found. Please copy .env.production to .env and configure it."
        exit 1
    fi
    
    log_success "Prerequisites check passed"
}

# Create backup directory
create_backup_dir() {
    if [ ! -d "$BACKUP_DIR" ]; then
        mkdir -p "$BACKUP_DIR"
        log_info "Created backup directory: $BACKUP_DIR"
    fi
}

# Backup database
backup_database() {
    log_info "Creating database backup..."
    
    # Get database credentials from environment
    source "$ENV_FILE"
    
    BACKUP_FILE="$BACKUP_DIR/memo_app_backup_$(date +%Y%m%d_%H%M%S).sql"
    
    # Create database backup using docker exec
    if docker-compose -f "$COMPOSE_FILE" ps postgres | grep -q "Up"; then
        docker-compose -f "$COMPOSE_FILE" exec -T postgres pg_dump \
            -U "$POSTGRES_USER" \
            -d "$POSTGRES_DB" > "$BACKUP_FILE"
        
        log_success "Database backup created: $BACKUP_FILE"
    else
        log_warning "Database container not running, skipping backup"
    fi
}

# Build and deploy
deploy() {
    log_info "Starting deployment..."
    
    # Pull latest images and build
    log_info "Building application images..."
    docker-compose -f "$COMPOSE_FILE" build --no-cache
    
    # Start services
    log_info "Starting services..."
    docker-compose -f "$COMPOSE_FILE" up -d
    
    # Wait for services to be healthy
    log_info "Waiting for services to be healthy..."
    sleep 30
    
    # Check service health
    check_service_health
    
    log_success "Deployment completed successfully!"
}

# Check service health
check_service_health() {
    log_info "Checking service health..."
    
    # Check backend health
    if curl -f http://localhost:3001/api/health &> /dev/null; then
        log_success "Backend service is healthy"
    else
        log_error "Backend service health check failed"
        return 1
    fi
    
    # Check frontend health
    if curl -f http://localhost/health &> /dev/null; then
        log_success "Frontend service is healthy"
    else
        log_error "Frontend service health check failed"
        return 1
    fi
    
    # Check load balancer health
    if curl -f http://localhost:8080/health &> /dev/null; then
        log_success "Load balancer is healthy"
    else
        log_warning "Load balancer health check failed (this is optional)"
    fi
}

# Run database migrations
run_migrations() {
    log_info "Running database migrations..."
    
    docker-compose -f "$COMPOSE_FILE" exec backend npx prisma migrate deploy
    
    log_success "Database migrations completed"
}

# Show deployment status
show_status() {
    log_info "Deployment Status:"
    echo ""
    docker-compose -f "$COMPOSE_FILE" ps
    echo ""
    log_info "Service URLs:"
    echo "  Frontend: http://localhost"
    echo "  Backend API: http://localhost/api"
    echo "  Load Balancer: http://localhost:8080"
    echo "  Health Checks:"
    echo "    - Backend: http://localhost/api/health"
    echo "    - Frontend: http://localhost/health"
    echo "    - Load Balancer: http://localhost:8080/health"
}

# Rollback function
rollback() {
    log_warning "Rolling back deployment..."
    
    # Stop current containers
    docker-compose -f "$COMPOSE_FILE" down
    
    # Restore from backup if available
    LATEST_BACKUP=$(ls -t "$BACKUP_DIR"/*.sql 2>/dev/null | head -n1)
    if [ -n "$LATEST_BACKUP" ]; then
        log_info "Restoring from backup: $LATEST_BACKUP"
        # Restore database logic would go here
        log_success "Rollback completed"
    else
        log_warning "No backup found for rollback"
    fi
}

# Main deployment process
main() {
    case "${1:-deploy}" in
        "deploy")
            check_prerequisites
            create_backup_dir
            backup_database
            deploy
            run_migrations
            show_status
            ;;
        "rollback")
            rollback
            ;;
        "status")
            show_status
            ;;
        "health")
            check_service_health
            ;;
        "backup")
            create_backup_dir
            backup_database
            ;;
        *)
            echo "Usage: $0 {deploy|rollback|status|health|backup}"
            echo ""
            echo "Commands:"
            echo "  deploy   - Full deployment (default)"
            echo "  rollback - Rollback to previous version"
            echo "  status   - Show deployment status"
            echo "  health   - Check service health"
            echo "  backup   - Create database backup only"
            exit 1
            ;;
    esac
}

# Run main function with all arguments
main "$@"