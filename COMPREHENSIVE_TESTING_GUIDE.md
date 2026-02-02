# Comprehensive Testing Guide - Security Enhancement Implementation

**Date:** 2026-02-01
**Status:** All Implementation Complete - Ready for Testing
**Scope:** Phases 1-4 (Password Security, MFA, Sessions, Cookies, OAuth, Security Alerts, Middleware, IP Binding)

---

## 🎯 Testing Overview

This guide covers end-to-end testing for all implemented security enhancements across backend and frontend.

### Testing Categories

1. **Unit Tests** - Individual component/function testing
2. **Integration Tests** - API endpoint and database interaction testing
3. **E2E Tests** - Full user flow testing
4. **Security Tests** - Penetration testing and vulnerability assessment
5. **Performance Tests** - Load testing and optimization
6. **User Acceptance Tests** - Real-world scenario validation

---

## 📋 Phase 1: Password Security Testing

### Backend Tests

#### 1.1 Password Policy Validation
```kotlin
// Test file: PasswordPolicyServiceTest.kt

✅ Test: Password meets minimum length (8 characters)
✅ Test: Password contains uppercase letter
✅ Test: Password contains lowercase letter
✅ Test: Password contains number
✅ Test: Password contains special character
✅ Test: Password not in common password dictionary
✅ Test: Password not same as last 5 passwords (history check)
✅ Test: All validation rules enforced together
```

**Manual Test:**
1. Try to set password "password123" → Should fail (common password)
2. Try to set password "Test123!" → Should succeed
3. Try to reuse same password → Should fail (in history)

#### 1.2 Login Audit Trail
```kotlin
// Test file: LoginAttemptServiceTest.kt

✅ Test: Successful login creates audit record
✅ Test: Failed login creates audit record
✅ Test: Device fingerprint is captured
✅ Test: IP address is captured
✅ Test: Geolocation is captured (if available)
✅ Test: User can view their login history
```

**Manual Test:**
1. Login successfully from Chrome → Check audit log shows device info
2. Login from different browser → Check audit log shows new device
3. View login history page → Should show both logins with details

#### 1.3 Account Lockout Notifications
```kotlin
// Test file: SecurityEmailServiceTest.kt

✅ Test: Email sent after account lockout
✅ Test: Email contains lockout timestamp
✅ Test: Email contains IP address
✅ Test: Email contains device info
✅ Test: Email is bilingual (EN + AR)
✅ Test: Email contains unlock instructions
```

**Manual Test:**
1. Fail login 5 times → Account should lock
2. Check email → Should receive lockout notification
3. Verify email has English and Arabic content

---

## 📋 Phase 2: MFA, Sessions & Cookies Testing

### Phase 2.1: MFA Testing

#### Backend Tests
```kotlin
// Test file: MfaServiceTest.kt

✅ Test: TOTP secret generation (Base32 encoded)
✅ Test: TOTP code verification (6 digits, 30-second window)
✅ Test: Time drift tolerance (±1 window)
✅ Test: Backup codes generation (10 codes)
✅ Test: Backup code usage (single-use enforcement)
✅ Test: Backup code hashing (BCrypt)
✅ Test: MFA setup flow (QR code + verification)
✅ Test: MFA disable flow (requires password)
✅ Test: Login flow with MFA enabled
✅ Test: Cannot bypass MFA
```

**Manual Test - MFA Setup:**
1. Navigate to Security → MFA Setup
2. Scan QR code with Google Authenticator
3. Enter TOTP code from authenticator
4. Save backup codes
5. Verify MFA is enabled

**Manual Test - MFA Login:**
1. Logout
2. Login with email/password
3. Should prompt for MFA code
4. Enter TOTP code from authenticator
5. Should login successfully

**Manual Test - Backup Codes:**
1. Logout
2. Login with email/password
3. Click "Use backup code"
4. Enter one backup code
5. Should login successfully
6. Try to use same backup code again → Should fail

### Phase 2.2: HTTPOnly Cookie Testing

#### Backend Tests
```kotlin
// Test file: CookieAuthenticationFilterTest.kt

✅ Test: Access token set as HTTPOnly cookie
✅ Test: Refresh token set as HTTPOnly cookie
✅ Test: Cookie has Secure flag in production
✅ Test: Cookie has SameSite=Strict
✅ Test: Cookie path is /
✅ Test: Cookie expiry matches token expiry
✅ Test: CSRF token validation on POST/PUT/DELETE
✅ Test: CSRF token not required on GET
✅ Test: Invalid CSRF token rejected (403)
```

