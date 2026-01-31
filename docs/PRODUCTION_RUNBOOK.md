# Production Runbook

## 1. System Overview

### Architecture

**Liyaqa** is a multi-tenant B2B SaaS platform for gym and fitness club management.

**Technology Stack:**
- **Backend:** Spring Boot 4, Kotlin, PostgreSQL 15+
- **Frontend:** Next.js 15, React 19, TypeScript
- **Infrastructure:** Docker, Docker Compose
- **Monitoring:** Prometheus, Grafana, Loki, Zipkin
- **Alerting:** Alertmanager with Slack integration

### Service Inventory

| Service | Port | Purpose | Health Check |
|---------|------|---------|--------------|
| **Backend** | 8080 | Spring Boot API | `http://localhost:8080/api/health` |
| **Frontend** | 3000 | Next.js web app | `http://localhost:3000` |
| **PostgreSQL** | 5432 | Primary database | `pg_isready -h localhost -p 5432` |
| **Prometheus** | 9090 | Metrics collection | `http://localhost:9090/-/healthy` |
| **Grafana** | 3001 | Metrics visualization | `http://localhost:3001/api/health` |
| **Loki** | 3100 | Log aggregation | `http://localhost:3100/ready` |
| **Promtail** | 9080 | Log shipping | `http://localhost:9080/ready` |
| **Alertmanager** | 9093 | Alert routing | `http://localhost:9093/-/healthy` |
| **Zipkin** | 9411 | Distributed tracing | `http://localhost:9411/health` |

### Network Topology

```
Internet
   │
   ├──> Port 443 (HTTPS) ──> Frontend (Next.js)
   │                             │
   │                             ▼
   └──> Port 443 (HTTPS) ──> Backend API (Spring Boot)
                                 │
                                 ├──> PostgreSQL (internal)
                                 ├──> Prometheus (internal)
                                 └──> Zipkin (internal)
```

### Access Controls

**Production Access:**
- SSH: Key-based authentication only (port 22)
- Database: Internal network only (no public access)
- Monitoring: VPN or IP whitelist required
- Application: HTTPS only (HTTP redirects to HTTPS)

**Required Permissions:**
- **DevOps:** Full server access via SSH
- **Backend Team:** Database read access, log access
- **Frontend Team:** Log access
- **Support:** Application-level access only

---

## 2. Daily Operations

### 2.1 Service Management

#### Start All Services

```bash
# From project root
cd /opt/liyaqa
docker compose up -d

# Verify all services started
docker compose ps
```

#### Stop All Services

```bash
# Graceful shutdown
docker compose down

# Force stop if needed
docker compose kill
docker compose down
```

#### Restart Specific Service

```bash
# Restart backend only
docker compose restart backend

# Restart with rebuild (if configuration changed)
docker compose up -d --build backend
```

#### Health Check Verification

```bash
# Backend health
curl http://localhost:8080/api/health

# Expected response:
# {"status":"UP","timestamp":"2026-01-31T..."}

# Detailed health with components
curl http://localhost:8080/actuator/health

# Database connectivity
curl http://localhost:8080/health/ready
```

#### Service Status Check

```bash
# Check all containers
docker compose ps

# Check specific service logs
docker compose logs backend --tail 100 -f

# Check resource usage
docker stats --no-stream
```

### 2.2 Monitoring & Alerts

#### Dashboard Access

| Dashboard | URL | Purpose |
|-----------|-----|---------|
| **Grafana** | http://localhost:3001 | Metrics visualization |
| **Prometheus** | http://localhost:9090 | Metrics data source |
| **Alertmanager** | http://localhost:9093 | Alert management |
| **Zipkin** | http://localhost:9411 | Distributed tracing |

**Grafana Credentials:**
- Default: `admin / admin` (change on first login)
- Production: Use configured credentials from secrets

#### Key Metrics to Monitor

**Application Metrics:**
- Request rate (should be steady during business hours)
- Error rate (should be <1%)
- Response time p95 (should be <500ms)
- Active users (monitor for unusual spikes)

**Infrastructure Metrics:**
- JVM heap usage (alert at 90%)
- Database connections (alert at 80% of pool)
- Disk space (alert at 80% usage)
- CPU usage (alert at 90%)

#### Alert Acknowledgment Procedures

1. **Review Alert in Slack**
   - Check #liyaqa-alerts or #liyaqa-critical channel
   - Note alert name, severity, timestamp

2. **Acknowledge in Alertmanager**
   ```bash
   # Access Alertmanager UI
   open http://localhost:9093

   # Or use amtool CLI
   amtool alert --alertmanager.url=http://localhost:9093
   ```

3. **Investigate Root Cause**
   - Check Grafana dashboards
   - Review logs in Loki/Grafana
   - Check recent deployments
   - Check external dependencies

