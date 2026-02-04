# Monorepo Deployment Instructions

## 🎉 Successfully Pushed to GitHub

**Commit:** `545d0e4` - feat: Implement npm workspace monorepo architecture for frontend (WIP)
**Repository:** https://github.com/AminElhag/Liyaqa
**Branch:** main

---

## ⚠️ Current Status: Work in Progress (75% Complete)

The monorepo structure is in place and the code has been pushed, but there are **import path issues** that need to be resolved before production deployment.

### What's Working ✅
- Workspace structure complete
- All files copied to correct locations
- Import paths migrated in apps (club & platform)
- Docker configurations created
- Git history preserved

### What Needs Fixing ⚠️
- ~300 import path resolution errors in shared package
- Builds not yet tested successfully
- Type checking disabled temporarily (strict: false)

---

## 📋 Deployment Options

### Option 1: Continue Using Monolith (Recommended for Now)

**Keep the current production deployment running** while we fix the remaining issues.

The old monolith code is still in `/frontend/src/` and the current Docker setup will continue to work.

**No action needed on server.**

---

### Option 2: Deploy Monorepo (Not Recommended Yet)

If you want to deploy the monorepo despite the issues:

#### Step 1: Pull Latest Code on Server

```bash
# SSH to server
ssh root@167.71.233.43

# Navigate to deployment directory
cd /opt/Liyaqa

# Pull latest changes
git pull origin main
```

#### Step 2: Update Docker Compose

Create or update `/opt/Liyaqa/deploy/docker-compose.monorepo.yml`:

```yaml
version: '3.8'

services:
  backend:
    image: amegung/liyaqa-backend:latest
    container_name: liyaqa-backend
    # ... existing backend config ...

  frontend-club:
    build:
      context: ../frontend
      dockerfile: apps/club/Dockerfile
    container_name: liyaqa-frontend-club
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - NEXT_PUBLIC_API_URL=https://api.liyaqa.com
    restart: unless-stopped
    networks:
      - liyaqa-network

  frontend-platform:
    build:
      context: ../frontend
      dockerfile: apps/platform/Dockerfile
    container_name: liyaqa-frontend-platform
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
      - NEXT_PUBLIC_API_URL=https://api.liyaqa.com
    restart: unless-stopped
    networks:
      - liyaqa-network

  nginx:
    image: nginx:alpine
    container_name: liyaqa-nginx
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf
      - ./nginx/certs:/etc/nginx/certs
    depends_on:
      - backend
      - frontend-club
      - frontend-platform
    restart: unless-stopped
    networks:
      - liyaqa-network

networks:
  liyaqa-network:
    driver: bridge
```

#### Step 3: Update Nginx Configuration

Update `/opt/Liyaqa/deploy/nginx/nginx.conf` to route subdomains:

```nginx
# Club App - app.liyaqa.com
server {
    listen 80;
    server_name app.liyaqa.com;

    location / {
        proxy_pass http://frontend-club:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}

# Platform App - platform.liyaqa.com
server {
    listen 80;
    server_name platform.liyaqa.com;

    location / {
        proxy_pass http://frontend-platform:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}

# API - api.liyaqa.com
server {
    listen 80;
    server_name api.liyaqa.com;

    location / {
        proxy_pass http://backend:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

#### Step 4: Build and Deploy

```bash
cd /opt/Liyaqa/deploy

# Build images (this will likely fail due to import errors)
docker compose -f docker-compose.monorepo.yml build

# If builds succeed, deploy
docker compose -f docker-compose.monorepo.yml up -d

# Check logs
docker compose logs -f frontend-club
docker compose logs -f frontend-platform
```

#### Step 5: DNS Configuration

Ensure DNS records point to your server:
- `app.liyaqa.com` → `167.71.233.43`
- `platform.liyaqa.com` → `167.71.233.43`
- `api.liyaqa.com` → `167.71.233.43`

---

## 🔧 Next Steps to Complete Monorepo

### 1. Fix Import Paths in Shared Package

The shared package has ~300 import errors where relative paths need correction:

```bash
cd /Users/waraiotoko/Desktop/Liyaqa/frontend

# Option A: Fix paths manually (2-3 hours)
# Edit files in shared/src/ to use correct relative paths

# Option B: Simplify shared package (1 hour)
# Remove complex components, keep only UI primitives

# Option C: Use webpack aliases (30 min)
# Configure Next.js to resolve @/ from shared
```

### 2. Test Local Development

```bash
cd /Users/waraiotoko/Desktop/Liyaqa/frontend

# Test club app
npm run dev:club
# Open http://localhost:3000

# Test platform app
npm run dev:platform
# Open http://localhost:3001
```

### 3. Test Production Builds

```bash
# Build both apps
npm run build:all

# Verify standalone outputs
ls -la apps/club/.next/standalone
ls -la apps/platform/.next/standalone
```

### 4. Build Docker Images

```bash
# Build club image
docker build -f apps/club/Dockerfile -t liyaqa-frontend-club:test .

# Build platform image
docker build -f apps/platform/Dockerfile -t liyaqa-frontend-platform:test .

# Test locally
docker run -p 3000:3000 liyaqa-frontend-club:test
docker run -p 3001:3001 liyaqa-frontend-platform:test
```

### 5. Push to Docker Hub

```bash
# Tag and push
docker tag liyaqa-frontend-club:test amegung/liyaqa-frontend-club:latest
docker tag liyaqa-frontend-platform:test amegung/liyaqa-frontend-platform:latest

docker push amegung/liyaqa-frontend-club:latest
docker push amegung/liyaqa-frontend-platform:latest
```

---

## 🔄 Rollback Instructions

If deployment fails and you need to rollback:

### On Local Machine

```bash
cd /Users/waraiotoko/Desktop/Liyaqa

# Restore from backup
tar -xzf frontend-monolith-backup-*.tar.gz -C frontend/

# Or revert git commit
git revert 545d0e4
git push origin main
```

### On Server

```bash
# SSH to server
ssh root@167.71.233.43

# Revert to previous commit
cd /opt/Liyaqa
git reset --hard 80e4ae4
git push -f origin main

# Restart existing services
cd deploy
docker compose -f docker-compose.production.yml restart frontend
```

---

## 📊 Monorepo Benefits (When Complete)

1. **Independent Scaling** - Scale club and platform apps separately
2. **Faster Builds** - Only rebuild changed apps
3. **Better Code Organization** - Clear separation of concerns
4. **Easier Testing** - Test apps independently
5. **Deployment Flexibility** - Deploy apps to different servers if needed

---

## 🆘 Support

If you encounter issues:

1. **Check logs:** `docker compose logs -f [service-name]`
2. **Verify DNS:** `nslookup app.liyaqa.com`
3. **Test locally first:** `npm run dev:club`
4. **Review migration status:** `frontend/MONOREPO_MIGRATION_STATUS.md`

---

## 📞 Contact

For assistance with completing the monorepo migration or deploying to production, the remaining work includes:

- [ ] Fix 300+ import path errors
- [ ] Test builds locally
- [ ] Test Docker images
- [ ] Update production docker-compose
- [ ] Deploy and verify

**Estimated Time to Complete:** 2-3 hours of focused work

---

**Current Recommendation:** Wait to deploy the monorepo until the import path issues are resolved and builds are tested successfully.
