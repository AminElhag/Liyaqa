# 🚀 Liyaqa DigitalOcean Quick Reference

Essential commands for managing your Liyaqa deployment on DigitalOcean.

---

## 📦 Initial Setup (One-Time)

```bash
# 1. Connect to droplet
ssh root@YOUR_DROPLET_IP

# 2. Run server setup
curl -O https://raw.githubusercontent.com/YourOrg/Liyaqa/main/deploy/setup-server.sh
chmod +x setup-server.sh
sudo ./setup-server.sh

# 3. Clone repository
cd /opt/liyaqa
git clone https://github.com/YourOrg/Liyaqa.git .

# 4. Configure environment
cp deploy/.env.production .env
nano .env  # Edit your values

# 5. Deploy
chmod +x deploy/deploy-digitalocean.sh
./deploy/deploy-digitalocean.sh --init
./deploy/deploy-digitalocean.sh --deploy
```

---

## 🔄 Daily Operations

### Start/Stop/Restart

```bash
cd /opt/liyaqa

# Start all services
docker compose -f docker-compose.production.yml up -d

# Stop all services
docker compose -f docker-compose.production.yml down

# Restart specific service
docker compose restart backend
docker compose restart frontend
docker compose restart nginx

# Restart all
docker compose restart
```

### View Logs

```bash
# All services (real-time)
docker compose logs -f

# Specific service
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f postgres

# Last 100 lines
docker compose logs --tail=100 backend

# Search for errors
docker compose logs backend | grep ERROR
```

### Check Status

```bash
# Service status
docker compose ps

# Resource usage
docker stats

# Disk usage
df -h
docker system df

# Check health
curl http://localhost/actuator/health
```

---

## 🔧 Maintenance Commands

### Update Application

```bash
cd /opt/liyaqa

# Pull latest code
git pull origin main

# Update images and restart
./deploy/deploy-digitalocean.sh --update

# Or manually
docker compose pull
docker compose up -d
```

### Database Operations

```bash
# Connect to database
docker compose exec postgres psql -U liyaqa -d liyaqa

# Common queries
\dt          # List tables
\d members   # Describe table
\q           # Quit

# Manual backup
./deploy/backup.sh

# Or
./deploy/deploy-digitalocean.sh --backup

# Restore from backup
gunzip < /opt/liyaqa/backups/liyaqa_backup_YYYYMMDD_HHMMSS.sql.gz | \
  docker compose exec -T postgres psql -U liyaqa -d liyaqa
```

### Redis Operations

```bash
# Connect to Redis
docker compose exec redis redis-cli -a YOUR_REDIS_PASSWORD

# Redis commands
PING              # Test connection
INFO              # Server info
DBSIZE            # Number of keys
FLUSHALL          # Clear all data (CAREFUL!)
KEYS *            # List all keys (slow, avoid in production)
MONITOR           # Watch commands in real-time
```

---

## 🛡️ Security & SSL

### Setup SSL Certificate

```bash
# Using deployment script
./deploy/deploy-digitalocean.sh --ssl yourdomain.com your@email.com

# Or manually
docker compose --profile ssl run --rm certbot certonly \
  --webroot --webroot-path=/var/www/certbot \
  --email your@email.com --agree-tos --no-eff-email \
  -d yourdomain.com -d www.yourdomain.com

# Reload nginx after SSL setup
docker compose exec nginx nginx -s reload
```

### Renew SSL Certificate

```bash
# Test renewal (dry run)
docker compose exec certbot certbot renew --dry-run

# Force renewal
docker compose exec certbot certbot renew --force-renewal

# Certificates auto-renew via certbot service
```

### Firewall Management

```bash
# Check firewall status
sudo ufw status

# Allow specific port
sudo ufw allow 9090/tcp  # Example: Prometheus

# Delete rule
sudo ufw delete allow 9090/tcp

# Reload firewall
sudo ufw reload
```

---

## 📊 Monitoring

### Access Monitoring Tools

```bash
# Get droplet IP
DROPLET_IP=$(curl -4 -s icanhazip.com)

# Monitoring URLs
echo "Grafana: http://$DROPLET_IP:3001"
echo "Prometheus: http://$DROPLET_IP:9090"
echo "Alertmanager: http://$DROPLET_IP:9093"
```