4. **Take Action**
   - Resolve issue (see troubleshooting section)
   - Document findings
   - Update alert if threshold needs adjustment

#### Alert Escalation Matrix

| Alert Severity | Response Time | Escalation Path |
|---------------|---------------|-----------------|
| **Critical** | 15 min | DevOps → Backend Lead → CTO |
| **High** | 1 hour | DevOps → Backend Team |
| **Medium** | 4 hours | DevOps |
| **Low** | Next business day | DevOps |

### 2.3 Database Operations

#### Connect to Database

```bash
# Via Docker exec
docker exec -it liyaqa-postgres psql -U liyaqa -d liyaqa

# Via local psql (if installed)
psql -h localhost -p 5432 -U liyaqa -d liyaqa
```

#### Check Database Health

```sql
-- Check database size
SELECT pg_size_pretty(pg_database_size('liyaqa'));

-- Check active connections
SELECT COUNT(*) FROM pg_stat_activity WHERE datname = 'liyaqa';

-- Check connection limit
SELECT setting::int FROM pg_settings WHERE name = 'max_connections';

-- Check table sizes
SELECT schemaname, tablename,
       pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
LIMIT 10;
```

#### Running Migrations

Migrations run automatically via Flyway on application startup.

```bash
# Check migration status
docker exec liyaqa-postgres psql -U liyaqa -d liyaqa -c \
  "SELECT installed_rank, version, description, installed_on, success
   FROM flyway_schema_history
   ORDER BY installed_rank DESC
   LIMIT 10;"

# Force re-run failed migration (CAUTION)
# 1. Fix migration file
# 2. Delete failed entry from flyway_schema_history
# 3. Restart application
```

#### Backup Verification

```bash
# Check recent backups
ls -lh /var/backups/liyaqa/

# Verify latest backup
/opt/liyaqa/backend/scripts/verify-backup.sh

# Expected output:
# ✓ Backup file exists: /var/backups/liyaqa/liyaqa_20260131_020000.sql.gz
# ✓ Backup file size: 45M
# ✓ Backup file age: 6 hours
# ✓ Backup integrity verified
```

#### Index Maintenance

```sql
-- List unused indexes
SELECT schemaname, tablename, indexname, idx_scan
FROM pg_stat_user_indexes
WHERE idx_scan = 0
  AND indexname NOT LIKE '%pkey';

-- Reindex table (during low traffic)
REINDEX TABLE members;

-- Reindex all tables in database (during maintenance window)
REINDEX DATABASE liyaqa;
```

#### Vacuum Procedures

```sql
-- Check last vacuum/analyze times
SELECT schemaname, relname, last_vacuum, last_autovacuum, last_analyze, last_autoanalyze
FROM pg_stat_user_tables
ORDER BY last_vacuum DESC NULLS LAST;

-- Manual vacuum (recovers space)
VACUUM VERBOSE members;

-- Vacuum with analyze (updates statistics)
VACUUM ANALYZE members;

-- Full vacuum (requires table lock - use during maintenance)
VACUUM FULL members;
```

---

## 3. Common Troubleshooting

### 3.1 Service Down

**Symptoms:**
- Health check fails: `curl http://localhost:8080/api/health` returns error
- Service unreachable from frontend
- Alert: `ServiceDown` firing

**Diagnosis:**

```bash
# 1. Check if container is running
docker ps | grep liyaqa-backend

# 2. Check container logs for errors
docker logs liyaqa-backend --tail 100

# 3. Check resource usage
docker stats liyaqa-backend --no-stream

# 4. Check if port is listening
netstat -tulpn | grep 8080
# or
ss -tulpn | grep 8080
```

**Resolution:**

```bash
# 1. Restart service
docker compose restart backend

# 2. If restart fails, check logs
docker logs liyaqa-backend --tail 200

# 3. Check database connectivity
docker exec liyaqa-backend curl http://localhost:8080/actuator/health

# 4. If database issue, restart database
docker compose restart postgres

# 5. If configuration issue, verify environment variables
docker exec liyaqa-backend env | grep SPRING_

# 6. Escalate if unresolved after 15 minutes
```

**Common Causes:**
- Database connection failure
- Out of memory (JVM heap exhausted)
- Port already in use
- Missing environment variables
- Failed migration

### 3.2 High Error Rate

**Symptoms:**
- Alert: `HighErrorRate` firing (>5% errors)
- Error logs in Loki
- User reports of 500 errors

**Diagnosis:**

```bash
# 1. Check error logs in Loki (via Grafana)
# Navigate to Grafana > Explore > Loki
# Query: {app="liyaqa-backend"} |= "ERROR"

# 2. Check error rate in Prometheus
# Query: rate(http_server_requests_total{status=~"5.."}[5m])

# 3. Check response time metrics
# Query: histogram_quantile(0.95, rate(http_server_requests_seconds_bucket[5m]))

# 4. Check database connection pool
# Query: hikaricp_connections_active / hikaricp_connections_max

# 5. Check for specific error patterns
docker logs liyaqa-backend | grep ERROR | tail -50
```

