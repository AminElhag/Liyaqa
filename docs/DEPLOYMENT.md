# Liyaqa Backend Deployment Guide

## Overview

This document describes the CI/CD pipeline and deployment process for the Liyaqa backend.

## Architecture

```
GitHub Repository
      │
      ▼
┌─────────────────────┐
│    CI Pipeline      │
│  (Build & Test)     │
└──────────┬──────────┘
           │
     ┌─────┴─────┐
     ▼           ▼
┌─────────┐ ┌─────────────┐
│ Staging │ │ Production  │
│  (Auto) │ │  (Manual)   │
└─────────┘ └─────────────┘
```

## Environments

| Environment | Profile | Database | Deployment | URL |
|-------------|---------|----------|------------|-----|
| Development | `dev` | H2 in-memory | Local | `localhost:8080` |
| Staging | `prod` | PostgreSQL | Auto (main branch) | `staging-api.liyaqa.com` |
| Production | `prod` | PostgreSQL | Manual approval | `api.liyaqa.com` |

---

## Local Development

### Prerequisites
- Docker & Docker Compose
- JDK 21 (for IDE development)

### Quick Start

```bash
# Start all services (PostgreSQL + Backend)
docker compose up -d

# View logs
docker compose logs -f backend

# Stop services
docker compose down

# Stop and remove volumes
docker compose down -v
```

### With Email Testing (Mailhog)

```bash
# Start with email profile
docker compose --profile email up -d

# Access Mailhog UI at http://localhost:8025
# SMTP server at localhost:1025
```

### With Database Admin (pgAdmin)

```bash
# Start with admin profile
docker compose --profile admin up -d

# Access pgAdmin at http://localhost:5050
# Login: admin@liyaqa.com / admin
```

### Run Without Docker

```bash
cd backend
./gradlew bootRun

# With specific profile
SPRING_PROFILES_ACTIVE=dev ./gradlew bootRun
```

---

## Docker Build

### Build Image Locally

```bash
cd backend
docker build -t liyaqa-backend:local .
```

### Run Container Locally

```bash
docker run -d \
  --name liyaqa-backend \
  -p 8080:8080 \
  -e SPRING_PROFILES_ACTIVE=prod \
  -e DATABASE_URL=jdbc:postgresql://host.docker.internal:5432/liyaqa \
  -e DATABASE_USERNAME=liyaqa \
  -e DATABASE_PASSWORD=secret \
  -e JWT_SECRET=your-32-character-minimum-secret-key \
  -e EMAIL_ENABLED=false \
  -e SMS_ENABLED=false \
  -e CORS_ALLOWED_ORIGINS=http://localhost:3000 \
  liyaqa-backend:local
```

---

## CI/CD Workflows

### 1. CI Pipeline (`.github/workflows/ci.yml`)

**Triggers:**
- Push to `main`, `features/**`, `fixes/**`, `hotfixes/**`
- Pull requests to `main`

**Jobs:**
| Job | Description | Artifacts |
|-----|-------------|-----------|
| `build-and-test` | Compile, run 191 tests | Test reports, JAR |
| `code-quality` | Dependency analysis | - |
| `docker-build` | Build & push to GHCR | Docker image |
| `security-scan` | Trivy vulnerability scan | SARIF report |

### 2. Staging Deployment (`.github/workflows/deploy-staging.yml`)

**Triggers:**
- Push to `main` branch
- Manual dispatch

**Steps:**
1. Pull latest Docker image
2. SSH to staging server
3. Stop existing container
4. Start new container
5. Health check verification
6. Slack notification

### 3. Production Deployment (`.github/workflows/deploy-production.yml`)

**Triggers:**
- Release published
- Manual dispatch with image tag

**Steps:**
1. Manual approval gate
2. Pull Docker image
3. Blue-green deployment
4. Health check verification
5. Rollback on failure
6. Slack notification

---

## GitHub Configuration

### Repository Secrets

#### Staging Environment

| Secret | Description | Example |
|--------|-------------|---------|
| `STAGING_HOST` | Server hostname | `staging.liyaqa.com` |
| `STAGING_USER` | SSH username | `deploy` |
| `STAGING_SSH_KEY` | SSH private key | `-----BEGIN...` |
| `STAGING_DATABASE_URL` | JDBC URL | `jdbc:postgresql://...` |
| `STAGING_DATABASE_USERNAME` | DB username | `liyaqa_staging` |
| `STAGING_DATABASE_PASSWORD` | DB password | `***` |
| `STAGING_JWT_SECRET` | JWT secret (32+ chars) | `***` |
| `STAGING_EMAIL_ENABLED` | Enable email | `false` |
| `STAGING_SMTP_HOST` | SMTP host | `smtp.gmail.com` |
| `STAGING_SMTP_PORT` | SMTP port | `587` |
| `STAGING_SMTP_USERNAME` | SMTP username | `***` |
| `STAGING_SMTP_PASSWORD` | SMTP password | `***` |
| `STAGING_CORS_ORIGINS` | CORS origins | `https://staging.liyaqa.com` |

#### Production Environment

Same secrets with `PRODUCTION_` prefix, plus:

