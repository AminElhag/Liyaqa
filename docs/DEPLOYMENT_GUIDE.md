# Deployment Guide

**Last Updated:** 2026-01-31
**Version:** 1.0
**Status:** Production Ready

---

## Table of Contents

1. [Deployment Overview](#1-deployment-overview)
2. [Pre-Deployment Checklist](#2-pre-deployment-checklist)
3. [Staging Deployment](#3-staging-deployment)
4. [Production Deployment](#4-production-deployment)
5. [Database Migrations](#5-database-migrations)
6. [Rollback Procedures](#6-rollback-procedures)
7. [Feature Flags](#7-feature-flags)
8. [Deployment Validation](#8-deployment-validation)
9. [Hotfix Deployment](#9-hotfix-deployment)
10. [Deployment Troubleshooting](#10-deployment-troubleshooting)
11. [Emergency Procedures](#11-emergency-procedures)

---

## 1. Deployment Overview

### 1.1 Environments

| Environment | Purpose | Database | Auto-Deploy | Approval Required | URL |
|-------------|---------|----------|-------------|-------------------|-----|
| **Development** | Local development | H2 in-memory | No | No | `http://localhost:8080` |
| **Staging** | Pre-production testing | PostgreSQL | Yes (on push to `main`) | No | `https://staging-api.liyaqa.com` |
| **Production** | Live customer-facing | PostgreSQL | No | Yes (2+ approvers) | `https://api.liyaqa.com` |

### 1.2 Deployment Strategy

**Staging:**
- Rolling deployment
- Automatic on merge to `main`
- Single instance (no load balancing)
- 30-second health check timeout
- Auto-rollback on health check failure

**Production:**
- Blue-green deployment
- Manual trigger with approval gate
- Zero-downtime deployment
- Comprehensive health checks
- Database migration pre-validation
- Automated rollback capability

### 1.3 Deployment Windows

**Recommended Deployment Times:**

| Day | Time (UTC) | Time (Gulf) | Status | Notes |
|-----|-----------|-------------|--------|-------|
| **Monday** | 09:00-11:00 | 12:00-14:00 | ✅ Preferred | Start of week, full team available |
| **Tuesday** | 09:00-11:00 | 12:00-14:00 | ✅ Preferred | Full team available |
| **Wednesday** | 09:00-11:00 | 12:00-14:00 | ✅ Preferred | Mid-week stability |
| **Thursday** | 09:00-11:00 | 12:00-14:00 | ⚠️ Acceptable | Plan for Friday support |
| **Friday** | ❌ Not Recommended | ❌ Not Recommended | ❌ Avoid | Limited weekend support |
| **Saturday/Sunday** | ❌ Emergency Only | ❌ Emergency Only | ❌ Avoid | Weekend, reduced staffing |

**Blackout Periods:**
- Peak hours: 16:00-22:00 Gulf time (13:00-19:00 UTC)
- Public holidays in Saudi Arabia
- Known high-traffic events (Ramadan evenings, etc.)
- During active incident response

### 1.4 Deployment Frequency

**Target Cadence:**
- Staging: Multiple times per day (as needed)
- Production: 2-3 times per week (Tuesday/Wednesday preferred)
- Hotfixes: As needed (any time)

### 1.5 CI/CD Pipeline Overview

```
┌──────────────────────────────────────────────────────────────┐
│                    GitHub Repository                          │
│                    (main branch)                              │
└────────────────┬─────────────────────────────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────────────────────────────┐
│                    CI Pipeline                                │
│  • Build & Compile (Gradle)                                   │
│  • Run 191+ Unit Tests                                        │
│  • Code Quality Checks                                        │
│  • Security Scan (Trivy)                                      │
│  • Build Docker Image                                         │
│  • Push to GHCR                                              │
└────────────────┬─────────────────────────────────────────────┘
                 │
         ┌───────┴────────┐
         │                │
         ▼                ▼
┌──────────────┐  ┌──────────────────────────────────┐
│   Staging    │  │         Production               │
│              │  │                                  │
│  Auto-Deploy │  │  1. Manual Trigger               │
│  on Success  │  │  2. Approval Gate (2+ reviewers) │
│              │  │  3. Blue-Green Deployment        │
│  30s Health  │  │  4. Health Checks                │
│  Check       │  │  5. Traffic Switch               │
│              │  │  6. Auto-Rollback on Failure     │
└──────────────┘  └──────────────────────────────────┘
```

---

## 2. Pre-Deployment Checklist

### 2.1 All Deployments (Staging + Production)

**Code Quality:**
- [ ] All unit tests passing (`./gradlew test`)
- [ ] Integration tests passing
- [ ] E2E tests passing
- [ ] Code coverage ≥ 80% (check JaCoCo report)
- [ ] No critical SonarQube issues
- [ ] Security scan passed (Trivy)
- [ ] No HIGH or CRITICAL vulnerabilities

**Code Review:**
- [ ] All code reviewed and approved
- [ ] PR merged to `main` branch
- [ ] CI/CD pipeline succeeded
- [ ] Docker image built and pushed to GHCR

**Database:**
- [ ] Flyway migrations validated
- [ ] Migration scripts tested in staging
- [ ] Backup created (if production)
- [ ] Rollback plan documented

**Configuration:**
- [ ] Environment variables verified
- [ ] Secrets rotated (if needed)
- [ ] Feature flags configured correctly
- [ ] CORS origins updated

**Documentation:**
- [ ] CHANGELOG updated
- [ ] API documentation current
- [ ] Runbook updated (if infrastructure changed)
- [ ] Team notified in Slack

### 2.2 Production-Only Checklist

**Planning:**
- [ ] Deployment scheduled in approved window
- [ ] Team notified 24 hours in advance
- [ ] On-call engineer identified
- [ ] Rollback plan reviewed
- [ ] Stakeholders informed

**Testing:**
- [ ] Staging deployment successful
- [ ] Staging smoke tests passed
- [ ] Load testing completed (if major changes)
- [ ] Performance regression tests passed

**Backup & Recovery:**
- [ ] Database backup verified (< 2 hours old)
- [ ] Backup restore tested recently (< 7 days)
- [ ] Previous Docker image tagged and available
- [ ] Blue environment ready for quick rollback

**Monitoring:**
- [ ] Grafana dashboards accessible
- [ ] Prometheus targets healthy
- [ ] Alerting rules verified
- [ ] Slack notifications configured
- [ ] On-call rotation updated

**Compliance:**
- [ ] Change management ticket created
- [ ] Security team notified (if security changes)
- [ ] Data privacy review completed (if data model changed)
- [ ] Audit log configured

**Communication:**
- [ ] Deployment announcement in #deployments channel
- [ ] Customer-facing changes documented
- [ ] Support team briefed
- [ ] Status page updated (if needed)

---

## 3. Staging Deployment

### 3.1 Overview

Staging deployments are **automatic** on every merge to `main` branch.

**Workflow:** `.github/workflows/deploy-staging.yml`

### 3.2 Automatic Deployment Process

```bash
# Triggered automatically on:
# 1. Push to main branch
# 2. Manual workflow dispatch

# Process:
# 1. CI pipeline completes successfully
# 2. Docker image pushed to GHCR with :latest tag
# 3. SSH to staging server
# 4. Pull latest image
# 5. Stop old container
# 6. Start new container
# 7. Health check (30s timeout)
# 8. Slack notification (success/failure)
```

### 3.3 Manual Staging Deployment

**When to use:**
- Testing specific feature branch
- Re-deploying after configuration change
- Recovering from failed deployment

**Steps:**

```bash
# 1. Go to GitHub Actions
https://github.com/aminelhag/liyaqa/actions/workflows/deploy-staging.yml

# 2. Click "Run workflow"
# 3. Select branch (usually 'main')
# 4. Click "Run workflow" button

# 5. Monitor deployment logs
# Watch for:
# - Docker image pull
# - Container start
# - Health check success
# - Slack notification
```

### 3.4 Staging Health Check

```bash
# After deployment, verify:

# 1. Backend health
curl https://staging-api.liyaqa.com/api/health

# Expected response:
# {
#   "status": "UP",
#   "components": {
#     "db": { "status": "UP" },
#     "diskSpace": { "status": "UP" }
#   }
# }

# 2. API documentation
curl https://staging-api.liyaqa.com/api-docs

# 3. Check recent logs
ssh deploy@staging.liyaqa.com
docker logs liyaqa-backend --tail 100
```

### 3.5 Staging Smoke Tests

```bash
# Run automated smoke tests after deployment
cd frontend
npm run test:e2e:staging

# Or manually verify:
# - User login
# - Create member
# - Create class
# - Book class
# - Generate invoice
```

---

## 4. Production Deployment

### 4.1 Overview

Production deployments use **blue-green deployment** strategy for zero-downtime releases.

**Workflow:** `.github/workflows/deploy-production.yml`

### 4.2 Blue-Green Deployment Strategy

```
┌─────────────────────────────────────────────────────────┐
│                    Load Balancer                        │
│                  (nginx/Traefik)                        │
└──────────────┬──────────────────────────────────────────┘
               │
        ┌──────┴──────┐
        │             │
        ▼             ▼
  ┌──────────┐  ┌──────────┐
  │  Blue    │  │  Green   │
  │ (Live)   │  │ (Standby)│
  │          │  │          │
  │ v1.2.3   │  │ v1.2.4   │
  └──────────┘  └──────────┘

DEPLOYMENT FLOW:
1. Blue = Current Production (v1.2.3)
2. Green = Deploy New Version (v1.2.4)
3. Run Health Checks on Green
4. Switch Traffic: Blue → Green
5. Blue becomes Standby (instant rollback available)
6. After 24h, destroy Blue environment
```

### 4.3 Pre-Production Deployment Steps

**Step 1: Create Release**

```bash
# 1. Ensure main branch is ready
git checkout main
git pull origin main

# 2. Create release tag
git tag -a v1.2.4 -m "Release v1.2.4: Add trainer portal API"
git push origin v1.2.4

# 3. Create GitHub Release
# Go to: https://github.com/aminelhag/liyaqa/releases/new
# - Tag version: v1.2.4
# - Release title: v1.2.4 - Trainer Portal API
# - Description: Copy from CHANGELOG.md
# - Click "Publish release"
```

**Step 2: Verify CI Pipeline**

```bash
# Go to: https://github.com/aminelhag/liyaqa/actions

# Verify:
# ✅ Build and Test passed
# ✅ Code Quality passed
# ✅ Docker Build passed
# ✅ Security Scan passed
# ✅ Image pushed to GHCR with tag: v1.2.4
```

**Step 3: Database Migration Plan**

```bash
# Review migration files
ls backend/src/main/resources/db/migration/

# Check for new migrations
git diff v1.2.3..v1.2.4 -- backend/src/main/resources/db/migration/

# If migrations exist:
# 1. Review SQL carefully
# 2. Estimate downtime (if any)
# 3. Plan rollback strategy
# 4. Communicate to team
```

### 4.4 Production Deployment Execution

**Step 1: Trigger Deployment Workflow**

```bash
# 1. Go to GitHub Actions
https://github.com/aminelhag/liyaqa/actions/workflows/deploy-production.yml

# 2. Click "Run workflow"
# 3. Enter parameters:
#    - Branch: main
#    - Image Tag: v1.2.4 (or 'latest')
#    - Environment: production

# 4. Click "Run workflow"
```

**Step 2: Approval Gate**

```
# Workflow pauses at approval gate
# Requires approval from 2+ designated approvers

Reviewers verify:
✅ Staging deployment successful
✅ All tests passed
✅ Documentation updated
✅ Deployment window appropriate
✅ Team ready for support

Click "Approve and deploy" in GitHub Actions
```

**Step 3: Blue-Green Deployment Process**

```bash
# Automated steps (from workflow):

# 1. SSH to production server
ssh deploy@api.liyaqa.com

# 2. Pull Docker image
docker pull ghcr.io/aminelhag/liyaqa/liyaqa-backend:v1.2.4

# 3. Run database migrations (if any)
docker run --rm \
  --network liyaqa_network \
  -e DATABASE_URL=$DATABASE_URL \
  -e DATABASE_USERNAME=$DATABASE_USERNAME \
  -e DATABASE_PASSWORD=$DATABASE_PASSWORD \
  ghcr.io/aminelhag/liyaqa/liyaqa-backend:v1.2.4 \
  ./gradlew flywayMigrate

# 4. Start Green environment
docker run -d \
  --name liyaqa-backend-green \
  --network liyaqa_network \
  -p 8081:8080 \
  -e SPRING_PROFILES_ACTIVE=prod \
  -e DATABASE_URL=$DATABASE_URL \
  -e DATABASE_USERNAME=$DATABASE_USERNAME \
  -e DATABASE_PASSWORD=$DATABASE_PASSWORD \
  --env-file /opt/liyaqa/.env.prod \
  ghcr.io/aminelhag/liyaqa/liyaqa-backend:v1.2.4

# 5. Wait 30 seconds for startup
sleep 30

# 6. Health check Green
curl -f http://localhost:8081/api/health || exit 1

# 7. Run smoke tests on Green
./scripts/smoke-test.sh http://localhost:8081

# 8. Switch traffic (Blue → Green)
# Update nginx/load balancer configuration
nginx -s reload

# 9. Verify production traffic
curl -f https://api.liyaqa.com/api/health

# 10. Monitor for 5 minutes
# Watch metrics, logs, error rates

# 11. If successful:
#     - Rename: blue → old, green → blue
#     - Keep old container for 24h (quick rollback)
docker rename liyaqa-backend-blue liyaqa-backend-old
docker rename liyaqa-backend-green liyaqa-backend-blue

# 12. Slack notification
# "✅ Production deployment v1.2.4 completed successfully"
```

### 4.5 Post-Deployment Verification

**Immediate Verification (0-5 minutes):**

```bash
# 1. Health check
curl https://api.liyaqa.com/api/health

# 2. API documentation
curl https://api.liyaqa.com/api-docs

# 3. Check recent logs
ssh deploy@api.liyaqa.com
docker logs liyaqa-backend-blue --tail 100 --follow

# 4. Verify metrics in Grafana
# Open: https://grafana.liyaqa.com
# Dashboard: Liyaqa Production

# 5. Check error rate
# PromQL: rate(http_server_requests_seconds_count{status=~"5.."}[5m])
# Should be: < 1%

# 6. Check latency
# PromQL: histogram_quantile(0.95, http_server_requests_seconds_bucket)
# Should be: < 2 seconds
```

**Extended Monitoring (5-60 minutes):**

```bash
# Monitor in Grafana:
# - Request rate (should be stable)
# - Error rate (should be < 1%)
# - Latency P95 (should be < 2s)
# - Memory usage (should be stable)
# - Database connections (should be normal)

# Monitor in Loki:
# {service="backend"} |= "ERROR"
# Should see: No new error patterns

# Check Alertmanager:
# Should see: No new alerts firing
```

**Business Verification (1-24 hours):**

```bash
# Functional tests:
✅ User login working
✅ Member creation working
✅ Class booking working
✅ Invoice generation working
✅ Email notifications sending
✅ SMS notifications sending (if enabled)

# Monitor business metrics:
✅ User signups normal
✅ Bookings normal
✅ Payments processing
✅ No customer complaints
```

### 4.6 Communication

**Deployment Start:**

```
Slack #deployments:
---
🚀 **Production Deployment Started**
Version: v1.2.4
Deployer: @engineer
Started: 2026-01-31 10:00 UTC
Expected Duration: 15 minutes
Rollback Plan: Blue-Green swap (instant)
---
```

**Deployment Complete:**

```
Slack #deployments:
---
✅ **Production Deployment Completed**
Version: v1.2.4
Duration: 12 minutes
Status: Healthy
Metrics: All green
Rollback Available: Until 2026-02-01 10:00 UTC
---
```

**If Issues Found:**

```
Slack #deployments:
---
⚠️ **Post-Deployment Issue Detected**
Issue: Increased latency on /api/members endpoint
Severity: Medium
Impact: 5% of requests > 2s
Action: Investigating. Rollback prepared if needed.
---
```

---

## 5. Database Migrations

### 5.1 Migration Strategy

**Tool:** Flyway (integrated with Spring Boot)

**Migration Files Location:**
```
backend/src/main/resources/db/migration/
├── V2__organizations_clubs_locations.sql
├── V3__users_refresh_tokens.sql
├── V4__members_plans_subscriptions.sql
├── V5__attendance_records.sql
├── V6__invoices_billing.sql
├── V7__password_reset_tokens.sql
├── V8__class_scheduling.sql
├── V9__notifications.sql
├── V10__performance_indexes.sql
├── V11__audit_logs.sql
└── V12__new_feature.sql  ← New migration
```

**Naming Convention:**
```
V{VERSION}__{DESCRIPTION}.sql

Examples:
✅ V12__add_trainer_role.sql
✅ V13__create_payment_methods_table.sql
❌ v12_add_trainer_role.sql (lowercase v)
❌ V12-add-trainer-role.sql (hyphens instead of underscores)
```

### 5.2 Migration Execution Modes

| Environment | Mode | Behavior |
|-------------|------|----------|
| **Development** | `create-drop` | Recreates schema on startup (data loss) |
| **Staging** | `update` | Auto-applies migrations on startup |
| **Production** | `validate` | Validates only, manual migration required |

### 5.3 Migration Best Practices

**DO:**
- ✅ Use transactions (`BEGIN` / `COMMIT`)
- ✅ Add rollback comments
- ✅ Test in development + staging first
- ✅ Make migrations idempotent when possible
- ✅ Use `IF NOT EXISTS` for safety
- ✅ Add indexes in separate migration
- ✅ Document breaking changes

**DON'T:**
- ❌ Modify existing migration files
- ❌ Delete migration files
- ❌ Use database-specific syntax unnecessarily
- ❌ Make large data migrations without batching
- ❌ Forget to test rollback

### 5.4 Migration Checklist

**Before Writing Migration:**
- [ ] Schema changes documented
- [ ] Breaking changes identified
- [ ] Backward compatibility considered
- [ ] Data migration strategy planned
- [ ] Index strategy planned

**Migration File:**
- [ ] Proper naming convention used
- [ ] Transaction boundaries defined
- [ ] Rollback comments included
- [ ] Idempotency considered
- [ ] Error handling included

**Testing:**
- [ ] Applied successfully in development
- [ ] Tested with seed data
- [ ] Rollback tested (if applicable)
- [ ] Applied successfully in staging
- [ ] Performance tested (if large data migration)

**Documentation:**
- [ ] Migration purpose documented
- [ ] Breaking changes documented
- [ ] Rollback procedure documented
- [ ] Expected downtime documented (if any)

### 5.5 Migration Examples

**Example 1: Add Column (Safe, No Downtime)**

```sql
-- V12__add_trainer_certification_field.sql

-- Migration: Add certification field to users table
-- Rollback: Can be left in place or removed with separate migration
-- Downtime: None
-- Risk: Low

BEGIN;

-- Add column (nullable for backward compatibility)
ALTER TABLE users
ADD COLUMN IF NOT EXISTS certification VARCHAR(255);

-- Add comment
COMMENT ON COLUMN users.certification IS 'Trainer certification details';

COMMIT;

-- Rollback (create V13__remove_trainer_certification.sql if needed):
-- BEGIN;
-- ALTER TABLE users DROP COLUMN IF EXISTS certification;
-- COMMIT;
```

**Example 2: Create Table (Safe, No Downtime)**

```sql
-- V13__create_class_templates_table.sql

-- Migration: Create class templates table
-- Rollback: Drop table with V14__drop_class_templates.sql
-- Downtime: None
-- Risk: Low

BEGIN;

CREATE TABLE IF NOT EXISTS class_templates (
    id BIGSERIAL PRIMARY KEY,
    club_id BIGINT NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    duration_minutes INTEGER NOT NULL,
    capacity INTEGER NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_class_templates_club_id
    ON class_templates(club_id);

-- Add constraint
ALTER TABLE class_templates
    ADD CONSTRAINT chk_duration_positive
    CHECK (duration_minutes > 0);

COMMIT;

-- Rollback (V14__drop_class_templates.sql):
-- BEGIN;
-- DROP TABLE IF EXISTS class_templates CASCADE;
-- COMMIT;
```

**Example 3: Data Migration (Requires Testing)**

```sql
-- V14__migrate_old_payment_data.sql

-- Migration: Migrate payment data from old to new structure
-- Rollback: Restore from backup (forward-only)
-- Downtime: None (if batched), 5 min (if locked)
-- Risk: Medium

BEGIN;

-- Create temporary table for validation
CREATE TEMP TABLE payment_migration_log (
    old_id BIGINT,
    new_id BIGINT,
    migrated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Batch migration (process 1000 records at a time)
-- Run this in production with monitoring

DO $$
DECLARE
    batch_size INT := 1000;
    processed INT := 0;
BEGIN
    LOOP
        -- Insert batch
        WITH batch AS (
            SELECT id, amount, payment_date, member_id
            FROM old_payments
            WHERE migrated = FALSE
            ORDER BY id
            LIMIT batch_size
        )
        INSERT INTO new_payments (amount, processed_date, member_id, status)
        SELECT amount, payment_date, member_id, 'COMPLETED'
        FROM batch;

        -- Get rows affected
        GET DIAGNOSTICS processed = ROW_COUNT;

        -- Exit if no more rows
        EXIT WHEN processed = 0;

        -- Mark as migrated
        UPDATE old_payments
        SET migrated = TRUE
        WHERE id IN (SELECT id FROM batch);

        -- Log progress
        RAISE NOTICE 'Migrated % rows', processed;

        -- Pause to avoid locking (production only)
        PERFORM pg_sleep(0.1);
    END LOOP;
END $$;

-- Verify migration
DO $$
DECLARE
    old_count INT;
    new_count INT;
BEGIN
    SELECT COUNT(*) INTO old_count FROM old_payments WHERE migrated = TRUE;
    SELECT COUNT(*) INTO new_count FROM new_payments;

    IF old_count != new_count THEN
        RAISE EXCEPTION 'Migration verification failed: old=%, new=%',
            old_count, new_count;
    END IF;

    RAISE NOTICE 'Migration verified: % records migrated', old_count;
END $$;

COMMIT;

-- Rollback: Restore from pre-migration backup
-- pg_restore -h localhost -U liyaqa -d liyaqa backup_before_v14.dump
```

**Example 4: Add Index (Production Considerations)**

```sql
-- V15__add_members_search_index.sql

-- Migration: Add full-text search index on members
-- Rollback: Drop index with V16__drop_members_search_index.sql
-- Downtime: None (CONCURRENTLY)
-- Risk: Low

-- Note: CREATE INDEX CONCURRENTLY cannot run in transaction block
-- Remove BEGIN/COMMIT for this type of migration

-- Create index without locking table
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_members_name_search
    ON members USING gin(to_tsvector('english', name));

-- Add comment
COMMENT ON INDEX idx_members_name_search IS
    'Full-text search index for member names';

-- Rollback (V16__drop_members_search_index.sql):
-- DROP INDEX CONCURRENTLY IF EXISTS idx_members_name_search;
```

### 5.6 Manual Migration in Production

**When Required:**
- Production uses `validate` mode (no auto-migration)
- Large migrations requiring monitoring
- Migrations with potential rollback

**Process:**

```bash
# 1. Create database backup
ssh deploy@api.liyaqa.com
cd /opt/liyaqa
./backend/scripts/backup-database.sh

# 2. Verify backup
./backend/scripts/verify-backup.sh

# 3. Review migration file
cat backend/src/main/resources/db/migration/V12__new_feature.sql

# 4. Estimate downtime (if any)
# - Simple ADD COLUMN: 0 seconds
# - Create index CONCURRENTLY: 0 seconds (no lock)
# - Data migration: Varies (test in staging)

# 5. Apply migration manually
docker exec -it liyaqa-postgres psql -U liyaqa -d liyaqa

-- Copy-paste migration SQL
-- Or load from file:
\i /path/to/V12__new_feature.sql

# 6. Verify migration
SELECT version, description, installed_on, success
FROM flyway_schema_history
ORDER BY installed_rank DESC
LIMIT 5;

# 7. Check application startup
docker restart liyaqa-backend-blue
docker logs liyaqa-backend-blue --follow

# Look for: "Flyway migration validated successfully"

# 8. Smoke test
curl https://api.liyaqa.com/api/health
```

### 5.7 Migration Rollback

**Option 1: Reverse Migration (Preferred)**

```bash
# Create reverse migration file
V13__rollback_v12_changes.sql

# Apply reverse migration
docker exec -it liyaqa-postgres psql -U liyaqa -d liyaqa
\i /path/to/V13__rollback_v12_changes.sql
```

**Option 2: Restore from Backup (If Reverse Not Possible)**

```bash
# 1. Stop application
docker stop liyaqa-backend-blue liyaqa-backend-green

# 2. Restore database
cd /var/backups/liyaqa
pg_restore -h localhost -U liyaqa -d liyaqa -c liyaqa_backup_20260131_0200.dump

# 3. Start application with previous version
docker start liyaqa-backend-old
docker rename liyaqa-backend-old liyaqa-backend-blue

# 4. Verify
curl https://api.liyaqa.com/api/health
```

---

## 6. Rollback Procedures

### 6.1 Rollback Decision Matrix

| Scenario | Rollback Method | Downtime | Data Loss | Complexity |
|----------|----------------|----------|-----------|------------|
| **Application bug** | Blue-Green swap | 0 seconds | No | Low |
| **Performance issue** | Blue-Green swap | 0 seconds | No | Low |
| **Config error** | Blue-Green swap | 0 seconds | No | Low |
| **Database migration issue** | Restore backup | 5-15 min | Possible | High |
| **Data corruption** | Restore backup | 5-15 min | Possible | High |

### 6.2 When to Rollback

**Immediate Rollback Required:**
- ⚠️ Error rate > 5%
- ⚠️ Response time degradation > 50%
- ⚠️ Critical functionality broken
- ⚠️ Data corruption detected
- ⚠️ Security vulnerability introduced

**Monitor and Decide:**
- ⚡ Error rate 1-5%
- ⚡ Response time degradation 20-50%
- ⚡ Minor functionality broken
- ⚡ Acceptable workaround available

**No Rollback Needed:**
- ✅ Error rate < 1%
- ✅ Response time normal
- ✅ All critical features working
- ✅ Minor cosmetic issues only

### 6.3 Rollback Option 1: Blue-Green Swap (Instant)

**Use When:**
- Application code issue (not database)
- Need instant rollback
- Within 24 hours of deployment

**Process:**

```bash
# 1. SSH to production server
ssh deploy@api.liyaqa.com

# 2. Verify old container is running
docker ps -a | grep liyaqa-backend-old

# 3. Test old container health
docker start liyaqa-backend-old
sleep 10
curl http://localhost:8082/api/health

# 4. Switch traffic back to old version
# Update nginx/load balancer
sudo nano /etc/nginx/sites-available/liyaqa-backend
# Change: proxy_pass http://localhost:8080; → http://localhost:8082;

# 5. Reload nginx
sudo nginx -t
sudo nginx -s reload

# 6. Verify production
curl https://api.liyaqa.com/api/health

# 7. Monitor for 5 minutes
watch -n 5 'curl -s https://api.liyaqa.com/api/health | jq'

# 8. Stop new (problematic) version
docker stop liyaqa-backend-blue

# 9. Rename containers
docker rename liyaqa-backend-blue liyaqa-backend-failed
docker rename liyaqa-backend-old liyaqa-backend-blue

# 10. Notify team
# Slack: "⚠️ Production rolled back to v1.2.3 due to [reason]"

# Total time: < 2 minutes
```

### 6.4 Rollback Option 2: Redeploy Previous Version

**Use When:**
- Blue-green swap not available
- Old container destroyed
- Need specific version

**Process:**

```bash
# 1. Identify previous version
docker images ghcr.io/aminelhag/liyaqa/liyaqa-backend
# Find tag: v1.2.3

# 2. Stop current version
docker stop liyaqa-backend-blue
docker rm liyaqa-backend-blue

# 3. Pull previous version
docker pull ghcr.io/aminelhag/liyaqa/liyaqa-backend:v1.2.3

# 4. Start previous version
docker run -d \
  --name liyaqa-backend-blue \
  --network liyaqa_network \
  -p 8080:8080 \
  --env-file /opt/liyaqa/.env.prod \
  ghcr.io/aminelhag/liyaqa/liyaqa-backend:v1.2.3

# 5. Wait for startup
sleep 30

# 6. Health check
curl https://api.liyaqa.com/api/health

# 7. Monitor
docker logs liyaqa-backend-blue --follow

# Total time: 2-3 minutes
```

### 6.5 Rollback Option 3: Git Revert + Redeploy

**Use When:**
- Need to revert code changes permanently
- Prepare new release without problematic changes

**Process:**

```bash
# 1. Revert commit in Git
git revert <commit-hash>
git push origin main

# 2. Wait for CI pipeline
# Go to: https://github.com/aminelhag/liyaqa/actions
# Wait for: Build and test to complete

# 3. Create hotfix release
git tag -a v1.2.5 -m "Hotfix: Revert problematic changes"
git push origin v1.2.5

# 4. Trigger production deployment
# Follow normal deployment process in section 4.4

# Total time: 15-20 minutes
```

### 6.6 Database Rollback

**Important:** Database rollbacks are complex and risky.

**Option 1: Reverse Migration (Preferred)**

```sql
-- V13__rollback_v12.sql
BEGIN;

-- Reverse changes from V12
ALTER TABLE users DROP COLUMN IF EXISTS certification;

COMMIT;
```

**Option 2: Restore from Backup**

```bash
# 1. Stop application
docker stop liyaqa-backend-blue

# 2. Identify backup
ls -lh /var/backups/liyaqa/
# Find: liyaqa_backup_20260131_0200.dump (before migration)

# 3. Restore database
pg_restore \
  -h localhost \
  -U liyaqa \
  -d liyaqa \
  --clean \
  --if-exists \
  /var/backups/liyaqa/liyaqa_backup_20260131_0200.dump

# 4. Verify restore
docker exec -it liyaqa-postgres psql -U liyaqa -d liyaqa
SELECT version FROM flyway_schema_history ORDER BY installed_rank DESC LIMIT 1;

# 5. Start application with previous version
docker start liyaqa-backend-old

# 6. Health check
curl https://api.liyaqa.com/api/health

# Total time: 10-15 minutes
# Data loss: Transactions between backup and restore (< 2 hours)
```

### 6.7 Rollback Communication

**During Rollback:**

```
Slack #incidents:
---
⚠️ **ROLLBACK IN PROGRESS**
Version: Reverting v1.2.4 → v1.2.3
Reason: High error rate (8%) on member creation
Started: 2026-01-31 14:23 UTC
ETA: 2 minutes
Impact: Service available, some errors
Status: https://status.liyaqa.com
---
```

**After Rollback:**

```
Slack #incidents:
---
✅ **ROLLBACK COMPLETED**
Reverted: v1.2.4 → v1.2.3
Duration: 1m 47s
Status: Service healthy
Error rate: 0.3% (normal)
Next steps: Root cause analysis, fix, redeploy
Incident: INC-2026-001 (tracking)
---
```

---

## 7. Feature Flags

### 7.1 Overview

Feature flags allow deploying code to production with features disabled, then enabling them progressively.

**Current Implementation:** Not yet implemented (planned for Sprint 2.5)

**Recommended Tool:** LaunchDarkly or Unleash (open-source)

### 7.2 Feature Flag Strategy

**Use Feature Flags For:**
- ✅ Large features (multi-sprint)
- ✅ Risky changes
- ✅ A/B testing
- ✅ Gradual rollouts
- ✅ Beta features
- ✅ Kill switches for external services

**Don't Use Feature Flags For:**
- ❌ Bug fixes
- ❌ Refactoring
- ❌ Small changes
- ❌ Database migrations

### 7.3 Feature Flag Lifecycle

```
1. DEVELOPMENT
   - Flag created, default: OFF
   - Code deployed with flag

2. TESTING (Staging)
   - Flag: ON for testing
   - Verify functionality

3. ROLLOUT (Production)
   Phase 1: Internal users only (5%)
   Phase 2: Beta users (25%)
   Phase 3: All users (100%)

4. CLEANUP
   - Flag: Always ON
   - Remove flag code
   - Delete flag configuration
```

### 7.4 Feature Flag Example (Planned)

```kotlin
// Example: Trainer portal feature
@Service
class ClassService(
    private val featureFlags: FeatureFlagService
) {

    fun createClass(request: CreateClassRequest): ClassDTO {
        // Check if trainer portal is enabled
        if (featureFlags.isEnabled("trainer-portal")) {
            // New implementation with trainer-specific logic
            return createClassWithTrainerPortal(request)
        } else {
            // Legacy implementation
            return createClassLegacy(request)
        }
    }
}
```

```yaml
# Feature flag configuration
feature-flags:
  trainer-portal:
    enabled: false  # Start disabled
    rollout:
      percentage: 0
      users: []
      tenants: []
```

### 7.5 Gradual Rollout Process (Planned)

```bash
# Phase 1: Internal testing (0-5%)
# Update flag via admin dashboard or API
curl -X PATCH https://api.liyaqa.com/admin/feature-flags/trainer-portal \
  -d '{"enabled": true, "rollout": {"percentage": 5, "tenants": ["internal-test"]}}'

# Monitor for 24 hours:
# - Error rate
# - User feedback
# - Performance metrics

# Phase 2: Beta users (5-25%)
curl -X PATCH https://api.liyaqa.com/admin/feature-flags/trainer-portal \
  -d '{"rollout": {"percentage": 25}}'

# Monitor for 48 hours

# Phase 3: All users (100%)
curl -X PATCH https://api.liyaqa.com/admin/feature-flags/trainer-portal \
  -d '{"rollout": {"percentage": 100}}'

# Monitor for 1 week

# Phase 4: Cleanup (remove flag)
# 1. Make feature permanently enabled
# 2. Remove flag checks from code
# 3. Deploy cleanup release
# 4. Delete flag configuration
```

---

## 8. Deployment Validation

### 8.1 Automated Smoke Tests

**Backend Smoke Tests:**

```bash
#!/bin/bash
# scripts/smoke-test.sh

BASE_URL="${1:-https://api.liyaqa.com}"

echo "Running smoke tests against $BASE_URL..."

# Test 1: Health check
echo "1. Health check..."
curl -f "$BASE_URL/api/health" || exit 1
echo "✅ Health check passed"

# Test 2: API documentation
echo "2. API documentation..."
curl -f "$BASE_URL/api-docs" || exit 1
echo "✅ API docs accessible"

# Test 3: Authentication
echo "3. Authentication..."
RESPONSE=$(curl -s -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@liyaqa.com","password":"test123"}')

TOKEN=$(echo $RESPONSE | jq -r '.accessToken')
if [ "$TOKEN" == "null" ]; then
  echo "❌ Authentication failed"
  exit 1
fi
echo "✅ Authentication passed"

# Test 4: Protected endpoint
echo "4. Protected endpoint..."
curl -f "$BASE_URL/api/members" \
  -H "Authorization: Bearer $TOKEN" || exit 1
echo "✅ Protected endpoint accessible"

# Test 5: Database connection
echo "5. Database check..."
DB_STATUS=$(curl -s "$BASE_URL/actuator/health" | jq -r '.components.db.status')
if [ "$DB_STATUS" != "UP" ]; then
  echo "❌ Database check failed"
  exit 1
fi
echo "✅ Database connected"

echo ""
echo "🎉 All smoke tests passed!"
```

**Run Smoke Tests:**

```bash
# After deployment
ssh deploy@api.liyaqa.com
cd /opt/liyaqa
./scripts/smoke-test.sh https://api.liyaqa.com
```

### 8.2 Manual Validation Checklist

**Immediately After Deployment:**

- [ ] Health check returns "UP"
- [ ] API documentation accessible
- [ ] No errors in logs (past 5 minutes)
- [ ] Metrics being collected in Prometheus
- [ ] No alerts firing in Alertmanager

**Functional Testing (15 minutes):**

- [ ] User login successful
- [ ] Member creation successful
- [ ] Class creation successful
- [ ] Class booking successful
- [ ] Invoice generation successful
- [ ] Email notification sent (if enabled)
- [ ] Payment processing successful (if enabled)

**Performance Testing (30 minutes):**

- [ ] Response time P95 < 2 seconds
- [ ] Error rate < 1%
- [ ] Memory usage stable
- [ ] Database connection pool healthy
- [ ] No slow query alerts

### 8.3 Monitoring Checks

**Grafana Dashboard Checks:**

```bash
# 1. Open Grafana
https://grafana.liyaqa.com/d/liyaqa-production

# 2. Verify panels:
✅ Request Rate: Normal traffic pattern
✅ Error Rate: < 1%
✅ Latency P50: < 500ms
✅ Latency P95: < 2s
✅ Latency P99: < 5s
✅ JVM Memory: < 80% usage
✅ JVM GC Pauses: < 100ms
✅ Database Connections: < 80% of pool
✅ Database Query Time: < 100ms average
```

**Prometheus Queries:**

```promql
# Request rate (requests/sec)
rate(http_server_requests_seconds_count[5m])

# Error rate (%)
sum(rate(http_server_requests_seconds_count{status=~"5.."}[5m]))
/
sum(rate(http_server_requests_seconds_count[5m]))
* 100

# P95 latency (seconds)
histogram_quantile(0.95,
  sum(rate(http_server_requests_seconds_bucket[5m])) by (le)
)

# JVM memory usage (%)
jvm_memory_used_bytes{area="heap"}
/
jvm_memory_max_bytes{area="heap"}
* 100

# Database connections active
hikaricp_connections_active

# Database connection pool usage (%)
hikaricp_connections_active
/
hikaricp_connections_max
* 100
```

**Loki Log Checks:**

```logql
# Errors in last 5 minutes
{service="backend", level="ERROR"} | json

# Slow requests
{service="backend"} |= "Slow request detected"

# Authentication failures
{service="backend"} |= "authentication failed"

# Database errors
{service="backend"} |= "SQLException"
```

### 8.4 Rollback Criteria

**Trigger Rollback If:**

| Metric | Threshold | Action |
|--------|-----------|--------|
| Error rate | > 5% | Immediate rollback |
| P95 latency | > 5s | Rollback in 5 minutes |
| Memory usage | > 95% | Investigate, rollback if OOM |
| Database errors | > 10/min | Immediate rollback |
| Critical feature broken | Any | Immediate rollback |
| Customer complaints | > 5 in 10 min | Rollback consideration |

---

## 9. Hotfix Deployment

### 9.1 When to Use Hotfix

**Hotfix Criteria:**
- 🔥 Production outage or critical bug
- 🔥 Security vulnerability
- 🔥 Data integrity issue
- 🔥 Cannot wait for normal deployment window

**NOT a Hotfix:**
- Minor bugs with workarounds
- Feature requests
- Performance optimizations (non-critical)
- Cosmetic issues

### 9.2 Hotfix Process

**Step 1: Create Hotfix Branch**

```bash
# 1. Create hotfix branch from production tag
git checkout v1.2.4
git checkout -b hotfix/critical-auth-bug

# 2. Make minimal fix
# Edit only necessary files
# NO refactoring, NO new features

# 3. Add tests
# Ensure bug is covered by tests

# 4. Commit
git add .
git commit -m "hotfix: Fix critical authentication bypass (SEC-2026-001)"

# 5. Push
git push origin hotfix/critical-auth-bug
```

**Step 2: Fast-Track Testing**

```bash
# 1. Run tests locally
./gradlew test

# 2. Create PR to main
gh pr create --title "HOTFIX: Critical auth bug" --body "Security: Authentication bypass fix"

# 3. Get approval (at least 1 reviewer, can skip 2nd in emergency)

# 4. Merge to main
gh pr merge --squash
```

**Step 3: Deploy to Staging**

```bash
# 1. Staging deploys automatically on merge to main

# 2. Verify in staging
curl https://staging-api.liyaqa.com/api/health
./scripts/smoke-test.sh https://staging-api.liyaqa.com

# 3. Test the specific fix
# Verify bug is resolved
```

**Step 4: Deploy to Production (Expedited)**

```bash
# 1. Create hotfix release tag
git checkout main
git pull origin main
git tag -a v1.2.5 -m "Hotfix v1.2.5: Critical authentication fix"
git push origin v1.2.5

# 2. Trigger production deployment
# Go to: https://github.com/aminelhag/liyaqa/actions/workflows/deploy-production.yml
# Click "Run workflow"
# Tag: v1.2.5

# 3. Fast-track approval
# Notify approvers in Slack #incidents
# Get 1 approval (can reduce from 2 in critical emergency)

# 4. Monitor deployment closely
# Watch logs, metrics, errors

# 5. Verify fix in production
./scripts/smoke-test.sh https://api.liyaqa.com
# Test specific bug scenario
```

**Step 5: Post-Hotfix Tasks**

```bash
# 1. Update CHANGELOG.md
## [1.2.5] - 2026-01-31
### Security
- Fixed critical authentication bypass vulnerability

# 2. Create post-mortem (if incident)
# Document in docs/incidents/2026-01-31-auth-bypass.md

# 3. Notify stakeholders
# Slack #general: "Security hotfix deployed successfully"

# 4. Close incident ticket
```

### 9.3 Hotfix Communication

**During Hotfix:**

```
Slack #incidents:
---
🔥 **CRITICAL HOTFIX IN PROGRESS**
Issue: Authentication bypass vulnerability (SEC-2026-001)
Severity: P0 - Critical
Impact: All users potentially affected
Started: 2026-01-31 15:45 UTC
ETA: 30 minutes
Status: Fix in progress
Team: @security-team @devops-team
---
```

**After Hotfix:**

```
Slack #incidents:
---
✅ **HOTFIX DEPLOYED SUCCESSFULLY**
Version: v1.2.5
Issue: Authentication bypass (SEC-2026-001)
Deployed: 2026-01-31 16:12 UTC (27 minutes)
Status: Verified in production
Impact: Vulnerability closed
Post-mortem: [Link to doc]
---
```

### 9.4 Hotfix Validation

```bash
# 1. Verify specific fix
# Test the exact scenario that was broken

# 2. Smoke tests
./scripts/smoke-test.sh https://api.liyaqa.com

# 3. Monitor for 1 hour
# Watch metrics closely
# Check for side effects

# 4. Extended monitoring for 24 hours
# Error rate, performance, user feedback
```

---

## 10. Deployment Troubleshooting

### 10.1 Common Deployment Issues

#### Issue 1: Docker Image Pull Failed

**Symptoms:**
```
Error: manifest for ghcr.io/aminelhag/liyaqa/liyaqa-backend:v1.2.4 not found
```

**Diagnosis:**
```bash
# Check if image exists
docker manifest inspect ghcr.io/aminelhag/liyaqa/liyaqa-backend:v1.2.4

# Check GitHub packages
https://github.com/aminelhag/liyaqa/pkgs/container/liyaqa-backend
```

**Solutions:**
```bash
# Solution 1: Wait for CI pipeline to finish
# Check: https://github.com/aminelhag/liyaqa/actions

# Solution 2: Re-run Docker build workflow
gh workflow run docker-build.yml --ref v1.2.4

# Solution 3: Authenticate Docker with GHCR
echo $GITHUB_TOKEN | docker login ghcr.io -u aminelhag --password-stdin
```

#### Issue 2: Health Check Failed

**Symptoms:**
```
Health check failed: curl: (7) Failed to connect to localhost:8080
```

**Diagnosis:**
```bash
# Check container status
docker ps -a | grep liyaqa-backend

# Check container logs
docker logs liyaqa-backend-green --tail 100

# Check port binding
docker port liyaqa-backend-green

# Test inside container
docker exec liyaqa-backend-green curl http://localhost:8080/api/health
```

**Solutions:**
```bash
# Solution 1: Wait longer (may need 60s for large apps)
sleep 60
curl http://localhost:8080/api/health

# Solution 2: Check database connection
docker exec liyaqa-postgres pg_isready

# Solution 3: Check environment variables
docker inspect liyaqa-backend-green | grep -A 20 "Env"

# Solution 4: Check application logs for errors
docker logs liyaqa-backend-green | grep -i error
```

#### Issue 3: Database Migration Failed

**Symptoms:**
```
FlywayException: Migration V12__add_trainer_role.sql failed
```

**Diagnosis:**
```bash
# Check Flyway history
docker exec -it liyaqa-postgres psql -U liyaqa -d liyaqa

SELECT version, description, installed_on, success
FROM flyway_schema_history
ORDER BY installed_rank DESC
LIMIT 10;

# Check for locked tables
SELECT * FROM pg_locks WHERE NOT granted;

# Check for migration file syntax
cat backend/src/main/resources/db/migration/V12__add_trainer_role.sql
```

**Solutions:**
```bash
# Solution 1: Fix migration file and retry
# Edit migration file
# Restart container

# Solution 2: Mark migration as failed and repair
docker exec -it liyaqa-postgres psql -U liyaqa -d liyaqa
DELETE FROM flyway_schema_history WHERE version = '12';
# Fix migration and restart

# Solution 3: Restore from backup (if corrupted)
pg_restore -h localhost -U liyaqa -d liyaqa backup.dump
```

#### Issue 4: Container Starts But Immediately Stops

**Symptoms:**
```
docker ps -a
liyaqa-backend-green   Exited (1) 3 seconds ago
```

**Diagnosis:**
```bash
# Check exit logs
docker logs liyaqa-backend-green

# Common issues:
# - Missing environment variables
# - Database connection failed
# - Port already in use
# - Invalid configuration
```

**Solutions:**
```bash
# Solution 1: Check required environment variables
docker run --rm \
  ghcr.io/aminelhag/liyaqa/liyaqa-backend:v1.2.4 \
  env

# Solution 2: Run in foreground to see errors
docker run --rm -it \
  --env-file /opt/liyaqa/.env.prod \
  ghcr.io/aminelhag/liyaqa/liyaqa-backend:v1.2.4

# Solution 3: Check database connectivity
docker run --rm \
  --network liyaqa_network \
  postgres:15 \
  pg_isready -h liyaqa-postgres -p 5432

# Solution 4: Check port availability
netstat -tuln | grep 8080
# Kill process if needed
```

#### Issue 5: Slow Response After Deployment

**Symptoms:**
- P95 latency increased from 500ms to 3s
- Requests timing out

**Diagnosis:**
```bash
# Check container resources
docker stats liyaqa-backend-blue

# Check JVM memory
curl http://localhost:8080/actuator/metrics/jvm.memory.used
curl http://localhost:8080/actuator/metrics/jvm.memory.max

# Check database connections
curl http://localhost:8080/actuator/metrics/hikaricp.connections.active

# Check for slow queries
docker exec -it liyaqa-postgres psql -U liyaqa -d liyaqa
SELECT pid, now() - query_start as duration, query
FROM pg_stat_activity
WHERE state = 'active'
ORDER BY duration DESC;
```

**Solutions:**
```bash
# Solution 1: Increase JVM memory
# Edit .env.prod
JAVA_OPTS="-Xms2g -Xmx4g"
docker restart liyaqa-backend-blue

# Solution 2: Increase database connection pool
# Edit application.yml
spring.datasource.hikari.maximum-pool-size: 50
docker restart liyaqa-backend-blue

# Solution 3: Rollback if performance issue persists
# Follow rollback procedure in section 6
```

#### Issue 6: 502 Bad Gateway After Deployment

**Symptoms:**
```
curl https://api.liyaqa.com
502 Bad Gateway
```

**Diagnosis:**
```bash
# Check nginx status
sudo systemctl status nginx

# Check nginx error logs
sudo tail -f /var/log/nginx/error.log

# Check backend container
docker ps | grep liyaqa-backend
curl http://localhost:8080/api/health

# Check nginx configuration
sudo nginx -t
```

**Solutions:**
```bash
# Solution 1: Restart nginx
sudo systemctl restart nginx

# Solution 2: Check upstream configuration
sudo nano /etc/nginx/sites-available/liyaqa-backend
# Verify: proxy_pass http://localhost:8080;

# Solution 3: Check firewall
sudo ufw status
sudo ufw allow 8080/tcp

# Solution 4: Restart backend container
docker restart liyaqa-backend-blue
```

### 10.2 Debugging Commands

**Container Debugging:**
```bash
# Enter running container
docker exec -it liyaqa-backend-blue bash

# Check Java version
docker exec liyaqa-backend-blue java -version

# Check environment variables
docker exec liyaqa-backend-blue env

# Check file system
docker exec liyaqa-backend-blue ls -la /app

# Check listening ports
docker exec liyaqa-backend-blue netstat -tuln

# Check processes
docker exec liyaqa-backend-blue ps aux
```

**Log Analysis:**
```bash
# Follow logs
docker logs liyaqa-backend-blue --follow

# Last 100 lines
docker logs liyaqa-backend-blue --tail 100

# Logs with timestamps
docker logs liyaqa-backend-blue --timestamps

# Logs since 1 hour ago
docker logs liyaqa-backend-blue --since 1h

# Search for errors
docker logs liyaqa-backend-blue 2>&1 | grep -i error

# Count error occurrences
docker logs liyaqa-backend-blue 2>&1 | grep -c "ERROR"
```

**Database Debugging:**
```bash
# Connect to database
docker exec -it liyaqa-postgres psql -U liyaqa -d liyaqa

# Check active connections
SELECT count(*) FROM pg_stat_activity;

# Check database size
SELECT pg_size_pretty(pg_database_size('liyaqa'));

# Check table sizes
SELECT schemaname, tablename,
       pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename))
FROM pg_tables
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
LIMIT 10;

# Check slow queries
SELECT pid, now() - query_start as duration, query
FROM pg_stat_activity
WHERE state = 'active' AND query NOT LIKE '%pg_stat_activity%'
ORDER BY duration DESC;
```

**Network Debugging:**
```bash
# Test container networking
docker network inspect liyaqa_network

# Test DNS resolution
docker exec liyaqa-backend-blue nslookup liyaqa-postgres

# Test connectivity between containers
docker exec liyaqa-backend-blue ping liyaqa-postgres

# Test external connectivity
docker exec liyaqa-backend-blue curl -I https://google.com

# Check open ports
docker exec liyaqa-backend-blue netstat -tuln | grep LISTEN
```

### 10.3 Emergency Access

**If SSH access lost:**
```bash
# Option 1: Use cloud provider console
# - DigitalOcean: Access Droplet Console
# - AWS: Use Session Manager

# Option 2: Use backup access
# - Serial console
# - Recovery mode

# Option 3: Contact infrastructure team
# - Use emergency contact list
# - Escalate to on-call engineer
```

**If database access lost:**
```bash
# Option 1: Restart PostgreSQL container
docker restart liyaqa-postgres

# Option 2: Check PostgreSQL logs
docker logs liyaqa-postgres --tail 200

# Option 3: Restore from backup
cd /var/backups/liyaqa
./backend/scripts/verify-backup.sh
# Restore if necessary
```

---

## 11. Emergency Procedures

### 11.1 Emergency Response Team

**Primary On-Call:** DevOps Engineer
**Backup On-Call:** Senior Backend Engineer
**Escalation:** CTO

**Contact Methods:**
1. Slack: @devops-team (instant)
2. Phone: [Emergency contact list]
3. PagerDuty: [PagerDuty integration]

### 11.2 Production Outage Response

**Step 1: Acknowledge Incident (< 1 minute)**

```
Slack #incidents:
---
🚨 **PRODUCTION OUTAGE**
Detected: 2026-01-31 18:45 UTC
Incident Commander: @engineer-name
Status: Investigating
Severity: P0 - Critical
Impact: All users affected
Updates: Every 5 minutes
---
```

**Step 2: Assess Situation (< 3 minutes)**

```bash
# Check service status
curl https://api.liyaqa.com/api/health

# Check all services
docker ps

# Check recent deployments
docker ps -a --format "{{.Names}}\t{{.Status}}\t{{.Image}}"

# Check logs for errors
docker logs liyaqa-backend-blue --tail 100 | grep ERROR

# Check system resources
df -h
free -h
top
```

**Step 3: Immediate Mitigation (< 5 minutes)**

```bash
# Option 1: Restart service (if hung)
docker restart liyaqa-backend-blue

# Option 2: Rollback (if recent deployment)
# Follow rollback procedure in section 6.3

# Option 3: Failover to backup (if available)
# Switch load balancer to backup region

# Option 4: Enable maintenance mode
# Update nginx to serve maintenance page
```

**Step 4: Restore Service (< 15 minutes)**

```bash
# After mitigation, verify service
curl https://api.liyaqa.com/api/health

# Check error rate
# PromQL: rate(http_server_requests_seconds_count{status=~"5.."}[1m])

# Monitor recovery
watch -n 5 'curl -s https://api.liyaqa.com/api/health | jq'
```

**Step 5: Communicate Resolution**

```
Slack #incidents:
---
✅ **PRODUCTION RESTORED**
Incident: INC-2026-002
Duration: 12 minutes
Root Cause: Application crashed due to memory leak
Fix Applied: Restarted service, rollback to v1.2.3
Status: Service healthy
Next Steps: Post-mortem scheduled
---
```

**Step 6: Post-Incident Tasks**

- [ ] Create post-mortem document
- [ ] Identify root cause
- [ ] Create action items to prevent recurrence
- [ ] Update runbook
- [ ] Schedule team review
- [ ] Update status page

### 11.3 Data Breach Response

**Step 1: Contain Breach (Immediate)**

```bash
# 1. Isolate affected systems
docker stop liyaqa-backend-blue

# 2. Block suspicious IP addresses
sudo ufw deny from <suspicious-ip> to any

# 3. Rotate all credentials
# - Database passwords
# - JWT secrets
# - API keys
# - AWS credentials

# 4. Enable additional logging
# Capture all activity for forensics
```

**Step 2: Assess Impact (< 1 hour)**

```bash
# 1. Check access logs
docker logs liyaqa-backend-blue | grep -E "401|403|404"

# 2. Query audit logs
docker exec -it liyaqa-postgres psql -U liyaqa -d liyaqa
SELECT * FROM audit_logs
WHERE created_at > NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;

# 3. Identify affected users
SELECT DISTINCT user_id FROM audit_logs
WHERE action IN ('unauthorized_access', 'data_export')
  AND created_at > NOW() - INTERVAL '24 hours';

# 4. Document findings
# Create incident report
```

**Step 3: Notify Stakeholders (< 2 hours)**

```
# Internal notification
Slack #security-incidents:
---
🔒 **SECURITY INCIDENT**
Type: Potential data breach
Detected: 2026-01-31 20:15 UTC
Severity: P1 - High
Affected: [User count] users
Status: Contained, investigating
IC: @security-lead
Updates: Every 15 minutes
---

# External notification (if required by law)
# - Email affected users
# - Update status page
# - Notify regulatory authorities (GDPR, etc.)
```

**Step 4: Remediation**

```bash
# 1. Patch vulnerability
# Follow hotfix procedure

# 2. Force password resets (if credentials compromised)
docker exec -it liyaqa-postgres psql -U liyaqa -d liyaqa
UPDATE users SET password_reset_required = TRUE
WHERE id IN (SELECT user_id FROM affected_users);

# 3. Invalidate all sessions
DELETE FROM refresh_tokens;

# 4. Deploy security fixes
# Follow deployment procedure
```

**Step 5: Post-Incident**

- [ ] Complete forensic analysis
- [ ] Create detailed incident report
- [ ] Notify affected users (if required)
- [ ] Implement preventive measures
- [ ] Conduct security audit
- [ ] Update security policies
- [ ] Train team on lessons learned

### 11.4 Database Corruption

**Step 1: Detect Corruption**

```bash
# Symptoms:
# - Random query failures
# - Data inconsistencies
# - PostgreSQL errors in logs

# Check database integrity
docker exec -it liyaqa-postgres psql -U liyaqa -d liyaqa

# Check for corrupted indexes
REINDEX DATABASE liyaqa;

# Check table integrity
SELECT * FROM pg_stat_database WHERE datname = 'liyaqa';
```

**Step 2: Stop Writes**

```bash
# 1. Enable read-only mode
docker exec -it liyaqa-postgres psql -U liyaqa -d liyaqa
ALTER DATABASE liyaqa SET default_transaction_read_only = on;

# 2. Stop application
docker stop liyaqa-backend-blue
```

**Step 3: Assess Damage**

```bash
# 1. Identify corrupted tables
# Check logs for specific table errors

# 2. Export healthy data
pg_dump -h localhost -U liyaqa -t healthy_table > backup_healthy.sql

# 3. Estimate data loss
# Compare record counts with expected values
```

**Step 4: Restore from Backup**

```bash
# 1. Find latest good backup
ls -lh /var/backups/liyaqa/

# 2. Restore database
pg_restore -h localhost -U liyaqa -d liyaqa \
  --clean \
  /var/backups/liyaqa/liyaqa_backup_20260131_0200.dump

# 3. Verify restore
docker exec -it liyaqa-postgres psql -U liyaqa -d liyaqa
SELECT COUNT(*) FROM members;

# 4. Re-enable writes
ALTER DATABASE liyaqa SET default_transaction_read_only = off;

# 5. Restart application
docker start liyaqa-backend-blue
```

**Step 5: Communicate**

```
Slack #incidents:
---
⚠️ **DATABASE CORRUPTION INCIDENT RESOLVED**
Duration: 45 minutes
Data Loss: Transactions from 01:30-02:00 UTC (30 minutes)
Resolution: Restored from 01:00 UTC backup
Impact: 23 affected transactions
Next Steps: Contacting affected users
Post-mortem: Scheduled for tomorrow
---
```

### 11.5 Maintenance Mode

**Enable Maintenance Mode:**

```bash
# 1. SSH to server
ssh deploy@api.liyaqa.com

# 2. Update nginx configuration
sudo nano /etc/nginx/sites-available/liyaqa-backend

# Add at top of server block:
if (-f /var/www/maintenance.html) {
    return 503;
}

error_page 503 @maintenance;
location @maintenance {
    root /var/www;
    rewrite ^(.*)$ /maintenance.html break;
}

# 3. Create maintenance page
sudo nano /var/www/maintenance.html
# Add maintenance message

# 4. Reload nginx
sudo nginx -t
sudo nginx -s reload

# 5. Notify users
# Update status page
# Post on social media
```

**Disable Maintenance Mode:**

```bash
# 1. Remove maintenance page
sudo rm /var/www/maintenance.html

# 2. Reload nginx
sudo nginx -s reload

# 3. Verify service
curl https://api.liyaqa.com/api/health

# 4. Notify users
# Update status page
```

### 11.6 Disaster Recovery

**Scenario: Complete Server Loss**

**Step 1: Provision New Server (< 30 minutes)**

```bash
# 1. Create new droplet/instance
# Same specifications as production

# 2. Configure DNS
# Point api.liyaqa.com to new server IP

# 3. Run setup script
ssh root@new-server
wget https://raw.githubusercontent.com/aminelhag/liyaqa/main/deploy/setup-server.sh
chmod +x setup-server.sh
./setup-server.sh
```

**Step 2: Restore Database (< 15 minutes)**

```bash
# 1. Restore from S3 backup (if configured)
aws s3 cp s3://liyaqa-backups/latest.dump /tmp/

# 2. Restore to PostgreSQL
docker exec -i liyaqa-postgres pg_restore \
  -U liyaqa -d liyaqa --clean < /tmp/latest.dump

# 3. Verify restoration
docker exec -it liyaqa-postgres psql -U liyaqa -d liyaqa
SELECT COUNT(*) FROM users;
```

**Step 3: Deploy Application (< 10 minutes)**

```bash
# 1. Pull latest Docker image
docker pull ghcr.io/aminelhag/liyaqa/liyaqa-backend:latest

# 2. Start application
docker run -d \
  --name liyaqa-backend-blue \
  --network liyaqa_network \
  -p 8080:8080 \
  --env-file /opt/liyaqa/.env.prod \
  ghcr.io/aminelhag/liyaqa/liyaqa-backend:latest

# 3. Verify health
curl http://localhost:8080/api/health
```

**Step 4: Verify and Monitor (< 30 minutes)**

```bash
# 1. Run smoke tests
./scripts/smoke-test.sh https://api.liyaqa.com

# 2. Monitor metrics
# Check Grafana dashboards

# 3. Verify user access
# Test login, critical workflows

# 4. Monitor for 1 hour
# Watch for issues
```

**Total Recovery Time Objective (RTO):** < 90 minutes
**Recovery Point Objective (RPO):** < 2 hours (last backup)

---

## Appendix

### A. Deployment Command Reference

```bash
# Staging deployment (automatic)
# Triggered on merge to main

# Production deployment (manual)
# 1. Create release tag
git tag -a v1.2.4 -m "Release v1.2.4"
git push origin v1.2.4

# 2. Trigger workflow
gh workflow run deploy-production.yml --ref main

# Health check
curl https://api.liyaqa.com/api/health

# View logs
ssh deploy@api.liyaqa.com
docker logs liyaqa-backend-blue --tail 100 --follow

# Rollback (blue-green swap)
docker start liyaqa-backend-old
# Update nginx config
sudo nginx -s reload

# Database migration (manual)
docker exec -it liyaqa-postgres psql -U liyaqa -d liyaqa
\i /path/to/migration.sql
```

### B. Monitoring URLs

| Service | URL | Credentials |
|---------|-----|-------------|
| Grafana | https://grafana.liyaqa.com | admin / [vault] |
| Prometheus | https://prometheus.liyaqa.com | admin / [vault] |
| Alertmanager | https://alertmanager.liyaqa.com | admin / [vault] |
| Zipkin | https://zipkin.liyaqa.com | N/A |
| Status Page | https://status.liyaqa.com | N/A |

### C. Escalation Contacts

| Role | Primary | Backup |
|------|---------|--------|
| DevOps | @devops-lead | @devops-engineer |
| Backend | @backend-lead | @senior-backend |
| Frontend | @frontend-lead | @senior-frontend |
| Security | @security-lead | @cto |
| Management | @cto | @ceo |

### D. Related Documentation

- [Production Runbook](/docs/PRODUCTION_RUNBOOK.md)
- [Incident Response Guide](/docs/INCIDENT_RESPONSE.md)
- [Monitoring Quick Start](/deploy/MONITORING_QUICK_START.md)
- [Secrets Management](/deploy/SECRETS_MANAGEMENT.md)
- [Database Backup Guide](/backend/scripts/README.md)

---

**Document Version:** 1.0
**Last Updated:** 2026-01-31
**Next Review:** 2026-02-28
**Owner:** DevOps Team

