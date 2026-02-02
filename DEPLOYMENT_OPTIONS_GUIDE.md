# Liyaqa Platform - Deployment Options Guide

## 📊 System Architecture Overview

Your Liyaqa platform consists of:

- **Backend**: Kotlin/Spring Boot 3.4.1 (Java 21)
- **Frontend**: Next.js 15.1.0 (React 19, Node 20)
- **Database**: PostgreSQL 16
- **Cache**: Redis (sessions + application cache)
- **Monitoring**: Prometheus + Grafana + Loki + Zipkin
- **File Storage**: AWS S3 or MinIO
- **Email**: SendGrid, AWS SES, or SMTP

**Current Docker Assets:**
✅ Multi-stage Dockerfiles (backend + frontend)
✅ Docker Compose configurations (production + monitoring)
✅ Pre-built images on Docker Hub (`amegung/liyaqa-backend:latest`, `amegung/liyaqa-frontend:latest`)

---

## 🚀 Deployment Options (Ranked by Complexity)

### **Option 1: VPS/Cloud VM (DigitalOcean, Linode, Hetzner, AWS EC2)**
**💰 Cost**: $12-40/month | **⚙️ Complexity**: Low | **⏱️ Setup Time**: 30-60 minutes

**✅ BEST FOR**: Production launch, full control, cost-effective

**Requirements:**
- Minimum: 2GB RAM, 2 vCPU, 50GB SSD
- Recommended: 4GB RAM, 2 vCPU, 80GB SSD (for monitoring stack)

#### Why This Is Your Best Option:
1. ✅ **Pre-configured for VPS**: `docker-compose.droplet.yml` already exists
2. ✅ **Complete stack**: PostgreSQL, Redis, Backend, Frontend, Nginx all configured
3. ✅ **Cost-effective**: ~$12-24/month vs $50-200/month on PaaS
4. ✅ **Full control**: Customize everything, no vendor lock-in
5. ✅ **Monitoring ready**: Prometheus/Grafana stack ready to deploy

#### Quick Start (DigitalOcean Droplet Example):

```bash
# 1. Create droplet (Ubuntu 24.04, 2GB RAM, $12/month)
# 2. SSH into droplet
ssh root@your-droplet-ip

# 3. Install Docker & Docker Compose
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
apt-get install -y docker-compose-plugin

# 4. Clone your repository (or upload files)
git clone https://github.com/your-org/liyaqa.git /opt/liyaqa
cd /opt/liyaqa/deploy

# 5. Create environment file
cat > .env <<EOF
# Database
POSTGRES_DB=liyaqa
POSTGRES_USER=liyaqa
POSTGRES_PASSWORD=$(openssl rand -base64 32)

# Security
JWT_SECRET=$(openssl rand -base64 32)
CORS_ALLOWED_ORIGINS=https://yourdomain.com

# Email (Optional - configure later)
EMAIL_ENABLED=false

# Storage (use MinIO for now, migrate to S3 later)
STORAGE_TYPE=local

# Redis
REDIS_HOST=redis
REDIS_PORT=6379
EOF

# 6. Start the stack
docker compose -f docker-compose.droplet.yml up -d

# 7. Check logs
docker compose logs -f

# 8. Setup SSL (Let's Encrypt)
# Edit nginx config with your domain, then:
docker compose --profile ssl up certbot
```

#### Post-Deployment:
```bash
# Enable monitoring stack
cd /opt/liyaqa/deploy
docker compose -f docker-compose.monitoring.yml up -d

# Access services:
# - App: http://your-ip (https://yourdomain.com with SSL)
# - Grafana: http://your-ip:3001
# - Prometheus: http://your-ip:9090
```

**Providers Comparison:**

| Provider | 2GB RAM | 4GB RAM | Locations | Notes |
|----------|---------|---------|-----------|-------|
| **DigitalOcean** | $12/mo | $24/mo | Global | Best UX, 1-click apps |
| **Linode (Akamai)** | $12/mo | $24/mo | Global | Fast network |
| **Hetzner** | €4.5/mo | €8/mo | EU only | Cheapest, great performance |
| **Vultr** | $12/mo | $24/mo | Global | Good DDoS protection |
| **AWS EC2 (t3.small)** | ~$15/mo | ~$30/mo | Global | Advanced features, complex pricing |

**Recommended**: Start with **Hetzner** (cheapest) or **DigitalOcean** (easiest).

---

