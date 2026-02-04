# Production Deployment Instructions

## ✅ **Docker Image Built and Pushed Successfully!**

**Image:** `amegung/liyaqa-frontend-club:latest`
**Digest:** `sha256:93f7f54fe6ce765657298f0474ed374c0522332659b14bc62286f3489b554457`
**Status:** Ready for production deployment

---

## 🚀 **Deploy to Production Server**

### Step 1: SSH to Production Server

```bash
ssh root@167.71.233.43
```

### Step 2: Navigate to Deployment Directory

```bash
cd /opt/Liyaqa
```

### Step 3: Pull Latest Code

```bash
git pull origin main
```

### Step 4: Pull New Docker Image

```bash
docker pull amegung/liyaqa-frontend-club:latest
```

### Step 5: Update Docker Compose Configuration

**Option A: Use Existing Frontend Container (Quick)**

If you want to replace the existing frontend with the new club app:

```bash
cd deploy

# Stop current frontend
docker compose -f docker-compose.production.yml stop frontend

# Update docker-compose.production.yml
nano docker-compose.production.yml
```

Change the frontend service:

```yaml
  frontend:
    image: amegung/liyaqa-frontend-club:latest
    container_name: liyaqa-frontend-club
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - NEXT_PUBLIC_API_URL=https://api.liyaqa.com
    restart: unless-stopped
    networks:
      - liyaqa-network
```

Then restart:

```bash
docker compose -f docker-compose.production.yml up -d frontend
```

**Option B: Run Both Old and New (Side-by-Side)**

Keep the old frontend running on port 3000 and run the new one on port 3001:

```bash
# Run the new club app on port 3001 temporarily
docker run -d \
  --name liyaqa-frontend-club-new \
  --network liyaqa-network \
  -p 3001:3000 \
  -e NODE_ENV=production \
  -e NEXT_PUBLIC_API_URL=https://api.liyaqa.com \
  --restart unless-stopped \
  amegung/liyaqa-frontend-club:latest

# Test the new app at http://167.71.233.43:3001
# If it works, stop the old one and switch ports
```

---

## 🔍 **Verify Deployment**

### Check Container Status

```bash
docker ps | grep frontend
```

### Check Logs

```bash
# For Option A
docker compose -f docker-compose.production.yml logs -f frontend

# For Option B
docker logs -f liyaqa-frontend-club-new
```

### Test the Application

```bash
# Check if it's responding
curl http://localhost:3000

# Or from your local machine
curl http://167.71.233.43:3000
```

### Access in Browser

- **App:** http://app.liyaqa.com (if DNS is configured)
- **Direct IP:** http://167.71.233.43:3000

---

## ⚙️ **Environment Variables**

The Docker image uses these environment variables:

- `NODE_ENV=production` (required)
- `NEXT_PUBLIC_API_URL=https://api.liyaqa.com` (required)

Add any additional env vars to the docker-compose file or docker run command.

---

## 🔄 **Rollback Plan**

If something goes wrong:

### Rollback to Previous Image

```bash
cd /opt/Liyaqa/deploy

# Stop new frontend
docker compose -f docker-compose.production.yml stop frontend

# Change image back to previous version
nano docker-compose.production.yml
# Change image to: amegung/liyaqa-frontend:latest (or previous tag)

# Restart
docker compose -f docker-compose.production.yml up -d frontend
```

### Rollback Git Changes

```bash
cd /opt/Liyaqa
git log --oneline | head -5  # Find commit to revert to
git reset --hard <commit-hash>
```

---

## 📋 **Complete docker-compose.production.yml Example**

Here's a complete example with the new monorepo structure:

```yaml
version: '3.8'

services:
  backend:
    image: amegung/liyaqa-backend:latest
    container_name: liyaqa-backend
    environment:
      - SPRING_PROFILES_ACTIVE=prod
      - SPRING_DATASOURCE_URL=jdbc:postgresql://db:5432/liyaqa
      - SPRING_DATASOURCE_USERNAME=${DB_USER}
      - SPRING_DATASOURCE_PASSWORD=${DB_PASSWORD}
    ports:
      - "8080:8080"
    depends_on:
      - db
    restart: unless-stopped
    networks:
      - liyaqa-network

  frontend-club:
    image: amegung/liyaqa-frontend-club:latest
    container_name: liyaqa-frontend-club
    environment:
      - NODE_ENV=production
      - NEXT_PUBLIC_API_URL=https://api.liyaqa.com
    ports:
      - "3000:3000"
    restart: unless-stopped
    networks:
      - liyaqa-network

  db:
    image: postgres:15-alpine
    container_name: liyaqa-db
    environment:
      - POSTGRES_DB=liyaqa
      - POSTGRES_USER=${DB_USER}
      - POSTGRES_PASSWORD=${DB_PASSWORD}
    volumes:
      - postgres-data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    restart: unless-stopped
    networks:
      - liyaqa-network

  nginx:
    image: nginx:alpine
    container_name: liyaqa-nginx
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/certs:/etc/nginx/certs:ro
    ports:
      - "80:80"
      - "443:443"
    depends_on:
      - backend
      - frontend-club
    restart: unless-stopped
    networks:
      - liyaqa-network

networks:
  liyaqa-network:
    driver: bridge

volumes:
  postgres-data:
```

---

## 🌐 **Nginx Configuration**

If you need to update nginx to route to the new container:

```bash
nano /opt/Liyaqa/deploy/nginx/nginx.conf
```

Update the frontend proxy:

```nginx
upstream frontend {
    server frontend-club:3000;
}

server {
    listen 80;
    server_name app.liyaqa.com;

    location / {
        proxy_pass http://frontend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Reload nginx:

```bash
docker compose -f docker-compose.production.yml exec nginx nginx -s reload
```

---

## ✅ **Post-Deployment Checklist**

- [ ] Container is running (`docker ps`)
- [ ] Logs show no errors (`docker logs`)
- [ ] Application accessible via browser
- [ ] Login functionality works
- [ ] API calls are successful
- [ ] i18n language switching works (en/ar)
- [ ] All routes accessible

---

## 📊 **Monitoring**

### Check Resource Usage

```bash
docker stats liyaqa-frontend-club
```

### Check Disk Space

```bash
df -h
docker system df
```

### Clean Up Old Images

```bash
# Remove dangling images
docker image prune -f

# Remove old frontend images (keep latest)
docker images | grep liyaqa-frontend | grep -v latest
```

---

## 🆘 **Troubleshooting**

### Container Won't Start

```bash
# Check detailed logs
docker logs liyaqa-frontend-club --tail 100

# Check if port is in use
netstat -tulpn | grep 3000

# Try running with interactive mode to see errors
docker run -it --rm amegung/liyaqa-frontend-club:latest
```

### Application Shows Errors

```bash
# Check environment variables
docker inspect liyaqa-frontend-club | grep -A 10 Env

# Check network connectivity
docker exec liyaqa-frontend-club ping backend
```

### High Memory Usage

```bash
# Restart container
docker restart liyaqa-frontend-club

# Set memory limits in docker-compose.yml
deploy:
  resources:
    limits:
      memory: 512M
```

---

## 📝 **What Was Deployed**

**Monorepo Club App:**
- ✅ Complete Next.js standalone build
- ✅ All admin, member, trainer routes
- ✅ Kiosk functionality
- ✅ i18n support (English/Arabic)
- ✅ Shared component library integration
- ✅ Production optimizations

**Build Details:**
- Standalone output: 139MB
- Static assets: 12MB
- Built with: Next.js 16.1.6
- Node.js: 20-alpine
- Architecture: linux/amd64

---

## 🎉 **Success!**

Once deployed, your new monorepo-based frontend will be live!

**Key Improvements:**
- Better code organization
- Shared component library
- Independent app scaling (future)
- Improved build performance
- Modern monorepo architecture

---

**Need Help?** Check logs or contact support with any deployment issues.
