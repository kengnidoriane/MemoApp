# MemoApp Production Runbook

This runbook provides step-by-step procedures for common production operations, troubleshooting, and incident response.

## Table of Contents

1. [Quick Reference](#quick-reference)
2. [Deployment Procedures](#deployment-procedures)
3. [Monitoring and Alerting](#monitoring-and-alerting)
4. [Backup and Recovery](#backup-and-recovery)
5. [Troubleshooting](#troubleshooting)
6. [Incident Response](#incident-response)
7. [Maintenance Procedures](#maintenance-procedures)
8. [Security Procedures](#security-procedures)

## Quick Reference

### Service URLs
- **Application**: http://localhost (or your domain)
- **API Health**: http://localhost/api/health
- **Grafana**: http://localhost:3000 (admin/admin)
- **Prometheus**: http://localhost:9090
- **AlertManager**: http://localhost:9093

### Key Commands
```bash
# Check service status
./scripts/deploy.sh status

# Check service health
./scripts/deploy.sh health

# Create backup
./scripts/backup.sh backup

# View logs
docker-compose -f docker-compose.prod.yml logs [service]

# Restart service
docker-compose -f docker-compose.prod.yml restart [service]
```

### Emergency Contacts
- **System Administrator**: [Your contact info]
- **Database Administrator**: [DBA contact info]
- **Security Team**: [Security contact info]
- **On-call Engineer**: [On-call contact info]

## Deployment Procedures

### Standard Deployment

1. **Pre-deployment Checklist**
   - [ ] Backup current database
   - [ ] Verify all tests pass
   - [ ] Check monitoring dashboards
   - [ ] Notify team of deployment

2. **Deployment Steps**
   ```bash
   # Create backup
   ./scripts/backup.sh backup
   
   # Deploy new version
   ./scripts/deploy.sh deploy
   
   # Verify deployment
   ./scripts/deploy.sh health
   ```

3. **Post-deployment Verification**
   - [ ] Check application health endpoints
   - [ ] Verify critical user flows work
   - [ ] Monitor error rates and response times
   - [ ] Check database connections

### Rollback Procedure

If deployment fails or issues are detected:

```bash
# Immediate rollback
./scripts/deploy.sh rollback

# Verify rollback
./scripts/deploy.sh health

# Check application functionality
curl -f http://localhost/api/health
```

### Blue-Green Deployment (Advanced)

For zero-downtime deployments:

1. Deploy to staging environment
2. Run full test suite
3. Switch traffic gradually
4. Monitor metrics during switch
5. Complete switch or rollback if issues

## Monitoring and Alerting

### Setting Up Monitoring

```bash
# Setup monitoring stack
./scripts/monitoring.sh setup

# Check monitoring status
./scripts/monitoring.sh status
```

### Key Metrics to Monitor

#### Application Metrics
- **Response Time**: < 2s for frontend, < 1s for API
- **Error Rate**: < 1% for 4xx, < 0.1% for 5xx
- **Throughput**: Requests per second
- **Active Users**: Current active sessions

#### System Metrics
- **CPU Usage**: < 80% sustained
- **Memory Usage**: < 85% of available
- **Disk Usage**: < 90% of available
- **Network I/O**: Monitor for unusual spikes

#### Database Metrics
- **Connection Pool**: < 80% utilization
- **Query Performance**: Slow query log
- **Replication Lag**: < 1 second (if applicable)
- **Lock Waits**: Monitor for deadlocks

### Alert Response Procedures

#### High Priority Alerts

**Service Down**
1. Check service status: `docker-compose ps`
2. Check logs: `docker-compose logs [service]`
3. Restart service if needed: `docker-compose restart [service]`
4. If restart fails, check system resources
5. Escalate if issue persists > 5 minutes

**Database Connection Failed**
1. Check database container: `docker-compose ps postgres`
2. Check database logs: `docker-compose logs postgres`
3. Verify database connectivity: `docker-compose exec postgres psql -U memo_user -d memo_app -c "SELECT 1;"`
4. Check disk space and memory
5. Restart database if needed (with caution)

**High Error Rate**
1. Check application logs for error patterns
2. Check recent deployments
3. Monitor user reports
4. Consider rollback if error rate > 5%

#### Medium Priority Alerts

**High CPU/Memory Usage**
1. Identify resource-intensive processes
2. Check for memory leaks in application
3. Consider scaling if sustained high usage
4. Review recent changes

**Slow Response Times**
1. Check database query performance
2. Review application logs for bottlenecks
3. Check network connectivity
4. Monitor cache hit rates

## Backup and Recovery

### Daily Backup Procedure

```bash
# Automated daily backup (set in cron)
0 2 * * * /path/to/memo-app/scripts/backup.sh backup

# Manual backup
./scripts/backup.sh backup

# Verify backup
./scripts/backup.sh verify /path/to/backup
```

### Recovery Procedures

#### Database Recovery

```bash
# List available backups
./scripts/backup.sh list

# Restore from specific backup
./scripts/backup.sh restore /path/to/backup/file.sql.gz

# Verify restoration
./scripts/deploy.sh health
```

#### Full System Recovery

1. **Prepare new environment**
   ```bash
   # Clone repository
   git clone [repository-url]
   cd memo-app
   ```

2. **Restore configuration**
   ```bash
   # Copy environment file from backup
   cp backups/[date]/config/.env .
   ```

3. **Restore database**
   ```bash
   # Start database only
   docker-compose -f docker-compose.prod.yml up -d postgres redis
   
   # Restore database
   ./scripts/backup.sh restore backups/[date]/database/memo_app_[timestamp].sql.gz
   ```

4. **Start all services**
   ```bash
   ./scripts/deploy.sh deploy
   ```

## Troubleshooting

### Common Issues

#### Application Won't Start

**Symptoms**: Containers exit immediately or fail to start

**Diagnosis**:
```bash
# Check container status
docker-compose -f docker-compose.prod.yml ps

# Check logs
docker-compose -f docker-compose.prod.yml logs [service]

# Check system resources
df -h
free -h
```

**Solutions**:
- Check environment variables in `.env`
- Verify database connectivity
- Check disk space
- Review Docker logs for specific errors

#### Database Connection Issues

**Symptoms**: "Connection refused" or timeout errors

**Diagnosis**:
```bash
# Test database connection
docker-compose -f docker-compose.prod.yml exec postgres psql -U memo_user -d memo_app -c "SELECT 1;"

# Check database logs
docker-compose -f docker-compose.prod.yml logs postgres

# Check network connectivity
docker network ls
```

**Solutions**:
- Verify database credentials in `.env`
- Check if database container is running
- Verify network configuration
- Check firewall rules

#### High Memory Usage

**Symptoms**: System becomes slow, out of memory errors

**Diagnosis**:
```bash
# Check memory usage
free -h
docker stats

# Check for memory leaks
docker-compose -f docker-compose.prod.yml exec backend node --expose-gc -e "global.gc(); console.log(process.memoryUsage());"
```

**Solutions**:
- Restart memory-intensive containers
- Check for memory leaks in application code
- Increase system memory if needed
- Optimize database queries

#### SSL Certificate Issues

**Symptoms**: HTTPS not working, certificate warnings

**Diagnosis**:
```bash
# Check certificate expiration
openssl x509 -in /path/to/cert.pem -text -noout | grep "Not After"

# Test SSL connection
openssl s_client -connect your-domain.com:443 -servername your-domain.com
```

**Solutions**:
- Renew SSL certificate
- Update nginx configuration
- Restart nginx container

### Performance Issues

#### Slow Database Queries

**Diagnosis**:
```sql
-- Check slow queries
SELECT query, mean_time, calls 
FROM pg_stat_statements 
ORDER BY mean_time DESC 
LIMIT 10;

-- Check active connections
SELECT * FROM pg_stat_activity;
```

**Solutions**:
- Add database indexes
- Optimize query patterns
- Increase connection pool size
- Consider read replicas

#### High API Response Times

**Diagnosis**:
- Check application logs for bottlenecks
- Monitor database query times
- Check external service dependencies
- Review caching effectiveness

**Solutions**:
- Optimize slow endpoints
- Implement caching
- Scale horizontally
- Optimize database queries

## Incident Response

### Incident Classification

#### Severity 1 (Critical)
- Complete service outage
- Data loss or corruption
- Security breach
- Response time: Immediate

#### Severity 2 (High)
- Partial service outage
- Significant performance degradation
- Authentication issues
- Response time: 15 minutes

#### Severity 3 (Medium)
- Minor feature issues
- Performance issues affecting some users
- Non-critical bugs
- Response time: 2 hours

#### Severity 4 (Low)
- Cosmetic issues
- Enhancement requests
- Documentation updates
- Response time: Next business day

### Incident Response Process

1. **Detection and Alert**
   - Monitor alerts from monitoring systems
   - User reports
   - Automated health checks

2. **Initial Response**
   - Acknowledge incident
   - Assess severity
   - Notify stakeholders
   - Begin investigation

3. **Investigation and Diagnosis**
   - Gather logs and metrics
   - Identify root cause
   - Document findings

4. **Resolution**
   - Implement fix
   - Test resolution
   - Monitor for recurrence

5. **Post-Incident**
   - Document incident
   - Conduct post-mortem
   - Implement preventive measures

### Communication Templates

#### Incident Notification
```
INCIDENT ALERT - [Severity Level]
Service: MemoApp
Issue: [Brief description]
Impact: [User impact description]
Status: Investigating
ETA: [Estimated resolution time]
Updates: Will provide updates every 30 minutes
```

#### Resolution Notification
```
INCIDENT RESOLVED
Service: MemoApp
Issue: [Brief description]
Resolution: [What was done to fix]
Duration: [Total downtime]
Next Steps: [Any follow-up actions]
```

## Maintenance Procedures

### Regular Maintenance Tasks

#### Daily
- [ ] Check service health
- [ ] Review monitoring dashboards
- [ ] Check backup completion
- [ ] Review error logs

#### Weekly
- [ ] Update security patches
- [ ] Review performance metrics
- [ ] Clean up old logs
- [ ] Test backup restoration

#### Monthly
- [ ] Review capacity planning
- [ ] Update dependencies
- [ ] Security audit
- [ ] Disaster recovery test

### Planned Maintenance

#### Preparation
1. Schedule maintenance window
2. Notify users in advance
3. Prepare rollback plan
4. Create maintenance checklist

#### During Maintenance
1. Put application in maintenance mode
2. Create backup
3. Perform maintenance tasks
4. Test functionality
5. Remove maintenance mode

#### Post-Maintenance
1. Monitor system performance
2. Verify all services are working
3. Update documentation
4. Notify completion

### System Updates

#### Operating System Updates
```bash
# Check for updates
sudo apt update && sudo apt list --upgradable

# Install security updates
sudo apt upgrade

# Reboot if kernel updated
sudo reboot
```

#### Docker Updates
```bash
# Update Docker images
docker-compose -f docker-compose.prod.yml pull

# Recreate containers with new images
docker-compose -f docker-compose.prod.yml up -d --force-recreate
```

#### Application Updates
```bash
# Pull latest code
git pull origin main

# Rebuild and deploy
./scripts/deploy.sh deploy
```

## Security Procedures

### Security Monitoring

#### Daily Security Checks
- [ ] Review authentication logs
- [ ] Check for failed login attempts
- [ ] Monitor unusual traffic patterns
- [ ] Review security alerts

#### Weekly Security Tasks
- [ ] Update security patches
- [ ] Review user access logs
- [ ] Check SSL certificate status
- [ ] Scan for vulnerabilities

### Security Incident Response

#### Suspected Security Breach
1. **Immediate Actions**
   - Isolate affected systems
   - Preserve evidence
   - Notify security team
   - Document timeline

2. **Investigation**
   - Analyze logs
   - Identify attack vector
   - Assess data exposure
   - Determine scope

3. **Containment**
   - Block malicious traffic
   - Patch vulnerabilities
   - Reset compromised credentials
   - Update security rules

4. **Recovery**
   - Restore from clean backups
   - Verify system integrity
   - Monitor for reinfection
   - Update security measures

### Access Management

#### User Access Review
- Review user accounts monthly
- Remove inactive accounts
- Verify access permissions
- Update authentication policies

#### Credential Management
- Rotate passwords regularly
- Use strong, unique passwords
- Enable two-factor authentication
- Store secrets securely

---

## Emergency Procedures

### Complete System Failure

1. **Assess Situation**
   - Determine scope of failure
   - Check infrastructure status
   - Identify critical systems

2. **Immediate Response**
   - Activate incident response team
   - Notify stakeholders
   - Begin recovery procedures

3. **Recovery Steps**
   - Restore from backups
   - Verify data integrity
   - Test critical functions
   - Gradually restore services

4. **Communication**
   - Keep stakeholders informed
   - Provide regular updates
   - Document lessons learned

### Contact Information

**Emergency Escalation**
1. On-call Engineer: [Phone/Email]
2. System Administrator: [Phone/Email]
3. Database Administrator: [Phone/Email]
4. Security Team: [Phone/Email]
5. Management: [Phone/Email]

**External Contacts**
- Cloud Provider Support: [Contact info]
- DNS Provider: [Contact info]
- SSL Certificate Provider: [Contact info]
- Monitoring Service: [Contact info]

---

*This runbook should be reviewed and updated regularly to ensure accuracy and completeness.*