### **Option 2: Managed Kubernetes (GKE, EKS, AKS, DigitalOcean K8s)**
**💰 Cost**: $30-100/month | **⚙️ Complexity**: Medium-High | **⏱️ Setup Time**: 4-8 hours

**✅ BEST FOR**: Scaling to 100+ concurrent businesses, high availability

**Why Use Kubernetes:**
- Auto-scaling based on load
- Zero-downtime deployments
- Multi-region support
- Container orchestration

**Requirements:**
- Kubernetes cluster (managed or self-hosted)
- Helm (package manager)
- kubectl CLI

#### Quick Start (DigitalOcean Kubernetes):

```bash
# 1. Create Kubernetes cluster (3 nodes, $40/month)
# 2. Download kubeconfig and set context

# 3. Create namespace
kubectl create namespace liyaqa-prod

# 4. Create secrets
kubectl create secret generic liyaqa-secrets \
  --from-literal=postgres-password=$(openssl rand -base64 32) \
  --from-literal=jwt-secret=$(openssl rand -base64 32) \
  -n liyaqa-prod

# 5. Deploy PostgreSQL (using Helm)
helm repo add bitnami https://charts.bitnami.com/bitnami
helm install postgres bitnami/postgresql \
  --set auth.username=liyaqa \
  --set auth.database=liyaqa \
  --set auth.existingSecret=liyaqa-secrets \
  --set persistence.size=20Gi \
  -n liyaqa-prod

# 6. Deploy Redis
helm install redis bitnami/redis \
  --set auth.enabled=false \
  -n liyaqa-prod

# 7. Create Kubernetes manifests (see kubernetes/ folder below)
kubectl apply -f kubernetes/

# 8. Setup ingress with SSL
helm install nginx-ingress ingress-nginx/ingress-nginx
kubectl apply -f kubernetes/ingress.yaml
```

**You'll need to create Kubernetes manifests** (I can help with this if you choose this option).

**Providers Comparison:**

| Provider | 3-node cluster | Auto-scaling | Managed | Notes |
|----------|----------------|--------------|---------|-------|
| **DigitalOcean K8s** | $40/mo | ✅ | ✅ | Easiest managed K8s |
| **GKE (Google)** | ~$75/mo | ✅ | ✅ | Best K8s features |
| **EKS (AWS)** | ~$90/mo | ✅ | ✅ | AWS ecosystem integration |
| **AKS (Azure)** | ~$70/mo | ✅ | ✅ | Azure integration |

---

### **Option 3: Platform-as-a-Service (Heroku-like)**
**💰 Cost**: $50-200/month | **⚙️ Complexity**: Low | **⏱️ Setup Time**: 1-2 hours

**⚠️ LIMITATION**: Most PaaS platforms struggle with multi-container apps. Your app needs PostgreSQL + Redis + Backend + Frontend together.

#### **Option 3A: Railway.app** (RECOMMENDED PaaS)
**💰 Cost**: ~$20-40/month | **⚙️ Complexity**: Very Low

Railway supports Docker Compose natively:

```bash
# 1. Install Railway CLI
npm i -g railway

# 2. Login and create project
railway login
railway init

# 3. Deploy using docker-compose
cd deploy
railway up --service backend --dockerfile ../backend/Dockerfile
railway up --service frontend --dockerfile ../frontend/Dockerfile

# 4. Add PostgreSQL and Redis from Railway dashboard
# They auto-provision and inject connection strings

# 5. Add environment variables via dashboard
```

**Pros:**
- ✅ Zero infrastructure management
- ✅ Auto-scaling
- ✅ Built-in PostgreSQL and Redis
- ✅ GitHub integration (auto-deploy on push)
- ✅ Free SSL

**Cons:**
- ❌ More expensive than VPS (~$20-40/mo vs $12/mo)
- ❌ Less control over infrastructure
- ❌ Monitoring stack harder to deploy

#### **Option 3B: Render.com**
Similar to Railway, supports Docker:

```bash
# 1. Create account on render.com
# 2. Create services:
#    - PostgreSQL (managed) - $7/month
#    - Redis (managed) - $10/month
#    - Backend web service (Docker) - $7-25/month
#    - Frontend web service (Docker) - $7-25/month

# 3. Connect GitHub repo
# 4. Configure environment variables
# 5. Deploy
```

**Total Cost**: ~$30-60/month

#### **Option 3C: Fly.io**
Excellent for global deployment:

