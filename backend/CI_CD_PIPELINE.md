# CI/CD Pipeline & Deployment Strategy

## Overview

This document outlines the recommended CI/CD pipeline for deploying Phase 1 security fixes and future updates to production.

---

## 🏗️ Pipeline Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Commit    │────▶│   Build &   │────▶│   Deploy    │────▶│   Deploy    │
│   & Push    │     │    Test     │     │   Staging   │     │ Production  │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
                           │                    │                    │
                           ▼                    ▼                    ▼
                    Security Scan        Integration Tests    Health Checks
                    Unit Tests           Smoke Tests          Monitoring
                    Build JAR            Manual Approval      Rollback Plan
```

---

## 📋 Pipeline Stages

### Stage 1: Build & Test (5-10 minutes)

**Triggers:**
- Push to `main` branch
- Pull request creation
- Manual trigger

**Steps:**
```bash
# 1. Checkout code
git checkout main

# 2. Compile code
./gradlew clean compileKotlin

# 3. Run unit tests
./gradlew test --tests "*BookingServiceTest*" \
               --tests "*AuthServiceTest*" \
               --tests "*PermissionServiceTest*" \
               --tests "*MemberServiceTest*"

# 4. Run security scan
./gradlew dependencyCheckAnalyze

# 5. Build JAR
./gradlew bootJar

