# 🚀 Liyaqa DigitalOcean Deployment Guide

Complete step-by-step guide to deploy Liyaqa on DigitalOcean Droplets.

---

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Droplet Selection](#droplet-selection)
3. [Initial Server Setup](#initial-server-setup)
4. [Application Deployment](#application-deployment)
5. [SSL Configuration](#ssl-configuration)
6. [Monitoring Setup](#monitoring-setup)
7. [Post-Deployment](#post-deployment)
8. [Maintenance](#maintenance)
9. [Troubleshooting](#troubleshooting)

---

## 1. Prerequisites

### Required Accounts & Access

- ✅ DigitalOcean account ([Sign up here](https://m.do.co/c/your-referral))
- ✅ Domain name (optional but recommended)
- ✅ SSH key generated on your local machine
- ✅ SendGrid account for emails (free tier: 100 emails/day)
- ✅ AWS account for S3 storage (optional, can use MinIO)

### Local Machine Requirements

```bash
# Generate SSH key if you don't have one
ssh-keygen -t ed25519 -C "your_email@example.com"

# View your public key
cat ~/.ssh/id_ed25519.pub
```

---

## 2. Droplet Selection

### Recommended Configurations

| Use Case | Size | RAM | CPU | Disk | Price/Month | Users |
|----------|------|-----|-----|------|-------------|-------|
| **Testing** | s-2vcpu-2gb | 2GB | 2 | 60GB | $18 | 10-50 |
| **Production Start** | s-2vcpu-4gb | 4GB | 2 | 80GB | $24 | 50-200 |
| **Recommended** | s-4vcpu-8gb | 8GB | 4 | 160GB | $48 | 200-1000 |
| **Scale-up** | s-8vcpu-16gb | 16GB | 8 | 320GB | $96 | 1000-5000 |

### Create Droplet

1. **Login to DigitalOcean**
   - Go to: https://cloud.digitalocean.com/

2. **Create Droplet**
   ```
   Click: Create → Droplets
   ```

3. **Choose Image**
   ```
   Distribution: Ubuntu
   Version: 24.04 (LTS) x64
   ```

4. **Choose Size**
   ```
   Shared CPU → Regular
   Select: $24/mo (4GB RAM / 2 vCPU / 80GB SSD)
   ```

5. **Choose Region**
   ```
   For Saudi Arabia market:
   - Amsterdam (AMS3) - Closest to Middle East
   - Frankfurt (FRA1) - Alternative
   - London (LON1) - Alternative

   Note: DigitalOcean doesn't have Middle East region yet
   ```

6. **Authentication**
   ```
   SSH Keys: Add your public key (from prerequisites)
   ```

7. **Additional Options**
   ```
   ✅ Monitoring (Free)
   ✅ IPv6
   ❌ Backups (We'll use custom backup script - $1.20/mo)
   ```

8. **Finalize**
   ```
   Hostname: liyaqa-prod-01
   Tags: liyaqa, production

   Click: Create Droplet
   ```

9. **Wait for Droplet**
   - Takes ~60 seconds
   - Note the IP address: `157.230.XX.XXX`

---

## 3. Initial Server Setup

### Step 1: Connect to Droplet

```bash
# Replace with your droplet IP
ssh root@157.230.XX.XXX

# Type 'yes' when prompted about fingerprint
```

### Step 2: Run Server Setup Script

```bash
# Download setup script
curl -O https://raw.githubusercontent.com/YourOrg/Liyaqa/main/deploy/setup-server.sh

# Make executable
chmod +x setup-server.sh

# Run setup (installs Docker, firewall, fail2ban, etc.)
sudo ./setup-server.sh

# This will take 5-10 minutes
```

**What this script does:**
- ✅ Updates system packages
- ✅ Installs Docker & Docker Compose
- ✅ Configures UFW firewall (ports 22, 80, 443)
- ✅ Installs Fail2Ban (brute-force protection)
- ✅ Creates application directory `/opt/liyaqa`
- ✅ Adds 2GB swap file
- ✅ Optimizes system settings

### Step 3: Create Application User (Recommended)

```bash
# Create dedicated user
adduser liyaqa

# Add to sudo group
usermod -aG sudo liyaqa

# Add to docker group
usermod -aG docker liyaqa

# Copy SSH keys
rsync --archive --chown=liyaqa:liyaqa ~/.ssh /home/liyaqa

# Switch to new user
su - liyaqa
```

### Step 4: Clone Repository

```bash
# Navigate to app directory
cd /opt/liyaqa

# Clone your repository
# Option 1: HTTPS
git clone https://github.com/YourOrg/Liyaqa.git .

# Option 2: SSH (if you set up deploy keys)
git clone git@github.com:YourOrg/Liyaqa.git .

# Verify files
ls -la
```

---

## 4. Application Deployment

### Step 1: Configure Environment

```bash
cd /opt/liyaqa

# Copy production environment template
cp deploy/.env.production .env

# Edit configuration
nano .env
```

**Edit these critical values:**

```bash
# REQUIRED: Your domain or droplet IP
DOMAIN=157.230.XX.XXX
# After DNS setup: DOMAIN=liyaqa.example.com

# REQUIRED: These will auto-generate, but verify they're filled
POSTGRES_PASSWORD=  # Leave empty, script will generate
JWT_SECRET=         # Leave empty, script will generate
REDIS_PASSWORD=     # Leave empty, script will generate

# RECOMMENDED: Email configuration
EMAIL_ENABLED=true
EMAIL_PROVIDER=sendgrid
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxxxxx
EMAIL_FROM=noreply@yourdomain.com

# OPTIONAL: AWS S3 for file storage
STORAGE_TYPE=s3
S3_BUCKET_NAME=liyaqa-files-prod
AWS_REGION=me-south-1
AWS_ACCESS_KEY_ID=AKIAxxxxxxxxx
AWS_SECRET_ACCESS_KEY=xxxxxxxxxxxxx

# If not using S3, use local storage temporarily
# STORAGE_TYPE=local
```

**Save and exit:** `Ctrl+X`, then `Y`, then `Enter`

### Step 2: Initialize Deployment

```bash
# Make deployment script executable
chmod +x deploy/deploy-digitalocean.sh

# Run initialization
./deploy/deploy-digitalocean.sh --init
```

**This will:**
- ✅ Create directory structure
- ✅ Generate secure secrets (DB password, JWT secret, Redis password)
- ✅ Validate configuration
- ✅ Copy nginx configuration

### Step 3: Deploy Application

```bash
# Deploy the full stack
./deploy/deploy-digitalocean.sh --deploy
```

**This will:**
- ✅ Pull Docker images
- ✅ Start PostgreSQL database
- ✅ Start Redis cache
- ✅ Run database migrations
- ✅ Start backend API
- ✅ Start frontend
- ✅ Start Nginx reverse proxy

**Expected output:**
```
[INFO] Pulling latest Docker images...
[INFO] Deploying Liyaqa application...
[INFO] Starting services...
[INFO] Waiting for services to be healthy...
[SUCCESS] Services are healthy!
[SUCCESS] Application deployed successfully
```

### Step 4: Verify Deployment

```bash
# Check service status
./deploy/deploy-digitalocean.sh --status

# Expected output:
# NAME              STATUS    PORTS
# liyaqa-postgres   healthy   5432/tcp
# liyaqa-redis      healthy   6379/tcp
# liyaqa-backend    healthy   8080/tcp
# liyaqa-frontend   healthy   3000/tcp
# liyaqa-nginx      healthy   80/tcp, 443/tcp

# Check logs
./deploy/deploy-digitalocean.sh --logs

# Check specific service
./deploy/deploy-digitalocean.sh --logs backend
```

### Step 5: Access Application

```bash
# Get your droplet IP
curl -4 icanhazip.com

# Open in browser:
http://YOUR_DROPLET_IP
```

**You should see:**
- ✅ Liyaqa login page
- ✅ No SSL warning (normal - we'll add SSL next)

---

## 5. SSL Configuration

### Option A: Using Your Own Domain (Recommended)

#### Step 1: Configure DNS

1. **Go to your domain registrar** (Namecheap, GoDaddy, etc.)

2. **Add A Record:**
   ```
   Type: A
   Name: @
   Value: YOUR_DROPLET_IP
   TTL: 300
   ```

3. **Add A Record for www:**
   ```
   Type: A
   Name: www
   Value: YOUR_DROPLET_IP
   TTL: 300
   ```

4. **Add A Record for API subdomain (optional):**
   ```
   Type: A
   Name: api
   Value: YOUR_DROPLET_IP
   TTL: 300
   ```

5. **Wait for DNS propagation** (5-60 minutes)
   ```bash
   # Check DNS propagation
   dig +short liyaqa.example.com

   # Should return your droplet IP
   ```

#### Step 2: Update Environment Configuration

```bash
cd /opt/liyaqa
nano .env
```

**Update:**
```bash
# Change from IP to domain
DOMAIN=liyaqa.example.com
CORS_ALLOWED_ORIGINS=https://liyaqa.example.com
NEXT_PUBLIC_API_URL=https://liyaqa.example.com/api
LIYAQA_BASE_DOMAIN=liyaqa.example.com
```

#### Step 3: Update Nginx Configuration

```bash
# Edit nginx config
nano nginx/conf.d/default.conf
```

**Find line ~150 and uncomment, then update:**
```nginx
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name liyaqa.example.com;  # ← CHANGE THIS

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/liyaqa.example.com/fullchain.pem;  # ← CHANGE THIS
    ssl_certificate_key /etc/letsencrypt/live/liyaqa.example.com/privkey.pem;  # ← CHANGE THIS

    # ... rest of config
}
```

**On line ~31, uncomment redirect:**
```nginx
# Uncomment this line to redirect HTTP to HTTPS
return 301 https://$host$request_uri;
```

#### Step 4: Obtain SSL Certificate

```bash
# Run SSL setup script
./deploy/deploy-digitalocean.sh --ssl liyaqa.example.com your-email@example.com
```

**Or manually:**
```bash
docker compose -f docker-compose.production.yml --profile ssl run --rm certbot certonly \
  --webroot \
  --webroot-path=/var/www/certbot \
  --email your-email@example.com \
  --agree-tos \
  --no-eff-email \
  -d liyaqa.example.com \
  -d www.liyaqa.example.com
```

#### Step 5: Reload Nginx

```bash
# Test nginx config
docker compose exec nginx nginx -t

# Reload nginx
docker compose exec nginx nginx -s reload

# Or restart
docker compose restart nginx
```

#### Step 6: Update Environment and Restart

```bash
# Update CORS and URLs to use https
nano .env

# Restart services
./deploy/deploy-digitalocean.sh --update
```

#### Step 7: Test SSL

```bash
# Visit in browser
https://liyaqa.example.com

# Check SSL rating
# https://www.ssllabs.com/ssltest/analyze.html?d=liyaqa.example.com
```

### Option B: Using IP Address (Temporary)

If you don't have a domain yet, you can use the app with HTTP (not recommended for production):

```bash
# Access via:
http://YOUR_DROPLET_IP

# Note: Some features may not work without HTTPS (like OAuth, cameras)
```

---

## 6. Monitoring Setup

### Deploy Monitoring Stack

```bash
cd /opt/liyaqa

# Deploy Prometheus, Grafana, Loki, Alertmanager
./deploy/deploy-digitalocean.sh --monitoring

# Wait for services to start (30-60 seconds)
```

### Access Monitoring Tools

```bash
# Get your droplet IP
DROPLET_IP=$(curl -4 -s icanhazip.com)

echo "Grafana: http://$DROPLET_IP:3001"
echo "Prometheus: http://$DROPLET_IP:9090"
echo "Alertmanager: http://$DROPLET_IP:9093"
```

### Configure Grafana

1. **Open Grafana:** `http://YOUR_IP:3001`

2. **Login:**
   ```
   Username: admin
   Password: (check .env for GRAFANA_ADMIN_PASSWORD)
   ```

3. **Dashboards are pre-configured:**
   - Business Metrics Dashboard
   - Application Performance Dashboard
   - Per-Tenant Metrics Dashboard

4. **Change admin password:**
   ```
   Settings → Users → admin → Change Password
   ```

### Configure Alerts (Optional)

```bash
# Edit alertmanager config
nano deploy/alertmanager.yml
```

**Add Slack webhook:**
```yaml
receivers:
  - name: 'slack'
    slack_configs:
      - api_url: 'https://hooks.slack.com/services/YOUR/WEBHOOK/URL'
        channel: '#liyaqa-alerts'
        title: 'Liyaqa Alert'
```

**Restart alertmanager:**
```bash
docker compose -f docker-compose.monitoring.yml restart alertmanager
```

---

## 7. Post-Deployment

### Create First User

```bash
# Access backend API directly
curl -X POST http://localhost/api/platform/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "SecurePassword123!",
    "displayName": {
      "en": "Admin User",
      "ar": "مستخدم المسؤول"
    },
    "role": "PLATFORM_ADMIN"
  }'
```

**Or use the web UI:**
1. Go to `http://YOUR_DOMAIN/platform-login`
2. Click "Create Account" (if registration is enabled)
3. Or use database seed script (if you created one)

### Configure Backup

```bash
# Test manual backup
./deploy/deploy-digitalocean.sh --backup

# Setup automated daily backups (2 AM)
(crontab -l 2>/dev/null; echo "0 2 * * * cd /opt/liyaqa && ./deploy/deploy-digitalocean.sh --backup >> /var/log/liyaqa-backup.log 2>&1") | crontab -

# Verify crontab
crontab -l
```

### Configure Email Service

If you're using SendGrid:

1. **Create SendGrid account:** https://signup.sendgrid.com/
2. **Create API key:**
   - Settings → API Keys → Create API Key
   - Full Access or Restricted (Mail Send only)
3. **Add to .env:**
   ```bash
   SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxxxxx
   ```
4. **Restart backend:**
   ```bash
   docker compose restart backend
   ```
5. **Test email:**
   ```bash
   # Send test email via API
   curl -X POST http://localhost/api/notifications/test-email \
     -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     -d '{"email":"test@example.com"}'
   ```

### Configure S3 File Storage

1. **Create S3 bucket:**
   - AWS Console → S3 → Create Bucket
   - Name: `liyaqa-files-prod`
   - Region: `me-south-1` (Middle East - Bahrain)
   - Block all public access: Yes

2. **Create IAM user:**
   - AWS Console → IAM → Users → Add User
   - User name: `liyaqa-app`
   - Access type: Programmatic access
   - Attach policy: `AmazonS3FullAccess` (or custom restricted policy)

3. **Update .env:**
   ```bash
   STORAGE_TYPE=s3
   S3_BUCKET_NAME=liyaqa-files-prod
   AWS_REGION=me-south-1
   AWS_ACCESS_KEY_ID=AKIAXXXXXXXXXXXXXXXX
   AWS_SECRET_ACCESS_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```

4. **Restart backend:**
   ```bash
   docker compose restart backend
   ```

---

## 8. Maintenance

### Update Application

```bash
cd /opt/liyaqa

# Pull latest code
git pull origin main

# Update deployment
./deploy/deploy-digitalocean.sh --update
```

### View Logs

```bash
# All services
./deploy/deploy-digitalocean.sh --logs

# Specific service
./deploy/deploy-digitalocean.sh --logs backend
./deploy/deploy-digitalocean.sh --logs frontend
./deploy/deploy-digitalocean.sh --logs postgres

# Follow logs in real-time
docker compose logs -f backend

# Last 100 lines
docker compose logs --tail=100 backend
```

### Database Management

```bash
# Connect to database
docker compose exec postgres psql -U liyaqa -d liyaqa

# Backup database
./deploy/deploy-digitalocean.sh --backup

# Restore from backup
gunzip < /opt/liyaqa/backups/liyaqa_backup_20260201_020000.sql.gz | \
  docker compose exec -T postgres psql -U liyaqa -d liyaqa
```

### Resource Monitoring

```bash
# Check resource usage
./deploy/deploy-digitalocean.sh --status

# Detailed stats
docker stats

# Disk usage
df -h
docker system df

# Clean up old images/containers
docker system prune -a --volumes
```

### Certificate Renewal

Let's Encrypt certificates auto-renew, but you can manually renew:

```bash
# Test renewal
docker compose exec certbot certbot renew --dry-run

# Force renewal
docker compose exec certbot certbot renew --force-renewal

# Reload nginx after renewal
docker compose exec nginx nginx -s reload
```

---

## 9. Troubleshooting

### Services Not Starting

```bash
# Check logs
docker compose logs backend

# Common issues:
# 1. Database not ready
docker compose exec postgres pg_isready

# 2. Port already in use
sudo netstat -tulpn | grep :80
sudo netstat -tulpn | grep :443

# 3. Memory issues
free -h
docker stats --no-stream
```

### Application Not Accessible

```bash
# 1. Check firewall
sudo ufw status

# Should show:
# 22/tcp    ALLOW
# 80/tcp    ALLOW
# 443/tcp   ALLOW

# 2. Check nginx
docker compose exec nginx nginx -t
docker compose logs nginx

# 3. Check backend health
curl http://localhost:8080/actuator/health
```

### Database Connection Issues

```bash
# Check PostgreSQL logs
docker compose logs postgres

# Verify connection
docker compose exec postgres psql -U liyaqa -d liyaqa -c "SELECT version();"

# Check connection pool
docker compose exec backend curl localhost:8080/actuator/metrics/hikaricp.connections
```

### High Memory Usage

```bash
# Check memory
free -h

# Reduce backend memory
# Edit docker-compose.production.yml:
JAVA_OPTS=-Xms256m -Xmx768m

# Restart
docker compose restart backend
```

### SSL Certificate Issues

```bash
# Check certificate
docker compose exec nginx openssl x509 -in /etc/letsencrypt/live/yourdomain.com/fullchain.pem -text -noout

# Renew certificate
docker compose --profile ssl run --rm certbot renew

# Check nginx SSL config
docker compose exec nginx nginx -t
```

### Email Not Sending

```bash
# Check backend logs
docker compose logs backend | grep -i email

# Test SendGrid API key
curl --request POST \
  --url https://api.sendgrid.com/v3/mail/send \
  --header "Authorization: Bearer $SENDGRID_API_KEY" \
  --header 'Content-Type: application/json' \
  --data '{"personalizations":[{"to":[{"email":"test@example.com"}]}],"from":{"email":"noreply@yourdomain.com"},"subject":"Test","content":[{"type":"text/plain","value":"Test"}]}'
```

---

## 🆘 Getting Help

### Check Application Logs

```bash
# Backend errors
docker compose logs backend | grep ERROR

# Frontend errors
docker compose logs frontend | grep ERROR

# Nginx errors
docker compose logs nginx | grep error
```

### Health Check All Services

```bash
# Quick health check
curl http://localhost/actuator/health

# Detailed health
curl http://localhost/actuator/health | jq
```

### Contact Support

- **GitHub Issues:** https://github.com/YourOrg/Liyaqa/issues
- **Email:** support@liyaqa.com
- **Slack:** liyaqa.slack.com

---

## 📚 Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [DigitalOcean Community Tutorials](https://www.digitalocean.com/community/tutorials)
- [Let's Encrypt Documentation](https://letsencrypt.org/docs/)
- [Nginx Documentation](https://nginx.org/en/docs/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)

---

## ✅ Deployment Checklist

- [ ] Droplet created and accessible via SSH
- [ ] Docker and Docker Compose installed
- [ ] Firewall configured (UFW)
- [ ] Application deployed and running
- [ ] Domain DNS configured (if using domain)
- [ ] SSL certificate obtained and configured
- [ ] Monitoring stack deployed
- [ ] Automated backups configured
- [ ] Email service configured and tested
- [ ] S3 file storage configured (or MinIO)
- [ ] First admin user created
- [ ] Application tested end-to-end
- [ ] Documentation reviewed

---

**Congratulations! 🎉 Your Liyaqa instance is now live on DigitalOcean!**

For ongoing support and updates, visit: https://github.com/YourOrg/Liyaqa