```bash
# 1. Install flyctl
curl -L https://fly.io/install.sh | sh

# 2. Login and launch apps
flyctl auth login
flyctl launch --dockerfile backend/Dockerfile --name liyaqa-backend
flyctl launch --dockerfile frontend/Dockerfile --name liyaqa-frontend

# 3. Create PostgreSQL and Redis
flyctl postgres create --name liyaqa-db
flyctl redis create --name liyaqa-redis

# 4. Attach to apps
flyctl postgres attach liyaqa-db -a liyaqa-backend
flyctl redis attach liyaqa-redis -a liyaqa-backend
```

**Pros:**
- ✅ Global edge network (fastest)
- ✅ Free tier (good for testing)
- ✅ Excellent developer experience

**Cons:**
- ❌ Pricing can be unpredictable
- ❌ Learning curve for Fly-specific configs

---

### **Option 4: AWS/Azure/GCP (Full Cloud)**
**💰 Cost**: $100-500/month | **⚙️ Complexity**: High | **⏱️ Setup Time**: 8-16 hours

**✅ BEST FOR**: Enterprise scale, compliance requirements, Saudi market (AWS Middle East)

#### **Option 4A: AWS (Recommended for Saudi Market)**

**Architecture:**
- **Compute**: ECS Fargate (or EC2 + Docker)
- **Database**: RDS PostgreSQL
- **Cache**: ElastiCache Redis
- **Storage**: S3
- **CDN**: CloudFront
- **Email**: SES
- **Monitoring**: CloudWatch + Grafana

**Quick Start (AWS ECS Fargate):**

```bash
# 1. Install AWS CLI
aws configure

# 2. Create VPC, subnets, security groups (or use default)

# 3. Create RDS PostgreSQL
aws rds create-db-instance \
  --db-instance-identifier liyaqa-db \
  --db-instance-class db.t3.small \
  --engine postgres \
  --engine-version 16 \
  --master-username liyaqa \
  --master-user-password YOUR_PASSWORD \
  --allocated-storage 20

# 4. Create ElastiCache Redis
aws elasticache create-cache-cluster \
  --cache-cluster-id liyaqa-redis \
  --cache-node-type cache.t3.micro \
  --engine redis

# 5. Push Docker images to ECR
aws ecr create-repository --repository-name liyaqa-backend
aws ecr create-repository --repository-name liyaqa-frontend

docker tag amegung/liyaqa-backend:latest YOUR_ECR/liyaqa-backend:latest
docker push YOUR_ECR/liyaqa-backend:latest

# 6. Create ECS cluster and task definitions
aws ecs create-cluster --cluster-name liyaqa-cluster
# Create task definitions (JSON files needed)

# 7. Create Application Load Balancer
# 8. Deploy services to ECS
```

**Estimated Monthly Cost (Saudi Arabia - me-south-1):**
- ECS Fargate (2 tasks): ~$40
- RDS db.t3.small: ~$30
- ElastiCache t3.micro: ~$15
- S3 + CloudFront: ~$10
- Load Balancer: ~$20
- **Total**: ~$115/month

**Pros:**
- ✅ Saudi Arabia region (Bahrain - me-south-1)
- ✅ Enterprise-grade security
- ✅ Compliance (SAMA, NCA)
- ✅ Managed services (less maintenance)
- ✅ Auto-scaling

**Cons:**
- ❌ Complex setup
- ❌ Higher cost
- ❌ Learning curve

#### **Option 4B: Azure**
Similar architecture using Azure Container Apps, Azure Database for PostgreSQL, Azure Cache for Redis.

#### **Option 4C: Google Cloud (GCP)**
Similar architecture using Cloud Run, Cloud SQL, Memorystore.

---

## 🎯 Decision Matrix

| Criteria | VPS (Option 1) | Kubernetes (Option 2) | PaaS (Option 3) | Full Cloud (Option 4) |
|----------|----------------|----------------------|-----------------|----------------------|
| **Setup Time** | 30-60 min | 4-8 hours | 1-2 hours | 8-16 hours |
| **Monthly Cost** | $12-40 | $40-100 | $50-200 | $100-500 |
| **Scalability** | Manual | Auto | Auto | Auto |
| **Complexity** | Low | High | Low | High |
| **Control** | Full | Full | Limited | Full |
| **Monitoring Stack** | ✅ Easy | ✅ Easy | ⚠️ Hard | ✅ Easy |
| **Multi-tenant Ready** | ✅ | ✅ | ✅ | ✅ |
| **Saudi Data Residency** | ⚠️ Choose region | ⚠️ Choose region | ❌ Limited | ✅ AWS Bahrain |