**Resolution:**

1. **Identify Error Pattern**
   - Specific endpoint? (e.g., `/api/members`)
   - Time-based? (e.g., every 5 minutes)
   - User-based? (e.g., specific tenant)

2. **Check Recent Deployments**
   ```bash
   # Check deployment history
   git log --oneline -10

   # If recent deployment, consider rollback
   # See DEPLOYMENT_GUIDE.md for rollback procedures
   ```

3. **Scale Resources if Load-Related**
   ```bash
   # Check CPU/memory usage
   docker stats liyaqa-backend

   # Increase JVM heap if needed (edit docker-compose.yml)
   # JAVA_OPTS: "-Xms2g -Xmx4g"

   # Restart with new settings
   docker compose up -d backend
   ```

4. **Fix and Deploy if Code Issue**
   - Create hotfix branch
   - Fix issue
   - Test in staging
   - Deploy to production (see DEPLOYMENT_GUIDE.md)

### 3.3 Slow Performance

**Symptoms:**
- Alert: `SlowResponseTime` firing (p95 >1s)
- Users report slow page loads
- High response times in Grafana

**Diagnosis:**

```bash
# 1. Check p95 response time in Grafana
# Dashboard: Application Metrics
# Panel: Response Time (p95, p99)

# 2. Check database slow queries
docker exec liyaqa-postgres psql -U liyaqa -d liyaqa -c \
  "SELECT * FROM slow_queries LIMIT 10;"

# 3. Check JVM metrics (GC, heap)
curl http://localhost:8080/actuator/metrics/jvm.gc.pause | jq

# 4. Check external API latency (if applicable)
# Review distributed traces in Zipkin
open http://localhost:9411

# 5. Check for N+1 query problems
# Review logs for multiple similar queries
docker logs liyaqa-backend | grep "Hibernate:" | tail -100
```

**Resolution:**

1. **Review Slow Queries**
   ```sql
   -- Find slow queries
   SELECT * FROM slow_queries ORDER BY mean_exec_time DESC LIMIT 10;

   -- Analyze query plan
   EXPLAIN ANALYZE SELECT * FROM members WHERE email = 'test@example.com';
   ```

2. **Add Indexes if Needed**
   ```sql
   -- Create index concurrently (no table lock)
   CREATE INDEX CONCURRENTLY idx_members_email ON members(email);
   ```

3. **Increase JVM Heap if Memory Pressure**
   ```yaml
   # docker-compose.yml
   backend:
     environment:
       JAVA_OPTS: "-Xms2g -Xmx4g"  # Increase from default
   ```

4. **Scale Horizontally if CPU-Bound**
   - Add load balancer (nginx)
   - Run multiple backend instances
   - Update database connection pool

### 3.4 Database Connection Pool Exhausted

**Symptoms:**
- Error logs: "Connection pool exhausted"
- Alert: `DatabaseConnectionPoolHigh` firing (>80%)
- Application hanging on database operations

**Diagnosis:**

```bash
# 1. Check active connections
docker exec liyaqa-postgres psql -U liyaqa -d liyaqa -c \
  "SELECT COUNT(*) FROM pg_stat_activity WHERE datname='liyaqa';"

# 2. Check HikariCP metrics
curl http://localhost:8080/actuator/metrics/hikaricp.connections.active | jq
curl http://localhost:8080/actuator/metrics/hikaricp.connections.max | jq

# 3. Check for connection leaks
docker logs liyaqa-backend | grep "Connection leak"

# 4. Check long-running queries
docker exec liyaqa-postgres psql -U liyaqa -d liyaqa -c \
  "SELECT pid, now() - query_start AS duration, query
   FROM pg_stat_activity
   WHERE state = 'active' AND query NOT LIKE '%pg_stat_activity%'
   ORDER BY duration DESC;"
```

**Resolution:**

```bash
# 1. Restart backend service (releases connections)
docker compose restart backend

# 2. If persistent, increase pool size
# Edit backend/src/main/resources/application.yml
# spring.datasource.hikari.maximum-pool-size: 50  # Increase from 30

# 3. Fix connection leaks in code if detected
# Review code for unclosed connections
# Ensure @Transactional annotations are correct

# 4. Kill long-running queries if needed
docker exec liyaqa-postgres psql -U liyaqa -d liyaqa -c \
  "SELECT pg_terminate_backend(pid) FROM pg_stat_activity
   WHERE datname='liyaqa' AND state='active' AND now()-query_start > interval '10 minutes';"
```

### 3.5 Disk Space Full

**Symptoms:**
- Error: "No space left on device"
- Alert: `DiskSpaceLow` firing (<20% free)
- Application fails to write logs or backups

