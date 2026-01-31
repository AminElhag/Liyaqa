# Production Environment Configuration Checklist

**Generated:** 2026-01-31
**Status:** Verification Required
**Purpose:** Pre-launch validation of production secrets and infrastructure

---

## GitHub Secrets Verification

The following secrets must be configured in GitHub Repository → Settings → Secrets and variables → Actions:

### Infrastructure Secrets
- [ ] `PRODUCTION_HOST` - Production server IP or hostname
- [ ] `PRODUCTION_USER` - SSH user for deployment
- [ ] `PRODUCTION_SSH_KEY` - Private SSH key for server access

### Database Secrets
- [ ] `PRODUCTION_DATABASE_URL` - Full JDBC connection string
- [ ] `PRODUCTION_DATABASE_USERNAME` - Database username
- [ ] `PRODUCTION_DATABASE_PASSWORD` - Database password (min 16 chars, complex)

### Application Secrets
- [ ] `PRODUCTION_JWT_SECRET` - JWT signing key (min 32 chars, cryptographically random)
- [ ] `PRODUCTION_CORS_ORIGINS` - Allowed CORS origins (comma-separated)
- [ ] `PRODUCTION_URL` - Public URL of the application

### Email (SMTP) Secrets
- [ ] `PRODUCTION_SMTP_HOST` - SMTP server hostname
- [ ] `PRODUCTION_SMTP_PORT` - SMTP port (587 for TLS, 465 for SSL)
- [ ] `PRODUCTION_SMTP_USERNAME` - SMTP authentication username
- [ ] `PRODUCTION_SMTP_PASSWORD` - SMTP authentication password

### SMS (Twilio) Secrets
- [ ] `PRODUCTION_TWILIO_ACCOUNT_SID` - Twilio account identifier
- [ ] `PRODUCTION_TWILIO_AUTH_TOKEN` - Twilio authentication token
- [ ] `PRODUCTION_TWILIO_PHONE_NUMBER` - Twilio phone number for SMS

### Monitoring Secrets
- [ ] `SLACK_WEBHOOK_URL` - Slack webhook for alerts and notifications

---

## Manual Verification Required

**Action Items:**

1. **Verify GitHub Secrets**
   - Navigate to: https://github.com/AminElhag/Liyaqa/settings/secrets/actions
   - Check each secret listed above exists
   - Document missing secrets in PRODUCTION_LAUNCH_STATUS.md

2. **Verify Production Server** (if provisioned)
   ```bash
   ssh <PRODUCTION_USER>@<PRODUCTION_HOST>
   docker --version
   docker compose version
   df -h
   free -h
   ls -la /opt/liyaqa
   ```

3. **Verify DNS Configuration**
   ```bash
   nslookup liyaqa.com
   nslookup api.liyaqa.com
   ```

4. **Verify SSL Certificates**
   ```bash
   curl -I https://liyaqa.com
   ```

---

## Status Summary

**Cannot be automatically verified - requires manual GitHub access:**

- Secrets Configured: UNKNOWN (manual verification required)
- Server Ready: UNKNOWN (manual verification required)
- DNS Configured: UNKNOWN (manual verification required)
- SSL Installed: UNKNOWN (manual verification required)

**See docs/PRE_LAUNCH_CHECKLIST.md for comprehensive launch requirements.**
