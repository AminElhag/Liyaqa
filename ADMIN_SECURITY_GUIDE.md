# Admin Security Guide
**Liyaqa Platform - Security Administration Documentation**

> **Last Updated:** February 1, 2026
> **Version:** 1.0
> **Audience:** Platform Administrators, Security Officers, IT Staff

---

## Table of Contents

1. [Introduction](#introduction)
2. [Configuring OAuth Providers](#configuring-oauth-providers)
3. [Reviewing Security Alerts](#reviewing-security-alerts)
4. [Security Policy Recommendations](#security-policy-recommendations)
5. [Incident Response Procedures](#incident-response-procedures)
6. [Password Policy Configuration](#password-policy-configuration)
7. [Managing User Sessions](#managing-user-sessions)
8. [Audit Trail Review](#audit-trail-review)
9. [Compliance Considerations](#compliance-considerations)
10. [Best Practices for Security Configuration](#best-practices-for-security-configuration)

---

## Introduction

### Purpose

This guide provides comprehensive instructions for Liyaqa platform administrators to configure, manage, and monitor security features. As an administrator, you have enhanced responsibilities for protecting user data, ensuring compliance, and responding to security incidents.

### Administrator Responsibilities

As a platform administrator, you are responsible for:

- Configuring organization-wide security policies
- Monitoring security alerts and anomalies
- Responding to security incidents
- Managing OAuth integrations
- Reviewing audit trails for compliance
- Enforcing password policies
- Managing user access and sessions
- Maintaining security documentation
- Coordinating with support teams during incidents

### Security Clearance Levels

Liyaqa implements role-based access control (RBAC) with the following security-relevant roles:

| Role | Access Level | Security Permissions |
|------|-------------|---------------------|
| **PLATFORM_OWNER** | Full access | All security configurations, view all alerts, manage all users |
| **PLATFORM_ADMIN** | Administrative | View organization alerts, manage users, configure policies |
| **PLATFORM_SUPPORT** | Support | View user sessions, assist with lockouts, limited alert access |
| **CLUB_OWNER** | Club-level | Manage club users, view club alerts |
| **CLUB_ADMIN** | Club-level | Limited user management, view club security reports |

---

## Configuring OAuth Providers

### Overview

OAuth 2.0 / OpenID Connect allows users to authenticate using external identity providers (Google, Microsoft, GitHub, or custom SAML/OIDC providers). This reduces password management burden and can improve security.

### Supported Providers

| Provider | Type | Use Case |
|----------|------|----------|
| **Google** | OAuth 2.0 / OIDC | Personal Gmail accounts, Google Workspace |
| **Microsoft** | OAuth 2.0 / OIDC | Outlook.com, Microsoft 365, Azure AD |
| **GitHub** | OAuth 2.0 | Developer accounts, tech-focused organizations |
| **Custom** | SAML 2.0 / OIDC | Enterprise SSO (Okta, Auth0, Keycloak, etc.) |

### Step-by-Step: Configuring Google OAuth

#### 1. Create OAuth Credentials in Google Cloud Console

1. **Navigate to Google Cloud Console**
   - Go to https://console.cloud.google.com
   - Sign in with your organization's Google account

2. **Create or Select a Project**
   - Click the project dropdown at the top
   - Select existing project or create new: "Liyaqa OAuth"

3. **Enable Google+ API**
   - Navigate to "APIs & Services" > "Library"
   - Search for "Google+ API"
   - Click "Enable"

4. **Configure OAuth Consent Screen**
   - Navigate to "APIs & Services" > "OAuth consent screen"
   - Select "External" (or "Internal" for Google Workspace)
   - Fill in required fields:
     - App name: "Liyaqa Platform"
     - User support email: your support email
     - Developer contact: your admin email
   - Add scopes:
     - `email`
     - `profile`
     - `openid`
   - Save and continue

5. **Create OAuth Client ID**
   - Navigate to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth client ID"
   - Application type: "Web application"
   - Name: "Liyaqa Web Client"
   - Authorized redirect URIs:
     ```
     https://your-domain.com/api/auth/oauth/callback/google
     https://app.liyaqa.com/api/auth/oauth/callback/google
     ```
   - Click "Create"
   - **Save the Client ID and Client Secret** (you'll need these)

#### 2. Configure Provider in Liyaqa Platform

**Via API:**

```bash
curl -X POST https://api.liyaqa.com/api/admin/oauth-providers \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "organizationId": "your-org-uuid",
    "provider": "GOOGLE",
    "clientId": "123456789.apps.googleusercontent.com",
    "clientSecret": "YOUR_CLIENT_SECRET",
    "enabled": true,
    "autoProvision": true
  }'
```

**Configuration Fields:**

- `organizationId` (required): Your organization's UUID
- `provider` (required): One of: `GOOGLE`, `MICROSOFT`, `GITHUB`, `CUSTOM`
- `clientId` (required): OAuth client ID from provider
- `clientSecret` (required): OAuth client secret from provider
- `authorizationUri` (optional): Custom authorization endpoint (for CUSTOM providers)
- `tokenUri` (optional): Custom token endpoint (for CUSTOM providers)
- `userInfoUri` (optional): Custom user info endpoint (for CUSTOM providers)
- `scopes` (optional): Space-separated scopes (default: "openid email profile")
- `enabled` (required): Set to `true` to activate
- `autoProvision` (optional): If `true`, creates new users automatically on first OAuth login

**Security Recommendations:**

- Store `clientSecret` securely - it's encrypted at rest in the database
- Use environment-specific redirect URIs (separate for dev/staging/prod)
- Enable auto-provisioning only if you trust the provider's email verification
- Regularly rotate client secrets (recommended every 90 days)

#### 3. Test the Integration

1. **Test OAuth Flow**
   - Log out of Liyaqa
   - Click "Sign in with Google" on login page
   - Verify redirect to Google
   - Grant permissions
   - Verify redirect back to Liyaqa with successful login

2. **Verify User Provisioning**
   - Check that user record was created (if auto-provisioning enabled)
   - Verify email and name were populated correctly
   - Confirm `oauth_provider` field is set to "GOOGLE"

3. **Test Edge Cases**
   - User with existing email tries OAuth (should link accounts)
   - User revokes OAuth permission and tries again
   - User with no email permission (should fail gracefully)

### Step-by-Step: Configuring Microsoft OAuth

#### 1. Register Application in Azure Portal

1. **Navigate to Azure Portal**
   - Go to https://portal.azure.com
   - Sign in with admin account

2. **Register New Application**
   - Navigate to "Azure Active Directory" > "App registrations"
   - Click "New registration"
   - Name: "Liyaqa Platform"
   - Supported account types: "Accounts in any organizational directory and personal Microsoft accounts"
   - Redirect URI: "Web" - `https://your-domain.com/api/auth/oauth/callback/microsoft`
   - Click "Register"

3. **Configure Authentication**
   - Go to "Authentication" tab
   - Add additional redirect URIs if needed
   - Enable "ID tokens" under Implicit grant
   - Click "Save"

4. **Create Client Secret**
   - Go to "Certificates & secrets" tab
   - Click "New client secret"
   - Description: "Liyaqa OAuth Secret"
   - Expiry: 24 months (recommended)
   - Click "Add"
   - **Copy the secret value immediately** (it won't be shown again)

5. **Configure API Permissions**
   - Go to "API permissions" tab
   - Click "Add a permission"
   - Select "Microsoft Graph"
   - Select "Delegated permissions"
   - Add:
     - `openid`
     - `email`
     - `profile`
   - Click "Add permissions"
   - (Optional) Click "Grant admin consent" for the organization

6. **Note Application (client) ID**
   - Go to "Overview" tab
   - Copy the "Application (client) ID"

#### 2. Configure in Liyaqa

```bash
curl -X POST https://api.liyaqa.com/api/admin/oauth-providers \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "organizationId": "your-org-uuid",
    "provider": "MICROSOFT",
    "clientId": "your-application-id",
    "clientSecret": "your-client-secret",
    "enabled": true,
    "autoProvision": true
  }'
```

### Step-by-Step: Configuring Custom OIDC Provider (Okta Example)

For enterprise SSO with providers like Okta, Auth0, Keycloak:

#### 1. Create Application in Okta

1. Sign in to Okta Admin Console
2. Navigate to "Applications" > "Create App Integration"
3. Sign-in method: "OIDC - OpenID Connect"
4. Application type: "Web Application"
5. Configure:
   - App integration name: "Liyaqa"
   - Grant type: Authorization Code
   - Sign-in redirect URIs: `https://your-domain.com/api/auth/oauth/callback/custom`
   - Sign-out redirect URIs: `https://your-domain.com`
6. Save and note Client ID and Client Secret

#### 2. Get OIDC Endpoints

From Okta:
- Authorization URI: `https://your-org.okta.com/oauth2/v1/authorize`
- Token URI: `https://your-org.okta.com/oauth2/v1/token`
- User Info URI: `https://your-org.okta.com/oauth2/v1/userinfo`

#### 3. Configure in Liyaqa

```bash
curl -X POST https://api.liyaqa.com/api/admin/oauth-providers \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "organizationId": "your-org-uuid",
    "provider": "CUSTOM",
    "clientId": "okta-client-id",
    "clientSecret": "okta-client-secret",
    "authorizationUri": "https://your-org.okta.com/oauth2/v1/authorize",
    "tokenUri": "https://your-org.okta.com/oauth2/v1/token",
    "userInfoUri": "https://your-org.okta.com/oauth2/v1/userinfo",
    "scopes": "openid email profile",
    "enabled": true,
    "autoProvision": true
  }'
```

### Managing OAuth Providers

**List Enabled Providers:**

```bash
GET /api/auth/oauth/providers?organizationId={uuid}
```

**Update Provider:**

```bash
PUT /api/admin/oauth-providers/{providerId}
```

**Disable Provider:**

```bash
PATCH /api/admin/oauth-providers/{providerId}
{
  "enabled": false
}
```

**Security Note:** Disabling a provider does NOT revoke existing user sessions. Users who authenticated via OAuth can still use their active sessions until they expire.

---

## Reviewing Security Alerts

### Security Alert Dashboard

As an administrator, you have access to organization-wide security alerts at:
- **Endpoint:** `GET /api/admin/security/alerts`
- **UI:** Platform Admin > Security > Alerts

### Alert Types and Severity

| Alert Type | Severity | Trigger Condition | Recommended Action |
|-----------|----------|-------------------|-------------------|
| **IMPOSSIBLE_TRAVEL** | CRITICAL | Login from 2 locations 500+ km apart within 1 hour | Immediate investigation, likely account compromise |
| **BRUTE_FORCE** | HIGH | 10+ failed login attempts from same IP in 5 minutes | Monitor for ongoing attacks, consider IP blocking |
| **NEW_DEVICE** | MEDIUM | First login from new device fingerprint (90-day window) | Verify with user if unexpected |
| **NEW_LOCATION** | MEDIUM | First login from new city/country (90-day window) | Verify with user, especially for restricted countries |
| **UNUSUAL_TIME** | LOW | Login time 2+ std deviations from user's average | Low priority, review in batch |

### Reviewing Alerts

**Get All Unresolved Alerts:**

```bash
GET /api/admin/security/alerts?resolved=false&page=0&size=50
```

Response:
```json
{
  "content": [
    {
      "id": "alert-uuid",
      "userId": "user-uuid",
      "userEmail": "user@example.com",
      "alertType": "IMPOSSIBLE_TRAVEL",
      "severity": "CRITICAL",
      "details": "Login from London, UK detected 45 minutes after login from New York, USA. Distance: 5570 km. IP: 203.0.113.42",
      "loginAttemptId": "attempt-uuid",
      "resolved": false,
      "acknowledgedAt": null,
      "createdAt": "2026-02-01T10:30:00Z"
    }
  ],
  "totalElements": 15,
  "totalPages": 1
}
```

**Filter by Severity:**

```bash
GET /api/admin/security/alerts?severity=CRITICAL,HIGH
```

**Filter by Time Range:**

```bash
GET /api/admin/security/alerts?from=2026-02-01T00:00:00Z&to=2026-02-01T23:59:59Z
```

### Alert Investigation Workflow

#### For CRITICAL Alerts (Impossible Travel)

1. **Review Alert Details**
   - Check both locations, IP addresses, and device info
   - Verify time difference between logins

2. **Check User's Login History**
   ```bash
   GET /api/admin/users/{userId}/login-history
   ```
   - Look for pattern of suspicious activity
   - Identify if this is isolated or part of larger compromise

3. **Check Active Sessions**
   ```bash
   GET /api/admin/users/{userId}/sessions
   ```
   - Identify all active sessions
   - Look for sessions from suspicious IPs

4. **Contact User**
   - Email user at verified email address
   - Ask to confirm recent logins
   - Do NOT use contact info from the suspicious session

5. **Take Action Based on Response**
   - **If user confirms compromise:**
     - Force password reset
     - Revoke all sessions
     - Enable MFA requirement
     - Document incident
   - **If user confirms legitimate (e.g., VPN usage):**
     - Mark alert as resolved
     - Add note explaining resolution
     - Consider allowing user to whitelist VPN IPs

#### For HIGH Alerts (Brute Force)

1. **Identify Targeted Accounts**
   ```bash
   GET /api/admin/security/alerts?alertType=BRUTE_FORCE&resolved=false
   ```

2. **Check IP Address Reputation**
   - Use IP reputation services (AbuseIPDB, VirusTotal)
   - Check if IP is known botnet/proxy/VPN

3. **Review Attack Pattern**
   - Is it targeting multiple accounts or one specific account?
   - Is it distributed (multiple IPs) or single source?

4. **Mitigation Actions**
   - Account already locked automatically after 5 failed attempts
   - Consider blocking IP at firewall level for persistent attacks
   - Enable CAPTCHA for login form if available
   - Notify affected users via email

5. **Monitor for Escalation**
   - Watch for distributed brute force (credential stuffing)
   - Set up alerts for increased failed login rates

#### For MEDIUM Alerts (New Device/Location)

1. **Batch Review**
   - Review these alerts in weekly batches unless user reports issue
   - Look for patterns across multiple users

2. **Automated Resolution**
   - Most will be legitimate (new phone, travel, etc.)
   - Users can self-acknowledge via login history page

3. **Manual Investigation If:**
   - User has other concurrent security alerts
   - New location is high-risk country
   - Device info looks suspicious (outdated browser, unusual OS)

### Alert Response Metrics

Track the following metrics for security reporting:

- **Mean Time to Detect (MTTD):** Time from login to alert creation (automated, should be < 1 minute)
- **Mean Time to Acknowledge (MTTA):** Time from alert creation to admin review
- **Mean Time to Resolve (MTTR):** Time from alert creation to resolution
- **False Positive Rate:** Percentage of alerts marked as legitimate

**Target Metrics:**
- MTTA for CRITICAL: < 1 hour
- MTTA for HIGH: < 4 hours
- MTTA for MEDIUM: < 24 hours
- MTTR for CRITICAL: < 2 hours
- False Positive Rate: < 20%

---

## Security Policy Recommendations

### Password Policy

**Recommended Configuration:**

```yaml
Password Policy:
  Regular Users:
    - Minimum Length: 8 characters
    - Complexity: Require uppercase, lowercase, number, special character
    - Common Password Check: Enabled (blocks top 100 common passwords)
    - History: Last 5 passwords (prevent reuse)
    - Expiration: Not required (NIST recommends against forced expiration)
    - Lockout: 5 failed attempts, 15-minute lockout

  Platform Users (Admins/Staff):
    - Minimum Length: 12 characters
    - Complexity: Same as above
    - Common Password Check: Enabled (blocks top 1000 common passwords)
    - History: Last 10 passwords
    - Expiration: Recommended every 90 days
    - Lockout: 3 failed attempts, 30-minute lockout
    - MFA: Mandatory
```

**Rationale:**
- Longer passwords for privileged accounts (12 vs 8 chars)
- No forced expiration for regular users (reduces password reuse, sticky notes)
- Mandatory MFA for platform users (compensates for password-only risk)
- History prevents simple cycling of passwords

### MFA Policy

**Enforcement Levels:**

| User Role | MFA Requirement | Enforcement |
|-----------|----------------|-------------|
| Platform Owner | Mandatory | Cannot disable |
| Platform Admin | Mandatory | Cannot disable |
| Platform Support | Mandatory | Cannot disable |
| Club Owner | Strongly Recommended | Optional but prompted |
| Club Admin | Recommended | Optional |
| Trainer | Recommended | Optional |
| Member | Optional | User choice |

**Backup Code Policy:**
- Generate 8 backup codes during MFA setup
- Each code single-use only
- User must save codes in secure location
- Regenerate codes every 90 days or when 50% used
- Support team can disable MFA with identity verification

### Session Security Policy

**Recommended Settings:**

```yaml
Session Configuration:
  Access Token Lifetime: 15 minutes
  Refresh Token Lifetime: 7 days
  Absolute Session Timeout: 24 hours (maximum session duration)
  Concurrent Session Limit: 5 devices per user
  IP Binding:
    - Platform Users: Enabled by default (can disable)
    - Regular Users: Disabled by default (can enable)
    - Mobile Users: Disabled (incompatible with dynamic IPs)
  Session Inactivity Timeout: 2 hours (frontend only, soft logout)
```

**Rationale:**
- Short access token lifetime limits damage from token theft
- Refresh tokens allow seamless UX without frequent re-authentication
- Absolute timeout prevents indefinite sessions even with activity
- IP binding for admins prevents session hijacking
- Concurrent session limit prevents credential sharing

### OAuth Security Policy

**Provider Selection:**
- Only enable trusted OAuth providers (Google, Microsoft, GitHub, enterprise SSO)
- Verify provider's security practices and SLAs
- Require email verification from OAuth provider

**Auto-Provisioning:**
- Enable only for trusted providers with verified emails
- Disable for public OAuth providers if security is critical
- Review new OAuth users within 24 hours

**Access Review:**
- Quarterly review of linked OAuth accounts
- Revoke OAuth access for inactive users
- Monitor for OAuth provider security incidents

### IP Whitelisting (Future Enhancement)

For high-security deployments:
- Allow platform admins to whitelist trusted IP ranges
- Block all other IPs from accessing admin panel
- Useful for office-only access requirements

---

## Incident Response Procedures

### Incident Severity Classification

| Severity | Description | Response Time | Example |
|----------|-------------|---------------|---------|
| **P0 - Critical** | Active breach, data exfiltration, multiple compromised accounts | Immediate (< 15 min) | Attacker with admin access, database breach |
| **P1 - High** | Single confirmed account compromise, ongoing attack | < 1 hour | Impossible travel alert confirmed as breach |
| **P2 - Medium** | Suspicious activity, potential compromise | < 4 hours | Brute force attack, unusual access patterns |
| **P3 - Low** | Minor security concern, policy violation | < 24 hours | User sharing credentials, weak password |

### Incident Response Team

**Roles:**
- **Incident Commander:** Overall coordination, decision-making
- **Security Analyst:** Investigation, forensics, alert triage
- **System Administrator:** Technical remediation, system changes
- **Communications Lead:** User notifications, stakeholder updates
- **Legal/Compliance:** Regulatory requirements, data breach notifications

### P0 - Critical Incident Response

**Immediate Actions (< 15 minutes):**

1. **Assess Scope**
   - How many accounts affected?
   - What data was accessed?
   - Is attacker still active?

2. **Contain Breach**
   ```bash
   # Revoke all sessions for compromised user
   POST /api/admin/users/{userId}/revoke-all-sessions

   # Force password reset
   POST /api/admin/users/{userId}/force-password-reset

   # Disable account temporarily
   PATCH /api/admin/users/{userId}
   { "status": "SUSPENDED" }
   ```

3. **Preserve Evidence**
   - Export login history: `GET /api/admin/users/{userId}/login-history?export=true`
   - Export security alerts: `GET /api/admin/security/alerts?userId={userId}&export=true`
   - Export audit logs: `GET /api/admin/audit-logs?userId={userId}&export=true`
   - Take database snapshots if possible

4. **Escalate**
   - Notify Incident Commander
   - Assemble response team
   - Create incident ticket/document

**Investigation Phase (< 1 hour):**

1. **Forensic Analysis**
   - Review all login attempts from attacker IPs
   - Identify attack vector (phished password, token theft, etc.)
   - Check for lateral movement (other compromised accounts)
   - Review database query logs for data access

2. **Impact Assessment**
   - What data was accessed? (PII, payment info, etc.)
   - Was data modified or deleted?
   - Were privileges escalated?
   - How long was attacker active?

3. **Root Cause Analysis**
   - How did breach occur?
   - What controls failed?
   - Was it preventable?

**Remediation Phase (< 4 hours):**

1. **Eliminate Threat**
   - Ensure attacker access is completely revoked
   - Block attacker IPs at firewall level
   - Rotate any exposed secrets (API keys, tokens)

2. **Restore Services**
   - Re-enable affected user accounts
   - Restore any deleted/modified data from backups
   - Verify system integrity

3. **Strengthen Defenses**
   - Patch identified vulnerability
   - Implement additional monitoring
   - Update security rules

**Communication Phase (< 24 hours):**

1. **Notify Affected Users**
   - Send breach notification email
   - Explain what happened, what data was affected
   - Provide remediation steps (change password, monitor accounts)
   - Offer support contact

2. **Regulatory Notification** (if required)
   - GDPR: 72 hours to notify supervisory authority if high risk
   - CCPA: "Without unreasonable delay"
   - Local regulations vary

3. **Post-Mortem**
   - Document timeline of events
   - Identify lessons learned
   - Update incident response procedures
   - Implement preventive measures

### P1 - High Incident Response

**Example: Confirmed Account Compromise via Impossible Travel**

1. **Contact User** (< 30 min)
   - Email user at verified address
   - Ask to confirm recent login from [suspicious location]
   - Provide incident reference number

2. **If User Confirms Compromise:**
   ```bash
   # Immediate remediation
   POST /api/admin/users/{userId}/revoke-all-sessions
   POST /api/admin/users/{userId}/force-password-reset
   POST /api/admin/users/{userId}/require-mfa
   ```

3. **Investigation:**
   - Export user's complete login history
   - Check for data access during compromised session
   - Look for other affected accounts from same IP

4. **User Support:**
   - Guide user through password reset
   - Assist with MFA setup
   - Review account for unauthorized changes
   - Explain how breach may have occurred (phishing, etc.)

5. **Documentation:**
   - Create incident report
   - Document user communication
   - Update security metrics

### Incident Communication Templates

**Breach Notification Email Template:**

```
Subject: Important Security Notice - Action Required

Dear [User Name],

We have detected suspicious activity on your Liyaqa account and have taken
immediate action to protect your data.

WHAT HAPPENED:
On [date] at [time], we detected a login to your account from [location]
using IP address [IP]. Our security systems flagged this as suspicious
because [reason].

WHAT WE DID:
- Immediately logged out all devices
- Temporarily suspended your account
- Required a password reset

WHAT YOU NEED TO DO:
1. Reset your password using this link: [secure link]
2. Review your account for any unauthorized changes
3. Enable two-factor authentication (strongly recommended)
4. Contact us if you notice any suspicious activity

WHAT DATA WAS AFFECTED:
[Specific details about data accessed, if known]

If you have any questions or concerns, please contact our security team:
Email: security@liyaqa.com
Phone: [emergency hotline]
Reference: [incident ID]

We apologize for any inconvenience and are committed to protecting your account.

The Liyaqa Security Team
```

---

## Password Policy Configuration

### Database Configuration

Password policies are configured in the `PasswordPolicyService.kt` class. To modify:

**File:** `/backend/src/main/kotlin/com/liyaqa/auth/application/services/PasswordPolicyService.kt`

```kotlin
data class PasswordPolicyConfig(
    val minLength: Int,
    val requireUppercase: Boolean,
    val requireLowercase: Boolean,
    val requireNumber: Boolean,
    val requireSpecialChar: Boolean,
    val preventCommonPasswords: Boolean,
    val historyCount: Int,
    val maxAgeDays: Int? = null // Optional expiration
)

fun getPolicyForUser(isPlatformUser: Boolean): PasswordPolicyConfig {
    return if (isPlatformUser) {
        PasswordPolicyConfig(
            minLength = 12,
            requireUppercase = true,
            requireLowercase = true,
            requireNumber = true,
            requireSpecialChar = true,
            preventCommonPasswords = true,
            historyCount = 10,
            maxAgeDays = 90
        )
    } else {
        PasswordPolicyConfig(
            minLength = 8,
            requireUppercase = true,
            requireLowercase = true,
            requireNumber = true,
            requireSpecialChar = true,
            preventCommonPasswords = true,
            historyCount = 5,
            maxAgeDays = null
        )
    }
}
```

### Enforcing Password Expiration

To enable password expiration (not recommended for regular users per NIST guidelines):

1. **Add Expiration Check in AuthService:**

```kotlin
fun checkPasswordExpiration(user: User) {
    val policy = passwordPolicyService.getPolicyForUser(user.isPlatformUser)

    if (policy.maxAgeDays != null) {
        val daysSinceChange = Duration.between(
            user.passwordChangedAt ?: user.createdAt,
            Instant.now()
        ).toDays()

        if (daysSinceChange > policy.maxAgeDays) {
            throw PasswordExpiredException(
                "Your password has expired. Please change it to continue."
            )
        }
    }
}
```

2. **Add Frontend Prompt:**
- Redirect to change password page if `PasswordExpiredException`
- Show warning 7 days before expiration
- Email reminder 3 days before expiration

### Common Password Blacklist

**Default List (Top 100):**
Located in `PasswordPolicyService.kt`:

```kotlin
private val commonPasswords = setOf(
    "password", "123456", "12345678", "qwerty", "abc123",
    "monkey", "1234567", "letmein", "trustno1", "dragon",
    // ... (100 total)
)
```

**To Expand Blacklist:**

1. Download extended list:
   - https://github.com/danielmiessler/SecLists/tree/master/Passwords/Common-Credentials
   - Use "10-million-password-list-top-1000000.txt"

2. Create database table:
```sql
CREATE TABLE common_passwords (
    password_hash VARCHAR(64) PRIMARY KEY
);

CREATE INDEX idx_common_passwords_hash ON common_passwords(password_hash);
```

3. Import hashed passwords:
```kotlin
// Hash passwords before storing to prevent reverse lookup
val hashedPassword = DigestUtils.sha256Hex(password.lowercase())
commonPasswordRepository.save(hashedPassword)
```

4. Update validation:
```kotlin
fun isCommonPassword(password: String): Boolean {
    val hash = DigestUtils.sha256Hex(password.lowercase())
    return commonPasswordRepository.existsByHash(hash)
}
```

---

## Managing User Sessions

### Viewing All Active Sessions

**Organization-Wide:**

```bash
GET /api/admin/sessions?page=0&size=100&active=true
```

Response includes:
- User email and ID
- Device information
- IP address and location
- Session creation and last activity time
- Session status (active/expired/revoked)

**For Specific User:**

```bash
GET /api/admin/users/{userId}/sessions
```

### Force Logout (Revoking Sessions)

**Revoke Single Session:**

```bash
POST /api/admin/sessions/{sessionId}/revoke
```

**Revoke All Sessions for User:**

```bash
POST /api/admin/users/{userId}/revoke-all-sessions
```

Use cases:
- User reports lost/stolen device
- Suspected account compromise
- Employee termination
- Account sharing detected

### Session Monitoring

**Set Up Alerts for:**

1. **Concurrent Session Anomalies**
   - User has 5+ active sessions (max limit)
   - Sessions from geographically distant locations simultaneously

2. **Long-Running Sessions**
   - Sessions active > 7 days (refresh token max lifetime)
   - Sessions with no activity > 2 hours

3. **Unusual Session Patterns**
   - Same user, multiple devices, all created within minutes
   - Sessions from known VPN/proxy IPs

**Query Long-Running Sessions:**

```sql
SELECT u.email, s.created_at, s.last_active_at, s.ip_address, s.device_name
FROM user_sessions s
JOIN users u ON s.user_id = u.id
WHERE s.is_active = TRUE
  AND s.created_at < NOW() - INTERVAL '7 days'
ORDER BY s.created_at ASC;
```

---

## Audit Trail Review

### Available Audit Logs

Liyaqa implements comprehensive audit logging across multiple tables:

1. **login_attempts** - All authentication attempts
2. **security_alerts** - Security anomaly alerts
3. **user_sessions** - Session lifecycle events
4. **audit_logs** - General system audit trail (future enhancement)

### Querying Login Attempts

**All Attempts for Time Range:**

```sql
SELECT
    la.timestamp,
    la.email,
    la.attempt_type,
    la.ip_address,
    la.country,
    la.city,
    la.device_name,
    la.browser,
    la.flagged_as_suspicious
FROM login_attempts la
WHERE la.timestamp BETWEEN '2026-02-01' AND '2026-02-02'
ORDER BY la.timestamp DESC;
```

**Failed Login Analysis:**

```sql
-- Top IPs with failed attempts
SELECT
    ip_address,
    COUNT(*) as failed_count,
    COUNT(DISTINCT email) as targeted_accounts,
    MIN(timestamp) as first_attempt,
    MAX(timestamp) as last_attempt
FROM login_attempts
WHERE attempt_type = 'FAILED'
  AND timestamp > NOW() - INTERVAL '24 hours'
GROUP BY ip_address
HAVING COUNT(*) > 5
ORDER BY failed_count DESC;
```

**Account Lockout Events:**

```sql
SELECT
    u.email,
    la.timestamp,
    la.ip_address,
    la.country,
    la.city
FROM login_attempts la
JOIN users u ON la.user_id = u.id
WHERE la.attempt_type = 'LOCKED'
  AND la.timestamp > NOW() - INTERVAL '7 days'
ORDER BY la.timestamp DESC;
```

### Compliance Reporting

**GDPR Article 15 - Data Subject Access Request:**

To provide a user with all their security data:

```sql
-- Login history
SELECT * FROM login_attempts WHERE user_id = 'user-uuid';

-- Security alerts
SELECT * FROM security_alerts WHERE user_id = 'user-uuid';

-- Active sessions
SELECT * FROM user_sessions WHERE user_id = 'user-uuid';

-- Password history (hashes only, never reveal)
SELECT created_at FROM password_history WHERE user_id = 'user-uuid';

-- MFA backup codes (mark as used, never reveal unused codes)
SELECT used, used_at FROM mfa_backup_codes WHERE user_id = 'user-uuid';
```

**GDPR Article 17 - Right to Erasure:**

On user account deletion, cascade deletes automatically remove:
- login_attempts (via FK cascade)
- security_alerts (via FK cascade)
- user_sessions (via FK cascade)
- password_history (via FK cascade)
- mfa_backup_codes (via FK cascade)

**SOC 2 Compliance - Access Review:**

Quarterly audit of privileged access:

```sql
-- Platform users with admin access
SELECT
    u.email,
    u.role,
    u.created_at,
    u.last_login,
    u.mfa_enabled,
    COUNT(DISTINCT s.id) as active_sessions
FROM users u
LEFT JOIN user_sessions s ON u.id = s.user_id AND s.is_active = TRUE
WHERE u.role IN ('PLATFORM_OWNER', 'PLATFORM_ADMIN', 'PLATFORM_SUPPORT')
GROUP BY u.id
ORDER BY u.role, u.email;
```

### Audit Log Retention

**Recommended Retention Periods:**

| Data Type | Retention | Rationale |
|-----------|-----------|-----------|
| login_attempts | 90 days | Security analysis, fraud detection |
| security_alerts (resolved) | 90 days | Incident review, pattern analysis |
| security_alerts (unresolved) | Until resolved + 90 days | Active investigation |
| user_sessions (active) | Until revoked/expired | Session management |
| user_sessions (revoked) | 30 days | Recent activity review |
| password_history | 5-10 passwords | Prevent reuse |
| audit_logs (critical events) | 7 years | Compliance (SOX, GDPR) |

**Automated Cleanup (cron job):**

```sql
-- Delete old resolved alerts
DELETE FROM security_alerts
WHERE resolved = TRUE
  AND created_at < NOW() - INTERVAL '90 days';

-- Delete old login attempts
DELETE FROM login_attempts
WHERE timestamp < NOW() - INTERVAL '90 days';

-- Delete revoked sessions
DELETE FROM user_sessions
WHERE is_active = FALSE
  AND revoked_at < NOW() - INTERVAL '30 days';
```

---

## Compliance Considerations

### GDPR (General Data Protection Regulation)

**Relevant Requirements:**

1. **Data Minimization (Article 5)**
   - Only collect necessary security data (IP, device, location)
   - Don't store excessive details (full user agent strings should be parsed)

2. **Purpose Limitation (Article 5)**
   - Security data used only for authentication and fraud prevention
   - Not for marketing or other purposes without consent

3. **Storage Limitation (Article 5)**
   - Implement retention periods (90 days for logs)
   - Automated deletion of old security data

4. **Right to Access (Article 15)**
   - Users can request all their security data
   - Provide in machine-readable format (JSON export)

5. **Right to Erasure (Article 17)**
   - Delete all user security data on account deletion
   - Cascade deletes implemented in database

6. **Data Breach Notification (Article 33)**
   - Notify supervisory authority within 72 hours
   - Notify affected users "without undue delay"
   - Document breach details, impact, remediation

**Implementation:**

- Privacy policy covers security data collection
- User consent for IP-based geolocation
- Automated data retention and deletion
- Breach notification procedures documented

### SOC 2 (Service Organization Control 2)

**Trust Services Criteria:**

1. **Security (CC6)**
   - Strong authentication (MFA for admins)
   - Encryption at rest and in transit
   - Access controls and session management

2. **Availability (A1)**
   - Protection against DDoS and brute force
   - Session limits prevent resource exhaustion

3. **Processing Integrity (PI1)**
   - Audit logs for all security events
   - Cannot be modified by users

4. **Confidentiality (C1)**
   - Passwords hashed with BCrypt
   - Secrets encrypted at rest
   - IP binding prevents session hijacking

5. **Privacy (P1)**
   - Aligned with GDPR requirements
   - User control over MFA and IP binding

**Evidence for Auditors:**

- Security architecture documentation (this guide)
- Audit log samples showing comprehensive tracking
- Incident response procedures
- Access review reports (quarterly)
- Penetration test results
- Disaster recovery plans

### PCI DSS (Payment Card Industry Data Security Standard)

If storing payment information:

**Requirement 8: Identify and authenticate access**
- ✅ Unique user IDs for all users
- ✅ Strong password policy (8+ chars, complexity)
- ✅ MFA for administrative access
- ✅ Session timeout after 15 minutes inactivity (access token expiry)
- ✅ Account lockout after 5 failed attempts

**Requirement 10: Track and monitor all access**
- ✅ Audit logs for all authentication events
- ✅ User ID, timestamp, event type recorded
- ✅ Logs protected from modification
- ✅ Regular log review process

**Implementation Notes:**
- Do NOT store full credit card numbers in Liyaqa
- Use tokenized payment processor (PayTabs)
- Security logs must be retained for 1 year minimum (PCI) or 7 years (SOX)

### HIPAA (Health Insurance Portability and Accountability Act)

If handling health data (fitness assessments, medical forms):

**Administrative Safeguards:**
- ✅ Unique user authentication
- ✅ Automatic session timeout
- ✅ Audit controls and monitoring
- ✅ Access controls based on roles

**Technical Safeguards:**
- ✅ Unique user IDs
- ✅ Automatic logoff after inactivity
- ✅ Encryption of data in transit (TLS)
- ✅ Audit logs of system activity

**Breach Notification:**
- Notify affected individuals within 60 days
- Notify HHS if 500+ individuals affected
- Document: date of breach, date discovered, individuals affected, description

---

## Best Practices for Security Configuration

### Defense in Depth

Implement multiple layers of security:

1. **Network Layer**
   - Firewall rules restricting admin panel access
   - DDoS protection (Cloudflare, AWS Shield)
   - Rate limiting on authentication endpoints

2. **Application Layer**
   - Strong authentication (passwords + MFA)
   - Session management (timeouts, binding)
   - Input validation and sanitization

3. **Data Layer**
   - Encryption at rest (database encryption)
   - Encryption in transit (TLS 1.3)
   - Hashed passwords (BCrypt)
   - Encrypted secrets (OAuth client secrets)

4. **Monitoring Layer**
   - Security anomaly detection
   - Real-time alerts
   - Audit logging
   - SIEM integration (future)

### Principle of Least Privilege

- Grant users minimum necessary permissions
- Use role-based access control (RBAC)
- Regular access reviews (quarterly)
- Revoke access immediately on role change or termination

### Security Defaults

**Secure by Default:**
- MFA encouraged during onboarding
- Strong password policy enforced
- Sessions expire automatically
- Anomaly detection always enabled

**Opt-In for Advanced Features:**
- IP binding (opt-in due to UX impact)
- OAuth providers (admin-configured only)
- Extended session lifetimes (not allowed)

### Regular Security Reviews

**Weekly:**
- Review critical security alerts
- Check for ongoing brute force attacks
- Monitor failed login rates

**Monthly:**
- Review all security alerts
- Analyze login patterns and anomalies
- Update common password blacklist
- Review OAuth provider configurations

**Quarterly:**
- Access review for all platform users
- Update incident response procedures
- Review and update security policies
- Penetration testing (if budget allows)
- Security training for staff

**Annually:**
- Comprehensive security audit
- Review compliance status (GDPR, SOC 2)
- Update disaster recovery plan
- Review and renew security certifications

### Security Training for Admins

**Required Training Topics:**

1. **Phishing Awareness**
   - Recognize phishing emails
   - Verify sender identity
   - Never share credentials

2. **Password Security**
   - Use password manager
   - Never reuse passwords
   - Enable MFA on all accounts

3. **Incident Response**
   - Know the escalation process
   - Don't panic, follow procedures
   - Document everything

4. **Data Privacy**
   - GDPR and privacy laws
   - Handling user data responsibly
   - Breach notification requirements

5. **Social Engineering**
   - Verify identity before sharing info
   - Be cautious of urgent requests
   - Escalate suspicious requests

### Disaster Recovery and Business Continuity

**Backup Strategy:**
- Database backups every 6 hours
- Point-in-time recovery capability
- Backups stored in separate region
- Test restores monthly

**Incident Recovery:**
- Restore user accounts from backup
- Replay audit logs to detect unauthorized changes
- Verify data integrity after restoration

**Communication Plan:**
- Status page for system outages
- Email templates for breach notifications
- Escalation tree for critical incidents

### Third-Party Security

**OAuth Provider Security:**
- Monitor provider security advisories
- Rotate client secrets on provider breach
- Have backup authentication method (password)

**Dependencies:**
- Regular security updates for libraries
- Automated vulnerability scanning (Dependabot, Snyk)
- CVE monitoring for critical dependencies

---

## Appendix

### API Endpoint Reference

| Endpoint | Method | Description | Admin Only |
|----------|--------|-------------|------------|
| `/api/auth/login` | POST | User login | No |
| `/api/auth/mfa/setup` | POST | Initiate MFA setup | No |
| `/api/auth/sessions` | GET | List user's active sessions | No |
| `/api/auth/sessions/{id}/revoke` | POST | Revoke single session | No |
| `/api/admin/users/{id}/sessions` | GET | List user sessions | Yes |
| `/api/admin/users/{id}/revoke-all-sessions` | POST | Force logout all devices | Yes |
| `/api/admin/users/{id}/force-password-reset` | POST | Require password change | Yes |
| `/api/admin/security/alerts` | GET | List all security alerts | Yes |
| `/api/admin/oauth-providers` | POST | Create OAuth provider | Yes |
| `/api/admin/oauth-providers/{id}` | PUT | Update OAuth provider | Yes |
| `/api/admin/login-history` | GET | Organization-wide login history | Yes |

### Database Schema Reference

**Key Security Tables:**

- `users` - User accounts with MFA fields
- `login_attempts` - Complete login audit trail
- `user_sessions` - Active session tracking
- `security_alerts` - Anomaly detection alerts
- `password_history` - Password reuse prevention
- `mfa_backup_codes` - MFA recovery codes
- `oauth_providers` - OAuth configuration

See `DEVELOPER_SECURITY_REFERENCE.md` for complete schema details.

### Contact Information

**Security Team:**
- Email: security@liyaqa.com
- Emergency Hotline: [Available in admin dashboard]
- Response Time: < 1 hour for P0, < 4 hours for P1

**Support Team:**
- Email: support@liyaqa.com
- Response Time: < 24 hours

**Engineering Team:**
- For technical issues with security features
- Create ticket in internal system

---

**Document Version:** 1.0
**Last Updated:** February 1, 2026
**Next Review:** May 1, 2026
**Classification:** Internal - For Authorized Administrators Only

© 2026 Liyaqa. All rights reserved.