**Security Test - XSS Protection:**
1. Open browser DevTools → Console
2. Try to access cookies: `document.cookie`
3. Should NOT see access_token or refresh_token (HTTPOnly)
4. Try XSS attack: `<script>alert(document.cookie)</script>`
5. Should NOT expose tokens

**Security Test - CSRF Protection:**
1. Login with cookie mode
2. Use Postman/curl to make POST request without CSRF token
3. Should receive 403 Forbidden
4. Include X-CSRF-Token header → Should succeed

### Phase 2.3: Session Management Testing

#### Backend Tests
```kotlin
// Test file: SessionServiceTest.kt

✅ Test: Session created on login
✅ Test: Session includes device info
✅ Test: Session includes IP address
✅ Test: Session includes location (if available)
✅ Test: Max 5 concurrent sessions enforced
✅ Test: Oldest session revoked when limit exceeded
✅ Test: User can list active sessions
✅ Test: User can revoke specific session
✅ Test: User can revoke all sessions except current
✅ Test: Revoked session cannot refresh tokens
```

**Manual Test - Session Management:**
1. Login from Chrome → Session 1 created
2. Login from Firefox → Session 2 created
3. Login from Safari → Session 3 created
4. Navigate to Security → Sessions
5. Should see all 3 sessions listed
6. Click "Revoke" on Firefox session
7. Switch to Firefox → Should be logged out
8. Chrome should still be logged in

**Manual Test - Session Limit:**
1. Login from 5 different devices/browsers
2. Login from 6th device
3. Check session list
4. Oldest session should be automatically revoked

---

## 📋 Phase 3: OAuth/SSO Testing

### Backend Tests
```kotlin
// Test file: OAuthServiceTest.kt

✅ Test: Authorization URL generation
✅ Test: Authorization URL includes state parameter
✅ Test: Code exchange for tokens
✅ Test: User info retrieval from provider
✅ Test: Google user info parsing
✅ Test: Microsoft user info parsing
✅ Test: GitHub user info parsing
✅ Test: Okta user info parsing
✅ Test: Account linking (existing user)
✅ Test: Auto-provisioning (new user)
✅ Test: Auto-provisioning disabled → error
```

**Manual Test - Google OAuth:**
1. Navigate to login page
2. Click "Sign in with Google"
3. Redirected to Google consent screen
4. Grant permissions
5. Redirected back to app
6. Should be logged in
7. Check user profile → Should show Google email

**Manual Test - Account Linking:**
1. Create account with email: test@example.com
2. Login with email/password
3. Navigate to Settings → Connected Accounts
4. Click "Link Google Account"
5. Login with Google (same email)
6. Should link successfully
7. Logout and try "Sign in with Google"
8. Should login to same account

**Manual Test - Auto-Provisioning:**
1. Enable auto-provisioning for organization
2. Click "Sign in with Google" (new user)
3. Should create new account automatically
4. Check database → User should exist
5. Disable auto-provisioning
6. Try new user → Should show error

**Security Test - State Parameter:**
1. Intercept OAuth redirect
2. Modify state parameter
3. Complete OAuth flow
4. Should reject with "Invalid state" error

---

## 📋 Phase 4: Advanced Security Testing

### Phase 4.1: Security Anomaly Detection Testing

#### Backend Tests
```kotlin
// Test file: SecurityAnomalyServiceTest.kt

✅ Test: Impossible travel detection (>500km in <1h)
✅ Test: New device detection
✅ Test: Brute force detection (>10 failures in 5min)
✅ Test: Unusual time detection (>2σ from mean)
✅ Test: New location detection (new country)
✅ Test: Alert creation with correct severity
✅ Test: Alert details include relevant info
✅ Test: Multiple anomalies create multiple alerts
```

**Manual Test - Impossible Travel:**
1. Login from New York (use VPN)
2. Immediately login from London (different VPN)
3. Check Security → Alerts
4. Should see "Impossible Travel" alert with CRITICAL severity
5. Details should show: "Distance: 5500km in 0.1h from New York to London"

**Manual Test - New Device:**
1. Login from Chrome (device 1)
2. Login from Firefox (device 2)
3. Check Security → Alerts
4. Should see "New Device" alert with MEDIUM severity
5. Details should show: "New device from {City}, {Country}"

**Manual Test - Brute Force:**
1. Fail login 10 times from same IP
2. Login successfully
3. Check Security → Alerts
4. Should see "Brute Force" alert with HIGH severity
5. Details should show: "10 failed attempts in 5 minutes before success"