**Diagnosis:**

```bash
# 1. Check disk usage
df -h

# 2. Find large directories
du -sh /* 2>/dev/null | sort -h | tail -20

# 3. Check Docker disk usage
docker system df

# 4. Check log files
du -sh /var/log/* | sort -h | tail -10

# 5. Check backups
du -sh /var/backups/liyaqa/*
```

**Resolution:**

```bash
# 1. Clean old backups (>30 days)
find /var/backups/liyaqa/ -name "*.sql.gz" -mtime +30 -delete

# 2. Rotate/compress logs
journalctl --vacuum-time=7d
docker logs liyaqa-backend --tail 1000 > /tmp/recent.log
docker compose restart backend  # Truncates old logs

# 3. Prune unused Docker resources
docker system prune -a --volumes -f

# 4. Clean old Docker images
docker image prune -a -f

# 5. Increase disk if legitimate growth
# Resize DigitalOcean volume via dashboard
# Then resize filesystem
sudo resize2fs /dev/vda1
```

### 3.6 Authentication Failures

**Symptoms:**
- Users unable to login
- Error: "Invalid credentials" or "JWT token expired"
- 401 Unauthorized responses

**Diagnosis:**

```bash
# 1. Check authentication logs
docker logs liyaqa-backend | grep "Authentication failed" | tail -20

# 2. Verify JWT secret is configured
docker exec liyaqa-backend env | grep JWT_SECRET

# 3. Test authentication endpoint
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -H "X-Tenant-Id: test-tenant" \
  -d '{"email":"admin@test.com","password":"Test123!@#"}'

# 4. Check database for user
docker exec liyaqa-postgres psql -U liyaqa -d liyaqa -c \
  "SELECT id, email, enabled FROM users WHERE email='admin@test.com';"
```

**Resolution:**

1. **If JWT secret changed/missing:**
   ```bash
   # Update JWT secret in AWS Secrets Manager
   # Restart backend to load new secret
   docker compose restart backend
   ```

2. **If user account locked:**
   ```sql
   -- Unlock user account
   UPDATE users SET locked = false, failed_login_attempts = 0
   WHERE email = 'admin@test.com';
   ```

3. **If password reset needed:**
   ```sql
   -- Reset password (hashed value for "NewPassword123!")
   UPDATE users SET password = '$2a$10$...' WHERE email = 'admin@test.com';
   ```

### 3.7 Email/SMS Not Sending

**Symptoms:**
- Users not receiving emails
- Alert: `NotificationFailure` firing
- SMTP errors in logs

**Diagnosis:**

```bash
# 1. Check email logs
docker logs liyaqa-backend | grep "Mail" | tail -50

# 2. Verify SMTP configuration
docker exec liyaqa-backend env | grep SMTP

# 3. Test SMTP connectivity
telnet smtp.office365.com 587

# 4. Check email queue (if using)
# Query database for pending emails
docker exec liyaqa-postgres psql -U liyaqa -d liyaqa -c \
  "SELECT * FROM notification_queue WHERE status='PENDING' LIMIT 10;"
```

**Resolution:**

1. **If SMTP credentials invalid:**
   - Update credentials in AWS Secrets Manager
   - Restart backend

2. **If SMTP server unreachable:**
   - Check firewall rules (allow outbound port 587)
   - Verify SMTP server is operational

3. **If rate limit exceeded:**
   - Check SMTP provider limits
   - Implement queue/retry mechanism

---

## 4. Backup & Recovery

### 4.1 Manual Backup

```bash
# Run backup script
/opt/liyaqa/backend/scripts/backup-database.sh

# Expected output:
# Starting backup of liyaqa database...
# Backup created: /var/backups/liyaqa/liyaqa_20260131_143000.sql.gz
# Backup size: 45M
# Uploading to S3... Done
# ✓ Backup completed successfully

# Verify backup created
ls -lh /var/backups/liyaqa/
```

### 4.2 Restore from Backup

```bash
# 1. Stop application
docker compose stop backend

# 2. Restore database
gunzip -c /var/backups/liyaqa/liyaqa_20260131_020000.sql.gz | \
  docker exec -i liyaqa-postgres psql -U liyaqa -d liyaqa

# 3. Restart application
docker compose start backend

# 4. Verify health
curl http://localhost:8080/api/health

# 5. Test critical functionality
# - Login as admin
# - View member list
# - Create test booking
```

### 4.3 Point-in-Time Recovery

**If you need to restore to a specific point in time:**

1. **Find appropriate backup**
   ```bash
   ls -lh /var/backups/liyaqa/
   # Choose backup closest to desired timestamp
   ```

2. **Restore backup** (as above)

3. **Apply transaction logs** (if available)
   - Requires PostgreSQL WAL archiving (configure separately)

### 4.4 Disaster Recovery

