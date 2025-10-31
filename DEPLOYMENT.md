# MemoApp Production Deployment Guide

This guide covers the complete production deployment process for MemoApp, including Docker containerization, monitoring, and maintenance procedures.

## Prerequisites

### System Requirements
- **Operating System**: Linux (Ubuntu 20.04+ recommended) or Windows with WSL2
- **Docker**: Version 20.10+
- **Docker Compose**: Version 2.0+
- **Memory**: Minimum 4GB RAM (8GB+ recommended)
- **Storage**: Minimum 20GB free space
- **Network**: Ports 80, 443, 3001, 5432, 6379 available

### Required Services
- **PostgreSQL**: Database server
- **Redis**: Caching and job queues
- **SMTP Server**: Email notifications
- **Domain**: For production deployment (optional for local testing)

## Quick Start

### 1. Clone and Setup
```bash
git clone <repository-url>
cd memo-app
```

### 2. Environment Configuration
```bash
# Copy production environment template
cp .env.production .env

# Edit environment variables
nano .env  # or your preferred editor
```

### 3. Deploy
```bash
# Linux/macOS
./scripts/deploy.sh deploy

# Windows PowerShell
.\scripts\deploy.ps1 deploy
```

## Detailed Configuration

### Environment Variables

#### Database Configuration
```env
POSTGRES_DB=memo_app_prod
POSTGRES_USER=memo_user
POSTGRES_PASSWORD=your-secure-database-password
```

#### Security Configuration
```env
JWT_SECRET=your-super-secure-jwt-secret-key-at-least-32-characters-long
JWT_REFRESH_SECRET=your-super-secure-refresh-secret-key-at-least-32-characters-long
```

#### Email Configuration
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
FROM_EMAIL=noreply@your-domain.com
```

#### Push Notifications
```bash
# Generate VAPID keys
cd apps/backend
npm run generate-vapid-keys
```

### SSL/TLS Configuration

#### Using Let's Encrypt (Recommended)
```bash
# Install certbot
sudo apt-get install certbot

# Generate certificates
sudo certbot certonly --standalone -d your-domain.com

# Update nginx configuration to use SSL
# Uncomment SSL sections in nginx/nginx-lb.conf
```

#### Using Custom Certificates
```bash
# Place certificates in nginx/ssl/
mkdir -p nginx/ssl
cp your-cert.pem nginx/ssl/cert.pem
cp your-key.pem nginx/ssl/key.pem
```

## Deployment Commands

### Full Deployment
```bash
# Deploy with all services
./scripts/deploy.sh deploy
```

### Individual Operations
```bash
# Check service health
./scripts/deploy.sh health

# Create database backup
./scripts/deploy.sh backup

# View deployment status
./scripts/deploy.sh status

# Rollback deployment
./scripts/deploy.sh rollback
```

## Service Architecture

### Container Services
- **Frontend**: React PWA with nginx
- **Backend**: Node.js API server
- **Database**: PostgreSQL with persistent storage
- **Cache**: Redis for sessions and job queues
- **Load Balancer**: nginx reverse proxy

### Network Configuration
```
Internet → nginx-lb:8080 → frontend:80 → backend:3001
                         ↓
                    postgres:5432
                    redis:6379
```

### Health Checks
- **Backend**: `http://localhost:3001/api/health`
- **Frontend**: `http://localhost/health`
- **Load Balancer**: `http://localhost:8080/health`

## Monitoring and Alerting

### Setup Monitoring Stack
```bash
# Start monitoring services
docker-compose -f monitoring/docker-compose.monitoring.yml up -d
```

### Access Monitoring Dashboards
- **Grafana**: http://localhost:3000 (admin/admin)
- **Prometheus**: http://localhost:9090
- **AlertManager**: http://localhost:9093

### Key Metrics
- **Application Performance**: Response times, error rates
- **System Resources**: CPU, memory, disk usage
- **Database**: Connection pool, query performance
- **User Activity**: Active users, feature usage

## Backup and Recovery

### Automated Backups
```bash
# Setup daily backups (cron job)
0 2 * * * /path/to/memo-app/scripts/deploy.sh backup
```

### Manual Backup
```bash
# Create immediate backup
./scripts/deploy.sh backup
```

### Restore from Backup
```bash
# List available backups
ls -la backups/

# Restore specific backup
docker-compose -f docker-compose.prod.yml exec postgres psql -U memo_user -d memo_app < backups/backup_file.sql
```

## Security Considerations

### Network Security
- Use firewall to restrict access to necessary ports only
- Enable fail2ban for SSH protection
- Use VPN for administrative access

### Application Security
- Regularly update Docker images
- Use strong passwords and JWT secrets
- Enable HTTPS in production
- Implement rate limiting
- Regular security audits

### Data Protection
- Encrypt database backups
- Use encrypted storage volumes
- Implement data retention policies
- GDPR compliance features enabled

## Performance Optimization

### Database Optimization
```sql
-- Create indexes for better performance
CREATE INDEX CONCURRENTLY idx_memos_user_id ON memos(user_id);
CREATE INDEX CONCURRENTLY idx_memos_created_at ON memos(created_at);
CREATE INDEX CONCURRENTLY idx_memos_next_review ON memos(next_review_at);
```

### Caching Strategy
- Redis for session storage
- Application-level caching for frequent queries
- CDN for static assets (recommended)

### Scaling Considerations
- Horizontal scaling with multiple backend instances
- Database read replicas for high traffic
- Load balancer configuration for multiple frontends

## Troubleshooting

### Common Issues

#### Service Won't Start
```bash
# Check logs
docker-compose -f docker-compose.prod.yml logs [service-name]

# Check service status
docker-compose -f docker-compose.prod.yml ps
```

#### Database Connection Issues
```bash
# Test database connection
docker-compose -f docker-compose.prod.yml exec postgres psql -U memo_user -d memo_app -c "SELECT 1;"

# Check database logs
docker-compose -f docker-compose.prod.yml logs postgres
```

#### High Memory Usage
```bash
# Check container resource usage
docker stats

# Restart services if needed
docker-compose -f docker-compose.prod.yml restart
```

### Log Locations
- **Application Logs**: `docker-compose logs [service]`
- **nginx Logs**: `/var/log/nginx/` (inside container)
- **System Logs**: `/var/log/syslog`

## Maintenance

### Regular Tasks
- **Daily**: Check service health, review logs
- **Weekly**: Update security patches, backup verification
- **Monthly**: Performance review, capacity planning
- **Quarterly**: Security audit, dependency updates

### Update Procedure
```bash
# 1. Create backup
./scripts/deploy.sh backup

# 2. Pull latest code
git pull origin main

# 3. Rebuild and deploy
./scripts/deploy.sh deploy

# 4. Verify deployment
./scripts/deploy.sh health
```

### Scaling Up
```bash
# Scale backend instances
docker-compose -f docker-compose.prod.yml up -d --scale backend=3

# Update load balancer configuration
# Edit nginx/nginx-lb.conf to include new instances
```

## Support and Documentation

### Health Check Endpoints
- **Application Health**: `/api/health`
- **Database Status**: Included in health response
- **Service Metrics**: `/api/metrics` (if enabled)

### Configuration Files
- **Docker Compose**: `docker-compose.prod.yml`
- **nginx Config**: `nginx/nginx-lb.conf`
- **Environment**: `.env`
- **Monitoring**: `monitoring/prometheus.yml`

### Getting Help
1. Check application logs first
2. Review this documentation
3. Check GitHub issues
4. Contact system administrator

---

**Note**: This deployment guide assumes a production environment. For development setup, refer to the main README.md file.