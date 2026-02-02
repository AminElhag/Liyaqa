# Production Readiness - Quick Reference

**Last Updated:** 2026-01-31
**Status:** Week 1 Complete (30% done)
**Production Ready:** 75% (up from 65%)

---

## 🚀 Quick Start

### Start Monitoring Stack
```bash
cd deploy
docker-compose -f docker-compose.monitoring.yml up -d
```

**Access:**
- Grafana: http://localhost:3001 (admin/admin)
- Prometheus: http://localhost:9090
- Backend Metrics: http://localhost:8080/actuator/prometheus

### Run Manual Backup
```bash
./backend/scripts/backup-database.sh
./backend/scripts/verify-backup.sh
```

### View Logs
```bash
# Local files
tail -f logs/liyaqa.log

# Grafana Loki
# Open Grafana → Explore → Loki → Query: {service="backend"}
```

---

## 📚 Documentation Index

### Implementation Guides
| Document | Purpose | Location |
|----------|---------|----------|
| **Week 1 Progress** | Detailed implementation summary | `/PRODUCTION_READINESS_WEEK1_PROGRESS.md` |
| **Roadmap** | Full 4-week plan & status | `/IMPLEMENTATION_ROADMAP.md` |
| **This File** | Quick reference | `/PRODUCTION_READINESS_README.md` |

### Operational Guides
| Document | Purpose | Location |
|----------|---------|----------|
| **Backup Guide** | Backup/restore procedures | `/backend/scripts/README.md` |
| **Secrets Guide** | AWS Secrets Manager setup | `/deploy/SECRETS_MANAGEMENT.md` |
| **Monitoring Guide** | Grafana/Prometheus quick start | `/deploy/MONITORING_QUICK_START.md` |

### Configuration Files
| File | Purpose | Location |
|------|---------|----------|
| Backup Script | Automated backups | `/backend/scripts/backup-database.sh` |
| Verify Script | Backup verification | `/backend/scripts/verify-backup.sh` |
| Cron Jobs | Backup scheduling | `/deploy/crontab.txt` |
| Secrets Config | AWS Secrets Manager | `/backend/src/main/kotlin/com/liyaqa/config/SecretsConfig.kt` |
| Logging Config | Logback configuration | `/backend/src/main/resources/logback-spring.xml` |
| Request Filter | Request logging | `/backend/src/main/kotlin/com/liyaqa/config/RequestLoggingFilter.kt` |
| Monitoring Stack | Docker Compose | `/deploy/docker-compose.monitoring.yml` |
| Prometheus | Metrics config | `/deploy/prometheus.yml` |
| Loki | Log aggregation | `/deploy/loki-config.yml` |
| Promtail | Log shipping | `/deploy/promtail-config.yml` |

---

## ✅ What's Implemented

### ✅ Database Backups
- Automated daily backups (2 AM)
- Weekly verification (Sundays 3 AM)
- Monthly full backups (kept forever)
- 30-day retention for daily backups
- Optional S3 upload
- Backup verification via restore test

### ✅ Secrets Management
- AWS Secrets Manager integration
- Secure storage for all credentials
- Environment-specific secrets (dev/staging/prod)
- Migration script for existing secrets
- Fallback to .env for local development
- No secrets in version control

### ✅ Centralized Logging
- JSON structured logs (production)
- Human-readable logs (development)
- Request/response logging with timing
- MDC context (userId, tenantId, requestId)
- Loki log aggregation
- 30-day log retention
- Searchable via Grafana

### ✅ Monitoring
- Prometheus metrics collection (15s interval)
- Grafana dashboards
- Backend metrics (Spring Boot Actuator)
- Database metrics (postgres-exporter)
- 30-day metric retention
- Health checks on all services

---

## ⏳ What's Next

### Week 2: Testing Infrastructure
- [ ] Add JaCoCo coverage enforcement (80%)
- [ ] Backend integration tests
- [ ] Frontend component tests (60%)
- [ ] React Query hook tests
- [ ] E2E test enhancements

### Week 3: Monitoring & Observability
- [ ] Prometheus alerting rules
- [ ] Alertmanager + Slack integration
- [ ] Distributed tracing (OpenTelemetry)
- [ ] Load testing (k6)
- [ ] Grafana dashboards

### Week 4: Documentation & Validation
- [ ] Production runbook
- [ ] Incident response guide
- [ ] Deployment guide
- [ ] Security scanning CI/CD
- [ ] Pre-launch checklist

---

## 🎯 Production Checklist

### Infrastructure ✅
- [x] Automated database backups
- [x] Backup verification system
- [x] Secrets management (AWS)
- [x] Centralized logging
- [x] Metrics collection
- [ ] Alerting configured
- [ ] Distributed tracing

### Testing
- [x] Backend unit tests (85%+ coverage)
- [x] E2E tests (8 files)
- [ ] Backend coverage enforcement
- [ ] Frontend component tests
- [ ] Frontend hook tests
- [ ] Load testing

### Documentation ✅
- [x] API documentation (Swagger)
- [x] Backup procedures
- [x] Secrets management guide
- [x] Monitoring quick start
- [ ] Production runbook
- [ ] Incident response guide
- [ ] Deployment guide

### Security
- [x] JWT authentication
- [x] Rate limiting
- [x] CORS configuration
- [x] Secrets in AWS
- [ ] Security scanning in CI
- [ ] Dependency scanning
- [ ] Vulnerability assessment

### Monitoring ✅
- [x] Metrics collection
- [x] Log aggregation
- [ ] Custom dashboards
- [ ] Alerting rules
- [ ] On-call rotation
- [ ] PagerDuty integration