**Full system recovery from scratch:**

1. **Provision New Server**
   - Create DigitalOcean Droplet (Ubuntu 22.04, 4GB RAM minimum)
   - Configure firewall (ports 22, 80, 443)

2. **Install Dependencies**
   ```bash
   # Install Docker
   curl -fsSL https://get.docker.com -o get-docker.sh
   sudo sh get-docker.sh
   sudo usermod -aG docker $USER

   # Install Docker Compose
   sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
   sudo chmod +x /usr/local/bin/docker-compose
   ```

3. **Clone Repository**
   ```bash
   cd /opt
   git clone https://github.com/your-org/liyaqa.git
   cd liyaqa
   ```

4. **Restore Database from S3**
   ```bash
   # Download latest backup from S3
   aws s3 cp s3://liyaqa-backups/liyaqa_latest.sql.gz /tmp/

   # Start PostgreSQL
   docker compose up -d postgres

   # Wait for PostgreSQL to be ready
   sleep 10

   # Restore database
   gunzip -c /tmp/liyaqa_latest.sql.gz | \
     docker exec -i liyaqa-postgres psql -U liyaqa -d liyaqa
   ```

5. **Configure Environment Variables**
   ```bash
   # Copy environment template
   cp .env.example .env

   # Edit with production values
   nano .env

   # Load secrets from AWS Secrets Manager
   /opt/liyaqa/deploy/migrate-secrets.sh
   ```

6. **Start Services**
   ```bash
   docker compose up -d

   # Verify all services healthy
   docker compose ps
   curl http://localhost:8080/api/health
   ```

7. **Update DNS**
   - Point domain to new server IP
   - Wait for DNS propagation (5-60 minutes)

8. **Verify Functionality**
   - Test login
   - Test critical user flows
   - Check monitoring dashboards

**RTO (Recovery Time Objective):** 4 hours
**RPO (Recovery Point Objective):** 24 hours (daily backups)

---

## 5. Deployment Procedures

See **DEPLOYMENT_GUIDE.md** for detailed deployment procedures.

**Quick Reference:**

### Staging Deployment
- **Trigger:** Automatic on merge to `main` branch
- **Process:** CI builds, tests, deploys automatically
- **Validation:** Smoke tests run post-deployment

### Production Deployment
- **Trigger:** Manual approval via GitHub Actions
- **Process:** Blue-green deployment with health checks
- **Validation:** Smoke tests + manual validation required
- **Rollback:** Instant blue-green swap (<2 minutes)

---

## 6. Security Procedures

### 6.1 Rotate Secrets

```bash
# 1. Generate new secret
NEW_JWT_SECRET=$(openssl rand -base64 32)

# 2. Update in AWS Secrets Manager
aws secretsmanager update-secret \
  --secret-id liyaqa/prod/jwt-secret \
  --secret-string "$NEW_JWT_SECRET"

# 3. Update environment variable
export JWT_SECRET="$NEW_JWT_SECRET"

# 4. Restart backend
docker compose restart backend

# 5. Verify new secret loaded
docker exec liyaqa-backend env | grep JWT_SECRET
```

### 6.2 Review Access Logs

```bash
# Check authentication failures
docker logs liyaqa-backend | grep "Authentication failed" | tail -50

# Check rate limit violations
docker logs liyaqa-backend | grep "Rate limit exceeded" | tail -50

# Check suspicious activity (multiple failed logins)
docker exec liyaqa-postgres psql -U liyaqa -d liyaqa -c \
  "SELECT email, COUNT(*) as failed_attempts, MAX(created_at) as last_attempt
   FROM audit_log
   WHERE action = 'LOGIN_FAILED' AND created_at > NOW() - INTERVAL '1 hour'
   GROUP BY email
   HAVING COUNT(*) > 5
   ORDER BY failed_attempts DESC;"

# Review recent admin actions
docker exec liyaqa-postgres psql -U liyaqa -d liyaqa -c \
  "SELECT u.email, a.action, a.created_at
   FROM audit_log a
   JOIN users u ON a.user_id = u.id
   WHERE a.created_at > NOW() - INTERVAL '24 hours'
   ORDER BY a.created_at DESC
   LIMIT 50;"
```

### 6.3 Security Incident Response

**See INCIDENT_RESPONSE.md for full procedures.**

**Quick Actions for Security Incidents:**

1. **Suspected Breach:**
   - Immediately notify CTO and security team
   - Preserve logs (do not restart services)
   - Isolate affected systems if needed
   - Follow incident response guide

2. **Compromised Credentials:**
   - Immediately rotate affected credentials
   - Force logout all users (invalidate JWT tokens)
   - Review access logs
   - Reset affected user passwords

3. **DDoS Attack:**
   - Enable rate limiting (if not already)
   - Contact hosting provider (DigitalOcean)
   - Enable Cloudflare DDoS protection
   - Monitor attack patterns

