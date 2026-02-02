# CI/CD Quick Reference Card

Quick commands and information for the DigitalOcean droplet CI/CD pipeline.

---

## 🔐 GitHub Secrets (Required)

Add these in: **Settings** → **Secrets and variables** → **Actions**

| Secret | Value | Notes |
|--------|-------|-------|
| `PROD_HOST` | `167.71.233.43` | Droplet IP |
| `PROD_USER` | `root` | SSH user |
| `PROD_SSH_KEY` | Private key content | From `~/.ssh/liyaqa_deploy_key` |
| `PROD_SSH_PORT` | `22` | Default SSH port |
| `DOCKERHUB_USERNAME` | `amegung` | Docker Hub user |
| `DOCKERHUB_TOKEN` | Token from Docker Hub | Create at hub.docker.com/settings/security |
| `SLACK_WEBHOOK` | Webhook URL (optional) | For notifications |

---

## ⚡ Quick Setup Commands

```bash
# 1. Generate SSH key (on local machine)
ssh-keygen -t ed25519 -C "github-actions-deploy" -f ~/.ssh/liyaqa_deploy_key

# 2. Copy to droplet
ssh-copy-id -i ~/.ssh/liyaqa_deploy_key.pub root@167.71.233.43

# 3. Test connection
ssh -i ~/.ssh/liyaqa_deploy_key root@167.71.233.43 "echo 'Works!'"

# 4. Get private key for GitHub
cat ~/.ssh/liyaqa_deploy_key

# 5. Get current production secrets
ssh root@167.71.233.43 "cat /opt/Liyaqa/.env | grep -E 'POSTGRES_PASSWORD|JWT_SECRET'"
```

---

## 🚀 Triggering Deployments

### Automatic (on push to main)
```bash
git add .
git commit -m "feat: your changes"
git push origin main
# Deployment starts automatically
```

### Manual (via GitHub UI)
1. Go to GitHub → Actions → "Deploy to DigitalOcean Droplet"
2. Click "Run workflow"
3. Select `main` branch
4. Click "Run workflow"

---

## 🔍 Monitoring & Debugging

### Check Deployment Status
```bash
# View GitHub Actions
# URL: https://github.com/YOUR_USERNAME/Liyaqa/actions

# Check services on droplet
ssh root@167.71.233.43 "cd /opt/Liyaqa/deploy && docker compose -f docker-compose.droplet.yml ps"

# View live logs
ssh root@167.71.233.43 "cd /opt/Liyaqa/deploy && docker compose -f docker-compose.droplet.yml logs -f"
```

### Quick Health Check
```bash
# Check backend health
curl http://167.71.233.43/actuator/health

# Check frontend
curl -I http://167.71.233.43

# Check what commit is deployed
ssh root@167.71.233.43 "cd /opt/Liyaqa && git log -1 --oneline"
```

### View Logs
```bash
# Backend logs
ssh root@167.71.233.43 "cd /opt/Liyaqa/deploy && docker compose -f docker-compose.droplet.yml logs backend --tail=100"

# Frontend logs
ssh root@167.71.233.43 "cd /opt/Liyaqa/deploy && docker compose -f docker-compose.droplet.yml logs frontend --tail=100"

# All services
ssh root@167.71.233.43 "cd /opt/Liyaqa/deploy && docker compose -f docker-compose.droplet.yml logs --tail=50"
```

---

## 🔄 Rollback

```bash
# SSH to droplet
ssh root@167.71.233.43
cd /opt/Liyaqa

# View recent commits
git log --oneline -5

# Rollback to previous commit
git reset --hard COMMIT_HASH

# Redeploy
cd deploy
cp ../.env .env
docker compose -f docker-compose.droplet.yml pull
docker compose -f docker-compose.droplet.yml up -d

# Verify
docker compose -f docker-compose.droplet.yml logs -f backend
```

---

## 🛠️ Common Fixes

### Deployment Stuck
```bash
ssh root@167.71.233.43
cd /opt/Liyaqa/deploy

# Restart services
docker compose -f docker-compose.droplet.yml restart

# Or full restart
docker compose -f docker-compose.droplet.yml down
docker compose -f docker-compose.droplet.yml up -d
```