| Secret | Description |
|--------|-------------|
| `PRODUCTION_EMAIL_FROM` | From email address |
| `PRODUCTION_EMAIL_BASE_URL` | Base URL for email links |
| `PRODUCTION_SMS_ENABLED` | Enable SMS |
| `PRODUCTION_TWILIO_ACCOUNT_SID` | Twilio SID |
| `PRODUCTION_TWILIO_AUTH_TOKEN` | Twilio token |
| `PRODUCTION_TWILIO_FROM_NUMBER` | Twilio phone |

### Repository Variables

| Variable | Description |
|----------|-------------|
| `STAGING_URL` | Staging API URL |
| `PRODUCTION_URL` | Production API URL |
| `SLACK_WEBHOOK_URL` | Slack notifications |

### GitHub Environments

Create these environments in Settings > Environments:

1. **staging** - No protection rules
2. **production-approval** - Required reviewers (2+ recommended)
3. **production** - Deployment branches: `main` only

---

## Health Checks

### Endpoint

```
GET /actuator/health
```

### Response

```json
{
  "status": "UP",
  "components": {
    "db": { "status": "UP" },
    "diskSpace": { "status": "UP" }
  }
}
```

### Verification Commands

```bash
# Local
curl http://localhost:8080/actuator/health

# Staging
curl https://staging-api.liyaqa.com/actuator/health

# Production
curl https://api.liyaqa.com/actuator/health
```

---

## Database Migrations

### Overview

- **Tool:** Flyway (auto-configured via Spring Boot)
- **Location:** `src/main/resources/db/migration/`
- **Naming:** `V{version}__{description}.sql`
- **Production DDL:** `validate` (no auto-schema changes)

### Current Migrations

| Version | Description |
|---------|-------------|
| V2 | Organizations, clubs, locations |
| V3 | Users, refresh tokens |
| V4 | Members, plans, subscriptions |
| V5 | Attendance records |
| V6 | Invoices, billing |
| V7 | Password reset tokens |
| V8 | Class scheduling |
| V9 | Notifications |
| V10 | Performance indexes |
| V11 | Audit logs |

### Manual Migration

```bash
# Run migrations manually
./gradlew flywayMigrate

# Check migration status
./gradlew flywayInfo
```

---

## Rollback Procedures

### Automatic Rollback

Production deployment includes automatic rollback:
- If health check fails, old container remains active
- New container is automatically removed

### Manual Rollback

```bash
# List available image tags
docker images ghcr.io/aminelhag/liyaqa/liyaqa-backend

# Deploy previous version
docker pull ghcr.io/aminelhag/liyaqa/liyaqa-backend:previous-tag
docker stop liyaqa-backend-prod
docker rm liyaqa-backend-prod
docker run -d --name liyaqa-backend-prod [options] ghcr.io/aminelhag/liyaqa/liyaqa-backend:previous-tag
```

### Database Rollback

**Important:** Database migrations are forward-only. For rollback:
1. Restore from backup
2. Or create a new migration to reverse changes

---

## Troubleshooting

### Container Won't Start

```bash
# Check logs
docker logs liyaqa-backend

# Common causes:
# - Missing environment variables
# - Database connection failed
# - JWT_SECRET too short (< 32 chars)
```

### Health Check Fails

```bash
# Check if port is exposed
docker port liyaqa-backend

# Check container health
docker inspect liyaqa-backend | grep -A 10 "Health"

# Test endpoint manually
curl -v http://localhost:8080/actuator/health
```

### Database Connection Failed

```bash
# Verify PostgreSQL is running
docker ps | grep postgres

# Test connection
docker exec -it liyaqa-postgres psql -U liyaqa -d liyaqa -c "SELECT 1"

# Check DATABASE_URL format
# Format: jdbc:postgresql://host:port/database
```

### Migration Failed

```bash
# Check Flyway status
./gradlew flywayInfo

# View migration history
docker exec -it liyaqa-postgres psql -U liyaqa -d liyaqa -c "SELECT * FROM flyway_schema_history"
```

---

## Monitoring

### Actuator Endpoints

| Endpoint | Description |
|----------|-------------|
| `/actuator/health` | Health status |
| `/actuator/info` | Application info |
| `/actuator/metrics` | Metrics data |

### Logging

```bash
# Container logs
docker logs -f liyaqa-backend-prod

# Log levels (via environment variable)
LOGGING_LEVEL_COM_LIYAQA=DEBUG
```

### API Documentation

- **Swagger UI:** `/swagger-ui.html`
- **OpenAPI Spec:** `/api-docs`

---

## Security Checklist

### Pre-Deployment

- [ ] JWT_SECRET is at least 32 characters
- [ ] Database password is strong
- [ ] CORS_ALLOWED_ORIGINS is properly configured (no wildcards)
- [ ] Email/SMS credentials are secure
- [ ] SSH keys are properly secured

### Post-Deployment

- [ ] Health check passes
- [ ] Swagger UI is accessible (or disabled in production)
- [ ] Rate limiting is active
- [ ] HTTPS is enabled via reverse proxy
- [ ] Logs are being collected

---

## Support

For issues with:
- **CI/CD:** Check GitHub Actions logs
- **Docker:** Check container logs with `docker logs`
- **Application:** Check Spring Boot logs
- **Database:** Check PostgreSQL logs and Flyway history
