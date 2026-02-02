# Security Enhancement Testing Guide

**Project**: Platform Authentication Security Enhancement
**Status**: Testing Phase
**Date**: 2026-02-01
**Version**: 1.0

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Testing Environment Setup](#testing-environment-setup)
3. [Unit Testing](#unit-testing)
4. [Integration Testing](#integration-testing)
5. [End-to-End Testing](#end-to-end-testing)
6. [Security Testing](#security-testing)
7. [Performance Testing](#performance-testing)
8. [User Acceptance Testing](#user-acceptance-testing)
9. [Test Data](#test-data)
10. [Known Issues](#known-issues)

---

## Overview

This guide covers testing for all 11 phases of the Platform Authentication Security Enhancement:

- Phase 1: Password Security, Audit Trail, Notifications
- Phase 2: MFA, HTTPOnly Cookies, Session Management
- Phase 3: OAuth/SSO Integration
- Phase 4: Anomaly Detection, Middleware Protection, Absolute Timeout, IP Binding

**Testing Goals:**
- Verify all security features work correctly
- Ensure no regressions in existing functionality
- Validate security improvements
- Test edge cases and error handling
- Measure performance impact
- Ensure compliance requirements met

---

## Testing Environment Setup

### Backend Setup

```bash
cd backend

# 1. Clean build
./gradlew clean

# 2. Run database migrations
./gradlew flywayMigrate

# 3. Compile and run tests
./gradlew test

# 4. Start backend server
./gradlew bootRun
```

### Frontend Setup

```bash
cd frontend

# 1. Install dependencies
npm install

# 2. Clean Next.js cache
rm -rf .next
npm run build

# 3. Run frontend tests
npm test

# 4. Start dev server
npm run dev
```

### Database Setup

```sql
-- Create test database
CREATE DATABASE liyaqa_test;

-- Run migrations
-- Migrations will run automatically via Flyway

-- Verify migrations
SELECT version, description, installed_on
FROM flyway_schema_history
ORDER BY installed_rank DESC
LIMIT 20;
```

### Environment Variables

```bash
# Backend (.env or application.yml)
JWT_SECRET=test-secret-key-must-be-at-least-32-characters-long
JWT_ACCESS_TOKEN_EXPIRATION=900000
JWT_REFRESH_TOKEN_EXPIRATION=604800000
JWT_ABSOLUTE_SESSION_TIMEOUT=86400000

DATABASE_URL=jdbc:postgresql://localhost:5432/liyaqa_test
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=password

EMAIL_ENABLED=false  # Disable for testing
SMS_ENABLED=false    # Disable for testing

# Frontend (.env.local)
NEXT_PUBLIC_API_URL=http://localhost:8080
NEXT_PUBLIC_USE_COOKIE_AUTH=false  # Test Bearer auth first
```

---

## Unit Testing

### Backend Unit Tests

**Run all unit tests:**
```bash
./gradlew test
```

**Run specific test class:**
```bash
./gradlew test --tests "com.liyaqa.auth.application.services.AuthServiceTest"
```

**Key Test Classes to Verify:**

1. **Password Policy Tests**
   - `PasswordPolicyServiceTest.kt`
   - Test password validation rules
   - Test password history enforcement
   - Test policy configuration

2. **MFA Tests**
   - `MfaServiceTest.kt`
   - Test TOTP generation and verification
   - Test backup code generation and usage
   - Test MFA setup and disable flows

3. **Session Management Tests**
   - `SessionServiceTest.kt`
   - Test session creation and revocation
   - Test concurrent session limits
   - Test IP binding validation

4. **Anomaly Detection Tests**
   - `SecurityAnomalyServiceTest.kt`
   - Test impossible travel detection
   - Test brute force detection
   - Test unusual time detection

5. **Token Tests**
   - `JwtTokenProviderTest.kt`
   - Test token generation
   - Test token validation
   - Test absolute expiration

**Example Unit Test:**

```kotlin
@Test
fun `test IP binding validation when enabled`() {
    // Given
    val user = createTestUser(ipBindingEnabled = true)
    val session = createTestSession(
        userId = user.id,
        originatingIpAddress = "192.168.1.100"
    )

    // When
    val validationResult = sessionService.validateIpBinding(
        userId = user.id,
        currentIpAddress = "192.168.1.100"
    )

    // Then
    assertTrue(validationResult)
}

@Test
fun `test IP binding validation fails with different IP`() {
    // Given
    val user = createTestUser(ipBindingEnabled = true)
    val session = createTestSession(
        userId = user.id,
        originatingIpAddress = "192.168.1.100"
    )

    // When
    val validationResult = sessionService.validateIpBinding(
        userId = user.id,
        currentIpAddress = "203.0.113.50"
    )

    // Then
    assertFalse(validationResult)
}
```

### Frontend Unit Tests

**Run all tests:**
```bash
npm test
```

**Run with coverage:**
```bash
npm test -- --coverage
```

**Key Test Files:**

1. **Authentication Tests**
   - `auth-store.test.ts`
   - Test login/logout flows
   - Test token refresh
   - Test auth state management

2. **Component Tests**
   - `password-strength-indicator.test.tsx`
   - `mfa-verification-modal.test.tsx`
   - `security-alerts.test.tsx`

3. **API Client Tests**
   - `client.test.ts`
   - Test API request handling
   - Test error handling
   - Test token injection

---

## Integration Testing

### Authentication Flow Integration Tests

**1. Login with Password**

```bash
# Test successful login
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "StrongPassword123!",
    "tenantId": "00000000-0000-0000-0000-000000000001"
  }'

# Expected: 200 OK with accessToken, refreshToken
```

**2. Login with MFA**

```bash
# Step 1: Login (MFA enabled user)
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "mfa-user@example.com",
    "password": "StrongPassword123!",
    "tenantId": "00000000-0000-0000-0000-000000000001"
  }'

# Expected: 200 OK with mfaRequired: true

# Step 2: Verify MFA code
curl -X POST http://localhost:8080/api/auth/mfa/verify \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "<user_id>",
    "code": "123456"
  }'

# Expected: 200 OK with accessToken, refreshToken
```

**3. Token Refresh**

```bash
# Test token refresh
curl -X POST http://localhost:8080/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "<refresh_token>"
  }'

# Expected: 200 OK with new accessToken, refreshToken
```

**4. Token Refresh with IP Binding**

```bash
# Step 1: Enable IP binding
curl -X PUT http://localhost:8080/api/auth/security-preferences \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{"ipBindingEnabled": true}'

# Step 2: Login from specific IP
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -H "X-Forwarded-For: 192.168.1.100" \
  -d '{
    "email": "test@example.com",
    "password": "StrongPassword123!",
    "tenantId": "00000000-0000-0000-0000-000000000001"
  }'

# Step 3: Refresh from same IP (should succeed)
curl -X POST http://localhost:8080/api/auth/refresh \
  -H "Content-Type: application/json" \
  -H "X-Forwarded-For: 192.168.1.100" \
  -d '{"refreshToken": "<refresh_token>"}'

# Expected: 200 OK

# Step 4: Refresh from different IP (should fail)
curl -X POST http://localhost:8080/api/auth/refresh \
  -H "Content-Type: application/json" \
  -H "X-Forwarded-For: 203.0.113.50" \
  -d '{"refreshToken": "<refresh_token>"}'

# Expected: 400 Bad Request with IP validation error
```

**5. Absolute Session Timeout**

```bash
# Step 1: Login
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "StrongPassword123!",
    "tenantId": "00000000-0000-0000-0000-000000000001"
  }'

# Step 2: Immediately refresh (should succeed)
curl -X POST http://localhost:8080/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refreshToken": "<refresh_token>"}'

# Expected: 200 OK

# Step 3: Wait 25 hours, then refresh (should fail)
# (In testing, can modify JWT_ABSOLUTE_SESSION_TIMEOUT to 60000 = 1 minute)

# Expected: 400 Bad Request with absolute timeout error
```

### Session Management Integration Tests

**1. List Active Sessions**

```bash
curl -X GET http://localhost:8080/api/auth/sessions \
  -H "Authorization: Bearer <access_token>"

# Expected: List of active sessions with device info
```

**2. Revoke Session**

```bash
curl -X POST http://localhost:8080/api/auth/sessions/<session_id>/revoke \
  -H "Authorization: Bearer <access_token>"

# Expected: 200 OK, session revoked
```

**3. Concurrent Session Limit**

```bash
# Login 6 times from different devices
# (Concurrent limit is 5)

for i in {1..6}; do
  curl -X POST http://localhost:8080/api/auth/login \
    -H "Content-Type: application/json" \
    -d "{
      \"email\": \"test@example.com\",
      \"password\": \"StrongPassword123!\",
      \"tenantId\": \"00000000-0000-0000-0000-000000000001\",
      \"deviceInfo\": \"Device $i\"
    }"
done

# Expected: After 6th login, oldest session should be revoked
# Verify: GET /api/auth/sessions should show only 5 active
```

### Anomaly Detection Integration Tests

**1. Impossible Travel Detection**

```bash
# Step 1: Login from New York (40.7128° N, 74.0060° W)
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -H "X-Forwarded-For: 8.8.8.8" \
  -d '{
    "email": "test@example.com",
    "password": "StrongPassword123!",
    "tenantId": "00000000-0000-0000-0000-000000000001"
  }'

# Step 2: Immediately login from Tokyo (35.6762° N, 139.6503° E)
# (>10,000 km away)
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -H "X-Forwarded-For: 202.239.64.1" \
  -d '{
    "email": "test@example.com",
    "password": "StrongPassword123!",
    "tenantId": "00000000-0000-0000-0000-000000000001"
  }'

# Expected: Security alert created for impossible travel
# Verify: GET /api/security/alerts/unread
```

**2. Brute Force Detection**

```bash
# Attempt 11 failed logins within 5 minutes
for i in {1..11}; do
  curl -X POST http://localhost:8080/api/auth/login \
    -H "Content-Type: application/json" \
    -H "X-Forwarded-For: 203.0.113.50" \
    -d '{
      "email": "test@example.com",
      "password": "WrongPassword",
      "tenantId": "00000000-0000-0000-0000-000000000001"
    }'
done

# Expected:
# - Account locked after 5 attempts
# - Security alert created for brute force
# Verify: GET /api/security/alerts/unread
```

### OAuth Integration Tests

**1. OAuth Authorization Flow**

```bash
# Step 1: Get authorization URL
curl -X GET "http://localhost:8080/api/auth/oauth/authorize/GOOGLE?redirect_uri=http://localhost:3000/auth/callback"

# Expected: Redirect to Google OAuth

# Step 2: Handle callback (after user authorizes)
curl -X GET "http://localhost:8080/api/auth/oauth/callback?code=<auth_code>&state=<state>"

# Expected: 200 OK with accessToken, refreshToken
```

---

## End-to-End Testing

### E2E Test Scenarios

**Scenario 1: Complete User Journey**

```typescript
describe('Complete Authentication Journey', () => {
  it('should register, login with MFA, and access protected route', async () => {
    // 1. Register new user
    await page.goto('http://localhost:3000/register');
    await page.fill('input[name="email"]', 'e2e-test@example.com');
    await page.fill('input[name="password"]', 'StrongPassword123!');
    await page.click('button[type="submit"]');

    // 2. Setup MFA
    await page.goto('http://localhost:3000/security/mfa');
    await page.click('button:has-text("Enable MFA")');

    // Scan QR code (in real test, extract secret and generate TOTP)
    const totpCode = generateTOTP(secret);
    await page.fill('input[name="code"]', totpCode);
    await page.click('button:has-text("Verify")');

    // 3. Logout
    await page.click('button:has-text("Logout")');

    // 4. Login with MFA
    await page.goto('http://localhost:3000/login');
    await page.fill('input[name="email"]', 'e2e-test@example.com');
    await page.fill('input[name="password"]', 'StrongPassword123!');
    await page.click('button[type="submit"]');

    // MFA code required
    const mfaCode = generateTOTP(secret);
    await page.fill('input[name="mfaCode"]', mfaCode);
    await page.click('button:has-text("Verify")');

    // 5. Access protected route
    await page.goto('http://localhost:3000/admin/users');
    expect(await page.textContent('h1')).toBe('Users');

    // 6. View security alerts
    await page.goto('http://localhost:3000/security/alerts');
    expect(await page.textContent('h1')).toBe('Security Alerts');
  });
});
```

**Scenario 2: Session Management**

```typescript
describe('Session Management', () => {
  it('should manage multiple sessions', async () => {
    // Login from browser 1
    const context1 = await browser.newContext();
    const page1 = await context1.newPage();
    await login(page1, 'test@example.com', 'password');

    // Login from browser 2
    const context2 = await browser.newContext();
    const page2 = await context2.newPage();
    await login(page2, 'test@example.com', 'password');

    // View sessions from browser 1
    await page1.goto('http://localhost:3000/security/sessions');
    const sessionCount = await page1.locator('.session-card').count();
    expect(sessionCount).toBe(2);

    // Revoke session from browser 2
    await page1.click('.session-card:nth-child(2) button:has-text("Revoke")');

    // Browser 2 should be logged out
    await page2.reload();
    expect(await page2.url()).toContain('/login');
  });
});
```

---

## Security Testing

### Penetration Testing Checklist

**Authentication Vulnerabilities:**

- [ ] **SQL Injection**: Try SQL injection in login form
  ```bash
  curl -X POST http://localhost:8080/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{
      "email": "admin@example.com OR 1=1--",
      "password": "anything"
    }'
  # Expected: Should be sanitized, login should fail
  ```

- [ ] **Brute Force Protection**: Verify account lockout after 5 attempts
- [ ] **Password Reset Token**: Verify tokens expire and are single-use
- [ ] **Session Fixation**: Verify session ID changes after login
- [ ] **CSRF Protection**: Verify CSRF tokens required for state-changing requests

**XSS Vulnerabilities:**

- [ ] **Stored XSS**: Try injecting scripts in user profile
  ```bash
  curl -X PUT http://localhost:8080/api/users/me \
    -H "Authorization: Bearer <token>" \
    -H "Content-Type: application/json" \
    -d '{
      "displayNameEn": "<script>alert(\"XSS\")</script>"
    }'
  # Expected: Script should be sanitized
  ```

- [ ] **Reflected XSS**: Try XSS in URL parameters
- [ ] **Token Storage**: Verify tokens not in localStorage (use HTTPOnly cookies)

**Authorization Vulnerabilities:**

- [ ] **Privilege Escalation**: Try accessing admin routes as regular user
  ```bash
  curl -X GET http://localhost:8080/api/admin/users \
    -H "Authorization: Bearer <member_token>"
  # Expected: 403 Forbidden
  ```

- [ ] **IDOR**: Try accessing other users' data
  ```bash
  curl -X GET http://localhost:8080/api/users/<other_user_id> \
    -H "Authorization: Bearer <token>"
  # Expected: 403 Forbidden
  ```

**Session Vulnerabilities:**

- [ ] **Session Hijacking**: Try using token from different IP (with IP binding enabled)
- [ ] **Token Theft**: Verify refresh tokens revoked after use
- [ ] **Absolute Timeout**: Verify sessions expire after 24 hours

### Security Headers Verification

```bash
curl -I http://localhost:8080/api/auth/login

# Expected headers:
# X-Content-Type-Options: nosniff
# X-Frame-Options: DENY
# X-XSS-Protection: 1; mode=block
# Strict-Transport-Security: max-age=31536000; includeSubDomains
# Content-Security-Policy: default-src 'self'
```

---

## Performance Testing

### Load Testing with K6

```javascript
// load-test.js
import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
  stages: [
    { duration: '2m', target: 100 }, // Ramp up to 100 users
    { duration: '5m', target: 100 }, // Stay at 100 users
    { duration: '2m', target: 0 },   // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests under 500ms
  },
};

export default function () {
  // Login
  const loginRes = http.post('http://localhost:8080/api/auth/login', JSON.stringify({
    email: 'test@example.com',
    password: 'StrongPassword123!',
    tenantId: '00000000-0000-0000-0000-000000000001',
  }), {
    headers: { 'Content-Type': 'application/json' },
  });

  check(loginRes, {
    'login status is 200': (r) => r.status === 200,
    'has access token': (r) => r.json('accessToken') !== undefined,
  });

  const accessToken = loginRes.json('accessToken');
  const refreshToken = loginRes.json('refreshToken');

  sleep(1);

  // Refresh token
  const refreshRes = http.post('http://localhost:8080/api/auth/refresh', JSON.stringify({
    refreshToken: refreshToken,
  }), {
    headers: { 'Content-Type': 'application/json' },
  });

  check(refreshRes, {
    'refresh status is 200': (r) => r.status === 200,
  });

  sleep(1);
}
```

**Run load test:**
```bash
k6 run load-test.js
```

### Performance Benchmarks

**Expected Performance:**
- Login (no MFA): <300ms (p95)
- Login (with MFA): <500ms (p95)
- Token Refresh: <200ms (p95)
- Session Query: <100ms (p95)
- Anomaly Detection: Async (no impact on user)

---

## User Acceptance Testing

### UAT Test Cases

**Test Case 1: Password Change**
- User logs in
- Navigates to settings
- Changes password
- Verifies old password no longer works
- Verifies new password works
- Checks password not in history (try to change back immediately)

**Test Case 2: MFA Setup**
- User logs in
- Navigates to security settings
- Enables MFA
- Scans QR code with authenticator app
- Enters verification code
- Downloads backup codes
- Logs out and logs in with MFA

**Test Case 3: Session Management**
- User logs in from multiple devices
- Views active sessions
- Identifies current device
- Revokes another session
- Verifies that session is terminated

**Test Case 4: Security Alerts**
- User receives security alert (impossible travel)
- Views alert in security dashboard
- Reviews alert details
- Acknowledges alert
- Verifies alert marked as read

**Test Case 5: OAuth Login**
- User clicks "Sign in with Google"
- Authorizes application
- Redirected back to app
- Successfully logged in
- Profile populated from Google

---

## Test Data

### Test Users

```sql
-- Regular user
INSERT INTO users (id, email, password_hash, display_name_en, role, status, tenant_id)
VALUES (
  '11111111-1111-1111-1111-111111111111',
  'test@example.com',
  '$2a$10$... ', -- BCrypt hash of "StrongPassword123!"
  'Test User',
  'MEMBER',
  'ACTIVE',
  '00000000-0000-0000-0000-000000000001'
);

-- Admin user
INSERT INTO users (id, email, password_hash, display_name_en, role, status, tenant_id)
VALUES (
  '22222222-2222-2222-2222-222222222222',
  'admin@example.com',
  '$2a$10$...',
  'Admin User',
  'ADMIN',
  'ACTIVE',
  '00000000-0000-0000-0000-000000000001'
);

-- MFA enabled user
INSERT INTO users (id, email, password_hash, display_name_en, role, status, tenant_id, mfa_enabled)
VALUES (
  '33333333-3333-3333-3333-333333333333',
  'mfa-user@example.com',
  '$2a$10$...',
  'MFA User',
  'MEMBER',
  'ACTIVE',
  '00000000-0000-0000-0000-000000000001',
  true
);
```

---

## Known Issues

### Frontend Build Issues

**Issue**: Next.js build cache corruption
```
Error: ENOENT: no such file or directory, open '.next/server/vendor-chunks/next.js'
```

**Solution**:
```bash
cd frontend
rm -rf .next
rm -rf node_modules/.cache
npm run build
```

### Test Environment

**Issue**: Database state persistence between tests

**Solution**:
```kotlin
@BeforeEach
fun setup() {
    // Clean database before each test
    jdbcTemplate.execute("TRUNCATE TABLE users CASCADE")
    jdbcTemplate.execute("TRUNCATE TABLE refresh_tokens CASCADE")
    jdbcTemplate.execute("TRUNCATE TABLE user_sessions CASCADE")
}
```

---

## Test Reports

### Generate Test Coverage Report

**Backend:**
```bash
./gradlew test jacocoTestReport

# View report
open backend/build/reports/jacoco/test/html/index.html
```

**Frontend:**
```bash
npm test -- --coverage

# View report
open frontend/coverage/lcov-report/index.html
```

### Target Coverage

- **Backend**: >80% code coverage
- **Frontend**: >70% code coverage
- **Critical paths**: 100% coverage (auth, security)

---

## Continuous Integration

### GitHub Actions Workflow

```yaml
name: Security Tests

on: [push, pull_request]

jobs:
  backend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Set up JDK 17
        uses: actions/setup-java@v2
        with:
          java-version: '17'
      - name: Run tests
        run: ./gradlew test
      - name: Upload coverage
        uses: codecov/codecov-action@v2

  frontend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'
      - name: Install dependencies
        run: npm ci
      - name: Run tests
        run: npm test -- --coverage
      - name: Upload coverage
        uses: codecov/codecov-action@v2

  security-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Run OWASP Dependency Check
        uses: dependency-check/Dependency-Check_Action@main
      - name: Run Snyk
        uses: snyk/actions/node@master
```

---

## Next Steps

1. **Execute Test Plan**: Run all test suites
2. **Fix Issues**: Address any failing tests
3. **Security Audit**: Third-party penetration testing
4. **Performance Tuning**: Optimize based on load test results
5. **User Training**: Train users on new security features
6. **Production Deployment**: Gradual rollout with monitoring

---

**Testing Coordinator**: Security Enhancement Team
**Last Updated**: 2026-02-01
**Status**: Ready for Execution ✅