# 6. Archive artifacts
cp build/libs/*.jar artifacts/
```

**Success Criteria:**
- ✅ All tests pass
- ✅ No critical security vulnerabilities
- ✅ JAR builds successfully
- ✅ Code coverage > 70%

---

### Stage 2: Deploy to Staging (2-3 minutes)

**Triggers:**
- Stage 1 success
- Manual approval

**Steps:**
```bash
# 1. Copy JAR to staging server
scp artifacts/liyaqa-backend-*.jar staging-server:/opt/liyaqa/

# 2. Stop current application
ssh staging-server "sudo systemctl stop liyaqa-backend"

# 3. Backup current version
ssh staging-server "cp /opt/liyaqa/liyaqa-backend.jar /opt/liyaqa/backups/liyaqa-backend-$(date +%Y%m%d-%H%M%S).jar"

# 4. Deploy new version
ssh staging-server "cp /opt/liyaqa/liyaqa-backend-*.jar /opt/liyaqa/liyaqa-backend.jar"

# 5. Start application
ssh staging-server "sudo systemctl start liyaqa-backend"

# 6. Wait for startup
sleep 30

# 7. Health check
curl -f http://staging-server:8080/actuator/health || exit 1
```

**Success Criteria:**
- ✅ Application starts successfully
- ✅ Health check passes
- ✅ No errors in logs

---

### Stage 3: Integration & Smoke Tests (10-15 minutes)

**Runs on:** Staging environment

**Tests:**
```bash
# 1. Security Tests
./test-security-fixes.sh http://staging-server:8080

# 2. API Tests
newman run postman-collection.json -e staging-environment.json

# 3. Performance Tests
k6 run performance-tests.js

# 4. Smoke Tests
./smoke-tests.sh http://staging-server:8080
```

**Success Criteria:**
- ✅ All API tests pass
- ✅ Security fixes verified
- ✅ Performance within SLA
- ✅ No regressions detected

---

### Stage 4: Manual Approval (Variable)

**Requires:**
- Product Owner approval
- Tech Lead approval
- QA sign-off

**Checklist:**
- [ ] All automated tests passed
- [ ] Staging tested manually
- [ ] No critical bugs found
- [ ] Release notes prepared
- [ ] Rollback plan ready

---

### Stage 5: Deploy to Production (5-10 minutes)

**Triggers:**
- Manual approval
- Scheduled deployment window

**Blue-Green Deployment Strategy:**
```bash
# 1. Deploy to inactive environment (Green)
./deploy-to-green.sh

# 2. Run smoke tests on Green
./smoke-tests.sh http://green-server:8080

# 3. Switch traffic to Green
./switch-traffic.sh blue→green

# 4. Monitor for 10 minutes
./monitor.sh --duration 10m --alert-on-errors

# 5. If successful, keep Green as active
# 6. If issues, rollback to Blue
```

**Rollback Procedure:**
```bash
# Immediate rollback (< 30 seconds)
./switch-traffic.sh green→blue

# Or rollback via systemctl
ssh prod-server "sudo systemctl stop liyaqa-backend"
ssh prod-server "cp /opt/liyaqa/backups/liyaqa-backend-last-stable.jar /opt/liyaqa/liyaqa-backend.jar"
ssh prod-server "sudo systemctl start liyaqa-backend"
```

---

## 🔒 Security Checks

### Pre-Deployment Security Scan
```bash
# 1. Dependency vulnerabilities
./gradlew dependencyCheckAnalyze

# 2. OWASP scan
zap-cli quick-scan http://staging-server:8080

# 3. SQL injection tests
sqlmap -u "http://staging-server:8080/api/*" --batch

# 4. Authorization tests
./test-authorization.sh
```

### Security Verification Checklist
- [ ] No SQL injection vulnerabilities
- [ ] No XSS vulnerabilities
- [ ] Authorization checks working
- [ ] Tenant isolation verified
- [ ] PII masked in logs
- [ ] HTTPS enforced
- [ ] Rate limiting active

---

## 📊 Monitoring & Alerts

### Metrics to Monitor (First 24 Hours)

**Application Metrics:**
```bash
# Error rate
curl http://localhost:8080/actuator/metrics/http.server.requests | jq '.measurements[] | select(.statistic=="COUNT")'

# Response time (P95, P99)
curl http://localhost:8080/actuator/metrics/http.server.requests | jq '.measurements[] | select(.statistic=="TOTAL_TIME")'

# Database connections
curl http://localhost:8080/actuator/metrics/hikaricp.connections.active
```

**Business Metrics:**
- Booking cancellation attempts (authorized vs unauthorized)
- Profile update attempts (same tenant vs cross-tenant)
- Password reset requests
- API response times
- Database query counts

### Alert Rules

**Critical Alerts (Page immediately):**
```yaml
- name: High Error Rate
  condition: error_rate > 5%
  duration: 5m
  action: page_oncall

- name: Application Down
  condition: health_check_failed
  duration: 1m
  action: page_oncall

- name: Database Connection Exhausted
  condition: db_connections_available < 5
  duration: 2m
  action: page_oncall
```

**Warning Alerts (Slack notification):**
```yaml
- name: Elevated Response Time
  condition: p95_response_time > 500ms
  duration: 10m
  action: slack_alert

- name: Authorization Failures Spike
  condition: auth_failures > 100/hour
  duration: 5m
  action: slack_alert

- name: PII Detected in Logs
  condition: plaintext_email_detected
  duration: 1m
  action: slack_alert
```

---

## 🧪 Testing Strategy

### Unit Tests (Every Commit)
```bash
# Run all unit tests
./gradlew test

# Run specific service tests
./gradlew test --tests "*BookingServiceTest*"
./gradlew test --tests "*AuthServiceTest*"
./gradlew test --tests "*PermissionServiceTest*"
```

### Integration Tests (Staging Only)
```bash
# API integration tests
./gradlew integrationTest

# Database integration tests
./gradlew test --tests "*Repository*Test"

# External service integration tests
./gradlew test --tests "*EmailService*Test"
```

### Performance Tests (Staging & Production)
```bash
# Load test (100 concurrent users)
k6 run --vus 100 --duration 5m performance-test.js

# Stress test (find breaking point)
k6 run --vus 500 --duration 10m stress-test.js

# Soak test (sustained load)
k6 run --vus 50 --duration 1h soak-test.js
```

### Security Tests (Staging Only)
```bash
# Authorization tests
./test-authorization.sh

# SQL injection tests
sqlmap -u "http://staging:8080/api/bookings/*" --batch

# XSS tests
xsstrike -u "http://staging:8080/api/search?q="

# Penetration test
nmap -sV -p 8080 staging-server
```

---

## 📦 Deployment Environments

### Local Development
```bash
export SPRING_PROFILES_ACTIVE=local
export EMAIL_ENABLED=false
export DATABASE_URL=jdbc:postgresql://localhost:5432/liyaqa_dev
java -jar liyaqa-backend.jar
```

### Staging
```bash
export SPRING_PROFILES_ACTIVE=staging
export FRONTEND_BASE_URL=https://staging.liyaqa.com
export DATABASE_URL=jdbc:postgresql://staging-db:5432/liyaqa
export EMAIL_PROVIDER=smtp
java -jar liyaqa-backend.jar
```

### Production
```bash
export SPRING_PROFILES_ACTIVE=prod
export FRONTEND_BASE_URL=https://app.liyaqa.com
export DATABASE_URL=jdbc:postgresql://prod-db:5432/liyaqa
export EMAIL_PROVIDER=sendgrid
export SENDGRID_API_KEY=$SENDGRID_API_KEY
java -jar liyaqa-backend.jar
```

---

## 🔄 Release Process

### 1. Pre-Release (1 day before)
- [ ] Create release branch: `release/v1.0-phase1`
- [ ] Update version in `build.gradle`
- [ ] Generate release notes
- [ ] Notify stakeholders
- [ ] Schedule deployment window

### 2. Release Day
- [ ] Deploy to staging (morning)
- [ ] Run full test suite (2-3 hours)
- [ ] Manual testing by QA (2-3 hours)
- [ ] Get approvals (1 hour)
- [ ] Deploy to production (afternoon)
- [ ] Monitor for 4 hours

### 3. Post-Release
- [ ] Monitor metrics for 24 hours
- [ ] Gather feedback from pilot clubs
- [ ] Document any issues
- [ ] Plan hotfixes if needed
- [ ] Merge release branch to main

---

## 🚨 Incident Response

### Severity Levels

**P0 - Critical (Respond immediately)**
- Application down
- Data breach
- Major security vulnerability exploited
- **Action:** Rollback immediately, investigate, hotfix within 4 hours

**P1 - High (Respond within 1 hour)**
- Feature not working for all users
- Performance degradation
- Authorization bypassed
- **Action:** Investigate, fix within 24 hours, deploy hotfix

**P2 - Medium (Respond within 4 hours)**
- Feature not working for some users
- Minor performance issues
- Non-critical bugs
- **Action:** Fix in next regular deployment

**P3 - Low (Respond within 1 week)**
- Cosmetic issues
- Feature requests
- Documentation updates
- **Action:** Include in next sprint

### Rollback Decision Tree
```
Is production down? ─── YES ──▶ Rollback immediately
       │
       NO
       ▼
Error rate > 10%? ─── YES ──▶ Rollback immediately
       │
       NO
       ▼
Can fix in < 1 hour? ─ YES ──▶ Apply hotfix
       │
       NO
       ▼
Rollback and fix properly
```

---

## 📝 Deployment Checklist

### Pre-Deployment
- [ ] All tests pass
- [ ] Security scan complete
- [ ] Release notes prepared
- [ ] Stakeholders notified
- [ ] Rollback plan ready
- [ ] Database backups taken
- [ ] Monitoring alerts configured

### During Deployment
- [ ] Application deployed
- [ ] Health checks pass
- [ ] Smoke tests pass
- [ ] Logs show no errors
- [ ] Metrics look normal

### Post-Deployment
- [ ] Monitor for 1 hour
- [ ] Check error rates
- [ ] Verify key features work
- [ ] User acceptance testing
- [ ] Update documentation
- [ ] Close deployment ticket

---

## 🎯 Success Metrics

Track these metrics to measure deployment success:

**Deployment Metrics:**
- Deployment frequency: Target 2-4x per month
- Lead time: < 1 day from commit to production
- Mean time to recovery (MTTR): < 1 hour
- Change failure rate: < 5%

**Application Metrics:**
- Uptime: > 99.9%
- Error rate: < 0.1%
- P95 response time: < 200ms
- P99 response time: < 500ms

**Security Metrics:**
- Critical vulnerabilities: 0
- Unauthorized access attempts: Logged and blocked
- PII leaks in logs: 0
- Security incidents: 0

---

## 🛠️ Tools & Services

**Recommended CI/CD Tools:**
- **GitHub Actions** (free, integrated)
- **GitLab CI** (self-hosted option)
- **Jenkins** (on-premise)
- **CircleCI** (cloud)

**Monitoring:**
- **Prometheus + Grafana** (metrics)
- **ELK Stack** (logs)
- **Sentry** (errors)
- **DataDog** (all-in-one, paid)

**Testing:**
- **JUnit** (unit tests)
- **Postman/Newman** (API tests)
- **K6** (load tests)
- **OWASP ZAP** (security tests)

---

## 📞 Support Contacts

**During Deployment:**
- Tech Lead: [Contact]
- DevOps: [Contact]
- On-call Engineer: [Contact]

**Post-Deployment:**
- Product Owner: [Contact]
- Support Team: [Contact]
- Customer Success: [Contact]

---

**Last Updated:** February 4, 2026
**Version:** Phase 1 - Critical Security Fixes
**Status:** Ready for Implementation