**Manual Test - Unusual Time:**
1. Establish login pattern (e.g., 9 AM - 5 PM for 30 days)
2. Login at 3 AM
3. Check Security → Alerts
4. Should see "Unusual Time" alert with LOW severity
5. Details should show: "Login at 03:00 UTC. Typical login hours: 14:00 ± 3 hours"

**Manual Test - New Location:**
1. Login from USA for several days
2. Login from Japan
3. Check Security → Alerts
4. Should see "New Location" alert with MEDIUM severity
5. Details should show: "Login from new location: Tokyo, JP"

### Phase 4.2: Middleware Route Protection Testing

**Manual Test - Protected Routes:**
1. Logout
2. Try to access /admin → Should redirect to /login
3. Try to access /platform → Should redirect to /platform-login
4. Try to access /security → Should redirect to /login
5. Login as regular user
6. Try to access /platform → Should redirect to /unauthorized

**Manual Test - Token Expiry:**
1. Login successfully
2. Wait for access token to expire (15 minutes)
3. Navigate to protected route
4. Should auto-refresh token and continue
5. Check network tab → Should see /api/auth/refresh call

**Manual Test - Platform Access:**
1. Login as platform admin
2. Access /platform → Should succeed
3. Login as regular user
4. Access /platform → Should redirect to /unauthorized

### Phase 4.3: Absolute Session Timeout Testing

#### Backend Tests
```kotlin
// Test file: RefreshTokenTest.kt

✅ Test: absoluteExpiresAt set on token creation
✅ Test: absoluteExpiresAt = createdAt + 24 hours
✅ Test: Token refresh succeeds before absolute timeout
✅ Test: Token refresh fails after absolute timeout
✅ Test: Error message indicates re-authentication required
```

**Manual Test:**
1. Login at 9:00 AM
2. Keep session active with refreshes
3. At 9:00 AM next day (24 hours later)
4. Try to refresh token
5. Should receive error: "Session has exceeded maximum duration (24 hours). Please log in again."
6. Should be redirected to login

**Performance Test:**
1. Set absolute timeout to 5 minutes (for testing)
2. Login
3. Keep refreshing for 4 minutes → Should succeed
4. At 5 minutes → Should fail
5. Verify database: absoluteExpiresAt is enforced

### Phase 4.4: IP-Based Session Binding Testing

#### Backend Tests
```kotlin
// Test file: SessionServiceTest.kt

✅ Test: User with IP binding disabled → allows any IP
✅ Test: User with IP binding enabled → validates IP
✅ Test: IP mismatch → token refresh fails
✅ Test: Multiple active sessions → checks all session IPs
✅ Test: No active sessions → allows (creates new session)
```

**Manual Test - IP Binding Enabled:**
1. Enable IP binding in user settings
2. Login from IP: 192.168.1.100
3. Change IP to 192.168.1.101 (use VPN or proxy)
4. Try to refresh token
5. Should fail with error: "IP address validation failed"
6. Should be redirected to login

**Manual Test - IP Binding Disabled:**
1. Disable IP binding (default)
2. Login from IP: 192.168.1.100
3. Change IP to 192.168.1.101
4. Try to refresh token
5. Should succeed (IP validation skipped)

---

## 📋 Frontend Testing

### Component Tests

#### Security Alerts Page
```typescript
// Test file: alerts.test.tsx

✅ Test: Displays list of alerts
✅ Test: Shows severity badges with correct colors
✅ Test: Filters alerts by severity
✅ Test: Acknowledges alert on button click
✅ Test: Shows empty state when no alerts
✅ Test: Shows loading skeleton during fetch
✅ Test: Displays alert icons based on type
✅ Test: Formats timestamps as relative time
```

**Manual Test:**
1. Navigate to /security/alerts
2. Should see list of alerts
3. Click "CRITICAL" filter → Should show only critical alerts
4. Click "Was this you?" on an alert
5. Alert should be marked as acknowledged
6. Refresh page → Alert should still be acknowledged

#### OAuth Login Buttons
```typescript
// Test file: oauth-login-buttons.test.tsx

✅ Test: Fetches and displays available providers
✅ Test: Shows loading state during fetch
✅ Test: Displays provider-specific icons
✅ Test: Initiates OAuth flow on button click
✅ Test: Handles provider fetch error gracefully
```

**Manual Test:**
1. Navigate to /login
2. Should see "Sign in with Google", "Sign in with Microsoft" buttons
3. Click "Sign in with Google"
4. Should redirect to Google OAuth consent page

