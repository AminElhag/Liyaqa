# Liyaqa Backend - Production Deployment Guide

## Prerequisites

Before deploying to production, ensure you have:

- Docker and Docker Compose installed
- PostgreSQL database (v14+) provisioned
- Domain with SSL certificate (HTTPS required)
- SMTP credentials for email delivery
- Twilio account for SMS (optional)
- PayTabs merchant account for payments

---

## Environment Variables

### Required Variables (Application will fail to start without these)

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL JDBC connection URL | `jdbc:postgresql://db.example.com:5432/liyaqa` |
| `DATABASE_USERNAME` | Database username | `liyaqa_user` |
| `DATABASE_PASSWORD` | Database password | `secure_password_here` |
| `JWT_SECRET` | JWT signing key (min 32 characters) | `your-super-secure-jwt-secret-at-least-32-chars` |
| `CORS_ALLOWED_ORIGINS` | Frontend URLs (comma-separated) | `https://app.liyaqa.com,https://admin.liyaqa.com` |

### Conditional Variables (Required when feature is enabled)

#### Payment Processing (PayTabs)
| Variable | Description | Required When |
|----------|-------------|---------------|
| `PAYTABS_PROFILE_ID` | Merchant profile ID | Using online payments |
| `PAYTABS_SERVER_KEY` | API server key | Using online payments |
| `PAYTABS_CALLBACK_URL` | Webhook URL for payment notifications | Using online payments |
| `PAYTABS_RETURN_URL` | User redirect URL after payment | Using online payments |

#### Zatca E-Invoicing (Saudi Arabia Tax Compliance)
| Variable | Description | Required When |
|----------|-------------|---------------|
| `ZATCA_ENABLED` | Enable Zatca compliance | Set to `true` for Saudi Arabia |
| `ZATCA_SELLER_NAME` | Business name for QR code | `ZATCA_ENABLED=true` |
| `ZATCA_VAT_NUMBER` | VAT registration (15 digits) | `ZATCA_ENABLED=true` |

#### Email Notifications
| Variable | Description | Required When |
|----------|-------------|---------------|
| `EMAIL_ENABLED` | Enable email sending | Set to `true` |
| `EMAIL_FROM` | Sender email address | `EMAIL_ENABLED=true` |
| `EMAIL_BASE_URL` | Base URL for email links | `EMAIL_ENABLED=true` |
| `SMTP_HOST` | SMTP server hostname | `EMAIL_ENABLED=true` |
| `SMTP_PORT` | SMTP server port | `EMAIL_ENABLED=true` (default: 587) |
| `SMTP_USERNAME` | SMTP authentication username | `EMAIL_ENABLED=true` |
| `SMTP_PASSWORD` | SMTP authentication password | `EMAIL_ENABLED=true` |

#### SMS Notifications (Twilio)
| Variable | Description | Required When |
|----------|-------------|---------------|
| `SMS_ENABLED` | Enable SMS sending | Set to `true` |
| `TWILIO_ACCOUNT_SID` | Twilio account SID | `SMS_ENABLED=true` |
| `TWILIO_AUTH_TOKEN` | Twilio auth token | `SMS_ENABLED=true` |
| `TWILIO_FROM_NUMBER` | Twilio sender number | `SMS_ENABLED=true` |

### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `SERVER_PORT` | HTTP server port | `8080` |
| `HSTS_ENABLED` | Enable HSTS header | `true` in prod |
| `HSTS_MAX_AGE` | HSTS max age in seconds | `31536000` (1 year) |
| `DEFAULT_VAT_RATE` | VAT percentage | `15.00` |
| `MAX_FILE_SIZE` | Max upload size in bytes | `10485760` (10MB) |
| `UPLOAD_DIR` | Local file storage directory | `./uploads` |
| `PAYTABS_REGION` | PayTabs region code | `SAU` |
| `PAYTABS_CURRENCY` | Payment currency | `SAR` |

---

## Production Environment Template

Create a `.env.production` file with these values:

```bash
# ===========================================
# Liyaqa Production Environment
# ===========================================

# Spring Profile
SPRING_PROFILES_ACTIVE=prod

# Database (PostgreSQL)
DATABASE_URL=jdbc:postgresql://your-db-host:5432/liyaqa
DATABASE_USERNAME=liyaqa_prod
DATABASE_PASSWORD=your_secure_database_password

# Security
JWT_SECRET=your-production-jwt-secret-must-be-at-least-32-characters-long

# CORS (your frontend domains)
CORS_ALLOWED_ORIGINS=https://app.liyaqa.com,https://admin.liyaqa.com

# Email (SMTP)
EMAIL_ENABLED=true
EMAIL_FROM=noreply@liyaqa.com
EMAIL_BASE_URL=https://app.liyaqa.com
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@liyaqa.com
SMTP_PASSWORD=your-app-specific-password

# SMS (Twilio) - Optional
SMS_ENABLED=false
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_FROM_NUMBER=

# PayTabs Payment Gateway
PAYTABS_PROFILE_ID=your_profile_id
PAYTABS_SERVER_KEY=your_server_key
PAYTABS_CALLBACK_URL=https://api.liyaqa.com/api/payments/callback
PAYTABS_RETURN_URL=https://app.liyaqa.com/payment/complete

# Zatca E-Invoicing (Saudi Arabia)
ZATCA_ENABLED=true
ZATCA_SELLER_NAME=Your Business Name
ZATCA_VAT_NUMBER=123456789012345

# VAT Configuration
DEFAULT_VAT_RATE=15.00

# Security Headers
HSTS_ENABLED=true
```

---

## Deployment Steps

### Option 1: Docker Compose (Recommended)

1. **Pull the latest image:**
   ```bash
   docker pull ghcr.io/aminelhag/liyaqa/liyaqa-backend:latest
   ```