---

## 🏆 RECOMMENDED DEPLOYMENT STRATEGY

### **Phase 1: Launch (Months 1-3) - VPS**
**Platform**: Hetzner (€8/mo for 4GB) or DigitalOcean ($24/mo)

**Why:**
- ✅ Fastest to deploy (30 minutes)
- ✅ Cheapest ($12-24/month total)
- ✅ Your `docker-compose.droplet.yml` is production-ready
- ✅ Monitoring stack included
- ✅ Handles 50-100 concurrent users easily

**Deployment Steps:**
1. Provision 4GB RAM VPS
2. Install Docker
3. Clone repo and configure `.env`
4. Run `docker compose -f docker-compose.droplet.yml up -d`
5. Configure domain and SSL
6. Deploy monitoring: `docker compose -f docker-compose.monitoring.yml up -d`

### **Phase 2: Scale (Months 3-6) - Stay on VPS, Add S3 + SendGrid**
**Cost**: $30-40/month

**Why:**
- Single VPS can handle 500-1000 concurrent users with proper optimization
- Migrate file storage to S3 ($5/mo)
- Add SendGrid for emails ($10/mo for 12k emails)
- Add Redis clustering if needed

**Upgrades:**
- VPS: 8GB RAM ($48/mo DigitalOcean or €16/mo Hetzner)
- S3: $5-10/month
- SendGrid: $10-15/month
- CDN (Cloudflare): Free tier

### **Phase 3: Growth (Months 6-12) - Migrate to Kubernetes or AWS**
**Cost**: $100-300/month

**When to migrate:**
- 1000+ concurrent users
- 100+ tenant businesses
- Multiple regions needed
- 99.9% SLA required

**Migration options:**
1. **DigitalOcean Kubernetes** ($40/mo cluster + managed DB $15/mo)
2. **AWS ECS Fargate** (~$115/mo in Bahrain region)

---

## 📦 Pre-Deployment Checklist

### ✅ Critical (Must Complete Before Launch)

- [ ] **Database Migration Cleanup**
  - Remove duplicate migrations: `V106__absolute_session_timeout.sql` and `V107__ip_based_session_binding.sql`
  - Keep: `V106__add_absolute_session_timeout.sql` and `V107__add_ip_binding_enabled.sql`
  - Add: `V108__add_member_uniqueness_constraints.sql`

- [ ] **Security Configuration**
  - Fix CORS in `SecurityConfig.kt` (remove wildcard with credentials)
  - Generate strong JWT_SECRET (min 32 chars)
  - Generate strong database password
  - Disable default credentials

