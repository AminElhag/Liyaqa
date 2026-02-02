# Production Deployment Configuration

## Required Environment Variables

### Database (REQUIRED)
```bash
DATABASE_URL=jdbc:postgresql://prod-db-host:5432/liyaqa
DATABASE_USERNAME=liyaqa_prod
DATABASE_PASSWORD=<secure-password>
```

### Security (REQUIRED)
```bash
JWT_SECRET=<minimum-32-character-random-string>
CORS_ALLOWED_ORIGINS=https://app.liyaqa.com,https://admin.liyaqa.com
```

### Storage (REQUIRED)
Choose ONE storage provider:

**Option A: AWS S3**
```bash
STORAGE_TYPE=s3
S3_BUCKET_NAME=liyaqa-production
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=<aws-key>
AWS_SECRET_ACCESS_KEY=<aws-secret>
```

**Option B: MinIO**
```bash
STORAGE_TYPE=minio
MINIO_ENDPOINT=https://minio.liyaqa.com
MINIO_ACCESS_KEY=<minio-key>
MINIO_SECRET_KEY=<minio-secret>
MINIO_BUCKET=liyaqa-storage
```

### Email Service (REQUIRED)
Choose ONE email provider:

**Option A: SMTP**
```bash
EMAIL_ENABLED=true
EMAIL_PROVIDER=smtp
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=noreply@liyaqa.com
SMTP_PASSWORD=<app-password>
```

**Option B: SendGrid**
```bash
EMAIL_ENABLED=true
EMAIL_PROVIDER=sendgrid
SENDGRID_API_KEY=<sendgrid-api-key>
```

**Option C: AWS SES**
```bash
EMAIL_ENABLED=true
EMAIL_PROVIDER=aws-ses
AWS_REGION=us-east-1
```

### Redis Cache (REQUIRED for multi-instance)
```bash
REDIS_HOST=redis.liyaqa.com
REDIS_PORT=6379
REDIS_PASSWORD=<redis-password>
LIYAQA_CACHE_REDIS_ENABLED=true
```

### Optional Services

**SMS (Twilio)**
```bash
SMS_ENABLED=true
TWILIO_ACCOUNT_SID=<twilio-sid>
TWILIO_AUTH_TOKEN=<twilio-token>
TWILIO_FROM_NUMBER=+1234567890
```

**Push Notifications (Firebase)**
```bash
FIREBASE_ENABLED=true
FIREBASE_SERVICE_ACCOUNT_JSON=<json-string>
# OR
FIREBASE_SERVICE_ACCOUNT_PATH=/path/to/firebase-credentials.json
```

**Payment Gateway (PayTabs)**
```bash
PAYTABS_ENABLED=true
PAYTABS_PROFILE_ID=<profile-id>
PAYTABS_SERVER_KEY=<server-key>
```

**E-Invoicing (Zatca)**
```bash
ZATCA_ENABLED=true
ZATCA_SELLER_NAME=<company-name>
ZATCA_VAT_NUMBER=<vat-number>
```

## Running in Production

```bash
docker run -d \
  -p 8080:8080 \
  -e SPRING_PROFILES_ACTIVE=prod \
  -e DATABASE_URL=... \
  -e DATABASE_USERNAME=... \
  -e DATABASE_PASSWORD=... \
  -e JWT_SECRET=... \
  -e CORS_ALLOWED_ORIGINS=... \
  -e STORAGE_TYPE=s3 \
  -e S3_BUCKET_NAME=... \
  -e AWS_REGION=... \
  -e EMAIL_ENABLED=true \
  -e EMAIL_PROVIDER=smtp \
  -e SMTP_HOST=... \
  -e REDIS_HOST=... \
  -e LIYAQA_CACHE_REDIS_ENABLED=true \
  --name liyaqa-backend \
  amegung/liyaqa-backend:latest
```

## Production Validation

The backend will fail to start if required variables are missing. Check logs for:

```
ERROR ProductionConfigValidator - Missing required environment variable: JWT_SECRET
ERROR ProductionConfigValidator - Storage type 'local' is not allowed in production
```

## Health Checks

```bash
# Application health
curl https://api.liyaqa.com/actuator/health

# Database connectivity
curl https://api.liyaqa.com/actuator/health/db

# Redis connectivity
curl https://api.liyaqa.com/actuator/health/redis
```
