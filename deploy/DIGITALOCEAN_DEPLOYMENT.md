# Liyaqa DigitalOcean Droplet Deployment Guide

Deploy the complete Liyaqa platform on a DigitalOcean Droplet.

## Cost Estimate

| Droplet Size | RAM | CPU | Storage | Monthly Cost | Recommended For |
|--------------|-----|-----|---------|--------------|-----------------|
| Basic $6 | 1GB | 1 vCPU | 25GB | **$6/mo** | Demo/Testing |
| Basic $12 | 2GB | 1 vCPU | 50GB | **$12/mo** | Small Production |
| Basic $24 | 4GB | 2 vCPU | 80GB | **$24/mo** | Production |

**Recommended for investor demo: $6/mo (1GB RAM, 1 vCPU)**

---

## Quick Start (15-20 minutes)

### Step 1: Create Droplet in DigitalOcean

1. Go to [DigitalOcean](https://cloud.digitalocean.com/)
2. Click **Create** → **Droplets**
3. Configure:
   - **Region:** Choose closest to your users (e.g., Frankfurt, Singapore)
   - **Image:** Ubuntu 24.04 LTS
   - **Size:** Basic $6/mo (1GB RAM) or $12/mo (2GB RAM)
   - **Authentication:** SSH Key (recommended) or Password
   - **Hostname:** `liyaqa-server`
4. Click **Create Droplet**
5. Copy the **IP address** when ready

### Step 2: Connect to Your Droplet

```bash
# Using SSH (replace with your Droplet IP)
ssh root@YOUR_DROPLET_IP
```

### Step 3: Run Setup Script

```bash
# Download and run setup script
curl -fsSL https://raw.githubusercontent.com/AminElhag/Liyaqa/main/deploy/setup-server.sh -o setup-server.sh
chmod +x setup-server.sh
sudo ./setup-server.sh
```

This installs Docker, configures firewall, and prepares the server.

### Step 4: Clone Repository

```bash
cd /opt/liyaqa
git clone https://github.com/AminElhag/Liyaqa.git .
```

### Step 5: Configure Environment

```bash
# Copy example environment file
cp deploy/.env.example .env

# Edit with your values
nano .env
```

**Required changes in .env:**
```bash
# Change these values:
POSTGRES_PASSWORD=your_strong_password_here
JWT_SECRET=your_random_32_character_secret_key

# Replace YOUR_DROPLET_IP with your actual IP:
CORS_ALLOWED_ORIGINS=http://YOUR_DROPLET_IP
NEXT_PUBLIC_API_URL=http://YOUR_DROPLET_IP
```

**Generate a secure JWT secret:**
```bash
openssl rand -base64 32
```

### Step 6: Deploy

```bash
# Copy deployment files
cp deploy/docker-compose.droplet.yml docker-compose.yml
cp -r deploy/nginx/* nginx/

# Build and start (first time takes 5-10 minutes)
docker compose up -d --build

# Watch the logs
docker compose logs -f
```

### Step 7: Verify Deployment

Wait 2-3 minutes for services to start, then test:

```bash
# Check all services are running
docker compose ps

# Test backend health
curl http://localhost/actuator/health

# Test from your browser
# Frontend: http://YOUR_DROPLET_IP
# API Docs: http://YOUR_DROPLET_IP/swagger-ui.html
```

---

## Login Credentials

**Platform Admin (B2B Dashboard):**
- URL: `http://YOUR_DROPLET_IP/en/platform-login`
- Email: `admin@liyaqa.com`
- Password: `password123`

**Demo Client (Gym Dashboard):**
- URL: `http://YOUR_DROPLET_IP/en/login`
- Email: `admin@demo.com`
- Password: `Test1234`
- Tenant ID: `22222222-2222-2222-2222-222222222222`

---

## Optional: Setup SSL (HTTPS)

If you have a domain name pointed to your Droplet:

```bash
# Point your domain's A record to your Droplet IP first
# Then run:
./deploy/setup-ssl.sh yourdomain.com your-email@example.com
```

---

## Management Commands

### View Logs
```bash
cd /opt/liyaqa
docker compose logs -f              # All services
docker compose logs -f backend      # Backend only
docker compose logs -f frontend     # Frontend only
docker compose logs -f postgres     # Database only
```

### Restart Services
```bash
docker compose restart              # Restart all
docker compose restart backend      # Restart backend only
```

### Update Application
```bash
cd /opt/liyaqa
git pull origin main
docker compose up -d --build
```

### Stop Everything
```bash
docker compose down
```

### Database Backup
```bash
# Create backup
docker compose exec postgres pg_dump -U liyaqa liyaqa > backup_$(date +%Y%m%d).sql

# Restore backup
cat backup_20240122.sql | docker compose exec -T postgres psql -U liyaqa liyaqa
```

---

## Troubleshooting

### Backend won't start
```bash
# Check logs
docker compose logs backend

# Common issues:
# - Database not ready: Wait longer, or restart
# - Missing env vars: Check .env file
# - Out of memory: Upgrade droplet or add swap
```

### Frontend shows blank page
```bash
# Check frontend logs
docker compose logs frontend

# Verify API URL in .env
# NEXT_PUBLIC_API_URL should match your Droplet IP
```

### Can't connect to database
```bash
# Check postgres logs
docker compose logs postgres

# Verify database is healthy
docker compose exec postgres pg_isready -U liyaqa
```

### Out of memory (OOM)
```bash
# Check memory usage
free -h
docker stats

# Add swap if needed (already done by setup script)
# Or upgrade to larger droplet
```

---

## Architecture

```
                    ┌─────────────────────────────────────┐
                    │         DigitalOcean Droplet        │
                    │                                     │
  Internet ────────►│  ┌─────────┐                       │
       :80/:443     │  │  Nginx  │──────► Frontend:3000  │
                    │  │ (Proxy) │                       │
                    │  └────┬────┘──────► Backend:8080   │
                    │       │                            │
                    │       │            ┌────────────┐  │
                    │       └───────────►│ PostgreSQL │  │
                    │                    │   :5432    │  │
                    │                    └────────────┘  │
                    └─────────────────────────────────────┘
```

---

## Security Checklist

- [ ] Changed default passwords in .env
- [ ] Using strong JWT_SECRET (32+ characters)
- [ ] Firewall enabled (UFW)
- [ ] Fail2ban configured
- [ ] SSH key authentication (disable password auth)
- [ ] SSL/HTTPS enabled (for production)
- [ ] Regular backups configured

---

## Support

- GitHub Issues: https://github.com/AminElhag/Liyaqa/issues
- Documentation: See CLAUDE.md in repository root