#### Session Management Page
```typescript
// Test file: sessions.test.tsx

✅ Test: Lists active sessions
✅ Test: Shows device icons (mobile, tablet, desktop)
✅ Test: Shows "This Device" badge on current session
✅ Test: Revokes session on button click
✅ Test: Revokes all sessions except current
✅ Test: Refreshes list after revocation
```

**Manual Test:**
1. Navigate to /security/sessions
2. Should see list of active sessions
3. Current session should have "This Device" badge
4. Click "Revoke" on another session
5. Session should be removed from list

---

## 📋 E2E Testing Scenarios

### Scenario 1: New User Registration with MFA
1. Navigate to /register
2. Fill registration form
3. Submit form
4. Should redirect to /security/mfa (MFA setup)
5. Scan QR code with Google Authenticator
6. Enter TOTP code
7. Save backup codes
8. Should redirect to dashboard
9. Logout and login again
10. Should prompt for MFA code

### Scenario 2: OAuth User Journey
1. Navigate to /login
2. Click "Sign in with Google"
3. Grant permissions on Google
4. Should redirect back and login
5. Navigate to /settings/connected-accounts
6. Should show Google account linked
7. Click "Unlink" → Should unlink
8. Try to login with Google again
9. Should create new session (not linked to original account)

### Scenario 3: Security Alert Response
1. Login from VPN (New York)
2. Switch VPN (London)
3. Login again
4. Navigate to /security/alerts
5. Should see "Impossible Travel" alert
6. Click "Was this you?"
7. Alert should be acknowledged
8. Should no longer show in unread count

### Scenario 4: Session Management
1. Login from Chrome
2. Login from Firefox
3. Login from Safari
4. Navigate to /security/sessions (in Chrome)
5. Should see 3 active sessions
6. Click "Revoke All Other Devices"
7. Firefox and Safari should be logged out
8. Chrome should still be logged in

---

## 📋 Security Testing

### Penetration Testing Checklist

#### XSS (Cross-Site Scripting)
- [ ] Try to inject `<script>alert(1)</script>` in all input fields
- [ ] Try to access tokens via JavaScript: `document.cookie`
- [ ] Try to modify localStorage/sessionStorage from DevTools
- [ ] Verify HTTPOnly cookies cannot be accessed

#### CSRF (Cross-Site Request Forgery)
- [ ] Make POST request without CSRF token → Should fail (403)
- [ ] Make POST request with invalid CSRF token → Should fail (403)
- [ ] Make POST request with valid CSRF token → Should succeed
- [ ] Verify state parameter in OAuth flow

#### SQL Injection
- [ ] Try `' OR '1'='1` in login email field
- [ ] Try `'; DROP TABLE users; --` in all input fields
- [ ] Verify parameterized queries prevent injection

#### Session Hijacking
- [ ] Copy access token from sessionStorage
- [ ] Try to use in another browser → Should work (for access token)
- [ ] Copy refresh token from localStorage
- [ ] Try to use in another browser
- [ ] If IP binding enabled → Should fail
- [ ] If IP binding disabled → Should work but create alert

#### Brute Force Protection
- [ ] Attempt 10 failed logins → Account should lock
- [ ] Attempt 10 failed logins from same IP → Should trigger rate limiting
- [ ] Verify lockout notification email sent

---

## 📋 Performance Testing

### Load Testing

#### Backend Endpoint Performance
```bash
# Login endpoint
ab -n 1000 -c 10 -p login.json -T application/json http://localhost:8080/api/auth/login

# Expected: <500ms p95 latency
# Acceptance: >98% success rate

# Token refresh endpoint
ab -n 1000 -c 10 -H "Authorization: Bearer {token}" http://localhost:8080/api/auth/refresh

# Expected: <200ms p95 latency
# Acceptance: >99% success rate

# Security alerts endpoint
ab -n 1000 -c 10 -H "Authorization: Bearer {token}" http://localhost:8080/api/security/alerts

# Expected: <100ms p95 latency
# Acceptance: >99% success rate
```

#### Concurrent Session Testing
```python
# Test: 1000 concurrent logins
# Expected: All sessions created successfully
# Acceptance: No database deadlocks, <1% error rate
```

#### Anomaly Detection Performance
```python
# Test: 1000 logins with anomaly detection enabled
# Expected: Anomaly detection adds <50ms to login time
# Acceptance: No performance degradation
```