2. **Create production environment file:**
   ```bash
   cp .env.example .env.production
   # Edit .env.production with your production values
   ```

3. **Start the application:**
   ```bash
   docker compose -f docker-compose.prod.yml --env-file .env.production up -d
   ```

4. **Verify deployment:**
   ```bash
   # Check container status
   docker ps

   # Check health endpoint
   curl -f http://localhost:8080/actuator/health

   # Check logs
   docker logs liyaqa-backend-prod -f
   ```

### Option 2: Direct Docker Run

```bash
docker run -d \
  --name liyaqa-backend \
  --restart always \
  -p 8080:8080 \
  -e SPRING_PROFILES_ACTIVE=prod \
  -e DATABASE_URL=jdbc:postgresql://db-host:5432/liyaqa \
  -e DATABASE_USERNAME=liyaqa \
  -e DATABASE_PASSWORD=your_password \
  -e JWT_SECRET=your-jwt-secret-32-chars-min \
  -e CORS_ALLOWED_ORIGINS=https://app.liyaqa.com \
  -e EMAIL_ENABLED=true \
  -e SMTP_HOST=smtp.gmail.com \
  -e SMTP_PORT=587 \
  -e SMTP_USERNAME=email@liyaqa.com \
  -e SMTP_PASSWORD=smtp_password \
  ghcr.io/aminelhag/liyaqa/liyaqa-backend:latest
```

### Option 3: Kubernetes

Use the GitHub Actions workflow `deploy-production.yml` which supports:
- Blue-green deployment
- Automatic rollback on failure
- Health check verification

---

## Database Setup

### 1. Create PostgreSQL Database

```sql
CREATE DATABASE liyaqa;
CREATE USER liyaqa_prod WITH ENCRYPTED PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE liyaqa TO liyaqa_prod;
```

### 2. Run Migrations

Migrations run automatically on application startup via Flyway. The application will:
- Create all necessary tables (V2-V15)
- Create indexes for performance
- Set up audit logging

### 3. Verify Migration Status

```bash
curl http://localhost:8080/actuator/flyway
```

---

## Security Checklist

Before going live, verify:

- [ ] **HTTPS enabled** - All traffic should be encrypted
- [ ] **JWT_SECRET is unique** - Never use the default dev secret
- [ ] **CORS configured** - Only allow your frontend domains
- [ ] **HSTS enabled** - Enforces HTTPS in browsers
- [ ] **Database credentials secure** - Use strong, unique passwords
- [ ] **PayTabs callback URL correct** - Must be publicly accessible
- [ ] **SMTP credentials working** - Test email delivery
- [ ] **File upload directory exists** - With proper permissions

---

## Health Monitoring

### Health Endpoint

```bash
curl http://localhost:8080/actuator/health
```

Expected response:
```json
{
  "status": "UP",
  "components": {
    "db": { "status": "UP" },
    "diskSpace": { "status": "UP" }
  }
}
```

### Available Actuator Endpoints

| Endpoint | Description |
|----------|-------------|
| `/actuator/health` | Application health status |
| `/actuator/info` | Application info |
| `/actuator/metrics` | Performance metrics |

---

## Troubleshooting

### Application Won't Start

**Check logs:**
```bash
docker logs liyaqa-backend-prod
```

**Common issues:**
1. **Missing required environment variable** - Check ProductionConfigValidator output
2. **Database connection failed** - Verify DATABASE_URL, credentials, and network access
3. **JWT_SECRET too short** - Must be at least 32 characters

### Payment Callbacks Not Working

1. Verify `PAYTABS_CALLBACK_URL` is publicly accessible
2. Check firewall allows incoming webhooks
3. Verify PayTabs server key is correct

### Email Not Sending

1. Check `EMAIL_ENABLED=true`
2. Verify SMTP credentials
3. For Gmail, use App Password (not account password)
4. Check spam folder

### Zatca QR Code Not Appearing

1. Verify `ZATCA_ENABLED=true`
2. Check `ZATCA_SELLER_NAME` is set
3. Verify `ZATCA_VAT_NUMBER` is exactly 15 digits

---

## Scaling Considerations

### Horizontal Scaling

The application supports multiple instances via:
- **ShedLock** - Prevents duplicate scheduled job execution
- **Database-backed rate limiting** - Consistent limits across instances
- **Stateless JWT** - No session affinity required

### Recommended Production Setup

```
Load Balancer (nginx/HAProxy)
    ├── Backend Instance 1 (2 CPU, 2GB RAM)
    ├── Backend Instance 2 (2 CPU, 2GB RAM)
    └── Backend Instance 3 (2 CPU, 2GB RAM)
         │
    PostgreSQL (Primary + Replica)
```

### Resource Limits

| Resource | Minimum | Recommended |
|----------|---------|-------------|
| CPU | 0.5 cores | 2 cores |
| Memory | 512MB | 2GB |
| Disk | 1GB | 10GB+ (for uploads) |

---

## Backup Strategy

### Database Backup

```bash
# Daily backup
pg_dump -U liyaqa_prod -h db-host liyaqa > backup_$(date +%Y%m%d).sql

# Restore
psql -U liyaqa_prod -h db-host liyaqa < backup_20260108.sql
```

### File Storage Backup

If using local file storage, backup the upload directory:
```bash
tar -czf uploads_backup_$(date +%Y%m%d).tar.gz /app/uploads
```

---

## Support

- **Documentation:** `/swagger-ui.html`
- **API Spec:** `/api-docs`
- **Issues:** https://github.com/AminElhag/Liyaqa/issues

---

## Version Information

| Component | Version |
|-----------|---------|
| Spring Boot | 4.0.1 |
| Kotlin | 2.2 |
| Java | 21 |
| PostgreSQL | 14+ |
