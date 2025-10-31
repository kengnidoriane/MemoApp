#!/bin/bash

# MemoApp Production Monitoring Script
# This script sets up and manages monitoring and alerting for production deployment

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
MONITORING_COMPOSE="monitoring/docker-compose.monitoring.yml"
GRAFANA_URL="http://localhost:3000"
PROMETHEUS_URL="http://localhost:9090"
ALERTMANAGER_URL="http://localhost:9093"

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

# Setup monitoring stack
setup_monitoring() {
    log_info "Setting up monitoring stack..."
    
    # Create monitoring network if it doesn't exist
    docker network create memo-network 2>/dev/null || true
    
    # Start monitoring services
    docker-compose -f "$MONITORING_COMPOSE" up -d
    
    # Wait for services to be ready
    log_info "Waiting for monitoring services to be ready..."
    sleep 30
    
    # Check service health
    check_monitoring_health
    
    # Setup Grafana dashboards
    setup_grafana_dashboards
    
    log_success "Monitoring stack setup completed"
}

# Check monitoring service health
check_monitoring_health() {
    log_info "Checking monitoring service health..."
    
    local services=("prometheus:9090" "grafana:3000" "alertmanager:9093")
    local all_healthy=true
    
    for service in "${services[@]}"; do
        local name=$(echo "$service" | cut -d':' -f1)
        local port=$(echo "$service" | cut -d':' -f2)
        
        if curl -f "http://localhost:$port" &>/dev/null; then
            log_success "$name is healthy"
        else
            log_error "$name health check failed"
            all_healthy=false
        fi
    done
    
    if [ "$all_healthy" = true ]; then
        log_success "All monitoring services are healthy"
    else
        log_error "Some monitoring services are not healthy"
        return 1
    fi
}

# Setup Grafana dashboards
setup_grafana_dashboards() {
    log_info "Setting up Grafana dashboards..."
    
    # Wait for Grafana to be ready
    local retries=0
    local max_retries=30
    
    while [ $retries -lt $max_retries ]; do
        if curl -f "$GRAFANA_URL/api/health" &>/dev/null; then
            break
        fi
        sleep 2
        ((retries++))
    done
    
    if [ $retries -eq $max_retries ]; then
        log_error "Grafana is not responding"
        return 1
    fi
    
    # Create Prometheus data source
    curl -X POST \
        -H "Content-Type: application/json" \
        -d '{
            "name": "Prometheus",
            "type": "prometheus",
            "url": "http://prometheus:9090",
            "access": "proxy",
            "isDefault": true
        }' \
        "http://admin:admin@localhost:3000/api/datasources" 2>/dev/null || true
    
    log_success "Grafana setup completed"
}

# Generate monitoring report
generate_monitoring_report() {
    log_info "Generating monitoring report..."
    
    local report_file="monitoring_report_$(date +%Y%m%d_%H%M%S).txt"
    
    cat > "$report_file" << EOF
MemoApp Monitoring Report
Generated: $(date)

=== Service Status ===
EOF
    
    # Check main application services
    docker-compose -f docker-compose.prod.yml ps >> "$report_file"
    
    echo "" >> "$report_file"
    echo "=== Monitoring Services ===" >> "$report_file"
    docker-compose -f "$MONITORING_COMPOSE" ps >> "$report_file"
    
    echo "" >> "$report_file"
    echo "=== System Resources ===" >> "$report_file"
    
    # CPU usage
    echo "CPU Usage:" >> "$report_file"
    top -bn1 | grep "Cpu(s)" >> "$report_file"
    
    # Memory usage
    echo "" >> "$report_file"
    echo "Memory Usage:" >> "$report_file"
    free -h >> "$report_file"
    
    # Disk usage
    echo "" >> "$report_file"
    echo "Disk Usage:" >> "$report_file"
    df -h >> "$report_file"
    
    # Docker stats
    echo "" >> "$report_file"
    echo "=== Container Stats ===" >> "$report_file"
    docker stats --no-stream >> "$report_file"
    
    # Recent logs
    echo "" >> "$report_file"
    echo "=== Recent Application Logs ===" >> "$report_file"
    docker-compose -f docker-compose.prod.yml logs --tail=50 backend >> "$report_file"
    
    log_success "Monitoring report generated: $report_file"
}

# Check for alerts
check_alerts() {
    log_info "Checking for active alerts..."
    
    local alerts_response=$(curl -s "$ALERTMANAGER_URL/api/v1/alerts")
    local alert_count=$(echo "$alerts_response" | jq '.data | length' 2>/dev/null || echo "0")
    
    if [ "$alert_count" -gt 0 ]; then
        log_warning "Found $alert_count active alerts"
        echo "$alerts_response" | jq '.data[] | {alertname: .labels.alertname, severity: .labels.severity, summary: .annotations.summary}' 2>/dev/null || echo "Could not parse alerts"
    else
        log_success "No active alerts"
    fi
}