### Database Query Performance
```sql
-- Test: Query login attempts (indexed)
EXPLAIN ANALYZE SELECT * FROM login_attempts WHERE user_id = ? ORDER BY timestamp DESC LIMIT 10;
-- Expected: Index scan, <10ms

-- Test: Query security alerts (indexed)
EXPLAIN ANALYZE SELECT * FROM security_alerts WHERE user_id = ? AND resolved = false;
-- Expected: Index scan, <5ms

-- Test: Query active sessions (indexed)
EXPLAIN ANALYZE SELECT * FROM user_sessions WHERE user_id = ? AND is_active = true;
-- Expected: Index scan, <5ms
```

---

## 📋 User Acceptance Testing

### UAT Test Cases

#### UAT-1: Password Security
**Scenario:** User sets strong password
**Steps:**
1. Navigate to registration
2. Enter weak password "password123"
3. Should show error: "Password does not meet requirements"
4. Enter strong password "MyP@ssw0rd2024!"
5. Should succeed

**Acceptance Criteria:**
- ✅ Weak passwords rejected
- ✅ Strong passwords accepted
- ✅ Visual feedback on password strength
- ✅ Clear error messages

#### UAT-2: MFA Setup
**Scenario:** User enables MFA
**Steps:**
1. Navigate to Security → MFA
2. Click "Enable MFA"
3. Scan QR code
4. Enter TOTP code
5. Save backup codes

**Acceptance Criteria:**
- ✅ QR code displayed correctly
- ✅ TOTP code verification works
- ✅ Backup codes downloadable
- ✅ MFA enforced on next login

#### UAT-3: OAuth Login
**Scenario:** User logs in with Google
**Steps:**
1. Navigate to login page
2. Click "Sign in with Google"
3. Grant permissions
4. Redirected back to app

**Acceptance Criteria:**
- ✅ OAuth flow completes successfully
- ✅ User logged in
- ✅ User profile shows Google email
- ✅ No password required

#### UAT-4: Security Alerts
**Scenario:** User receives and acknowledges security alert
**Steps:**
1. Trigger impossible travel (VPN)
2. Check /security/alerts
3. See "Impossible Travel" alert
4. Click "Was this you?"
5. Alert acknowledged

**Acceptance Criteria:**
- ✅ Alert appears immediately
- ✅ Alert details are clear
- ✅ Severity badge is visible
- ✅ Acknowledgement works

---

## 📋 Testing Tools & Setup

### Backend Testing
```kotlin
// Dependencies in build.gradle.kts
testImplementation("org.springframework.boot:spring-boot-starter-test")
testImplementation("io.mockk:mockk:1.13.8")
testImplementation("org.testcontainers:postgresql:1.19.3")
testImplementation("com.ninja-squad:springmockk:4.0.2")
```

### Frontend Testing
```json
// package.json
{
  "devDependencies": {
    "@testing-library/react": "^14.0.0",
    "@testing-library/jest-dom": "^6.1.4",
    "@testing-library/user-event": "^14.5.1",
    "vitest": "^1.0.4",
    "playwright": "^1.40.0"
  }
}
```

### Load Testing Tools
- Apache Bench (ab)
- k6
- JMeter
- Gatling

### Security Testing Tools
- OWASP ZAP
- Burp Suite
- SQLMap
- XSS Hunter

---

## 📊 Test Coverage Requirements

### Backend Coverage
- **Minimum:** 80% line coverage
- **Target:** 90% line coverage
- **Critical paths:** 100% coverage (auth, security)

### Frontend Coverage
- **Minimum:** 70% component coverage
- **Target:** 85% component coverage
- **Critical components:** 90%+ coverage

---

## ✅ Testing Checklist

### Before Production Deployment

- [ ] All unit tests passing (backend)
- [ ] All component tests passing (frontend)
- [ ] All integration tests passing
- [ ] E2E test scenarios completed
- [ ] Security penetration testing completed
- [ ] Load testing completed (meets SLA)
- [ ] UAT signed off by stakeholders
- [ ] Database migrations tested (up and rollback)
- [ ] Monitoring and alerting configured
- [ ] Incident response plan documented
- [ ] Rollback plan prepared

---

## 📝 Test Results Documentation

After completing each test phase, document:

1. **Test Execution Summary**
   - Total tests executed
   - Pass/fail rate
   - Critical failures (if any)

2. **Performance Metrics**
   - Response times (p50, p95, p99)
   - Throughput (requests/second)
   - Error rates

3. **Security Assessment**
   - Vulnerabilities found
   - Risk level (Critical/High/Medium/Low)
   - Mitigation status

4. **User Feedback**
   - UAT participant feedback
   - Usability issues
   - Feature requests

---

**Status:** Ready for Testing Execution
**Estimated Testing Duration:** 2-3 weeks (with automated tests)
**Risk Level:** Low-Medium (comprehensive test coverage mitigates risk)