---

## 7. Performance Tuning

### 7.1 Database

#### Weekly Maintenance (Sundays 3 AM)

```bash
# Run vacuum analyze
docker exec liyaqa-postgres psql -U liyaqa -d liyaqa -c "VACUUM ANALYZE;"

# Reindex tables if needed
docker exec liyaqa-postgres psql -U liyaqa -d liyaqa -c "REINDEX DATABASE liyaqa;"

# Update statistics
docker exec liyaqa-postgres psql -U liyaqa -d liyaqa -c "ANALYZE;"
```

#### Monitor Slow Queries

```bash
# Via pg_stat_statements custom view
docker exec liyaqa-postgres psql -U liyaqa -d liyaqa -c \
  "SELECT * FROM slow_queries LIMIT 10;"

# Direct query
docker exec liyaqa-postgres psql -U liyaqa -d liyaqa -c \
  "SELECT query, calls, total_exec_time, mean_exec_time, max_exec_time
   FROM pg_stat_statements
   WHERE query NOT LIKE '%pg_stat_statements%'
   ORDER BY mean_exec_time DESC
   LIMIT 10;"
```

#### Review Indexes Monthly

```sql
-- Find missing indexes (queries doing sequential scans)
SELECT schemaname, tablename, seq_scan, seq_tup_read,
       idx_scan, seq_tup_read / seq_scan AS avg_seq_tup
FROM pg_stat_user_tables
WHERE seq_scan > 0
ORDER BY seq_tup_read DESC
LIMIT 10;

-- Find unused indexes
SELECT schemaname, tablename, indexname, idx_scan
FROM pg_stat_user_indexes
WHERE idx_scan = 0 AND indexname NOT LIKE '%pkey'
ORDER BY pg_relation_size(indexrelid) DESC;
```

### 7.2 Application

#### Monitor JVM Heap Usage

```bash
# Check current heap usage
curl http://localhost:8080/actuator/metrics/jvm.memory.used | jq

# Check max heap
curl http://localhost:8080/actuator/metrics/jvm.memory.max | jq

# Alert should fire if heap usage > 90%
```

#### Review Garbage Collection Patterns

```bash
# Check GC pause time
curl http://localhost:8080/actuator/metrics/jvm.gc.pause | jq

# Check GC count
curl http://localhost:8080/actuator/metrics/jvm.gc.memory.allocated | jq

# If GC is frequent, consider increasing heap size
```

#### Check Connection Pool Settings

```yaml
# backend/src/main/resources/application.yml
spring:
  datasource:
    hikari:
      maximum-pool-size: 30      # Max connections
      minimum-idle: 10           # Min idle connections
      connection-timeout: 30000  # 30 seconds
      idle-timeout: 600000       # 10 minutes
      max-lifetime: 1800000      # 30 minutes
```

#### Profile Slow Endpoints

```bash
# Check endpoint response times in Prometheus
# Query: histogram_quantile(0.95, rate(http_server_requests_seconds_bucket[5m]))

# Review traces in Zipkin for slow endpoints
open http://localhost:9411

# Add custom spans for slow operations in code
```

### 7.3 Monitoring

#### Review Dashboard Daily

**Check every morning:**
- [ ] No critical alerts firing
- [ ] Error rate < 1%
- [ ] Response time p95 < 500ms
- [ ] Database connections < 80%
- [ ] JVM heap usage < 70%
- [ ] Disk space > 20% free

#### Acknowledge Alerts Promptly

- Critical alerts: Acknowledge within 15 minutes
- High alerts: Acknowledge within 1 hour
- Medium/Low alerts: Acknowledge within 4 hours

#### Update Alert Thresholds as Needed

```yaml
# deploy/prometheus/alerts/application.yml
- alert: HighErrorRate
  expr: rate(http_server_requests_total{status=~"5.."}[5m]) > 0.05
  # Adjust threshold based on baseline
```

#### Archive Old Metrics (>30 days)

```bash
# Prometheus retention configured in docker-compose.yml
# Default: 30 days

# To change retention:
# Edit docker-compose.yml
# prometheus:
#   command:
#     - '--storage.tsdb.retention.time=60d'
```

---

## 8. Maintenance Windows

### Regular Maintenance Schedule

| Task | Frequency | Day | Time (KSA) | Duration |
|------|-----------|-----|------------|----------|
| **Database VACUUM** | Weekly | Sunday | 3:00 AM | 30 min |
| **OS Updates** | Monthly | First Saturday | 2:00 AM | 2 hours |
| **Docker Updates** | As needed | Saturday | 2:00 AM | 1 hour |
| **SSL Certificate Renewal** | Automatic | N/A | N/A | N/A |

### Notification Requirements

