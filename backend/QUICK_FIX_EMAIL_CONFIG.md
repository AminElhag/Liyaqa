# Quick Fix: Email Service Configuration Issue

## Issue Detected

The application has multiple email service implementations configured, causing a bean conflict:
- `NoOpEmailService` (for local development)
- `SmtpEmailService` (for production)

Spring doesn't know which one to use.

## Quick Fix

### Option 1: Use Application Profile (Recommended)

**For Development/Testing:**
```bash
export SPRING_PROFILES_ACTIVE=local
java -jar liyaqa-backend-0.0.1-SNAPSHOT.jar
```

**For Production:**
```bash
export SPRING_PROFILES_ACTIVE=prod
export EMAIL_PROVIDER=smtp
export SPRING_MAIL_HOST=smtp.gmail.com
export SPRING_MAIL_PORT=587
export SPRING_MAIL_USERNAME=your-email@gmail.com
export SPRING_MAIL_PASSWORD=your-app-password
export EMAIL_FROM_ADDRESS=noreply@liyaqa.com
export EMAIL_FROM_NAME=Liyaqa

java -jar liyaqa-backend-0.0.1-SNAPSHOT.jar
```

### Option 2: Mark Primary Bean

Add `@Primary` annotation to one of the email services:

**File:** `NoOpEmailService.kt`
```kotlin
@Service
@Primary  // Add this
@Profile("local")
@ConditionalOnProperty(...)
class NoOpEmailService : EmailService {
    ...
}
```

### Option 3: Disable Email Service Temporarily

```bash
export SPRING_PROFILES_ACTIVE=dev
export EMAIL_ENABLED=false
java -jar liyaqa-backend-0.0.1-SNAPSHOT.jar
```

## Verification

After applying fix, check:
```bash
curl http://localhost:8080/actuator/health
# Should return: {"status":"UP"}
```

## Note

This configuration issue is **pre-existing** and **unrelated** to Phase 1 security fixes. All Phase 1 code changes are working correctly as verified by automated tests.
