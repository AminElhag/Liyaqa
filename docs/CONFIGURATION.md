# Liyaqa Configuration Guide

**Complete Configuration Reference**

---

## Table of Contents

1. [Environment Setup](#1-environment-setup)
2. [Backend Configuration](#2-backend-configuration)
3. [Frontend Configuration](#3-frontend-configuration)
4. [Database Configuration](#4-database-configuration)
5. [External Service Configuration](#5-external-service-configuration)
6. [Security Configuration](#6-security-configuration)
7. [Deployment Configuration](#7-deployment-configuration)

---

## 1. Environment Setup

### 1.1 Prerequisites

**Backend**:
- Java 21 or higher
- Gradle 8.x
- PostgreSQL 14+ (or H2 for development)

**Frontend**:
- Node.js 18+ or 20+
- npm 9+ or yarn 1.22+

**Mobile Apps**:
- For Android: Android Studio, Android SDK
- For iOS: Xcode 15+, macOS required

### 1.2 Environment Variables

Create `.env` file in project root:

```bash
# Environment
SPRING_PROFILES_ACTIVE=dev  # dev, staging, production

# Database
DATABASE_URL=jdbc:postgresql://localhost:5432/liyaqa
DATABASE_USERNAME=liyaqa
DATABASE_PASSWORD=secure_password

# JWT
JWT_SECRET=your-secret-key-must-be-at-least-32-characters-long

# API Base URL
NEXT_PUBLIC_API_URL=http://localhost:8080/api

# Domain Configuration
LIYAQA_BASE_DOMAIN=liyaqa.local  # or liyaqa.com in production
```

---

## 2. Backend Configuration

### 2.1 Application Configuration

**File**: `backend/src/main/resources/application.yml`

#### Server Configuration
```yaml
server:
  port: ${SERVER_PORT:8080}
  compression:
    enabled: true
    min-response-size: 1024
  error:
    include-message: always
```

#### JWT Configuration
```yaml
jwt:
  secret: ${JWT_SECRET:must-be-at-least-32-characters}
  access-token-expiration: 900000      # 15 minutes
  refresh-token-expiration: 604800000  # 7 days
```

#### Multi-Tenancy Configuration
```yaml
liyaqa:
  domain:
    base: ${LIYAQA_BASE_DOMAIN:liyaqa.local}
    dev-hosts: localhost,127.0.0.1,liyaqa.local
```

### 2.2 Database Configuration

#### Development (H2)
```yaml
spring:
  datasource:
    url: jdbc:h2:mem:liyaqa
    driver-class-name: org.h2.Driver
    username: sa
    password:
  h2:
    console:
      enabled: true
      path: /h2-console
```

#### Production (PostgreSQL)
```yaml
spring:
  datasource:
    url: ${DATABASE_URL}
    username: ${DATABASE_USERNAME}
    password: ${DATABASE_PASSWORD}
    driver-class-name: org.postgresql.Driver
    hikari:
      maximum-pool-size: 10
      minimum-idle: 5
      connection-timeout: 30000
```

### 2.3 Email Configuration
```yaml
liyaqa:
  email:
    enabled: ${EMAIL_ENABLED:false}
    from-address: ${EMAIL_FROM:noreply@liyaqa.com}
    from-name: Liyaqa
    base-url: ${EMAIL_BASE_URL:http://localhost:3000}

spring:
  mail:
    host: ${SMTP_HOST:smtp.gmail.com}
    port: ${SMTP_PORT:587}
    username: ${SMTP_USERNAME}
    password: ${SMTP_PASSWORD}
    properties:
      mail.smtp.auth: true
      mail.smtp.starttls.enable: true
```

### 2.4 SMS Configuration (Twilio)
```yaml
liyaqa:
  sms:
    enabled: ${SMS_ENABLED:false}
    provider: twilio
    twilio:
      account-sid: ${TWILIO_ACCOUNT_SID}
      auth-token: ${TWILIO_AUTH_TOKEN}
      from-number: ${TWILIO_FROM_NUMBER}
```

### 2.5 Payment Gateway Configuration

#### PayTabs
```yaml
liyaqa:
  payment:
    paytabs:
      profile-id: ${PAYTABS_PROFILE_ID}
      server-key: ${PAYTABS_SERVER_KEY}
      region: SAU
      currency: SAR
      callback-url: ${PAYTABS_CALLBACK_URL:http://localhost:8080/api/payments/callback}
      return-url: ${PAYTABS_RETURN_URL:http://localhost:3000/payment/complete}
```

### 2.6 Firebase Configuration (Push Notifications)
```yaml
liyaqa:
  firebase:
    enabled: ${FIREBASE_ENABLED:false}
    service-account-path: ${FIREBASE_SERVICE_ACCOUNT_PATH}
    # Or for containers:
    service-account-json: ${FIREBASE_SERVICE_ACCOUNT_JSON}
```

### 2.7 ZATCA Configuration (Saudi E-Invoicing)
```yaml
liyaqa:
  zatca:
    enabled: ${ZATCA_ENABLED:false}
    seller-name: ${ZATCA_SELLER_NAME}
    vat-registration-number: ${ZATCA_VAT_NUMBER}
  billing:
    default-vat-rate: 15.00  # Saudi Arabia VAT rate
```

### 2.8 File Storage Configuration
```yaml
liyaqa:
  storage:
    type: local  # or s3
    max-file-size: 10485760  # 10MB
    allowed-types:
      - image/jpeg
      - image/png
      - application/pdf
    local:
      upload-dir: ${UPLOAD_DIR:./uploads}
```

### 2.9 CORS Configuration
```yaml
liyaqa:
  cors:
    allowed-origins: http://localhost:3000,http://localhost:3003
    allowed-origin-patterns: http://*.liyaqa.local:3000,http://*.localhost:3000
```

### 2.10 Security Configuration
```yaml
liyaqa:
  security:
    hsts-enabled: ${HSTS_ENABLED:false}  # Enable in production
    hsts-max-age-seconds: 31536000  # 1 year
    content-security-policy: "default-src 'self'; ..."
```

---

## 3. Frontend Configuration

### 3.1 Environment Variables

**File**: `frontend/.env.local`

```bash
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:8080/api

# Domain Configuration
NEXT_PUBLIC_BASE_DOMAIN=liyaqa.local

# Feature Flags
NEXT_PUBLIC_ENABLE_ANALYTICS=false
NEXT_PUBLIC_ENABLE_SENTRY=false

# Stripe (if using for frontend payments)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

### 3.2 Next.js Configuration

**File**: `frontend/next.config.js`

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // i18n configuration
  i18n: {
    locales: ['en', 'ar'],
    defaultLocale: 'en',
  },

  // Image optimization
  images: {
    domains: ['api.liyaqa.com', 'cdn.liyaqa.com'],
  },

  // API rewrites
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL}/:path*`,
      },
    ];
  },

  // Environment variables exposed to browser
  env: {
    API_URL: process.env.NEXT_PUBLIC_API_URL,
  },
};

module.exports = nextConfig;
```

---

## 4. Database Configuration

### 4.1 PostgreSQL Setup

#### Create Database
```sql
CREATE DATABASE liyaqa;
CREATE USER liyaqa WITH ENCRYPTED PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE liyaqa TO liyaqa;
```

#### Connection String
```bash
DATABASE_URL=jdbc:postgresql://localhost:5432/liyaqa?sslmode=disable
# For production with SSL:
DATABASE_URL=jdbc:postgresql://db.example.com:5432/liyaqa?sslmode=require
```

### 4.2 Database Migration

**Run Migrations**:
```bash
cd backend
./gradlew flywayMigrate
```

**Check Migration Status**:
```bash
./gradlew flywayInfo
```

**Repair Failed Migration**:
```bash
./gradlew flywayRepair
```

---

## 5. External Service Configuration

### 5.1 Email (SMTP)

#### Gmail
```yaml
spring:
  mail:
    host: smtp.gmail.com
    port: 587
    username: your-email@gmail.com
    password: your-app-password  # Use app password, not account password
    properties:
      mail.smtp.auth: true
      mail.smtp.starttls.enable: true
```

#### SendGrid
```yaml
spring:
  mail:
    host: smtp.sendgrid.net
    port: 587
    username: apikey
    password: ${SENDGRID_API_KEY}
```

### 5.2 SMS (Twilio)

**Sign up**: https://www.twilio.com/

**Configuration**:
```yaml
liyaqa:
  sms:
    twilio:
      account-sid: ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
      auth-token: your_auth_token
      from-number: +1234567890  # Your Twilio phone number
```

### 5.3 WhatsApp Business API

**Sign up**: https://business.whatsapp.com/

**Configuration**:
```yaml
liyaqa:
  whatsapp:
    enabled: true
    provider: twilio  # or meta
    business-phone-number-id: ${WHATSAPP_BUSINESS_PHONE_ID}
    access-token: ${WHATSAPP_ACCESS_TOKEN}
```

### 5.4 Firebase (Push Notifications)

**Setup**:
1. Create Firebase project: https://console.firebase.google.com/
2. Add Android and iOS apps
3. Download service account JSON
4. Enable Cloud Messaging

**Configuration**:
```yaml
liyaqa:
  firebase:
    enabled: true
    service-account-path: /path/to/firebase-service-account.json
```

**Environment Variable (Docker)**:
```bash
FIREBASE_SERVICE_ACCOUNT_JSON='{"type":"service_account","project_id":"..."}'
```

### 5.5 Payment Gateways

#### PayTabs
1. Sign up: https://site.paytabs.com/
2. Get Profile ID and Server Key from dashboard
3. Configure callback URLs

#### STC Pay
1. Contact STC Pay for merchant account
2. Get merchant ID and API key
3. Configure callback URL

---

## 6. Security Configuration

### 6.1 JWT Secret

**Generate Strong Secret**:
```bash
openssl rand -base64 32
```

**Configuration**:
```yaml
jwt:
  secret: ${JWT_SECRET}  # Store in environment variable
```

### 6.2 HTTPS/TLS

#### Development (Self-Signed Certificate)
```bash
keytool -genkeypair -alias liyaqa -keyalg RSA -keysize 2048 \
  -storetype PKCS12 -keystore keystore.p12 -validity 3650
```

```yaml
server:
  port: 8443
  ssl:
    enabled: true
    key-store: classpath:keystore.p12
    key-store-password: ${KEYSTORE_PASSWORD}
    key-store-type: PKCS12
    key-alias: liyaqa
```

#### Production (Let's Encrypt)
Use reverse proxy (Nginx, Caddy) with automatic SSL certificate:
```nginx
server {
    listen 443 ssl http2;
    server_name api.liyaqa.com;

    ssl_certificate /etc/letsencrypt/live/api.liyaqa.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.liyaqa.com/privkey.pem;

    location / {
        proxy_pass http://localhost:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### 6.3 CORS Configuration

**Development**:
```yaml
liyaqa:
  cors:
    allowed-origins: http://localhost:3000
    allowed-origin-patterns: http://*.localhost:3000
```

**Production**:
```yaml
liyaqa:
  cors:
    allowed-origins: https://app.liyaqa.com
    allowed-origin-patterns: https://*.liyaqa.com
```

---

## 7. Deployment Configuration

### 7.1 Environment Profiles

#### Development
```bash
SPRING_PROFILES_ACTIVE=dev
```

#### Staging
```bash
SPRING_PROFILES_ACTIVE=staging
```

#### Production
```bash
SPRING_PROFILES_ACTIVE=production
```

### 7.2 Docker Configuration

**backend/Dockerfile**:
```dockerfile
FROM openjdk:21-jdk-slim
WORKDIR /app
COPY build/libs/liyaqa-backend.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
```

**docker-compose.yml**:
```yaml
version: '3.8'

services:
  postgres:
    image: postgres:16
    environment:
      POSTGRES_DB: liyaqa
      POSTGRES_USER: liyaqa
      POSTGRES_PASSWORD: secure_password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  backend:
    build: ./backend
    environment:
      SPRING_PROFILES_ACTIVE: production
      DATABASE_URL: jdbc:postgresql://postgres:5432/liyaqa
      DATABASE_USERNAME: liyaqa
      DATABASE_PASSWORD: secure_password
      JWT_SECRET: ${JWT_SECRET}
    depends_on:
      - postgres
    ports:
      - "8080:8080"

  frontend:
    build: ./frontend
    environment:
      NEXT_PUBLIC_API_URL: http://backend:8080/api
    ports:
      - "3000:3000"

volumes:
  postgres_data:
```

**Run**:
```bash
docker-compose up -d
```

### 7.3 Kubernetes Configuration

**backend-deployment.yaml**:
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: liyaqa-backend
spec:
  replicas: 3
  selector:
    matchLabels:
      app: liyaqa-backend
  template:
    metadata:
      labels:
        app: liyaqa-backend
    spec:
      containers:
      - name: backend
        image: liyaqa/backend:latest
        ports:
        - containerPort: 8080
        env:
        - name: SPRING_PROFILES_ACTIVE
          value: "production"
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: liyaqa-secrets
              key: database-url
        - name: JWT_SECRET
          valueFrom:
            secretKeyRef:
              name: liyaqa-secrets
              key: jwt-secret
        resources:
          requests:
            memory: "1Gi"
            cpu: "500m"
          limits:
            memory: "2Gi"
            cpu: "1000m"
---
apiVersion: v1
kind: Service
metadata:
  name: liyaqa-backend
spec:
  selector:
    app: liyaqa-backend
  ports:
  - port: 80
    targetPort: 8080
  type: LoadBalancer
```

### 7.4 Environment Variables Summary

**Required Variables**:
```bash
# Database
DATABASE_URL
DATABASE_USERNAME
DATABASE_PASSWORD

# Security
JWT_SECRET

# Email (if enabled)
SMTP_HOST
SMTP_PORT
SMTP_USERNAME
SMTP_PASSWORD

# SMS (if enabled)
TWILIO_ACCOUNT_SID
TWILIO_AUTH_TOKEN
TWILIO_FROM_NUMBER

# Payments (if enabled)
PAYTABS_PROFILE_ID
PAYTABS_SERVER_KEY

# Firebase (if enabled)
FIREBASE_SERVICE_ACCOUNT_PATH
# or
FIREBASE_SERVICE_ACCOUNT_JSON
```

**Optional Variables**:
```bash
# Features
EMAIL_ENABLED=true
SMS_ENABLED=true
FIREBASE_ENABLED=true
ZATCA_ENABLED=true

# Domain
LIYAQA_BASE_DOMAIN=liyaqa.com

# Storage
UPLOAD_DIR=/var/uploads

# CORS
CORS_ALLOWED_ORIGINS=https://app.liyaqa.com
```

---

## 8. Monitoring & Logging

### 8.1 Spring Boot Actuator

**Configuration**:
```yaml
management:
  endpoints:
    web:
      exposure:
        include: health,info,metrics,prometheus
  endpoint:
    health:
      show-details: when_authorized
```

**Health Check**:
```bash
curl http://localhost:8080/actuator/health
```

### 8.2 Logging

**Configuration**:
```yaml
logging:
  level:
    root: INFO
    com.liyaqa: DEBUG
    org.springframework.web: INFO
    org.hibernate.SQL: DEBUG
  file:
    name: logs/liyaqa.log
  pattern:
    console: "%d{yyyy-MM-dd HH:mm:ss} - %msg%n"
    file: "%d{yyyy-MM-dd HH:mm:ss} [%thread] %-5level %logger{36} - %msg%n"
```

---

## Summary

Liyaqa configuration covers:
- **Environment setup** for development, staging, and production
- **Backend configuration** with Spring Boot and application.yml
- **Frontend configuration** with Next.js and environment variables
- **Database setup** with PostgreSQL and Flyway migrations
- **External services** including email, SMS, payments, and push notifications
- **Security** with JWT, HTTPS, and CORS
- **Deployment** with Docker and Kubernetes

All sensitive configuration should be stored in environment variables, never committed to version control.

---

*Last Updated: January 2026*
*Version: 1.0*
