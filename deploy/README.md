# Deployment Scripts

This directory contains scripts and configurations for deploying Liyaqa to production.

---

## 📁 Files Overview

| File | Purpose | Usage |
|------|---------|-------|
| `docker-compose.droplet.yml` | Production docker compose config | Main deployment configuration |
| `rollback.sh` | Emergency rollback script | `./rollback.sh [commit]` |
| `health-check.sh` | Health monitoring script | `./health-check.sh [--watch]` |
| `backup.sh` | Database backup script | `./backup.sh` |
| `nginx/` | Nginx configuration files | Reverse proxy config |

---

## 🚀 Quick Start

### Deploy to Droplet
```bash
# Automatic via GitHub Actions (recommended)
git push origin main

# Manual deployment
cd /opt/Liyaqa/deploy
cp ../.env .env
docker compose -f docker-compose.droplet.yml pull
docker compose -f docker-compose.droplet.yml up -d
```

### Check Health
```bash
./health-check.sh              # One-time check
./health-check.sh --watch      # Continuous monitoring
./health-check.sh --json       # JSON output
```

### Rollback Deployment
```bash
./rollback.sh                  # Rollback to previous commit
./rollback.sh abc1234          # Rollback to specific commit
./rollback.sh --list           # List recent commits
```

---

## 🔍 Monitoring

### Container Status
```bash
docker compose -f docker-compose.droplet.yml ps
```

### View Logs
```bash
# All services
docker compose -f docker-compose.droplet.yml logs -f

# Specific service
docker compose -f docker-compose.droplet.yml logs -f backend

# Last 100 lines
docker compose -f docker-compose.droplet.yml logs --tail=100 backend
```

### Resource Usage
```bash
# Real-time stats
docker stats

# Disk usage
docker system df

# Container health
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
```

---

## 🛠️ Common Operations

### Restart Services
```bash
# Restart all
docker compose -f docker-compose.droplet.yml restart

# Restart specific service
docker compose -f docker-compose.droplet.yml restart backend
```

### Update Single Service
```bash
# Pull latest image
docker compose -f docker-compose.droplet.yml pull backend

# Recreate container
docker compose -f docker-compose.droplet.yml up -d backend
```

### Stop/Start All
```bash
# Stop all services
docker compose -f docker-compose.droplet.yml down

# Start all services
docker compose -f docker-compose.droplet.yml up -d
```

---

## 🔐 Environment Configuration

### Required Environment Variables

Create a `.env` file in this directory (copied from `/opt/Liyaqa/.env`):

```bash
# Database
POSTGRES_DB=liyaqa
POSTGRES_USER=liyaqa
POSTGRES_PASSWORD=<secure-password>

# Backend
JWT_SECRET=<min-32-character-secret>
CORS_ALLOWED_ORIGINS=http://your-domain.com

# Email (Optional)
EMAIL_ENABLED=false
SMTP_HOST=
SMTP_PORT=587
SMTP_USERNAME=
SMTP_PASSWORD=

# SMS (Optional)
SMS_ENABLED=false
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_FROM_NUMBER=
```

---

## 🛡️ Security

### SSH Access
```bash
# Use key-based authentication
ssh -i ~/.ssh/liyaqa_deploy_key root@167.71.233.43
```

### Firewall Rules
```bash
# Allow HTTP
ufw allow 80/tcp

# Allow HTTPS
ufw allow 443/tcp

# Allow SSH
ufw allow 22/tcp

# Enable firewall
ufw enable
```

### SSL Certificate (Optional)
```bash
# Start certbot
docker compose --profile ssl up -d certbot
```

---

## 📊 Health Checks

The `health-check.sh` script verifies:

- ✅ PostgreSQL database connection
- ✅ Backend API health endpoint
- ✅ Frontend availability
- ✅ Nginx configuration
- ✅ System resources (disk, memory)
- ✅ Network connectivity
- ✅ Deployment status

### Health Check Output Example
```
===========================================
  Liyaqa Health Check
===========================================

=== PostgreSQL Database ===
✓ Container is running
✓ Database is accepting connections
ℹ Database size: 45 MB

=== Backend API ===
✓ Container is running
✓ Health endpoint responding
✓ Database connection: UP
ℹ Memory usage: 384MiB

=== Frontend ===
✓ Container is running
✓ Frontend is responding

=== Nginx Reverse Proxy ===
✓ Container is running
✓ Nginx configuration is valid
✓ Port 80 is listening

===========================================
All checks passed! ✓
===========================================
```

