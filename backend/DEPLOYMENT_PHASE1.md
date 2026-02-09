# Phase 1 Security Fixes - Deployment Guide

**Build Date:** 2026-02-04
**Version:** Phase 1 - Critical Security & Performance Fixes
**Status:** ✅ Ready for Production

---

## 🎯 What's Been Fixed

### P0 - CRITICAL Security Fixes
1. ✅ **Authorization in Booking Cancellation** - Users can only cancel their own bookings
2. ✅ **Tenant Isolation in Profile Updates** - Cross-tenant data modification prevented

### P1 - HIGH Priority Fixes
3. ✅ **Password Reset Token Security** - Race condition fixed, URL configurable, expiration consistent
4. ✅ **Permission Query Optimization** - N+1 query eliminated (2 queries instead of N+1)

### P2 - MEDIUM Priority
5. ✅ **PII Masking in Logs** - Emails masked for GDPR/PDPL compliance

---

## 📦 Deployment Artifacts

**JAR File:** `build/libs/liyaqa-backend-0.0.1-SNAPSHOT.jar` (168MB)
**Location:** `/Users/waraiotoko/Desktop/Liyaqa/backend/build/libs/`

---

## 🚀 Deployment Steps

### Option A: Local Testing (Recommended First)

```bash
# 1. Set environment variables
export SPRING_PROFILES_ACTIVE=dev
export FRONTEND_BASE_URL=http://localhost:3000
export DATABASE_URL=jdbc:postgresql://localhost:5432/liyaqa
export DATABASE_USERNAME=your_db_user
export DATABASE_PASSWORD=your_db_password

# 2. Run the application
cd /Users/waraiotoko/Desktop/Liyaqa/backend
java -jar build/libs/liyaqa-backend-0.0.1-SNAPSHOT.jar

# Application will start on http://localhost:8080
```

### Option B: Docker Deployment

```bash
# 1. Build Docker image
cd /Users/waraiotoko/Desktop/Liyaqa/backend
docker build -t liyaqa-backend:phase1 .

# 2. Run container
docker run -d \
  --name liyaqa-backend \
  -p 8080:8080 \
  -e SPRING_PROFILES_ACTIVE=prod \
  -e FRONTEND_BASE_URL=https://app.liyaqa.com \
  -e DATABASE_URL=jdbc:postgresql://your-db-host:5432/liyaqa \
  -e DATABASE_USERNAME=your_db_user \
  -e DATABASE_PASSWORD=your_db_password \
  liyaqa-backend:phase1
```

### Option C: Production Deployment (AWS/GCP/Azure)

1. **Copy JAR to server:**
   ```bash
   scp build/libs/liyaqa-backend-0.0.1-SNAPSHOT.jar user@server:/opt/liyaqa/
   ```

2. **Create systemd service** (`/etc/systemd/system/liyaqa-backend.service`):
   ```ini
   [Unit]
   Description=Liyaqa Backend Service
   After=network.target

   [Service]
   Type=simple
   User=liyaqa
   WorkingDirectory=/opt/liyaqa
   Environment="SPRING_PROFILES_ACTIVE=prod"
   Environment="FRONTEND_BASE_URL=https://app.liyaqa.com"
   ExecStart=/usr/bin/java -jar /opt/liyaqa/liyaqa-backend-0.0.1-SNAPSHOT.jar
   Restart=on-failure
   RestartSec=10

   [Install]
   WantedBy=multi-user.target
   ```

3. **Start service:**
   ```bash
   sudo systemctl daemon-reload
   sudo systemctl enable liyaqa-backend
   sudo systemctl start liyaqa-backend
   sudo systemctl status liyaqa-backend
   ```

---

## ✅ Verification & Testing

### 1. Health Check
```bash
curl http://localhost:8080/actuator/health
# Expected: {"status":"UP"}
```

### 2. Test Security Fixes

#### Test #1: Booking Cancellation Authorization
```bash
# Try to cancel another user's booking (should fail with 403)
curl -X POST http://localhost:8080/api/bookings/{some-other-users-booking-id}/cancel \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"

# Expected: 403 Forbidden or "You can only cancel your own bookings"
```

#### Test #2: Tenant Isolation
```bash
# Try to update profile with different tenant ID in header
curl -X PATCH http://localhost:8080/api/me/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "X-Tenant-ID: different-tenant-id" \
  -H "Content-Type: application/json" \
  -d '{"firstName":"Hacked"}'

# Expected: 404 Not Found (tenant validation prevents modification)
```

