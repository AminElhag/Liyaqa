# Developer Security Reference
**Liyaqa Platform - Technical Security Implementation Guide**

> **Last Updated:** February 1, 2026
> **Version:** 1.0
> **Audience:** Backend Developers, DevOps Engineers, Security Engineers

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Authentication Flow Diagrams](#authentication-flow-diagrams)
3. [API Documentation](#api-documentation)
4. [MFA Implementation Details](#mfa-implementation-details)
5. [OAuth Integration Guide](#oauth-integration-guide)
6. [Security Anomaly Detection Algorithms](#security-anomaly-detection-algorithms)
7. [Database Schema](#database-schema)
8. [Environment Variables Reference](#environment-variables-reference)
9. [Deployment Checklist](#deployment-checklist)
10. [Migration Guide](#migration-guide)
11. [Troubleshooting Common Issues](#troubleshooting-common-issues)

---

## Architecture Overview

### Security Components

```
┌─────────────────────────────────────────────────────────────┐
│                     Liyaqa Security Architecture             │
└─────────────────────────────────────────────────────────────┘

┌──────────────┐      ┌──────────────┐      ┌──────────────┐
│   Frontend   │      │   Backend    │      │   Database   │
│   (Next.js)  │◄────►│  (Kotlin/    │◄────►│ (PostgreSQL) │
│              │ HTTPS │   Spring)    │      │              │
└──────────────┘      └──────────────┘      └──────────────┘
                             │
                             ├─► JWT Token Provider
                             ├─► MFA Service (TOTP)
                             ├─► OAuth Service
                             ├─► Session Service
                             ├─► Audit Service (Async)
                             ├─► Security Anomaly Service
                             └─► Password Policy Service

External Services:
┌──────────────┐      ┌──────────────┐      ┌──────────────┐
│    Google    │      │  Microsoft   │      │    GitHub    │
│    OAuth     │      │    OAuth     │      │    OAuth     │
└──────────────┘      └──────────────┘      └──────────────┘
```

### Technology Stack

**Backend:**
- **Language:** Kotlin 1.9
- **Framework:** Spring Boot 3.2
- **Security:** Spring Security 6.2
- **Database:** PostgreSQL 15
- **ORM:** Hibernate/JPA
- **JWT:** jjwt 0.12
- **Password Hashing:** BCrypt (Spring Security)
- **TOTP:** Google Authenticator compatible

**Frontend:**
- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript 5
- **State:** React Query (TanStack Query)
- **HTTP Client:** Axios
- **Validation:** Zod

### Security Layers

1. **Transport Security**
   - TLS 1.3 for all communications
   - HSTS enabled in production
   - Certificate pinning (mobile apps)

2. **Authentication**
   - JWT-based (Bearer tokens)
   - Cookie-based (HTTPOnly, Secure, SameSite)
   - OAuth 2.0 / OpenID Connect
   - TOTP Multi-Factor Authentication

3. **Authorization**
   - Role-Based Access Control (RBAC)
   - Permission-based granular access
   - Tenant isolation

4. **Data Protection**
   - BCrypt password hashing (cost factor 10)
   - AES-256 encryption for secrets
   - Database encryption at rest
   - PII field-level encryption (future)

5. **Monitoring**
   - Login attempt tracking
   - Security anomaly detection
   - Real-time alerting
   - Comprehensive audit logging

---

## Authentication Flow Diagrams

### 1. Standard Email/Password Login (Bearer Token)

```
┌────────┐                  ┌────────┐                  ┌────────┐
│ Client │                  │ Server │                  │   DB   │
└───┬────┘                  └───┬────┘                  └───┬────┘
    │                           │                           │
    │ POST /api/auth/login      │                           │
    │ {email, password}         │                           │
    ├──────────────────────────►│                           │
    │                           │                           │
    │                           │ Query user by email       │
    │                           ├──────────────────────────►│
    │                           │                           │
    │                           │◄──────────────────────────┤
    │                           │ User entity               │
    │                           │                           │
    │                           │ BCrypt.checkpw()          │
    │                           │ (password verification)   │
    │                           │                           │
    │                           │ Log login attempt         │
    │                           ├──────────────────────────►│
    │                           │ (async)                   │
    │                           │                           │
    │                           │ Generate JWT              │
    │                           │ - Access Token (15 min)   │
    │                           │ - Refresh Token (7 days)  │
    │                           │                           │
    │                           │ Create session record     │
    │                           ├──────────────────────────►│
    │                           │                           │
    │◄──────────────────────────┤                           │
    │ 200 OK                    │                           │
    │ {accessToken, refreshToken│                           │
    │  expiresIn, user}         │                           │
    │                           │                           │
    │ Subsequent Requests       │                           │
    │ Authorization: Bearer {token}                         │
    ├──────────────────────────►│                           │
    │                           │                           │
    │                           │ Validate JWT              │
    │                           │ - Signature valid?        │
    │                           │ - Not expired?            │
    │                           │ - User still active?      │
    │                           │                           │
    │◄──────────────────────────┤                           │
    │ 200 OK {data}             │                           │
    │                           │                           │
```

### 2. Cookie-Based Authentication

```
┌────────┐                  ┌────────┐                  ┌────────┐
│ Client │                  │ Server │                  │   DB   │
└───┬────┘                  └───┬────┘                  └───┬────┘
    │                           │                           │
    │ POST /api/auth/login      │                           │
    │ Header: X-Auth-Mode: cookie                           │
    │ {email, password}         │                           │
    ├──────────────────────────►│                           │
    │                           │                           │
    │                           │ (Same authentication      │
    │                           │  as Bearer flow)          │
    │                           │                           │
    │◄──────────────────────────┤                           │
    │ 200 OK                    │                           │
    │ Set-Cookie: access_token=XXX; HttpOnly; Secure; SameSite=Strict│
    │ Set-Cookie: refresh_token=YYY; HttpOnly; Secure; SameSite=Strict│
    │ {user, csrfToken}         │                           │
    │                           │                           │
    │ Subsequent Requests       │                           │
    │ Cookie: access_token=XXX  │                           │
    │ X-CSRF-Token: {csrfToken} │                           │
    ├──────────────────────────►│                           │
    │                           │                           │
    │                           │ Extract token from cookie │
    │                           │ Validate CSRF token       │
    │                           │ Validate JWT              │
    │                           │                           │
    │◄──────────────────────────┤                           │
    │ 200 OK {data}             │                           │
    │                           │                           │
```

### 3. Multi-Factor Authentication (MFA) Flow

```
┌────────┐                  ┌────────┐                  ┌────────┐
│ Client │                  │ Server │                  │   DB   │
└───┬────┘                  └───┬────┘                  └───┬────┘
    │                           │                           │
    │ POST /api/auth/login      │                           │
    │ {email, password}         │                           │
    ├──────────────────────────►│                           │
    │                           │                           │
    │                           │ Verify password           │
    │                           │ Check user.mfaEnabled     │
    │                           │                           │
    │◄──────────────────────────┤                           │
    │ 200 OK                    │                           │
    │ {mfaRequired: true,       │                           │
    │  userId, email}           │                           │
    │                           │                           │
    │ (User opens authenticator app, gets 6-digit code)     │
    │                           │                           │
    │ POST /api/auth/mfa/verify-login                       │
    │ {userId, code}            │                           │
    ├──────────────────────────►│                           │
    │                           │                           │
    │                           │ Get user.mfaSecret        │
    │                           ├──────────────────────────►│
    │                           │◄──────────────────────────┤
    │                           │                           │
    │                           │ Verify TOTP code          │
    │                           │ - time_slot = now / 30    │
    │                           │ - expected = TOTP(secret, time_slot)│
    │                           │ - Check code == expected  │
    │                           │   OR previous time_slot   │
    │                           │   OR next time_slot (30s window)│
    │                           │                           │
    │                           │ If invalid, check backup codes│
    │                           ├──────────────────────────►│
    │                           │◄──────────────────────────┤
    │                           │                           │
    │                           │ Generate JWT tokens       │
    │                           │ Create session            │
    │                           │ Log MFA_SUCCESS attempt   │
    │                           │                           │
    │◄──────────────────────────┤                           │
    │ 200 OK                    │                           │
    │ {accessToken, refreshToken│                           │
    │  user, expiresIn}         │                           │
    │                           │                           │
```

### 4. OAuth 2.0 Login Flow

```
┌────────┐         ┌────────┐         ┌────────┐         ┌────────┐
│ Client │         │ Server │         │   DB   │         │ Google │
└───┬────┘         └───┬────┘         └───┬────┘         └───┬────┘
    │                  │                  │                  │
    │ Click "Sign in with Google"         │                  │
    ├─────────────────►│                  │                  │
    │                  │                  │                  │
    │                  │ Get OAuth config │                  │
    │                  ├─────────────────►│                  │
    │                  │◄─────────────────┤                  │
    │                  │ (clientId, clientSecret, etc.)      │
    │                  │                  │                  │
    │                  │ Build auth URL:  │                  │
    │                  │ https://accounts.google.com/o/oauth2/v2/auth?│
    │                  │   client_id={id}&                   │
    │                  │   redirect_uri={callback}&          │
    │                  │   response_type=code&               │
    │                  │   scope=openid email profile        │
    │                  │                  │                  │
    │◄─────────────────┤ 302 Redirect     │                  │
    │                  │                  │                  │
    │ (Browser follows redirect to Google)│                  │
    ├─────────────────────────────────────────────────────►  │
    │                  │                  │                  │
    │ (User logs in to Google, grants permissions)           │
    │                  │                  │                  │
    │◄─────────────────────────────────────────────────────┤ │
    │ 302 Redirect to callback with code                     │
    │                  │                  │                  │
    │ GET /api/auth/oauth/callback/google?code=XXX           │
    ├─────────────────►│                  │                  │
    │                  │                  │                  │
    │                  │ Exchange code for tokens            │
    │                  ├─────────────────────────────────────►│
    │                  │ POST /token                          │
    │                  │ {code, client_id, client_secret}    │
    │                  │                  │                  │
    │                  │◄─────────────────────────────────────┤
    │                  │ {access_token, id_token}            │
    │                  │                  │                  │
    │                  │ Get user info from Google           │
    │                  ├─────────────────────────────────────►│
    │                  │ GET /userinfo                       │
    │                  │ Authorization: Bearer {access_token}│
    │                  │                  │                  │
    │                  │◄─────────────────────────────────────┤
    │                  │ {sub, email, name, picture}         │
    │                  │                  │                  │
    │                  │ Find or create user by oauth_provider_id│
    │                  ├─────────────────►│                  │
    │                  │◄─────────────────┤                  │
    │                  │                  │                  │
    │                  │ Generate Liyaqa JWT tokens          │
    │                  │ Create session   │                  │
    │                  │ Log login attempt│                  │
    │                  │                  │                  │
    │◄─────────────────┤ 200 OK           │                  │
    │ {accessToken, refreshToken, user}   │                  │
    │                  │                  │                  │
```

### 5. Session Refresh Flow

```
┌────────┐                  ┌────────┐                  ┌────────┐
│ Client │                  │ Server │                  │   DB   │
└───┬────┘                  └───┬────┘                  └───┬────┘
    │                           │                           │
    │ (Access token expires after 15 minutes)               │
    │                           │                           │
    │ POST /api/auth/refresh    │                           │
    │ {refreshToken}            │                           │
    ├──────────────────────────►│                           │
    │                           │                           │
    │                           │ Validate refresh token    │
    │                           ├──────────────────────────►│
    │                           │ SELECT * FROM refresh_tokens│
    │                           │◄──────────────────────────┤
    │                           │                           │
    │                           │ Check:                    │
    │                           │ - Not expired?            │
    │                           │ - Not revoked?            │
    │                           │ - User still active?      │
    │                           │                           │
    │                           │ If IP binding enabled:    │
    │                           │ - Check IP matches?       │
    │                           │                           │
    │                           │ Check absolute timeout    │
    │                           │ - Session created < 24h ago?│
    │                           │                           │
    │                           │ Generate new tokens       │
    │                           │ - New access token (15 min)│
    │                           │ - New refresh token (7 days)│
    │                           │                           │
    │                           │ Revoke old refresh token  │
    │                           ├──────────────────────────►│
    │                           │                           │
    │                           │ Update session last_active│
    │                           ├──────────────────────────►│
    │                           │                           │
    │◄──────────────────────────┤                           │
    │ 200 OK                    │                           │
    │ {accessToken, refreshToken│                           │
    │  expiresIn}               │                           │
    │                           │                           │
```

---

## API Documentation

### Authentication Endpoints

#### POST /api/auth/login

Authenticates user with email and password.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "tenantId": "uuid" // Optional if accessing via subdomain
}
```

**Headers:**
```
Content-Type: application/json
X-Auth-Mode: cookie  // Optional: use cookie auth instead of Bearer
```

**Success Response (No MFA):**
```json
{
  "accessToken": "eyJhbGciOiJIUzUxMiJ9...",
  "refreshToken": "uuid",
  "expiresIn": 900,
  "tokenType": "Bearer",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "MEMBER",
    "mfaEnabled": false,
    "permissions": ["READ_CLASSES", "BOOK_CLASSES"]
  },
  "organizationId": "uuid"
}
```

**Success Response (MFA Required):**
```json
{
  "mfaRequired": true,
  "userId": "uuid",
  "email": "user@example.com"
}
```

**Error Responses:**
- `401 Unauthorized` - Invalid credentials
- `423 Locked` - Account locked due to too many failed attempts
- `400 Bad Request` - Tenant ID required

**Rate Limiting:** 10 requests per minute per IP

---

#### POST /api/auth/mfa/verify-login

Verifies MFA code and completes login.

**Request:**
```json
{
  "userId": "uuid",
  "code": "123456",
  "deviceInfo": "Chrome on MacBook Pro" // Optional
}
```

**Success Response:**
```json
{
  "accessToken": "eyJhbGciOiJIUzUxMiJ9...",
  "refreshToken": "uuid",
  "expiresIn": 900,
  "user": { /* same as login */ }
}
```

**Error Responses:**
- `401 Unauthorized` - Invalid MFA code
- `404 Not Found` - User not found

---

#### POST /api/auth/register

Creates a new user account.

**Request:**
```json
{
  "email": "newuser@example.com",
  "password": "SecurePass123!",
  "firstName": "Jane",
  "lastName": "Smith",
  "phoneNumber": "+1234567890",
  "tenantId": "uuid",
  "role": "MEMBER" // Optional, defaults to MEMBER
}
```

**Success Response:** `201 Created`
```json
{
  "accessToken": "...",
  "refreshToken": "...",
  "user": { /* user object */ }
}
```

**Error Responses:**
- `400 Bad Request` - Validation errors (email exists, weak password, etc.)
- `429 Too Many Requests` - Rate limit exceeded

---

#### POST /api/auth/refresh

Refreshes access token using refresh token.

**Request:**
```json
{
  "refreshToken": "uuid"
}
```

**Success Response:**
```json
{
  "accessToken": "new-access-token",
  "refreshToken": "new-refresh-token",
  "expiresIn": 900,
  "user": { /* user object */ }
}
```

**Error Responses:**
- `401 Unauthorized` - Invalid or expired refresh token
- `403 Forbidden` - IP mismatch (if IP binding enabled)
- `410 Gone` - Session exceeded absolute timeout (24 hours)

---

#### POST /api/auth/logout

Revokes refresh token and ends session.

**Request:**
```json
{
  "refreshToken": "uuid"
}
```

**Success Response:** `204 No Content`

---

#### POST /api/auth/logout-all

Revokes all refresh tokens for the authenticated user.

**Headers:**
```
Authorization: Bearer {access_token}
```

**Success Response:** `204 No Content`

---

### MFA Endpoints

#### POST /api/auth/mfa/setup

Initiates MFA setup for authenticated user.

**Headers:**
```
Authorization: Bearer {access_token}
```

**Success Response:**
```json
{
  "secret": "JBSWY3DPEHPK3PXP",
  "qrCodeUrl": "data:image/png;base64,iVBORw0KG...",
  "backupCodes": [
    "12345678",
    "87654321",
    "11223344",
    "99887766",
    "55443322",
    "66554433",
    "77889900",
    "00998877"
  ]
}
```

**Implementation Note:**
- `secret` is Base32-encoded TOTP secret
- `qrCodeUrl` is data URI for QR code image
- `backupCodes` are 8-digit codes (plaintext, shown only once)

---

#### POST /api/auth/mfa/verify-setup

Verifies TOTP code and enables MFA.

**Request:**
```json
{
  "secret": "JBSWY3DPEHPK3PXP",
  "code": "123456",
  "backupCodes": ["12345678", "87654321", ...]
}
```

**Success Response:**
```json
{
  "message": "MFA enabled successfully"
}
```

**Error Responses:**
- `400 Bad Request` - Invalid verification code

---

#### POST /api/auth/mfa/disable

Disables MFA for authenticated user.

**Request:**
```json
{
  "password": "current-password"
}
```

**Success Response:**
```json
{
  "message": "MFA disabled successfully"
}
```

**Error Responses:**
- `401 Unauthorized` - Incorrect password

---

#### POST /api/auth/mfa/regenerate-backup

Generates new backup codes (invalidates old ones).

**Headers:**
```
Authorization: Bearer {access_token}
```

**Success Response:**
```json
{
  "backupCodes": [
    "11112222",
    "33334444",
    ...
  ],
  "count": 8
}
```

---

#### GET /api/auth/mfa/status

Gets MFA status for authenticated user.

**Headers:**
```
Authorization: Bearer {access_token}
```

**Success Response:**
```json
{
  "enabled": true,
  "unusedBackupCodesCount": 6
}
```

---

### Session Management Endpoints

#### GET /api/auth/sessions

Lists active sessions for authenticated user.

**Headers:**
```
Authorization: Bearer {access_token}
```

**Success Response:**
```json
[
  {
    "id": "uuid",
    "sessionId": "uuid",
    "deviceName": "Chrome on MacBook Pro",
    "os": "macOS",
    "browser": "Chrome",
    "ipAddress": "203.0.113.42",
    "country": "US",
    "city": "New York",
    "createdAt": "2026-02-01T10:00:00Z",
    "lastActiveAt": "2026-02-01T12:30:00Z",
    "expiresAt": "2026-02-08T10:00:00Z",
    "isActive": true,
    "isCurrent": true
  }
]
```

---

#### POST /api/auth/sessions/{sessionId}/revoke

Revokes a specific session (remote logout).

**Headers:**
```
Authorization: Bearer {access_token}
```

**Success Response:** `204 No Content`

**Error Responses:**
- `404 Not Found` - Session not found
- `403 Forbidden` - Session belongs to different user

---

#### POST /api/auth/sessions/revoke-all

Revokes all sessions except current one.

**Request (Optional):**
```json
{
  "sessionId": "uuid" // Session to keep active
}
```

**Success Response:** `204 No Content`

---

### OAuth Endpoints

#### GET /api/auth/oauth/providers

Gets enabled OAuth providers for organization.

**Query Parameters:**
- `organizationId` (required): Organization UUID

**Success Response:**
```json
[
  {
    "id": "uuid",
    "provider": "GOOGLE",
    "enabled": true
  },
  {
    "id": "uuid",
    "provider": "MICROSOFT",
    "enabled": true
  }
]
```

---

#### GET /api/auth/oauth/authorize/{provider}

Initiates OAuth login flow (redirects to provider).

**Path Parameters:**
- `provider`: One of `google`, `microsoft`, `github`, `custom`

**Query Parameters:**
- `organizationId` (required): Organization UUID
- `redirectUri` (required): Callback URL
- `state` (required): CSRF protection state token

**Response:** `302 Redirect` to OAuth provider

---

#### GET /api/auth/oauth/callback/{provider}

Handles OAuth callback (completes login).

**Path Parameters:**
- `provider`: OAuth provider type

**Query Parameters:**
- `code` (required): Authorization code from provider
- `state` (required): State token for CSRF validation
- `organizationId` (required): Organization UUID
- `redirectUri` (required): Must match authorize call

**Success Response:**
```json
{
  "accessToken": "...",
  "refreshToken": "...",
  "expiresIn": 900,
  "user": { /* user object */ }
}
```

**Error Responses:**
- `400 Bad Request` - Invalid code or state mismatch
- `401 Unauthorized` - OAuth provider rejected authentication

---

### Security Alert Endpoints

#### GET /api/security/alerts

Gets security alerts for authenticated user.

**Headers:**
```
Authorization: Bearer {access_token}
```

**Query Parameters:**
- `unreadOnly` (optional): If true, return only unread alerts

**Success Response:**
```json
[
  {
    "id": "uuid",
    "alertType": "NEW_DEVICE",
    "severity": "MEDIUM",
    "details": "Login from a new device. User agent: Chrome 120 on Windows 11. Location: London, GB. IP: 203.0.113.42",
    "resolved": false,
    "acknowledgedAt": null,
    "createdAt": "2026-02-01T10:30:00Z"
  }
]
```

---

#### GET /api/security/alerts/count

Gets count of unresolved alerts.

**Success Response:**
```json
{
  "count": 3
}
```

---

#### POST /api/security/alerts/{alertId}/acknowledge

Marks alert as acknowledged/resolved.

**Success Response:** `204 No Content`

**Error Responses:**
- `404 Not Found` - Alert not found
- `403 Forbidden` - Alert belongs to different user

---

### Login History Endpoints

#### GET /api/auth/login-history

Gets login history for authenticated user.

**Query Parameters:**
- `page` (default: 0): Page number
- `size` (default: 20): Page size

**Success Response:**
```json
{
  "content": [
    {
      "id": "uuid",
      "email": "user@example.com",
      "ipAddress": "203.0.113.42",
      "userAgent": "Mozilla/5.0 ...",
      "deviceName": "Chrome",
      "os": "macOS",
      "browser": "Chrome",
      "country": "US",
      "city": "New York",
      "attemptType": "SUCCESS",
      "failureReason": null,
      "timestamp": "2026-02-01T10:30:00Z",
      "flaggedAsSuspicious": false,
      "acknowledgedAt": null
    }
  ],
  "totalElements": 150,
  "totalPages": 8,
  "number": 0,
  "size": 20
}
```

---

#### GET /api/auth/login-history/suspicious

Gets suspicious login attempts only.

**Success Response:** Same format as `/login-history`

---

#### POST /api/auth/login-history/{attemptId}/acknowledge

Acknowledges a suspicious login attempt.

**Success Response:** `204 No Content`

---

#### GET /api/auth/login-history/stats

Gets login statistics for last 30 days.

**Success Response:**
```json
{
  "successfulLogins": 45,
  "failedAttempts": 3,
  "suspiciousAttempts": 1,
  "uniqueDevices": 4
}
```

---

### Security Preferences Endpoints

#### GET /api/auth/security-preferences

Gets user's security preferences.

**Success Response:**
```json
{
  "ipBindingEnabled": false
}
```

---

#### PUT /api/auth/security-preferences

Updates security preferences.

**Request:**
```json
{
  "ipBindingEnabled": true
}
```

**Success Response:**
```json
{
  "ipBindingEnabled": true
}
```

**Note:** Enabling IP binding will log out the user (they must login again to bind to current IP).

---

## MFA Implementation Details

### TOTP Algorithm

Liyaqa uses Time-based One-Time Password (TOTP) algorithm as defined in RFC 6238.

**Algorithm Overview:**

```
TOTP = HOTP(K, T)

Where:
- K = shared secret key (Base32-encoded)
- T = current time step = floor(Unix_time / 30)
- HOTP = HMAC-based OTP from RFC 4226
```

**Implementation:**

```kotlin
import org.apache.commons.codec.binary.Base32
import javax.crypto.Mac
import javax.crypto.spec.SecretKeySpec
import java.nio.ByteBuffer
import java.time.Instant

class TotpGenerator {
    companion object {
        private const val TIME_STEP_SECONDS = 30L
        private const val DIGITS = 6
        private const val ALGORITHM = "HmacSHA1"

        fun generateTOTP(secret: String, time: Instant = Instant.now()): String {
            val base32 = Base32()
            val keyBytes = base32.decode(secret)

            val timeStep = time.epochSecond / TIME_STEP_SECONDS
            val timeBytes = ByteBuffer.allocate(8).putLong(timeStep).array()

            val mac = Mac.getInstance(ALGORITHM)
            mac.init(SecretKeySpec(keyBytes, ALGORITHM))
            val hash = mac.doFinal(timeBytes)

            // Dynamic truncation
            val offset = hash[hash.size - 1].toInt() and 0x0F
            val binary = ((hash[offset].toInt() and 0x7F) shl 24) or
                        ((hash[offset + 1].toInt() and 0xFF) shl 16) or
                        ((hash[offset + 2].toInt() and 0xFF) shl 8) or
                        (hash[offset + 3].toInt() and 0xFF)

            val otp = binary % 1000000
            return otp.toString().padStart(DIGITS, '0')
        }

        fun verifyTOTP(secret: String, userCode: String, windowSize: Int = 1): Boolean {
            val now = Instant.now()

            // Check current time slot
            if (generateTOTP(secret, now) == userCode) {
                return true
            }

            // Check previous and next time slots (allow clock drift)
            for (i in 1..windowSize) {
                // Check past
                val past = now.minusSeconds(TIME_STEP_SECONDS * i)
                if (generateTOTP(secret, past) == userCode) {
                    return true
                }

                // Check future
                val future = now.plusSeconds(TIME_STEP_SECONDS * i)
                if (generateTOTP(secret, future) == userCode) {
                    return true
                }
            }

            return false
        }

        fun generateSecret(): String {
            val random = SecureRandom()
            val bytes = ByteArray(20) // 160 bits
            random.nextBytes(bytes)
            val base32 = Base32()
            return base32.encodeToString(bytes).trimEnd('=')
        }
    }
}
```

**QR Code Generation:**

```kotlin
import com.google.zxing.BarcodeFormat
import com.google.zxing.qrcode.QRCodeWriter
import java.awt.image.BufferedImage
import java.io.ByteArrayOutputStream
import java.util.Base64
import javax.imageio.ImageIO

fun generateQRCode(secret: String, userEmail: String, issuer: String = "Liyaqa"): String {
    val otpauthUrl = "otpauth://totp/$issuer:$userEmail?secret=$secret&issuer=$issuer"

    val qrCodeWriter = QRCodeWriter()
    val bitMatrix = qrCodeWriter.encode(otpauthUrl, BarcodeFormat.QR_CODE, 300, 300)

    val width = bitMatrix.width
    val height = bitMatrix.height
    val image = BufferedImage(width, height, BufferedImage.TYPE_INT_RGB)

    for (x in 0 until width) {
        for (y in 0 until height) {
            image.setRGB(x, y, if (bitMatrix.get(x, y)) 0x000000 else 0xFFFFFF)
        }
    }

    val outputStream = ByteArrayOutputStream()
    ImageIO.write(image, "PNG", outputStream)
    val imageBytes = outputStream.toByteArray()
    val base64Image = Base64.getEncoder().encodeToString(imageBytes)

    return "data:image/png;base64,$base64Image"
}
```

### Backup Codes

**Generation:**

```kotlin
import java.security.SecureRandom

fun generateBackupCodes(count: Int = 8): List<String> {
    val random = SecureRandom()
    return (1..count).map {
        random.nextInt(100000000).toString().padStart(8, '0')
    }
}
```

**Storage:**

Backup codes are hashed before storage using BCrypt:

```kotlin
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder

val encoder = BCryptPasswordEncoder()

// Store
val hashedCode = encoder.encode(backupCode)
mfaBackupCodeRepository.save(MfaBackupCode(
    userId = userId,
    codeHash = hashedCode,
    used = false
))

// Verify
val code = mfaBackupCodeRepository.findByUserIdAndUsedFalse(userId)
    .firstOrNull { encoder.matches(userInputCode, it.codeHash) }

if (code != null) {
    code.used = true
    code.usedAt = Instant.now()
    mfaBackupCodeRepository.save(code)
    return true
}
```

---

## OAuth Integration Guide

### OAuth Provider Configuration

**Database Entity:**

```kotlin
@Entity
@Table(name = "oauth_providers")
data class OAuthProvider(
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    val id: UUID? = null,

    @Column(nullable = false)
    val organizationId: UUID,

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    val provider: ProviderType, // GOOGLE, MICROSOFT, GITHUB, CUSTOM

    @Column(nullable = false)
    val clientId: String,

    @Column(nullable = false, columnDefinition = "TEXT")
    val clientSecret: String, // TODO: Encrypt at rest

    val authorizationUri: String? = null,
    val tokenUri: String? = null,
    val userInfoUri: String? = null,
    val scopes: String? = null,

    @Column(nullable = false)
    val enabled: Boolean = true,

    @Column(nullable = false)
    val autoProvision: Boolean = false,

    @Column(nullable = false)
    val createdAt: Instant = Instant.now()
)
```

### OAuth Service Implementation

**Authorization URL Builder:**

```kotlin
fun buildAuthorizationUrl(
    provider: OAuthProvider,
    redirectUri: String,
    state: String
): String {
    val baseUrl = when (provider.provider) {
        ProviderType.GOOGLE -> "https://accounts.google.com/o/oauth2/v2/auth"
        ProviderType.MICROSOFT -> "https://login.microsoftonline.com/common/oauth2/v2.0/authorize"
        ProviderType.GITHUB -> "https://github.com/login/oauth/authorize"
        ProviderType.CUSTOM -> provider.authorizationUri
            ?: throw IllegalStateException("Custom provider must have authorizationUri")
    }

    val scopes = provider.scopes ?: "openid email profile"

    return "$baseUrl?" +
            "client_id=${URLEncoder.encode(provider.clientId, "UTF-8")}&" +
            "redirect_uri=${URLEncoder.encode(redirectUri, "UTF-8")}&" +
            "response_type=code&" +
            "scope=${URLEncoder.encode(scopes, "UTF-8")}&" +
            "state=${URLEncoder.encode(state, "UTF-8")}"
}
```

**Token Exchange:**

```kotlin
fun exchangeCodeForToken(
    provider: OAuthProvider,
    code: String,
    redirectUri: String
): OAuthTokenResponse {
    val tokenUrl = when (provider.provider) {
        ProviderType.GOOGLE -> "https://oauth2.googleapis.com/token"
        ProviderType.MICROSOFT -> "https://login.microsoftonline.com/common/oauth2/v2.0/token"
        ProviderType.GITHUB -> "https://github.com/login/oauth/access_token"
        ProviderType.CUSTOM -> provider.tokenUri
            ?: throw IllegalStateException("Custom provider must have tokenUri")
    }

    val requestBody = mapOf(
        "code" to code,
        "client_id" to provider.clientId,
        "client_secret" to provider.clientSecret,
        "redirect_uri" to redirectUri,
        "grant_type" to "authorization_code"
    )

    val response = restTemplate.postForObject(
        tokenUrl,
        requestBody,
        OAuthTokenResponse::class.java
    ) ?: throw IllegalStateException("Failed to exchange code for token")

    return response
}

data class OAuthTokenResponse(
    val access_token: String,
    val token_type: String,
    val expires_in: Int,
    val refresh_token: String?,
    val id_token: String?
)
```

**User Info Retrieval:**

```kotlin
fun getUserInfo(
    provider: OAuthProvider,
    accessToken: String
): OAuthUserInfo {
    val userInfoUrl = when (provider.provider) {
        ProviderType.GOOGLE -> "https://www.googleapis.com/oauth2/v3/userinfo"
        ProviderType.MICROSOFT -> "https://graph.microsoft.com/v1.0/me"
        ProviderType.GITHUB -> "https://api.github.com/user"
        ProviderType.CUSTOM -> provider.userInfoUri
            ?: throw IllegalStateException("Custom provider must have userInfoUri")
    }

    val headers = HttpHeaders()
    headers.setBearerAuth(accessToken)

    val entity = HttpEntity<String>(headers)
    val response = restTemplate.exchange(
        userInfoUrl,
        HttpMethod.GET,
        entity,
        Map::class.java
    )

    val body = response.body ?: throw IllegalStateException("No user info returned")

    return when (provider.provider) {
        ProviderType.GOOGLE -> OAuthUserInfo(
            providerId = body["sub"] as String,
            email = body["email"] as String,
            name = body["name"] as? String,
            picture = body["picture"] as? String
        )
        ProviderType.MICROSOFT -> OAuthUserInfo(
            providerId = body["id"] as String,
            email = body["mail"] as? String ?: body["userPrincipalName"] as String,
            name = body["displayName"] as? String,
            picture = null
        )
        ProviderType.GITHUB -> OAuthUserInfo(
            providerId = body["id"].toString(),
            email = body["email"] as? String ?: "${body["login"]}@users.noreply.github.com",
            name = body["name"] as? String,
            picture = body["avatar_url"] as? String
        )
        ProviderType.CUSTOM -> OAuthUserInfo(
            providerId = body["sub"] as String,
            email = body["email"] as String,
            name = body["name"] as? String,
            picture = body["picture"] as? String
        )
    }
}

data class OAuthUserInfo(
    val providerId: String,
    val email: String,
    val name: String?,
    val picture: String?
)
```

**User Provisioning:**

```kotlin
fun handleOAuthLogin(
    provider: OAuthProvider,
    userInfo: OAuthUserInfo,
    organizationId: UUID
): User {
    // Check if user exists with this OAuth provider
    val existingUser = userRepository.findByOAuthProviderAndOAuthProviderId(
        provider.provider.name,
        userInfo.providerId
    )

    if (existingUser != null) {
        return existingUser
    }

    // Check if user exists with this email
    val userByEmail = userRepository.findByEmail(userInfo.email)

    if (userByEmail != null) {
        // Link OAuth account to existing user
        userByEmail.oauthProvider = provider.provider.name
        userByEmail.oauthProviderId = userInfo.providerId
        return userRepository.save(userByEmail)
    }

    // Auto-provision new user if enabled
    if (!provider.autoProvision) {
        throw IllegalStateException(
            "User not found and auto-provisioning is disabled. " +
            "Please create an account first or enable auto-provisioning."
        )
    }

    val newUser = User(
        email = userInfo.email,
        firstName = userInfo.name?.split(" ")?.firstOrNull(),
        lastName = userInfo.name?.split(" ")?.drop(1)?.joinToString(" "),
        role = Role.MEMBER,
        tenantId = organizationId,
        oauthProvider = provider.provider.name,
        oauthProviderId = userInfo.providerId,
        status = UserStatus.ACTIVE,
        // No password for OAuth users
        passwordHash = null
    )

    return userRepository.save(newUser)
}
```

---

## Security Anomaly Detection Algorithms

### 1. Impossible Travel Detection

**Algorithm:**

```kotlin
fun detectImpossibleTravel(currentAttempt: LoginAttempt, userId: UUID): SecurityAlert? {
    val THRESHOLD_KM = 500.0
    val WINDOW_HOURS = 1L

    val since = Instant.now().minus(Duration.ofHours(WINDOW_HOURS))
    val previousAttempts = loginAttemptRepository.findSuccessfulByUserSince(userId, since)
        .filter { it.id != currentAttempt.id }

    if (previousAttempts.isEmpty()) return null

    val previousAttempt = previousAttempts.first()

    val currentLat = currentAttempt.latitude ?: return null
    val currentLon = currentAttempt.longitude ?: return null
    val previousLat = previousAttempt.latitude ?: return null
    val previousLon = previousAttempt.longitude ?: return null

    val distance = haversineDistance(previousLat, previousLon, currentLat, currentLon)

    if (distance > THRESHOLD_KM) {
        val timeDiff = Duration.between(previousAttempt.timestamp, currentAttempt.timestamp).toMinutes()

        return SecurityAlert(
            userId = userId,
            alertType = AlertType.IMPOSSIBLE_TRAVEL,
            severity = AlertSeverity.CRITICAL,
            details = "Login from ${currentAttempt.city ?: "unknown"} (${currentAttempt.country}) " +
                    "detected ${timeDiff} minutes after login from ${previousAttempt.city ?: "unknown"} " +
                    "(${previousAttempt.country}). Distance: ${distance.toInt()} km. " +
                    "IP: ${currentAttempt.ipAddress}",
            loginAttemptId = currentAttempt.id
        )
    }

    return null
}
```

**Haversine Formula:**

```kotlin
fun haversineDistance(lat1: Double, lon1: Double, lat2: Double, lon2: Double): Double {
    val EARTH_RADIUS_KM = 6371.0

    val dLat = Math.toRadians(lat2 - lat1)
    val dLon = Math.toRadians(lon2 - lon1)

    val a = sin(dLat / 2).pow(2) +
            cos(Math.toRadians(lat1)) * cos(Math.toRadians(lat2)) *
            sin(dLon / 2).pow(2)

    val c = 2 * atan2(sqrt(a), sqrt(1 - a))

    return EARTH_RADIUS_KM * c
}
```

### 2. Device Fingerprinting

**Algorithm:**

```kotlin
fun generateDeviceFingerprint(userAgent: String, acceptLanguage: String?, headers: Map<String, String>): String {
    val components = listOf(
        userAgent,
        acceptLanguage ?: "",
        headers["Accept-Encoding"] ?: "",
        headers["Accept"] ?: ""
    ).joinToString("|")

    return DigestUtils.sha256Hex(components)
}
```

**New Device Detection:**

```kotlin
fun detectNewDevice(currentAttempt: LoginAttempt, userId: UUID): SecurityAlert? {
    val deviceFingerprint = currentAttempt.deviceFingerprint ?: return null

    val since = Instant.now().minus(Duration.ofDays(90))
    val knownDevices = loginAttemptRepository.findSuccessfulByUserSince(userId, since)
        .mapNotNull { it.deviceFingerprint }
        .toSet()

    if (deviceFingerprint !in knownDevices) {
        return SecurityAlert(
            userId = userId,
            alertType = AlertType.NEW_DEVICE,
            severity = AlertSeverity.MEDIUM,
            details = "Login from a new device. User agent: ${currentAttempt.userAgent}. " +
                    "Location: ${currentAttempt.city}, ${currentAttempt.country}. " +
                    "IP: ${currentAttempt.ipAddress}",
            loginAttemptId = currentAttempt.id
        )
    }

    return null
}
```

### 3. Brute Force Detection

**Algorithm:**

```kotlin
fun detectBruteForce(ipAddress: String): SecurityAlert? {
    val THRESHOLD = 10
    val WINDOW_MINUTES = 5L

    val since = Instant.now().minus(Duration.ofMinutes(WINDOW_MINUTES))
    val failedCount = loginAttemptRepository.countFailedAttemptsByIpSince(ipAddress, since)

    if (failedCount >= THRESHOLD) {
        val recentAttempt = loginAttemptRepository.findRecentByIp(ipAddress, since).firstOrNull()
        val userId = recentAttempt?.userId ?: return null

        return SecurityAlert(
            userId = userId,
            alertType = AlertType.BRUTE_FORCE,
            severity = AlertSeverity.HIGH,
            details = "Detected $failedCount failed login attempts from IP $ipAddress " +
                    "in the last ${WINDOW_MINUTES} minutes",
            loginAttemptId = recentAttempt.id
        )
    }

    return null
}
```

### 4. Unusual Time Detection

**Statistical Analysis:**

```kotlin
fun detectUnusualTime(currentAttempt: LoginAttempt, userId: UUID): SecurityAlert? {
    val since = Instant.now().minus(Duration.ofDays(30))
    val historicalAttempts = loginAttemptRepository.findSuccessfulByUserSince(userId, since)

    if (historicalAttempts.size < 10) {
        return null // Not enough data
    }

    val historicalHours = historicalAttempts
        .map { LocalTime.ofInstant(it.timestamp, ZoneOffset.UTC).hour }

    val mean = historicalHours.average()
    val variance = historicalHours.map { (it - mean).pow(2) }.average()
    val stdDev = sqrt(variance)

    val currentHour = LocalTime.ofInstant(currentAttempt.timestamp, ZoneOffset.UTC).hour

    if (abs(currentHour - mean) > 2 * stdDev) {
        return SecurityAlert(
            userId = userId,
            alertType = AlertType.UNUSUAL_TIME,
            severity = AlertSeverity.LOW,
            details = "Login at unusual time: ${currentHour}:00 UTC. " +
                    "Typical login hours: ${mean.toInt()}:00 ± ${stdDev.toInt()} hours. " +
                    "IP: ${currentAttempt.ipAddress}",
            loginAttemptId = currentAttempt.id
        )
    }

    return null
}
```

---

## Database Schema

### users

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255), -- NULL for OAuth-only users
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    phone_number VARCHAR(20),
    role VARCHAR(50) NOT NULL,
    tenant_id UUID,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP WITH TIME ZONE,

    -- MFA fields
    mfa_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    mfa_secret VARCHAR(255),
    mfa_verified_at TIMESTAMP WITH TIME ZONE,

    -- OAuth fields
    oauth_provider VARCHAR(50),
    oauth_provider_id VARCHAR(255),

    -- Security preferences
    ip_binding_enabled BOOLEAN NOT NULL DEFAULT FALSE,

    CONSTRAINT fk_users_tenant FOREIGN KEY (tenant_id)
        REFERENCES clubs(id) ON DELETE SET NULL
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_tenant ON users(tenant_id);
CREATE UNIQUE INDEX idx_users_oauth ON users(oauth_provider, oauth_provider_id)
    WHERE oauth_provider IS NOT NULL;
```

### password_history

```sql
CREATE TABLE password_history (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_password_history_user FOREIGN KEY (user_id)
        REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_password_history_user ON password_history(user_id);
CREATE INDEX idx_password_history_user_created ON password_history(user_id, created_at DESC);
```

### login_attempts

```sql
CREATE TABLE login_attempts (
    id UUID PRIMARY KEY,
    user_id UUID,
    email VARCHAR(255) NOT NULL,
    ip_address VARCHAR(45) NOT NULL,
    user_agent VARCHAR(500),
    device_fingerprint VARCHAR(64),
    device_name VARCHAR(100),
    os VARCHAR(50),
    browser VARCHAR(50),
    country VARCHAR(2),
    city VARCHAR(100),
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    attempt_type VARCHAR(20) NOT NULL,
    failure_reason VARCHAR(255),
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    tenant_id UUID,
    flagged_as_suspicious BOOLEAN NOT NULL DEFAULT FALSE,
    acknowledged_at TIMESTAMP WITH TIME ZONE,

    CONSTRAINT fk_login_attempts_user FOREIGN KEY (user_id)
        REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_login_attempts_user ON login_attempts(user_id);
CREATE INDEX idx_login_attempts_email ON login_attempts(email);
CREATE INDEX idx_login_attempts_timestamp ON login_attempts(timestamp DESC);
CREATE INDEX idx_login_attempts_ip ON login_attempts(ip_address);
CREATE INDEX idx_login_attempts_suspicious ON login_attempts(user_id, flagged_as_suspicious)
    WHERE flagged_as_suspicious = TRUE;
```

### refresh_tokens

```sql
CREATE TABLE refresh_tokens (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    token UUID NOT NULL UNIQUE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    revoked_at TIMESTAMP WITH TIME ZONE,
    ip_address VARCHAR(45),

    CONSTRAINT fk_refresh_tokens_user FOREIGN KEY (user_id)
        REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_refresh_tokens_user ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_token ON refresh_tokens(token);
CREATE INDEX idx_refresh_tokens_expires ON refresh_tokens(expires_at);
```

### user_sessions

```sql
CREATE TABLE user_sessions (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    session_id UUID NOT NULL UNIQUE,
    access_token_hash VARCHAR(64),
    device_name VARCHAR(100),
    os VARCHAR(50),
    browser VARCHAR(50),
    ip_address VARCHAR(45) NOT NULL,
    country VARCHAR(2),
    city VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    last_active_at TIMESTAMP WITH TIME ZONE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    revoked_at TIMESTAMP WITH TIME ZONE,

    CONSTRAINT fk_user_sessions_user FOREIGN KEY (user_id)
        REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_user_sessions_user ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_active ON user_sessions(user_id, is_active);
CREATE INDEX idx_user_sessions_session_id ON user_sessions(session_id);
```

### mfa_backup_codes

```sql
CREATE TABLE mfa_backup_codes (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    code_hash VARCHAR(255) NOT NULL,
    used BOOLEAN NOT NULL DEFAULT FALSE,
    used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_mfa_backup_codes_user FOREIGN KEY (user_id)
        REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_mfa_backup_codes_user ON mfa_backup_codes(user_id);
CREATE INDEX idx_mfa_backup_codes_user_unused ON mfa_backup_codes(user_id, used)
    WHERE used = FALSE;
```

### oauth_providers

```sql
CREATE TABLE oauth_providers (
    id UUID PRIMARY KEY,
    organization_id UUID NOT NULL,
    provider VARCHAR(50) NOT NULL,
    client_id VARCHAR(255) NOT NULL,
    client_secret TEXT NOT NULL,
    authorization_uri VARCHAR(500),
    token_uri VARCHAR(500),
    user_info_uri VARCHAR(500),
    scopes TEXT,
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    auto_provision BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,

    CONSTRAINT fk_oauth_providers_org FOREIGN KEY (organization_id)
        REFERENCES organizations(id) ON DELETE CASCADE
);

CREATE INDEX idx_oauth_providers_org ON oauth_providers(organization_id);
CREATE INDEX idx_oauth_providers_enabled ON oauth_providers(organization_id, enabled);
```

### security_alerts

```sql
CREATE TABLE security_alerts (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    alert_type VARCHAR(50) NOT NULL,
    severity VARCHAR(20) NOT NULL,
    details TEXT,
    login_attempt_id UUID,
    resolved BOOLEAN NOT NULL DEFAULT FALSE,
    acknowledged_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,

    CONSTRAINT fk_security_alerts_user FOREIGN KEY (user_id)
        REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_security_alerts_login FOREIGN KEY (login_attempt_id)
        REFERENCES login_attempts(id) ON DELETE SET NULL
);

CREATE INDEX idx_security_alerts_user ON security_alerts(user_id);
CREATE INDEX idx_security_alerts_unresolved ON security_alerts(user_id, resolved);
CREATE INDEX idx_security_alerts_created ON security_alerts(created_at);
```

---

## Environment Variables Reference

### JWT Configuration

```bash
# JWT Secret (must be at least 32 characters)
JWT_SECRET=your-very-secure-secret-key-at-least-32-chars-long

# Token Expiration (milliseconds)
JWT_ACCESS_TOKEN_EXPIRATION=900000        # 15 minutes
JWT_REFRESH_TOKEN_EXPIRATION=604800000    # 7 days
JWT_ABSOLUTE_SESSION_TIMEOUT=86400000     # 24 hours
```

### Database Configuration

```bash
# PostgreSQL Database
DATABASE_URL=jdbc:postgresql://localhost:5432/liyaqa
DATABASE_USERNAME=liyaqa_user
DATABASE_PASSWORD=secure_password_here
```

### Email Configuration

```bash
# Email Service
EMAIL_ENABLED=true
EMAIL_FROM=noreply@liyaqa.com
EMAIL_BASE_URL=https://app.liyaqa.com

# SMTP Settings
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-password
```

### Security Configuration

```bash
# CORS
CORS_ALLOWED_ORIGINS=https://app.liyaqa.com,https://admin.liyaqa.com
CORS_ALLOWED_ORIGIN_PATTERNS=https://*.liyaqa.com

# HSTS (HTTPS Strict Transport Security)
HSTS_ENABLED=true
HSTS_MAX_AGE=31536000  # 1 year

# Content Security Policy
CONTENT_SECURITY_POLICY="default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data: https:;"
```

### OAuth Configuration

OAuth providers are configured in the database, not environment variables. However, you can set defaults:

```bash
# Google OAuth (optional defaults)
OAUTH_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
OAUTH_GOOGLE_CLIENT_SECRET=your-client-secret

# Microsoft OAuth (optional defaults)
OAUTH_MICROSOFT_CLIENT_ID=your-application-id
OAUTH_MICROSOFT_CLIENT_SECRET=your-client-secret
```

### Monitoring & Logging

```bash
# Distributed Tracing
TRACING_SAMPLE_RATE=0.1  # Sample 10% of requests (1.0 = 100% in dev)
ZIPKIN_ENDPOINT=http://localhost:9411/api/v2/spans

# Application Environment
ENVIRONMENT=production  # dev, staging, production
```

---

## Deployment Checklist

### Pre-Deployment

- [ ] **Database Migrations**
  - [ ] Run migrations V100-V107 in order
  - [ ] Verify all tables created successfully
  - [ ] Check indexes are created
  - [ ] Verify foreign key constraints

- [ ] **Environment Variables**
  - [ ] Set strong JWT_SECRET (32+ characters, random)
  - [ ] Configure database credentials
  - [ ] Set CORS allowed origins for production domain
  - [ ] Enable HSTS (HSTS_ENABLED=true)
  - [ ] Configure email SMTP settings
  - [ ] Set production base URL (EMAIL_BASE_URL)

- [ ] **Security Configuration**
  - [ ] Enable TLS 1.3 on load balancer/reverse proxy
  - [ ] Configure HTTPS certificates (Let's Encrypt, etc.)
  - [ ] Set up firewall rules (block ports except 80/443)
  - [ ] Configure rate limiting on authentication endpoints
  - [ ] Set up DDoS protection (Cloudflare, AWS Shield)

- [ ] **OAuth Providers (if using)**
  - [ ] Register OAuth applications with providers
  - [ ] Configure redirect URIs for production domain
  - [ ] Store client secrets in database
  - [ ] Test OAuth flow end-to-end

### Deployment

- [ ] **Application Deployment**
  - [ ] Build production artifacts (`./gradlew build`)
  - [ ] Run security scan (Snyk, Dependabot)
  - [ ] Deploy to production environment
  - [ ] Verify health endpoint: `GET /actuator/health`
  - [ ] Check application logs for errors

- [ ] **Database Configuration**
  - [ ] Enable database encryption at rest
  - [ ] Configure automated backups (every 6 hours)
  - [ ] Test point-in-time recovery
  - [ ] Set up read replicas for high availability

- [ ] **Monitoring Setup**
  - [ ] Configure Prometheus metrics export
  - [ ] Set up Grafana dashboards
  - [ ] Enable distributed tracing (Zipkin/Jaeger)
  - [ ] Configure log aggregation (ELK, Loki)
  - [ ] Set up alerts for security events

### Post-Deployment

- [ ] **Smoke Tests**
  - [ ] Test user registration
  - [ ] Test login (email/password)
  - [ ] Test MFA setup and verification
  - [ ] Test OAuth login (if configured)
  - [ ] Test session refresh
  - [ ] Test session revocation

- [ ] **Security Validation**
  - [ ] Verify HTTPS is enforced (HTTP redirects to HTTPS)
  - [ ] Check HSTS header is present
  - [ ] Verify CSP header is set
  - [ ] Test rate limiting on /api/auth/login
  - [ ] Verify JWT tokens have correct expiration
  - [ ] Check cookies have HttpOnly, Secure, SameSite flags

- [ ] **Performance Testing**
  - [ ] Load test authentication endpoints
  - [ ] Verify response times < 200ms for login
  - [ ] Check database query performance
  - [ ] Monitor memory and CPU usage

- [ ] **Documentation**
  - [ ] Update API documentation (Swagger/OpenAPI)
  - [ ] Provide runbook for common incidents
  - [ ] Document monitoring dashboards
  - [ ] Create on-call guide for security incidents

---

## Migration Guide

### Running Migrations

Liyaqa uses Flyway for database migrations. Migrations are located in:
```
/backend/src/main/resources/db/migration/
```

**Migration Order:**

1. `V100__password_policy.sql` - Password history table
2. `V101__login_audit.sql` - Login attempts audit table
3. `V102__mfa_support.sql` - MFA fields and backup codes
4. `V103__user_sessions.sql` - Session tracking table
5. `V104__oauth_providers.sql` - OAuth provider configuration
6. `V105__security_alerts.sql` - Security anomaly alerts
7. `V106__absolute_session_timeout.sql` - Add absolute timeout field
8. `V107__ip_binding_enabled.sql` - Add IP binding preference

**Execute Manually (if not using Spring Boot auto-migration):**

```bash
# Using Flyway CLI
flyway migrate -url=jdbc:postgresql://localhost:5432/liyaqa \
               -user=liyaqa_user \
               -password=password \
               -locations=filesystem:./src/main/resources/db/migration
```

**Verify Migrations:**

```sql
SELECT version, description, installed_on, success
FROM flyway_schema_history
ORDER BY installed_rank;
```

### Rollback Strategy

Flyway doesn't support automatic rollback. For critical issues:

1. **Create Rollback Scripts** (manually):

```sql
-- V100_rollback.sql
DROP TABLE IF EXISTS password_history CASCADE;
-- Repeat for each migration
```

2. **Restore from Backup:**

```bash
pg_restore -U liyaqa_user -d liyaqa /path/to/backup.dump
```

### Data Migration for Existing Users

If deploying to existing system with users:

**V100 (Password History):**
- Existing password hashes are NOT added to history
- History tracking starts from next password change
- No user action required

**V102 (MFA Support):**
- All existing users have `mfa_enabled = FALSE`
- Users must opt-in to MFA manually
- No forced migration

**V104 (OAuth):**
- Existing users can link OAuth accounts after deployment
- `oauth_provider` and `oauth_provider_id` are NULL for existing users
- Users can continue using email/password

---

## Troubleshooting Common Issues

### Issue: JWT Token Invalid / Signature Verification Failed

**Symptoms:**
- 401 Unauthorized on API requests
- Error: "JWT signature does not match"

**Causes:**
1. JWT_SECRET changed between token issuance and verification
2. Clock skew between servers
3. Token was issued by different environment (dev vs prod)

**Solutions:**

```bash
# 1. Check JWT_SECRET is consistent
echo $JWT_SECRET

# 2. Verify server time is synchronized
timedatectl  # Linux
systemsetup -gettimezone  # macOS

# 3. Decode JWT to inspect claims
# Use jwt.io or:
echo "eyJhbGciOiJ..." | cut -d'.' -f2 | base64 -d | jq
```

### Issue: Account Locked After Login Attempts

**Symptoms:**
- User cannot login even with correct password
- Error: "Account is locked"

**Cause:**
- 5 failed login attempts within short time

**Solution:**

**As Admin (unlock account):**

```sql
-- Find the user
SELECT id, email, status FROM users WHERE email = 'user@example.com';

-- Check lockout time
SELECT timestamp, attempt_type FROM login_attempts
WHERE user_id = 'user-uuid'
ORDER BY timestamp DESC
LIMIT 10;

-- Account auto-unlocks after 15 minutes
-- To unlock manually (emergency only):
UPDATE users SET status = 'ACTIVE' WHERE id = 'user-uuid';
```

**As User:**
- Wait 15 minutes for automatic unlock
- Use "Forgot Password" to reset password
- Contact support for immediate unlock

### Issue: MFA Code Not Working

**Symptoms:**
- 6-digit code from authenticator app rejected
- Error: "Invalid MFA code"

**Causes:**
1. Clock skew on phone or server
2. User entered code from wrong account
3. Code expired (30-second window)

**Solutions:**

**Check Server Time:**

```bash
# Server time must be synchronized
date
ntpq -p  # Check NTP sync
```

**Check Code Validity:**

```kotlin
// Manually verify TOTP
val secret = user.mfaSecret  // From database
val code = "123456"  // From user

val isValid = TotpGenerator.verifyTOTP(secret, code, windowSize = 2)
println("Code valid: $isValid")
```

**User Solutions:**
- Ensure phone time is set to "Automatic"
- Try entering code quickly (before 30-second expiry)
- Use backup code if TOTP consistently fails
- Re-setup MFA (disable and re-enable)

### Issue: OAuth Login Fails

**Symptoms:**
- Redirect to OAuth provider works
- Callback fails with error

**Causes:**
1. Redirect URI mismatch
2. Invalid client secret
3. OAuth provider configuration disabled

**Debug Steps:**

```bash
# 1. Check OAuth provider configuration
SELECT * FROM oauth_providers WHERE organization_id = 'org-uuid';

# 2. Verify redirect URI matches exactly
# Production: https://app.liyaqa.com/api/auth/oauth/callback/google
# Dev: http://localhost:8080/api/auth/oauth/callback/google

# 3. Check OAuth provider logs (Google Cloud Console, Azure Portal)

# 4. Test token exchange manually
curl -X POST https://oauth2.googleapis.com/token \
  -d "code=AUTHORIZATION_CODE" \
  -d "client_id=YOUR_CLIENT_ID" \
  -d "client_secret=YOUR_CLIENT_SECRET" \
  -d "redirect_uri=YOUR_REDIRECT_URI" \
  -d "grant_type=authorization_code"
```

### Issue: Sessions Not Refreshing

**Symptoms:**
- Access token expires after 15 minutes
- Refresh request returns 401 Unauthorized

**Causes:**
1. Refresh token expired (7 days)
2. IP binding enabled but IP changed
3. Absolute timeout exceeded (24 hours)
4. Refresh token was revoked

**Debug:**

```sql
-- Check refresh token
SELECT
    rt.token,
    rt.expires_at,
    rt.revoked_at,
    rt.ip_address,
    us.created_at as session_created,
    EXTRACT(EPOCH FROM (NOW() - us.created_at)) / 3600 as session_age_hours
FROM refresh_tokens rt
JOIN user_sessions us ON rt.user_id = us.user_id
WHERE rt.token = 'refresh-token-uuid';
```

**Solutions:**
- If expired: Re-login required
- If IP mismatch: Disable IP binding or re-login from current IP
- If absolute timeout: This is by design - re-login required
- If revoked: Re-login (may indicate security action)

### Issue: Security Alerts Not Triggering

**Symptoms:**
- User logs in from new device/location
- No alert created in security_alerts table

**Causes:**
1. GeoIP database not configured (latitude/longitude NULL)
2. Anomaly detection disabled
3. Insufficient historical data

**Debug:**

```sql
-- Check if login attempts have geolocation data
SELECT ip_address, country, city, latitude, longitude
FROM login_attempts
WHERE user_id = 'user-uuid'
ORDER BY timestamp DESC
LIMIT 5;

-- Check if alerts are being created
SELECT COUNT(*) FROM security_alerts
WHERE created_at > NOW() - INTERVAL '24 hours';

-- Check SecurityAnomalyService logs
tail -f /var/log/liyaqa/application.log | grep SecurityAnomalyService
```

**Solutions:**
1. Geolocation is not fully implemented (requires GeoIP2 integration)
2. New device/location detection requires 10+ historical logins
3. Impossible travel requires latitude/longitude data

### Issue: Database Connection Pool Exhausted

**Symptoms:**
- Intermittent 500 errors
- Error: "Unable to acquire JDBC Connection"

**Causes:**
- Too many concurrent sessions
- Slow queries blocking connections
- Connection leak (not closed properly)

**Debug:**

```sql
-- Check active connections
SELECT COUNT(*) FROM pg_stat_activity WHERE datname = 'liyaqa';

-- Check long-running queries
SELECT pid, now() - pg_stat_activity.query_start AS duration, query
FROM pg_stat_activity
WHERE state = 'active'
ORDER BY duration DESC;
```

**Solutions:**

```yaml
# Increase connection pool size
spring:
  datasource:
    hikari:
      maximum-pool-size: 50  # Increase from 30
      minimum-idle: 10
      connection-timeout: 30000
```

### Issue: Email Notifications Not Sending

**Symptoms:**
- Account locked emails not received
- Security alert emails not sent

**Debug:**

```bash
# Check email configuration
echo $EMAIL_ENABLED
echo $SMTP_HOST
echo $SMTP_USERNAME

# Test SMTP connection
telnet smtp.gmail.com 587

# Check application logs
tail -f /var/log/liyaqa/application.log | grep SecurityEmailService
```

**Solutions:**
1. Verify EMAIL_ENABLED=true
2. Check SMTP credentials
3. For Gmail: Use App Password, not account password
4. Check spam folder
5. Verify firewall allows outbound port 587/465

---

## Performance Optimization

### Database Indexes

All critical indexes are created by migrations, but verify:

```sql
-- Verify indexes exist
SELECT tablename, indexname FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN ('users', 'login_attempts', 'user_sessions', 'refresh_tokens')
ORDER BY tablename, indexname;
```

### Query Optimization

**Slow Query Example:**

```sql
-- SLOW: Full table scan
SELECT * FROM login_attempts WHERE email = 'user@example.com';

-- FAST: Uses index
SELECT * FROM login_attempts WHERE user_id = 'uuid';
```

**Recommend:**
- Always query by `user_id` instead of `email` when possible
- Use pagination for large result sets
- Add LIMIT to all queries

### Caching Strategy

**Redis Cache Configuration:**

```kotlin
@Cacheable("users")
fun getUserById(userId: UUID): User {
    return userRepository.findById(userId)
        .orElseThrow { NoSuchElementException("User not found") }
}

@CacheEvict("users", key = "#userId")
fun updateUser(userId: UUID, updates: UserUpdateRequest) {
    // Update user
}
```

**What to Cache:**
- User profiles (15-minute TTL)
- MFA status (5-minute TTL)
- OAuth provider configurations (1-hour TTL)
- Security preferences (15-minute TTL)

**What NOT to Cache:**
- Access tokens (already short-lived)
- Security alerts (must be real-time)
- Login attempts (audit trail)

---

## Security Best Practices

### Input Validation

```kotlin
// GOOD: Validate and sanitize all inputs
@PostMapping("/api/auth/login")
fun login(@Valid @RequestBody request: LoginRequest) {
    // @Valid triggers validation
    // Email format, password length checked by annotations
}

data class LoginRequest(
    @field:Email(message = "Invalid email format")
    val email: String,

    @field:Size(min = 8, max = 100, message = "Password must be 8-100 characters")
    val password: String
)

// BAD: No validation
fun login(email: String, password: String) {
    // Direct database query with user input
}
```

### SQL Injection Prevention

```kotlin
// GOOD: Use parameterized queries (JPA does this automatically)
@Query("SELECT u FROM User u WHERE u.email = :email")
fun findByEmail(@Param("email") email: String): User?

// BAD: String concatenation (DO NOT DO THIS)
val query = "SELECT * FROM users WHERE email = '$email'"  // VULNERABLE!
```

### XSS Prevention

```kotlin
// GOOD: Return JSON (auto-escaped by Jackson)
return ResponseEntity.ok(UserResponse.from(user))

// BAD: Return HTML with user input
return "<div>${user.name}</div>"  // VULNERABLE if name contains <script>
```

### CSRF Protection

Cookie-based authentication requires CSRF protection:

```kotlin
// Backend: Generate CSRF token
val csrfToken = csrfTokenProvider.generateToken(userId)
response.addHeader("X-CSRF-Token", csrfToken)

// Frontend: Include CSRF token in requests
headers: {
    'X-CSRF-Token': csrfToken
}

// Backend: Validate CSRF token
@PostMapping("/api/auth/change-password")
fun changePassword(
    @RequestHeader("X-CSRF-Token") csrfToken: String,
    @AuthenticationPrincipal principal: JwtUserPrincipal
) {
    csrfTokenProvider.validateToken(principal.userId, csrfToken)
    // Process request
}
```

### Rate Limiting

```kotlin
@Configuration
class RateLimitConfig {
    @Bean
    fun rateLimiter(): RateLimiter {
        return RateLimiter.create(10.0) // 10 requests per second
    }
}

@RestController
class AuthController(
    private val rateLimiter: RateLimiter
) {
    @PostMapping("/api/auth/login")
    fun login(@RequestBody request: LoginRequest): ResponseEntity<*> {
        if (!rateLimiter.tryAcquire()) {
            return ResponseEntity.status(429)
                .body("Too many requests. Please try again later.")
        }
        // Process login
    }
}
```

---

## Appendix

### Useful SQL Queries

**User Security Overview:**

```sql
SELECT
    u.id,
    u.email,
    u.role,
    u.mfa_enabled,
    u.ip_binding_enabled,
    u.oauth_provider,
    COUNT(DISTINCT s.id) as active_sessions,
    COUNT(DISTINCT la.id) FILTER (WHERE la.timestamp > NOW() - INTERVAL '30 days') as login_count_30d,
    COUNT(DISTINCT sa.id) FILTER (WHERE sa.resolved = FALSE) as unresolved_alerts
FROM users u
LEFT JOIN user_sessions s ON u.id = s.user_id AND s.is_active = TRUE
LEFT JOIN login_attempts la ON u.id = la.user_id
LEFT JOIN security_alerts sa ON u.id = sa.user_id
WHERE u.id = 'user-uuid'
GROUP BY u.id;
```

**Security Dashboard:**

```sql
SELECT
    DATE(created_at) as date,
    COUNT(*) FILTER (WHERE alert_type = 'IMPOSSIBLE_TRAVEL') as impossible_travel,
    COUNT(*) FILTER (WHERE alert_type = 'BRUTE_FORCE') as brute_force,
    COUNT(*) FILTER (WHERE alert_type = 'NEW_DEVICE') as new_device,
    COUNT(*) FILTER (WHERE alert_type = 'NEW_LOCATION') as new_location,
    COUNT(*) FILTER (WHERE alert_type = 'UNUSUAL_TIME') as unusual_time
FROM security_alerts
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;
```

---

**Document Version:** 1.0
**Last Updated:** February 1, 2026
**Next Review:** May 1, 2026

© 2026 Liyaqa. All rights reserved. Confidential - For Development Team Only.
