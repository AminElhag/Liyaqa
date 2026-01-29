# Liyaqa API Reference

**REST API Documentation**

---

## Table of Contents

1. [API Overview](#1-api-overview)
2. [Authentication](#2-authentication)
3. [Core Endpoints](#3-core-endpoints)
4. [Error Handling](#4-error-handling)
5. [Pagination & Filtering](#5-pagination--filtering)
6. [Webhook Events](#6-webhook-events)

---

## 1. API Overview

### 1.1 Base URL

**Production**: `https://api.liyaqa.com`
**Staging**: `https://api-staging.liyaqa.com`
**Development**: `http://localhost:8080`

### 1.2 API Versioning

Currently: **v1** (implicit, no version in URL)
Future: `/api/v2/...` when breaking changes introduced

### 1.3 Content Type

All requests and responses use `application/json`

### 1.4 Rate Limiting

- **Authenticated requests**: 1000 requests/hour
- **Unauthenticated requests**: 100 requests/hour
- Rate limit headers included in response:
  - `X-RateLimit-Limit`: Total requests allowed
  - `X-RateLimit-Remaining`: Requests remaining
  - `X-RateLimit-Reset`: Unix timestamp when limit resets

---

## 2. Authentication

### 2.1 JWT Authentication

**Login**:
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "admin@fitlife.com",
  "password": "securepassword"
}
```

**Response**:
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
  "expiresIn": 900,
  "tokenType": "Bearer",
  "user": {
    "id": "user-uuid",
    "email": "admin@fitlife.com",
    "role": "CLUB_ADMIN",
    "organizationId": "org-uuid"
  }
}
```

**Authenticated Requests**:
```http
GET /api/members
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
X-Organization-Id: org-uuid  (optional, extracted from JWT)
```

**Refresh Token**:
```http
POST /api/auth/refresh
Content-Type: application/json

{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

### 2.2 API Keys (Future)

For server-to-server integrations, API keys will be supported:
```http
GET /api/members
X-API-Key: liyaqa_api_key_xxxxxxxxxxxxx
```

---

## 3. Core Endpoints

### 3.1 Member Management

**List Members**:
```http
GET /api/members?status=ACTIVE&page=0&size=20
Authorization: Bearer {token}
```

**Response**:
```json
{
  "data": [
    {
      "id": "member-uuid",
      "firstName": "Ahmed",
      "lastName": "Al-Saud",
      "email": "ahmed@example.com",
      "phone": "+966501234567",
      "status": "ACTIVE",
      "memberNumber": "M001234",
      "createdAt": "2024-01-15T10:00:00Z"
    }
  ],
  "meta": {
    "page": 0,
    "pageSize": 20,
    "totalElements": 157,
    "totalPages": 8
  }
}
```

**Create Member**:
```http
POST /api/members
Authorization: Bearer {token}
Content-Type: application/json

{
  "firstName": "Mohammed",
  "lastName": "Ahmed",
  "email": "mohammed@example.com",
  "phone": "+966501234567",
  "dateOfBirth": "1990-05-15",
  "gender": "MALE"
}
```

**Get Member**:
```http
GET /api/members/{memberId}
Authorization: Bearer {token}
```

**Update Member**:
```http
PUT /api/members/{memberId}
Authorization: Bearer {token}
Content-Type: application/json

{
  "firstName": "Mohammed",
  "lastName": "Ahmed Al-Saud",
  "phone": "+966509876543"
}
```

---

### 3.2 Subscription Management

**Create Subscription**:
```http
POST /api/subscriptions
Authorization: Bearer {token}
Content-Type: application/json

{
  "memberId": "member-uuid",
  "planId": "plan-uuid",
  "startDate": "2024-02-01",
  "autoRenew": true
}
```

**List Member Subscriptions**:
```http
GET /api/members/{memberId}/subscriptions
Authorization: Bearer {token}
```

**Cancel Subscription**:
```http
POST /api/subscriptions/{subscriptionId}/cancel
Authorization: Bearer {token}
Content-Type: application/json

{
  "reason": "MEMBER_REQUEST",
  "effectiveDate": "2024-03-01",
  "refund": false
}
```

---

### 3.3 Class Booking

**List Classes**:
```http
GET /api/classes?date=2024-02-01&clubId={clubId}
Authorization: Bearer {token}
```

**Response**:
```json
{
  "data": [
    {
      "id": "session-uuid",
      "class": {
        "id": "class-uuid",
        "name": "Yoga Flow",
        "nameAr": "يوجا فلو",
        "duration": 60,
        "difficulty": "INTERMEDIATE"
      },
      "startTime": "2024-02-01T08:00:00Z",
      "endTime": "2024-02-01T09:00:00Z",
      "trainer": {
        "id": "trainer-uuid",
        "name": "Sarah Johnson"
      },
      "location": "Studio A",
      "capacity": 20,
      "bookedCount": 15,
      "available": true
    }
  ]
}
```

**Book Class**:
```http
POST /api/bookings
Authorization: Bearer {token}
Content-Type: application/json

{
  "sessionId": "session-uuid",
  "memberId": "member-uuid"
}
```

**Cancel Booking**:
```http
DELETE /api/bookings/{bookingId}
Authorization: Bearer {token}
```

---

### 3.4 Invoicing & Payments

**Create Invoice**:
```http
POST /api/invoices
Authorization: Bearer {token}
Content-Type: application/json

{
  "memberId": "member-uuid",
  "dueDate": "2024-02-15",
  "lineItems": [
    {
      "description": "Monthly Membership - Premium",
      "quantity": 1,
      "unitPrice": 500.00,
      "taxRate": 15.00
    }
  ]
}
```

**Response**:
```json
{
  "id": "invoice-uuid",
  "invoiceNumber": "INV-2024-001234",
  "memberId": "member-uuid",
  "invoiceDate": "2024-02-01",
  "dueDate": "2024-02-15",
  "subtotal": 500.00,
  "taxAmount": 75.00,
  "totalAmount": 575.00,
  "paidAmount": 0.00,
  "status": "ISSUED",
  "lineItems": [...]
}
```

**Process Payment**:
```http
POST /api/payments
Authorization: Bearer {token}
Content-Type: application/json

{
  "invoiceId": "invoice-uuid",
  "amount": 575.00,
  "paymentMethod": "CARD",
  "gateway": "PAYTABS"
}
```

**Response** (PayTabs redirect):
```json
{
  "paymentUrl": "https://secure.paytabs.sa/payment/request/abc123",
  "redirectMethod": "GET"
}
```

---

### 3.5 CRM & Leads

**Create Lead**:
```http
POST /api/leads
Authorization: Bearer {token}
Content-Type: application/json

{
  "firstName": "Fatima",
  "lastName": "Mohammed",
  "email": "fatima@example.com",
  "phone": "+966501234567",
  "source": "WEBSITE",
  "notes": "Interested in family membership"
}
```

**Update Lead Status**:
```http
PATCH /api/leads/{leadId}
Authorization: Bearer {token}
Content-Type: application/json

{
  "status": "CONTACTED",
  "stage": "TOUR_SCHEDULED"
}
```

**Convert Lead to Member**:
```http
POST /api/leads/{leadId}/convert
Authorization: Bearer {token}
Content-Type: application/json

{
  "planId": "plan-uuid",
  "startDate": "2024-02-01"
}
```

---

### 3.6 Attendance

**Check-In Member**:
```http
POST /api/attendance/check-in
Authorization: Bearer {token}
Content-Type: application/json

{
  "memberId": "member-uuid",
  "clubId": "club-uuid",
  "method": "QR_CODE"
}
```

**Response**:
```json
{
  "id": "attendance-uuid",
  "member": {
    "id": "member-uuid",
    "name": "Ahmed Al-Saud",
    "memberNumber": "M001234"
  },
  "checkInTime": "2024-02-01T10:30:00Z",
  "status": "CHECKED_IN"
}
```

**Check-Out**:
```http
POST /api/attendance/{attendanceId}/check-out
Authorization: Bearer {token}
```

---

### 3.7 Marketing Campaigns

**Create Campaign**:
```http
POST /api/campaigns
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "February Promotion",
  "type": "ONE_TIME",
  "channel": "EMAIL",
  "segmentId": "segment-uuid",
  "subject": "Special Offer: 20% Off",
  "content": "<html>...</html>",
  "sendAt": "2024-02-01T09:00:00Z"
}
```

**Get Campaign Analytics**:
```http
GET /api/campaigns/{campaignId}/analytics
Authorization: Bearer {token}
```

**Response**:
```json
{
  "campaignId": "campaign-uuid",
  "sentCount": 1000,
  "deliveredCount": 980,
  "openedCount": 350,
  "clickedCount": 89,
  "convertedCount": 12,
  "openRate": 35.7,
  "clickRate": 25.4,
  "conversionRate": 13.5
}
```

---

### 3.8 Platform APIs (B2B)

**Create Client Organization**:
```http
POST /api/platform/clients
Authorization: Bearer {platform_admin_token}
Content-Type: application/json

{
  "name": "FitLife Saudi Arabia",
  "slug": "fitlife",
  "email": "admin@fitlife.com",
  "planId": "growth-plan-uuid",
  "adminUser": {
    "firstName": "Ahmed",
    "lastName": "Al-Saud",
    "email": "ahmed@fitlife.com"
  }
}
```

**Get Client Health Score**:
```http
GET /api/platform/clients/{clientId}/health
Authorization: Bearer {platform_admin_token}
```

**Response**:
```json
{
  "clientId": "org-uuid",
  "overallScore": 78,
  "usageScore": 85,
  "engagementScore": 72,
  "paymentScore": 90,
  "supportScore": 65,
  "riskLevel": "MONITOR",
  "trend": "STABLE",
  "lastCalculated": "2024-02-01T00:00:00Z"
}
```

---

## 4. Error Handling

### 4.1 Error Response Format

```json
{
  "error": {
    "code": "MEMBER_NOT_FOUND",
    "message": "Member with ID abc-123 not found",
    "timestamp": "2024-01-15T10:30:00Z",
    "path": "/api/members/abc-123",
    "details": {}
  }
}
```

### 4.2 HTTP Status Codes

| Status Code | Meaning | Use Case |
|-------------|---------|----------|
| **200 OK** | Success | Successful GET, PUT, PATCH requests |
| **201 Created** | Resource created | Successful POST creating resource |
| **204 No Content** | Success, no body | Successful DELETE |
| **400 Bad Request** | Invalid input | Validation error |
| **401 Unauthorized** | Authentication required | Missing or invalid token |
| **403 Forbidden** | Insufficient permissions | Valid token, no permission |
| **404 Not Found** | Resource not found | Invalid ID or deleted resource |
| **409 Conflict** | Conflicting state | Duplicate email, constraint violation |
| **422 Unprocessable Entity** | Validation failed | Business rule violation |
| **429 Too Many Requests** | Rate limit exceeded | Exceeded rate limit |
| **500 Internal Server Error** | Server error | Unexpected server error |

### 4.3 Common Error Codes

| Error Code | Description |
|------------|-------------|
| `VALIDATION_ERROR` | Input validation failed |
| `MEMBER_NOT_FOUND` | Member does not exist |
| `DUPLICATE_EMAIL` | Email already registered |
| `SUBSCRIPTION_NOT_FOUND` | Subscription does not exist |
| `INSUFFICIENT_BALANCE` | Wallet balance too low |
| `CLASS_FULL` | Class reached capacity |
| `BOOKING_ALREADY_EXISTS` | Already booked this session |
| `UNAUTHORIZED` | Authentication required |
| `FORBIDDEN` | Insufficient permissions |
| `PAYMENT_FAILED` | Payment processing failed |
| `INVALID_TOKEN` | JWT token invalid or expired |

---

## 5. Pagination & Filtering

### 5.1 Pagination

**Request Parameters**:
- `page`: Page number (0-indexed, default: 0)
- `size`: Page size (default: 20, max: 100)
- `sort`: Sort field and direction (e.g., `createdAt,desc`)

**Example**:
```http
GET /api/members?page=2&size=50&sort=createdAt,desc
```

**Response Meta**:
```json
{
  "data": [...],
  "meta": {
    "page": 2,
    "pageSize": 50,
    "totalElements": 1250,
    "totalPages": 25,
    "first": false,
    "last": false
  }
}
```

### 5.2 Filtering

**Common Filters**:
- `status`: Filter by status (e.g., `status=ACTIVE`)
- `search`: Text search (e.g., `search=ahmed`)
- `from`, `to`: Date range (e.g., `from=2024-01-01&to=2024-01-31`)
- `clubId`: Filter by club
- `planId`: Filter by membership plan

**Example**:
```http
GET /api/members?status=ACTIVE&search=ahmed&clubId={clubId}&page=0&size=20
```

### 5.3 Sorting

**Sort Format**: `field,direction`

**Examples**:
- `sort=createdAt,desc` - Newest first
- `sort=lastName,asc` - Alphabetical by last name
- `sort=email,asc` - Alphabetical by email

---

## 6. Webhook Events

### 6.1 Event Types

**Member Events**:
- `member.created` - New member registered
- `member.updated` - Member information updated
- `member.deleted` - Member deleted (soft delete)
- `member.activated` - Member status changed to ACTIVE
- `member.suspended` - Member suspended

**Subscription Events**:
- `subscription.created` - New subscription created
- `subscription.renewed` - Subscription renewed
- `subscription.expired` - Subscription expired
- `subscription.cancelled` - Subscription cancelled
- `subscription.frozen` - Subscription frozen

**Payment Events**:
- `payment.completed` - Payment successful
- `payment.failed` - Payment failed
- `payment.refunded` - Payment refunded

**Booking Events**:
- `booking.created` - Class booked
- `booking.cancelled` - Booking cancelled
- `booking.completed` - Class completed (attendance marked)

**Invoice Events**:
- `invoice.created` - Invoice generated
- `invoice.paid` - Invoice paid
- `invoice.overdue` - Invoice past due date

**Attendance Events**:
- `attendance.checkin` - Member checked in
- `attendance.checkout` - Member checked out

### 6.2 Webhook Payload Example

```json
{
  "id": "event-uuid",
  "type": "member.created",
  "timestamp": "2024-01-15T10:00:00Z",
  "organizationId": "org-uuid",
  "data": {
    "id": "member-uuid",
    "firstName": "Ahmed",
    "lastName": "Al-Saud",
    "email": "ahmed@example.com",
    "phone": "+966501234567",
    "status": "ACTIVE",
    "createdAt": "2024-01-15T10:00:00Z"
  }
}
```

### 6.3 Webhook Security

**Signature Verification**:
```http
POST https://partner.com/webhooks/liyaqa
Content-Type: application/json
X-Liyaqa-Signature: sha256=abc123...
X-Liyaqa-Event: member.created

{payload}
```

**Verify Signature** (Node.js example):
```javascript
const crypto = require('crypto');

function verifySignature(payload, signature, secret) {
  const expected = 'sha256=' + crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expected)
  );
}
```

---

## 7. API Documentation (Swagger)

**Interactive API Documentation**:
- **URL**: `https://api.liyaqa.com/swagger-ui.html`
- **OpenAPI Spec**: `https://api.liyaqa.com/api-docs`

**Features**:
- Try API endpoints directly from browser
- See request/response schemas
- View authentication requirements
- Test with your API token

---

## Summary

Liyaqa API provides:
- **RESTful design** with predictable URLs
- **JWT authentication** for security
- **97+ controllers** with 150+ endpoints
- **Comprehensive error handling** with clear error codes
- **Pagination and filtering** for large datasets
- **Webhook system** for event-driven integrations
- **OpenAPI documentation** for interactive testing

For detailed API documentation, visit the Swagger UI at `/swagger-ui.html` when the backend is running.

---

*Last Updated: January 2026*
*Version: 1.0*