---

## 🔄 Rollback Procedure

The `rollback.sh` script:

1. Creates automatic backup of current deployment
2. Resets git to previous/specific commit
3. Redeploys services
4. Verifies health
5. Reports status

### Rollback Example
```bash
$ ./rollback.sh --list
Recent deployments (last 10 commits):
abc1234 (HEAD) feat: add new feature
def5678 fix: bug fix
...

$ ./rollback.sh def5678

==========================================
  Liyaqa Deployment Rollback
==========================================

ℹ Creating backup of current deployment...
✓ Backup created: backups/rollback_backup_abc1234_20260202_143022.tar.gz

ℹ Current commit: abc1234 feat: add new feature
ℹ Rolling back to: def5678 fix: bug fix

⚠ This will rollback the code to the selected commit
Continue? (yes/no): yes

ℹ Performing git reset...
✓ Code rolled back to: def5678

ℹ Redeploying services...
✓ Backend is healthy!

==========================================
✓ Rollback completed successfully!
==========================================
```

---

## 🚨 Troubleshooting

### Services Not Starting
```bash
# Check logs
docker compose -f docker-compose.droplet.yml logs

# Check for port conflicts
netstat -tuln | grep -E '80|443|5432|8080|3000'

# Check disk space
df -h

# Check memory
free -h
```

### Database Connection Issues
```bash
# Check PostgreSQL logs
docker compose -f docker-compose.droplet.yml logs postgres

# Test connection
docker exec liyaqa-postgres pg_isready -U liyaqa

# Check if database exists
docker exec liyaqa-postgres psql -U liyaqa -l
```

### Backend Not Responding
```bash
# Check backend logs
docker compose -f docker-compose.droplet.yml logs backend --tail=100

# Check health endpoint
docker exec liyaqa-backend curl http://localhost:8080/actuator/health

# Restart backend
docker compose -f docker-compose.droplet.yml restart backend
```

### Out of Memory
```bash
# Check memory usage
docker stats --no-stream

# Reduce memory limits in docker-compose.droplet.yml
# Or upgrade droplet size

# Clear system caches
sync; echo 3 > /proc/sys/vm/drop_caches
```

### Clean Up Space
```bash
# Remove unused Docker resources
docker system prune -a -f

# Remove old backups (keep last 7 days)
find backups/ -name "*.tar.gz" -mtime +7 -delete

# Remove old logs
docker compose -f docker-compose.droplet.yml logs --no-color > /dev/null
```

---

## 📈 Monitoring & Observability

### Enable Monitoring Stack
```bash
# Start Prometheus + Grafana
docker compose -f docker-compose.monitoring.yml up -d

# Access Grafana
# http://your-ip:3000
# Default: admin/admin
```

### Key Metrics to Monitor
- Container CPU/Memory usage
- Database connections
- API response times
- Disk space
- Network traffic

---

## 🔗 Related Documentation

- **CI/CD Setup**: `../CI_CD_SETUP_GUIDE.md`
- **Quick Reference**: `../CI_CD_QUICK_REFERENCE.md`
- **Implementation Summary**: `../CI_CD_IMPLEMENTATION_SUMMARY.md`
- **Main README**: `../README.md`

---

## 📞 Getting Help

### Check Status
```bash
# Quick health check
./health-check.sh

# Detailed container status
docker compose -f docker-compose.droplet.yml ps

# System resources
docker stats --no-stream
```

### Common Commands
```bash
# View current deployment
git log -1 --oneline

# Check last deployment time
stat -f '%Sm' /opt/Liyaqa/.git/FETCH_HEAD

# View recent git activity
git log --oneline -5
```

---

**Deployment Directory**: `/opt/Liyaqa/deploy`
**Docker Compose File**: `docker-compose.droplet.yml`
**Environment File**: `.env` (copy from parent directory)
**Backup Directory**: `/opt/Liyaqa/backups`

For emergency support, refer to the rollback and health-check scripts.