### Out of Memory
```bash
# Check memory
ssh root@167.71.233.43 "free -h"

# Check container stats
ssh root@167.71.233.43 "docker stats --no-stream"

# Restart specific service
ssh root@167.71.233.43 "cd /opt/Liyaqa/deploy && docker compose -f docker-compose.droplet.yml restart backend"
```

### Clean Up Old Images
```bash
ssh root@167.71.233.43

# Remove unused images
docker image prune -a -f

# Remove unused containers
docker container prune -f

# Remove unused volumes
docker volume prune -f
```

---

## 📊 System Health

```bash
# Disk space
ssh root@167.71.233.43 "df -h"

# Memory usage
ssh root@167.71.233.43 "free -h"

# Container resources
ssh root@167.71.233.43 "docker stats --no-stream"

# System load
ssh root@167.71.233.43 "uptime"

# Docker disk usage
ssh root@167.71.233.43 "docker system df"
```

---

## 🔐 Security

### Rotate SSH Key
```bash
# Generate new key
ssh-keygen -t ed25519 -C "github-deploy-2026" -f ~/.ssh/liyaqa_deploy_new

# Add to droplet
ssh-copy-id -i ~/.ssh/liyaqa_deploy_new.pub root@167.71.233.43

# Update GitHub secret PROD_SSH_KEY with new key
cat ~/.ssh/liyaqa_deploy_new

# Remove old key from droplet
ssh root@167.71.233.43
nano ~/.ssh/authorized_keys  # Delete old key line
```

### Update Production Secrets
```bash
# SSH to droplet
ssh root@167.71.233.43
cd /opt/Liyaqa

# Edit environment
nano .env

# Restart to apply
cd deploy
docker compose -f docker-compose.droplet.yml restart
```

---

## 🎯 Deployment Flow

```
Push to main
    ↓
Run Tests (5-10 min)
    ↓
Build Docker Images (3-5 min)
    ↓
Deploy to Droplet (2-3 min)
    ↓
Health Checks
    ↓
✅ Live
```

**Total time**: ~10-15 minutes

---

## 📞 Emergency Commands

### Stop All Services
```bash
ssh root@167.71.233.43 "cd /opt/Liyaqa/deploy && docker compose -f docker-compose.droplet.yml down"
```

### Start All Services
```bash
ssh root@167.71.233.43 "cd /opt/Liyaqa/deploy && docker compose -f docker-compose.droplet.yml up -d"
```

### View What's Running
```bash
ssh root@167.71.233.43 "docker ps"
```

### Emergency Rollback (Last Working Commit)
```bash
ssh root@167.71.233.43 "cd /opt/Liyaqa && git reset --hard HEAD~1 && cd deploy && docker compose -f docker-compose.droplet.yml up -d"
```

---

## 📱 URLs

- **Production**: http://167.71.233.43
- **Backend Health**: http://167.71.233.43/actuator/health
- **GitHub Actions**: https://github.com/YOUR_USERNAME/Liyaqa/actions
- **Docker Hub**: https://hub.docker.com/u/amegung

---

## ✅ Pre-Deployment Checklist

Before pushing to main:
- [ ] Tests pass locally (`./gradlew test` and `npm run test:run`)
- [ ] No linting errors
- [ ] Database migrations included (if needed)
- [ ] Environment variables documented
- [ ] Changes reviewed

---

## 🐛 Troubleshooting

| Issue | Quick Fix |
|-------|-----------|
| Tests failing | Run `./gradlew test` locally to debug |
| SSH connection failed | Verify GitHub secret `PROD_SSH_KEY` is correct |
| Docker build failed | Check Dockerfile syntax and dependencies |
| Services not healthy | Check logs: `docker compose logs backend` |
| Out of disk space | Run `docker system prune -a -f` |
| Out of memory | Restart container or upgrade droplet |
| Port already in use | Check for duplicate containers: `docker ps -a` |

---

## 💡 Pro Tips

1. **Monitor during first deployment**: Watch GitHub Actions and droplet logs simultaneously
2. **Test SSH key before setting secrets**: Save time by verifying SSH access first
3. **Keep .env in sync**: Droplet `.env` should match expected variables
4. **Use manual workflow first**: Test with manual trigger before relying on automatic deploys
5. **Setup Slack notifications**: Get notified of deployment status immediately
6. **Enable branch protection**: Require PR reviews before merging to main

---

**Need help?** Check the full guide: `CI_CD_SETUP_GUIDE.md`