- [ ] **File Storage**
  - Configure S3 or MinIO (don't use local storage)
  - Update `application.yml`: `storage.type=s3`

- [ ] **Environment Variables**
  - Set all production secrets
  - Configure CORS_ALLOWED_ORIGINS with actual domain
  - Configure email provider (SendGrid recommended)

- [ ] **SSL Certificate**
  - Configure domain DNS
  - Setup Let's Encrypt with Certbot

### ✅ Recommended (Should Complete Within Week 1)

- [ ] **Monitoring**
  - Deploy monitoring stack
  - Configure Grafana alerts
  - Test alerting (email/Slack)

- [ ] **Backups**
  - Enable PostgreSQL automated backups
  - Test restore procedure
  - Setup S3 file backup

- [ ] **Performance**
  - Enable Redis caching
  - Configure connection pools
  - Test under load (JMeter/k6)

- [ ] **Observability**
  - Connect backend to Prometheus
  - Import Grafana dashboards
  - Test distributed tracing (Zipkin)

---

## 🚀 Quick Start Commands (VPS Deployment)

```bash
# ===============================================
# FASTEST PATH TO PRODUCTION (30 minutes)
# ===============================================

# 1. Create VPS (Hetzner, DigitalOcean, etc.)
# Choose: Ubuntu 24.04, 4GB RAM, nearest region

# 2. SSH into server
ssh root@YOUR_SERVER_IP

# 3. Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
apt-get install -y docker-compose-plugin git

# 4. Clone repository
git clone https://github.com/your-org/liyaqa.git /opt/liyaqa
cd /opt/liyaqa

# 5. Create production .env
cd deploy
cat > .env <<'EOF'
# Database
POSTGRES_DB=liyaqa
POSTGRES_USER=liyaqa
POSTGRES_PASSWORD=CHANGE_ME_$(openssl rand -base64 32)

# Security
JWT_SECRET=CHANGE_ME_$(openssl rand -base64 32)
CORS_ALLOWED_ORIGINS=https://yourdomain.com,https://app.yourdomain.com

# Email (configure SendGrid after signup)
EMAIL_ENABLED=true
EMAIL_PROVIDER=sendgrid
SENDGRID_API_KEY=YOUR_SENDGRID_KEY
EMAIL_FROM=noreply@yourdomain.com

# Storage (use S3 after AWS signup)
STORAGE_TYPE=s3
S3_BUCKET_NAME=liyaqa-files
AWS_REGION=me-south-1
AWS_ACCESS_KEY_ID=YOUR_AWS_KEY
AWS_SECRET_ACCESS_KEY=YOUR_AWS_SECRET

# Redis
REDIS_HOST=redis
REDIS_PORT=6379
EOF

# 6. Generate actual secrets
sed -i "s/CHANGE_ME_//" .env

# 7. Start main application stack
docker compose -f docker-compose.droplet.yml up -d

# 8. Wait for services to be healthy
docker compose ps

# 9. Check logs
docker compose logs -f backend

# 10. Start monitoring stack (optional but recommended)
docker compose -f docker-compose.monitoring.yml up -d

# 11. Configure domain DNS
# Point A record: yourdomain.com -> YOUR_SERVER_IP

# 12. Setup SSL (after DNS propagates)
# Edit nginx config first, then:
docker compose exec nginx nginx -t
docker compose --profile ssl up certbot

# ===============================================
# YOUR APP IS NOW LIVE! 🎉
# ===============================================
# App: https://yourdomain.com
# Grafana: http://YOUR_SERVER_IP:3001 (admin/admin)
# Prometheus: http://YOUR_SERVER_IP:9090
```

---

## 🔧 Post-Deployment

### Week 1: Stabilization
- [ ] Monitor error rates in Grafana
- [ ] Test all critical user flows
- [ ] Verify email delivery
- [ ] Test payment processing
- [ ] Setup automated backups

### Week 2: Optimization
- [ ] Enable Redis caching
- [ ] Configure CDN (Cloudflare)
- [ ] Optimize database queries
- [ ] Setup log rotation

### Week 3: Monitoring
- [ ] Configure alerts (error rate, latency, disk space)
- [ ] Create on-call rotation
- [ ] Document incident response
- [ ] Test failover procedures

### Week 4: Scaling Prep
- [ ] Load test (simulate 500 users)
- [ ] Identify bottlenecks
- [ ] Plan scaling strategy
- [ ] Setup staging environment

---

## 📞 Need Help?

**If you choose:**
- ✅ **Option 1 (VPS)**: I can help refine `docker-compose.droplet.yml`, create nginx configs, setup SSL
- ✅ **Option 2 (Kubernetes)**: I can generate complete Kubernetes manifests, Helm charts
- ✅ **Option 3 (PaaS)**: I can help with Railway/Render/Fly.io specific configs
- ✅ **Option 4 (AWS)**: I can create Terraform scripts, ECS task definitions, CloudFormation templates

Just let me know which option you want to pursue!

---

## 🎯 My Recommendation

**START WITH OPTION 1 (VPS)** - Here's why:

1. ✅ **Your infrastructure is already VPS-optimized** (`docker-compose.droplet.yml` exists)
2. ✅ **Cheapest**: $12-24/month vs $50-200/month
3. ✅ **Fastest**: Deploy in 30 minutes
4. ✅ **Complete**: Includes monitoring stack
5. ✅ **Scalable**: Can handle 500-1000 users before needing to upgrade
6. ✅ **Easy to migrate later**: Docker makes migration to K8s/AWS seamless

**Platform**: **Hetzner** (cheapest, €8/mo) or **DigitalOcean** (best UX, $24/mo)

**Next steps if you choose VPS:**
1. I'll help you finalize the docker-compose configuration
2. Create proper nginx reverse proxy config
3. Setup automated SSL renewal
4. Configure monitoring dashboards
5. Create backup scripts
6. Write deployment runbook

Would you like me to proceed with Option 1 (VPS) deployment preparation?