### Deploy Monitoring Stack

```bash
./deploy/deploy-digitalocean.sh --monitoring

# Or manually
docker compose -f docker-compose.monitoring.yml up -d
```

### Check Metrics

```bash
# Application metrics
curl http://localhost:8080/actuator/metrics

# Specific metric
curl http://localhost:8080/actuator/metrics/jvm.memory.used

# Prometheus metrics (raw)
curl http://localhost:8080/actuator/prometheus
```

---

## 💾 Backup & Recovery

### Manual Backup

```bash
# Full backup (database + files)
./deploy/backup.sh

# Database only
docker compose exec -T postgres pg_dump \
  -U liyaqa -d liyaqa | gzip > backup_$(date +%Y%m%d).sql.gz
```

### Automated Backup (Cron)

```bash
# Edit crontab
crontab -e

# Add daily backup at 2 AM
0 2 * * * cd /opt/liyaqa && ./deploy/backup.sh >> /var/log/liyaqa-backup.log 2>&1

# View cron jobs
crontab -l

# View backup logs
tail -f /var/log/liyaqa-backup.log
```

### Restore Database

```bash
# Stop backend
docker compose stop backend

# Restore from backup
gunzip < backup_file.sql.gz | \
  docker compose exec -T postgres psql -U liyaqa -d liyaqa

# Start backend
docker compose start backend

# Verify
docker compose logs backend
```

---

## 🐛 Troubleshooting

### Service Won't Start

```bash
# Check logs
docker compose logs SERVICE_NAME

# Check specific error
docker compose logs backend | grep -A 5 ERROR

# Inspect container
docker inspect liyaqa-backend

# Remove and recreate
docker compose stop SERVICE_NAME
docker compose rm -f SERVICE_NAME
docker compose up -d SERVICE_NAME
```

### Database Issues

```bash
# Check PostgreSQL status
docker compose exec postgres pg_isready -U liyaqa

# Check connections
docker compose exec postgres psql -U liyaqa -d liyaqa \
  -c "SELECT count(*) FROM pg_stat_activity;"

# Kill idle connections
docker compose exec postgres psql -U liyaqa -d liyaqa \
  -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE state = 'idle';"
```

### Memory Issues

```bash
# Check memory
free -h

# Check container memory
docker stats --no-stream

# Reduce backend memory
nano docker-compose.production.yml
# Edit: JAVA_OPTS=-Xms256m -Xmx768m

# Restart
docker compose restart backend
```

### Network Issues

```bash
# Check nginx config
docker compose exec nginx nginx -t

# Check open ports
sudo netstat -tulpn | grep LISTEN

# Check DNS
dig +short yourdomain.com

# Test backend directly
curl -v http://localhost:8080/actuator/health

# Check CORS
curl -H "Origin: http://example.com" \
     -H "Access-Control-Request-Method: POST" \
     -H "Access-Control-Request-Headers: Content-Type" \
     -X OPTIONS \
     http://localhost/api/auth/login
```

### Clean Up Space

```bash
# Remove unused Docker data
docker system prune -a --volumes

# Clean old logs
docker compose logs --no-color | tail -1000 > recent.log
# (Docker logs stored in /var/lib/docker)

# Clean old backups (keep last 30 days)
find /opt/liyaqa/backups -name "*.sql.gz" -mtime +30 -delete
```

---

## 🔐 Environment Configuration

### View Current Config

```bash
# View .env (hidden passwords)
cat .env | grep -v PASSWORD | grep -v SECRET | grep -v TOKEN

# Check specific value
grep DOMAIN .env
grep EMAIL_ENABLED .env
```

### Update Configuration

```bash
# Edit environment
nano .env

# Apply changes (restart required)
docker compose restart backend
docker compose restart frontend

# Or full restart
docker compose down
docker compose up -d
```

### Generate New Secrets

```bash
# PostgreSQL password
openssl rand -base64 32

# JWT secret (min 48 chars recommended)
openssl rand -base64 48

# Redis password
openssl rand -base64 24

# Random UUID
uuidgen
```

---

## 📈 Performance Optimization

### Database Optimization