#### Test #3: Password Reset
```bash
# Request password reset
curl -X POST http://localhost:8080/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","tenantId":"your-tenant-id"}'

# Check email:
# - Link should use FRONTEND_BASE_URL from config
# - Email should say "valid for 1 hour" (not 24 hours)
```

#### Test #4: PII Masking in Logs
```bash
# Check application logs
tail -f logs/liyaqa.log | grep -E "email|Email"

# Expected: All emails should be masked like j***e@e***.com
# Should NOT see: full email addresses in plaintext
```

#### Test #5: Performance Improvement
```bash
# Monitor database queries when loading user permissions
# Enable SQL logging temporarily:
export LOGGING_LEVEL_ORG_HIBERNATE_SQL=DEBUG

# Load user permissions and check logs
# Expected: Only 2 queries (not N+1):
#   1. SELECT from user_permissions WHERE user_id = ?
#   2. SELECT from permissions WHERE id IN (?, ?, ...)
```

---

## 📊 Monitoring After Deployment

### Key Metrics to Watch

1. **Error Rate**: Should remain < 0.1%
2. **API Response Time**:
   - P95 should be < 200ms
   - P99 should be < 500ms
3. **Database Query Count**: Should see reduction in permission-related queries
4. **Authorization Failures**: Monitor for any spike (could indicate legitimate users being blocked)

### Monitoring Commands
```bash
# Check application logs
tail -f /var/log/liyaqa/application.log

# Check error rate
grep "ERROR" /var/log/liyaqa/application.log | wc -l

# Check for PII leaks (should return ZERO results)
grep -E '[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}' /var/log/liyaqa/application.log | grep -v "maskEmail"
```

---

## 🔄 Rollback Plan

If critical issues arise:

### Quick Rollback
```bash
# Stop current service
sudo systemctl stop liyaqa-backend

# Restore previous JAR
cp /opt/liyaqa/backups/liyaqa-backend-previous.jar /opt/liyaqa/liyaqa-backend-0.0.1-SNAPSHOT.jar

# Start service with old version
sudo systemctl start liyaqa-backend
```

### Docker Rollback
```bash
# Stop and remove current container
docker stop liyaqa-backend
docker rm liyaqa-backend

# Run previous version
docker run -d --name liyaqa-backend liyaqa-backend:previous
```

---

## 🔐 Required Environment Variables

### Mandatory
- `DATABASE_URL` - PostgreSQL connection string
- `DATABASE_USERNAME` - Database user
- `DATABASE_PASSWORD` - Database password

### Optional (with defaults)
- `FRONTEND_BASE_URL` - Default: `https://app.liyaqa.com`
- `SERVER_PORT` - Default: `8080`
- `SPRING_PROFILES_ACTIVE` - Default: `dev`

---

## 📝 Configuration Changes

### New Configuration Added to `application.yml`:
```yaml
app:
  frontend:
    base-url: ${FRONTEND_BASE_URL:https://app.liyaqa.com}
```

**Purpose:** Makes password reset email links configurable per environment/tenant

---

## ✅ Success Criteria

Before declaring deployment successful, verify:

- [ ] Application starts without errors
- [ ] Health check endpoint returns UP
- [ ] Users can only cancel their own bookings
- [ ] Cross-tenant profile updates are blocked
- [ ] Password reset emails show "1 hour" expiration
- [ ] Password reset links use correct frontend URL
- [ ] Logs show masked emails (j***e@e***.com)
- [ ] No PII visible in logs
- [ ] API response times improved
- [ ] No spike in authorization failures
- [ ] Zero CRITICAL vulnerabilities in security scan

---

## 🎉 Ready for Pilot Launch

Once all verification steps pass, the system is ready for:
- ✅ Soft launch with 2-3 pilot clubs
- ✅ Production deployment
- ✅ Security audit

---

## 📞 Support

If issues arise during deployment:
1. Check application logs: `/var/log/liyaqa/application.log`
2. Check service status: `systemctl status liyaqa-backend`
3. Review this deployment guide
4. Execute rollback plan if needed

**Build Info:**
- Phase: 1 - Critical Security & Performance Fixes
- Fixes: 5 (2 P0, 2 P1, 1 P2)
- Files Modified: 15
- Files Created: 1
- Build Date: 2026-02-04