# Performance check
performance_check() {
    log_info "Running performance checks..."
    
    # Check response times
    local frontend_time=$(curl -o /dev/null -s -w '%{time_total}' http://localhost/)
    local backend_time=$(curl -o /dev/null -s -w '%{time_total}' http://localhost/api/health)
    
    echo "Response Times:"
    echo "  Frontend: ${frontend_time}s"
    echo "  Backend API: ${backend_time}s"
    
    # Check if response times are acceptable
    if (( $(echo "$frontend_time > 2.0" | bc -l) )); then
        log_warning "Frontend response time is slow: ${frontend_time}s"
    else
        log_success "Frontend response time is good: ${frontend_time}s"
    fi
    
    if (( $(echo "$backend_time > 1.0" | bc -l) )); then
        log_warning "Backend response time is slow: ${backend_time}s"
    else
        log_success "Backend response time is good: ${backend_time}s"
    fi
    
    # Check database connections
    local db_connections=$(docker-compose -f docker-compose.prod.yml exec -T postgres psql -U memo_user -d memo_app -c "SELECT count(*) FROM pg_stat_activity;" | grep -E '^\s*[0-9]+' | tr -d ' ')
    echo "Database connections: $db_connections"
    
    # Check Redis memory usage
    local redis_memory=$(docker-compose -f docker-compose.prod.yml exec -T redis redis-cli info memory | grep used_memory_human | cut -d':' -f2 | tr -d '\r')
    echo "Redis memory usage: $redis_memory"
}

# Security check
security_check() {
    log_info "Running security checks..."
    
    # Check for exposed ports
    log_info "Checking exposed ports..."
    netstat -tuln | grep LISTEN
    
    # Check SSL certificate (if applicable)
    if command -v openssl &> /dev/null; then
        log_info "Checking SSL certificate..."
        # This would check SSL cert if HTTPS is configured
        # openssl s_client -connect localhost:443 -servername your-domain.com < /dev/null 2>/dev/null | openssl x509 -noout -dates
    fi
    
    # Check for security updates
    log_info "Checking for security updates..."
    if command -v apt &> /dev/null; then
        apt list --upgradable 2>/dev/null | grep -i security || log_success "No security updates available"
    fi
    
    # Check Docker image vulnerabilities (if trivy is installed)
    if command -v trivy &> /dev/null; then
        log_info "Scanning Docker images for vulnerabilities..."
        trivy image memo-app-backend:latest --severity HIGH,CRITICAL --quiet
        trivy image memo-app-frontend:latest --severity HIGH,CRITICAL --quiet
    fi
}

# Cleanup monitoring data
cleanup_monitoring() {
    log_info "Cleaning up old monitoring data..."
    
    # Clean Prometheus data older than retention period
    docker-compose -f "$MONITORING_COMPOSE" exec prometheus \
        promtool query range \
        --start=$(date -d '200 hours ago' --iso-8601) \
        --end=$(date --iso-8601) \
        'up' > /dev/null 2>&1 || true
    
    # Clean Grafana old sessions
    docker-compose -f "$MONITORING_COMPOSE" exec grafana \
        sqlite3 /var/lib/grafana/grafana.db \
        "DELETE FROM session WHERE created_at < datetime('now', '-7 days');" 2>/dev/null || true
    
    log_success "Monitoring data cleanup completed"
}

# Stop monitoring stack
stop_monitoring() {
    log_info "Stopping monitoring stack..."
    
    docker-compose -f "$MONITORING_COMPOSE" down
    
    log_success "Monitoring stack stopped"
}

# Show monitoring URLs
show_monitoring_urls() {
    log_info "Monitoring Dashboard URLs:"
    echo "  Grafana: $GRAFANA_URL (admin/admin)"
    echo "  Prometheus: $PROMETHEUS_URL"
    echo "  AlertManager: $ALERTMANAGER_URL"
    echo "  Node Exporter: http://localhost:9100"
    echo "  cAdvisor: http://localhost:8080"
}

# Main function
main() {
    case "${1:-status}" in
        "setup")
            setup_monitoring
            show_monitoring_urls
            ;;
        "status")
            check_monitoring_health
            check_alerts
            ;;
        "report")
            generate_monitoring_report
            ;;
        "performance")
            performance_check
            ;;
        "security")
            security_check
            ;;
        "cleanup")
            cleanup_monitoring
            ;;
        "stop")
            stop_monitoring
            ;;
        "urls")
            show_monitoring_urls
            ;;
        *)
            echo "Usage: $0 {setup|status|report|performance|security|cleanup|stop|urls}"
            echo ""
            echo "Commands:"
            echo "  setup       - Setup monitoring stack"
            echo "  status      - Check monitoring status and alerts (default)"
            echo "  report      - Generate monitoring report"
            echo "  performance - Run performance checks"
            echo "  security    - Run security checks"
            echo "  cleanup     - Clean old monitoring data"
            echo "  stop        - Stop monitoring stack"
            echo "  urls        - Show monitoring dashboard URLs"
            exit 1
            ;;
    esac
}

# Run main function with all arguments
main "$@"