---

## 🔧 Common Tasks

### Check Backup Status
```bash
# View backup logs
tail -f /var/log/liyaqa-backup.log

# List backups
ls -lh /var/backups/liyaqa/

# Verify latest backup
./backend/scripts/verify-backup.sh
```

### Manage Secrets
```bash
# List secrets
aws secretsmanager list-secrets --region me-south-1

# Get secret value
aws secretsmanager get-secret-value \
  --secret-id liyaqa/prod/database \
  --region me-south-1

# Update secret
aws secretsmanager update-secret \
  --secret-id liyaqa/prod/jwt \
  --secret-string '{"accessTokenSecret":"new-value"}' \
  --region me-south-1
```

### Query Logs
```logql
# All backend logs
{service="backend"}

# Errors only
{service="backend", level="ERROR"}

# Specific user
{service="backend", userId="123"}

# Slow requests
{service="backend"} |= "Slow request detected"
```

### Query Metrics
```promql
# Request rate
rate(http_server_requests_seconds_count[5m])

# P95 latency
histogram_quantile(0.95, http_server_requests_seconds_bucket)

# Error rate
rate(http_server_requests_seconds_count{status=~"5.."}[5m])

# JVM memory
jvm_memory_used_bytes{area="heap"}

# Database connections
hikaricp_connections_active
```

### Restart Services
```bash
# Restart monitoring stack
cd deploy
docker-compose -f docker-compose.monitoring.yml restart

# Restart specific service
docker-compose -f docker-compose.monitoring.yml restart prometheus

# View logs
docker-compose -f docker-compose.monitoring.yml logs -f grafana
```

---

## 🚨 Troubleshooting

### No Metrics in Grafana
1. Check backend is running: `curl http://localhost:8080/actuator/prometheus`
2. Check Prometheus targets: http://localhost:9090/targets
3. Verify datasource in Grafana: Configuration → Data Sources

### No Logs in Loki
1. Check application is logging: `tail -f logs/liyaqa.log`
2. Check Promtail is running: `docker ps | grep promtail`
3. Check Loki is accessible: `curl http://localhost:3100/ready`

### Backup Failed
1. Check Docker is running: `docker ps | grep postgres`
2. Check disk space: `df -h /var/backups/liyaqa`
3. View logs: `tail -f /var/log/liyaqa-backup.log`
4. Test manually: `./backend/scripts/backup-database.sh`

### Can't Access Secrets
1. Verify AWS credentials: `aws sts get-caller-identity`
2. Check IAM permissions: `secretsmanager:GetSecretValue`
3. Verify secret exists: `aws secretsmanager list-secrets`
4. Check application config: `aws.secrets.enabled=true`

---

## 📊 Monitoring Quick Reference

### Service Status
| Service | Health Check | Dashboard |
|---------|-------------|-----------|
| Backend | http://localhost:8080/api/health | Grafana → Liyaqa Backend |
| Prometheus | http://localhost:9090/-/healthy | http://localhost:9090 |
| Grafana | http://localhost:3001/api/health | http://localhost:3001 |
| Loki | http://localhost:3100/ready | Grafana → Loki datasource |

### Key Metrics to Watch
- **Request Rate:** `rate(http_server_requests_seconds_count[5m])`
- **Error Rate:** `rate(http_server_requests_seconds_count{status=~"5.."}[5m])`
- **Latency (P95):** `histogram_quantile(0.95, http_server_requests_seconds_bucket)`
- **Memory Usage:** `jvm_memory_used_bytes / jvm_memory_max_bytes`
- **DB Connections:** `hikaricp_connections_active / hikaricp_connections_max`

---

## 📞 Getting Help

### Documentation
1. **Implementation Details:** See `/PRODUCTION_READINESS_WEEK1_PROGRESS.md`
2. **Full Roadmap:** See `/IMPLEMENTATION_ROADMAP.md`
3. **Backup Guide:** See `/backend/scripts/README.md`
4. **Secrets Guide:** See `/deploy/SECRETS_MANAGEMENT.md`
5. **Monitoring Guide:** See `/deploy/MONITORING_QUICK_START.md`

### External Resources
- [Spring Boot Actuator](https://docs.spring.io/spring-boot/docs/current/reference/html/actuator.html)
- [Prometheus Docs](https://prometheus.io/docs/)
- [Grafana Docs](https://grafana.com/docs/grafana/latest/)
- [Loki LogQL](https://grafana.com/docs/loki/latest/logql/)
- [AWS Secrets Manager](https://docs.aws.amazon.com/secretsmanager/)

---

## 🎯 Progress Tracking

**Current Status:**
```
Overall Progress:     ████████░░░░░░░░░░░░░░░░ 30%
Production Readiness: ███████████████░░░░░░░░░ 75%

Week 1: ████████████████████████████████ 100% ✅
Week 2: ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░   0%
Week 3: ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░   0%
Week 4: ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░   0%
```

**Completed:** 6/20 tasks
**Time Invested:** ~11.5 hours
**Time Remaining:** ~88.5 hours (estimated)

---

## 🎉 Quick Wins

What you can do RIGHT NOW with Week 1 implementation:

1. **View all logs in one place** - Grafana → Explore → Loki
2. **Track system performance** - Grafana → Explore → Prometheus
3. **Automated backups** - Running daily at 2 AM
4. **Secure secrets** - Ready for AWS Secrets Manager migration
5. **Monitor application health** - Prometheus targets & metrics

---

**For detailed information, see the full documentation in the links above.**