**For Planned Downtime:**
- 7 days advance notice
- Email to all users
- Status page update
- Slack announcement (#liyaqa-announcements)

**Notification Template:**

```
Subject: Scheduled Maintenance - [Date] [Time]

Dear Liyaqa Users,

We will be performing scheduled maintenance on:
Date: [Saturday, February 1, 2026]
Time: 2:00 AM - 4:00 AM KSA
Duration: Approximately 2 hours

During this time:
- The application will be unavailable
- All scheduled tasks will be paused
- Data will not be affected

We apologize for any inconvenience.

Best regards,
Liyaqa DevOps Team
```

---

## 9. Escalation Matrix

### On-Call Contacts

| Role | Primary | Backup | Contact Method |
|------|---------|--------|----------------|
| **DevOps** | @devops-oncall | @devops-lead | Slack, Phone |
| **Backend** | @backend-lead | @backend-senior | Slack |
| **Frontend** | @frontend-lead | @frontend-senior | Slack |
| **Database** | @dba-lead | @devops-lead | Slack, Phone |
| **Security** | @security-lead | @cto | Slack, Phone |

### Escalation Levels

**Level 1: On-Call DevOps Engineer**
- All alerts initially go here
- Response time: 15 minutes (critical), 1 hour (high)

**Level 2: Backend/Frontend Lead**
- Escalate after 1 hour if unresolved
- Code-level issues
- Architecture decisions

**Level 3: CTO**
- Escalate after 2 hours if SEV-1 unresolved
- Data loss or security breach
- Major outage

**Level 4: CEO**
- Only for major security breaches
- Legal implications
- Press involvement

### Contact Methods

1. **Slack** (Primary)
   - #liyaqa-alerts (automated alerts)
   - #liyaqa-critical (SEV-1 incidents)
   - @mention specific person

2. **Phone** (SEV-1 only if Slack unreachable)
   - On-call rotation phone number
   - Emergency contact list (in secure docs)

3. **Email** (Post-incident only)
   - incidents@liyaqa.com
   - Not for urgent issues

---

## 10. Useful Commands

### Service Management

```bash
# View all services
docker compose ps

# Check service health
docker compose ps | grep -E "Up|Exited"

# View service logs (follow)
docker compose logs backend -f

# View last 100 log lines
docker logs liyaqa-backend --tail 100

# Restart specific service
docker compose restart backend

# Rebuild and restart
docker compose up -d --build backend

# View resource usage
docker stats

# View resource usage (one-time snapshot)
docker stats --no-stream
```

### Database

```bash
# Connect to database
docker exec -it liyaqa-postgres psql -U liyaqa -d liyaqa

# Check active connections
docker exec liyaqa-postgres psql -U liyaqa -d liyaqa -c \
  "SELECT COUNT(*) FROM pg_stat_activity WHERE datname='liyaqa';"

# Check slow queries
docker exec liyaqa-postgres psql -U liyaqa -d liyaqa -c \
  "SELECT * FROM slow_queries LIMIT 10;"

# Check database size
docker exec liyaqa-postgres psql -U liyaqa -d liyaqa -c \
  "SELECT pg_size_pretty(pg_database_size('liyaqa'));"

# Backup database
/opt/liyaqa/backend/scripts/backup-database.sh

# Verify backup
/opt/liyaqa/backend/scripts/verify-backup.sh
```

### Monitoring

```bash
# Check Prometheus targets
curl http://localhost:9090/api/v1/targets | jq

# Check alerting status
curl http://localhost:9090/api/v1/alerts | jq

# Query specific metric
curl "http://localhost:9090/api/v1/query?query=up" | jq

# Query metric with time range
curl "http://localhost:9090/api/v1/query_range?query=up&start=$(date -d '1 hour ago' +%s)&end=$(date +%s)&step=60" | jq

# Check Alertmanager alerts
curl http://localhost:9093/api/v2/alerts | jq

# Silence alert
curl -X POST http://localhost:9093/api/v2/silences \
  -H "Content-Type: application/json" \
  -d '{"matchers":[{"name":"alertname","value":"HighErrorRate"}],"startsAt":"2026-01-31T10:00:00Z","endsAt":"2026-01-31T12:00:00Z","comment":"Investigating issue","createdBy":"devops"}'
```

### Logs (via LogCLI)

```bash
# Install LogCLI (if not already)
# wget https://github.com/grafana/loki/releases/download/v2.9.0/logcli-linux-amd64.zip
# unzip logcli-linux-amd64.zip
# chmod +x logcli-linux-amd64
# mv logcli-linux-amd64 /usr/local/bin/logcli

# Query logs from last hour
logcli query '{app="liyaqa-backend"}' --since=1h --limit=100

# Search for errors
logcli query '{app="liyaqa-backend"} |= "ERROR"' --since=1h

# Filter by user ID
logcli query '{app="liyaqa-backend"} | json | userId="123"' --since=1h

# Get logs for specific time range
logcli query '{app="liyaqa-backend"}' --from="2026-01-31T10:00:00Z" --to="2026-01-31T11:00:00Z"
```

### Application

```bash
# Health check
curl http://localhost:8080/api/health

# Detailed health
curl http://localhost:8080/actuator/health

# Application info
curl http://localhost:8080/actuator/info

# Metrics
curl http://localhost:8080/actuator/prometheus

# Specific metric
curl http://localhost:8080/actuator/metrics/jvm.memory.used | jq

# Thread dump
curl http://localhost:8080/actuator/threaddump > threaddump.txt

# Heap dump (WARNING: Large file, may cause brief pause)
curl -o heapdump.hprof http://localhost:8080/actuator/heapdump
```

---

## 11. Resources

### Dashboards

| Resource | URL | Credentials |
|----------|-----|-------------|
| **Grafana** | http://localhost:3001 | admin / [configured] |
| **Prometheus** | http://localhost:9090 | None |
| **Alertmanager** | http://localhost:9093 | None |
| **Zipkin** | http://localhost:9411 | None |
| **Loki** | http://localhost:3100 | None (API only) |

### Key Grafana Dashboards

- **System Overview** - High-level health metrics
- **Application Metrics** - Request rates, errors, response times
- **Database Performance** - Query performance, connections, locks
- **Business Metrics** - Bookings, payments, active users
- **Alert Dashboard** - Current and historical alerts

### Documentation

- **Production Runbook** - `/docs/PRODUCTION_RUNBOOK.md` (this file)
- **Incident Response** - `/docs/INCIDENT_RESPONSE.md`
- **Deployment Guide** - `/docs/DEPLOYMENT_GUIDE.md`
- **Architecture** - `/docs/ARCHITECTURE.md`
- **API Reference** - `/docs/API_REFERENCE.md`

### External Resources

- **DigitalOcean Console** - https://cloud.digitalocean.com
- **AWS Console** - https://console.aws.amazon.com (for Secrets Manager)
- **GitHub Repository** - https://github.com/your-org/liyaqa
- **Slack Workspace** - https://liyaqa.slack.com

---

## 12. Appendix

### A. Environment Variables Reference

**Backend (Spring Boot):**
```bash
SPRING_PROFILES_ACTIVE=prod
SPRING_DATASOURCE_URL=jdbc:postgresql://postgres:5432/liyaqa
SPRING_DATASOURCE_USERNAME=liyaqa
SPRING_DATASOURCE_PASSWORD=[from AWS Secrets Manager]
JWT_SECRET=[from AWS Secrets Manager]
SMTP_HOST=smtp.office365.com
SMTP_PORT=587
SMTP_USERNAME=[from AWS Secrets Manager]
SMTP_PASSWORD=[from AWS Secrets Manager]
```

**Frontend (Next.js):**
```bash
NEXT_PUBLIC_API_URL=https://api.liyaqa.com
NEXT_PUBLIC_ENVIRONMENT=production
```

### B. Port Reference

| Port | Service | Protocol | Access |
|------|---------|----------|--------|
| 22 | SSH | TCP | Restricted (key-based) |
| 80 | HTTP | TCP | Public (redirects to 443) |
| 443 | HTTPS | TCP | Public |
| 3000 | Frontend | TCP | Internal (behind reverse proxy) |
| 3001 | Grafana | TCP | Internal (VPN/whitelist) |
| 3100 | Loki | TCP | Internal |
| 5432 | PostgreSQL | TCP | Internal only |
| 8080 | Backend API | TCP | Internal (behind reverse proxy) |
| 9090 | Prometheus | TCP | Internal |
| 9093 | Alertmanager | TCP | Internal |
| 9411 | Zipkin | TCP | Internal |

### C. Cron Jobs

```bash
# Daily database backup (2 AM)
0 2 * * * /opt/liyaqa/backend/scripts/backup-database.sh

# Weekly database maintenance (Sunday 3 AM)
0 3 * * 0 docker exec liyaqa-postgres psql -U liyaqa -d liyaqa -c "VACUUM ANALYZE;"

# Daily backup verification (4 AM)
0 4 * * * /opt/liyaqa/backend/scripts/verify-backup.sh

# Clean old backups (Monday 5 AM)
0 5 * * 1 find /var/backups/liyaqa/ -name "*.sql.gz" -mtime +30 -delete

# Docker cleanup (Sunday 4 AM)
0 4 * * 0 docker system prune -f
```

---

**Last Updated:** 2026-01-31
**Maintained By:** DevOps Team
**Review Frequency:** Monthly
**Next Review:** 2026-02-28

**Document Version:** 1.0

---

**Change Log:**

| Date | Version | Changes | Author |
|------|---------|---------|--------|
| 2026-01-31 | 1.0 | Initial production runbook | DevOps Team |