```bash
# Analyze database
docker compose exec postgres psql -U liyaqa -d liyaqa -c "ANALYZE;"

# Vacuum database
docker compose exec postgres psql -U liyaqa -d liyaqa -c "VACUUM ANALYZE;"

# Check slow queries
docker compose exec postgres psql -U liyaqa -d liyaqa \
  -c "SELECT query, calls, mean_exec_time FROM pg_stat_statements ORDER BY mean_exec_time DESC LIMIT 10;"
```

### Cache Management

```bash
# Clear Redis cache
docker compose exec redis redis-cli -a YOUR_PASSWORD FLUSHDB

# Clear specific cache keys
docker compose exec redis redis-cli -a YOUR_PASSWORD DEL cache_key_name

# Monitor cache hit rate
docker compose exec redis redis-cli -a YOUR_PASSWORD INFO stats | grep hits
```

### Nginx Optimization

```bash
# Test config
docker compose exec nginx nginx -t

# Reload without downtime
docker compose exec nginx nginx -s reload

# View error log
docker compose exec nginx tail -f /var/log/nginx/error.log

# View access log
docker compose exec nginx tail -f /var/log/nginx/access.log
```

---

## 🚨 Emergency Procedures

### Total System Restart

```bash
# Stop everything
docker compose -f docker-compose.production.yml down
docker compose -f docker-compose.monitoring.yml down

# Clear Docker cache (optional, if issues persist)
docker system prune -f

# Start everything
docker compose -f docker-compose.production.yml up -d
docker compose -f docker-compose.monitoring.yml up -d

# Watch logs
docker compose logs -f
```

### Rollback Deployment

```bash
# Stop current
docker compose down

# Checkout previous version
git log --oneline  # Find commit hash
git checkout COMMIT_HASH

# Redeploy
docker compose pull
docker compose up -d

# Or return to main
git checkout main
```

### Emergency Backup

```bash
# Quick database export
docker compose exec -T postgres pg_dump -U liyaqa liyaqa | \
  gzip > emergency_backup_$(date +%Y%m%d_%H%M%S).sql.gz

# Copy to local machine
scp root@DROPLET_IP:/opt/liyaqa/emergency_backup_*.sql.gz ./
```

---

## 📞 Support Information

### System Info

```bash
# Droplet information
cat /etc/os-release
uname -a
free -h
df -h

# Docker version
docker --version
docker compose version

# Application version
grep version /opt/liyaqa/package.json
git log -1 --oneline
```

### Health Check URLs

```text
Application:    http://YOUR_DOMAIN
API Health:     http://YOUR_DOMAIN/actuator/health
API Metrics:    http://YOUR_DOMAIN/actuator/metrics
Prometheus:     http://YOUR_DOMAIN:9090
Grafana:        http://YOUR_DOMAIN:3001
Swagger UI:     http://YOUR_DOMAIN/swagger-ui.html
```

### Log Locations

```text
Application logs:    docker compose logs
Nginx logs:          /var/log/nginx/
Backup logs:         /var/log/liyaqa-backup.log
System logs:         /var/log/syslog
Docker logs:         /var/lib/docker/containers/
```

---

## ⚡ Quick Commands Summary

```bash
# Deploy
./deploy/deploy-digitalocean.sh --deploy

# Update
./deploy/deploy-digitalocean.sh --update

# Status
./deploy/deploy-digitalocean.sh --status

# Logs
./deploy/deploy-digitalocean.sh --logs

# Backup
./deploy/deploy-digitalocean.sh --backup

# Monitoring
./deploy/deploy-digitalocean.sh --monitoring

# SSL
./deploy/deploy-digitalocean.sh --ssl domain.com email@domain.com

# Help
./deploy/deploy-digitalocean.sh --help
```

---

## 📚 Resources

- **Full Guide:** `/opt/liyaqa/deploy/DIGITALOCEAN_DEPLOYMENT_GUIDE.md`
- **Environment Template:** `/opt/liyaqa/deploy/.env.production`
- **Backup Script:** `/opt/liyaqa/deploy/backup.sh`
- **Monitoring Setup:** `/opt/liyaqa/deploy/MONITORING_QUICK_START.md`

---

**💡 Tip:** Bookmark this file for quick reference!

```bash
# Create alias for quick access
echo "alias liyaqa-ref='cat /opt/liyaqa/deploy/QUICK_REFERENCE.md | less'" >> ~/.bashrc
source ~/.bashrc

# Now use: liyaqa-ref
```
