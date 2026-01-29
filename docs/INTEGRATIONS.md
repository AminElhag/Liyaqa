# Liyaqa Integrations Guide

**Complete Integration Documentation**

---

## Table of Contents

1. [Payment Gateway Integrations](#1-payment-gateway-integrations)
2. [Communication Channel Integrations](#2-communication-channel-integrations)
3. [Compliance Integrations](#3-compliance-integrations)
4. [Equipment Provider Integrations](#4-equipment-provider-integrations)
5. [Wearable Device Integrations](#5-wearable-device-integrations)
6. [Webhook System](#6-webhook-system)

---

## 1. Payment Gateway Integrations

### 1.1 PayTabs (Primary Card Processor)

**Purpose**: Process credit/debit card payments (Visa, Mastercard, Mada)

**Supported Regions**: Saudi Arabia, UAE, Egypt, Jordan, and more

**Configuration**:
```yaml
liyaqa:
  payment:
    paytabs:
      profile-id: ${PAYTABS_PROFILE_ID}
      server-key: ${PAYTABS_SERVER_KEY}
      region: SAU  # Saudi Arabia
      currency: SAR
      callback-url: https://api.liyaqa.com/api/payments/paytabs/callback
      return-url: https://app.liyaqa.com/payment/complete
```

**Payment Flow**:
1. Backend creates payment session with PayTabs API
2. Returns payment URL to frontend
3. Frontend redirects member to PayTabs payment page
4. Member completes payment
5. PayTabs sends webhook callback to backend
6. Backend updates invoice status
7. Member redirected to return URL with payment result

**API Integration**:
```kotlin
@Service
class PayTabsService {
    fun initiatePayment(invoice: Invoice): PaymentInitiationResponse {
        val request = PayTabsPaymentRequest(
            profile_id = config.profileId,
            tran_type = "sale",
            tran_class = "ecom",
            cart_id = invoice.id.toString(),
            cart_description = "Invoice ${invoice.invoiceNumber}",
            cart_currency = "SAR",
            cart_amount = invoice.totalAmount,
            callback = config.callbackUrl,
            return = config.returnUrl
        )

        return httpClient.post("/payment/request", request)
    }
}
```

**Testing**:
- Test cards: PayTabs provides test card numbers for sandbox
- Sandbox URL: `https://secure-egypt.paytabs.com`
- Production URL: `https://secure.paytabs.sa`

**Security**:
- Server-key kept secret in environment variables
- HTTPS-only communication
- Signature verification on webhook callbacks

---

### 1.2 STC Pay (Digital Wallet)

**Purpose**: Saudi Telecom Company digital wallet payments

**Why STC Pay**: 70%+ Saudi smartphone users have STC Pay

**Configuration**:
```yaml
liyaqa:
  payment:
    stcpay:
      merchant-id: ${STCPAY_MERCHANT_ID}
      api-key: ${STCPAY_API_KEY}
      callback-url: https://api.liyaqa.com/api/payments/stcpay/callback
```

**Payment Flow**:
1. Backend generates STC Pay payment QR code
2. Frontend displays QR code to member
3. Member scans with STC Pay app
4. Member authorizes payment in app
5. STC Pay sends webhook to backend
6. Backend updates invoice status

**Mobile Integration**:
- Deep link to STC Pay app: `stcpay://pay?amount=...&merchantId=...`
- Fallback to QR code display

---

### 1.3 SADAD (Bank Transfer System)

**Purpose**: Saudi Arabia bank transfer and bill payment system

**Configuration**:
```yaml
liyaqa:
  payment:
    sadad:
      biller-id: ${SADAD_BILLER_ID}
      secret-key: ${SADAD_SECRET_KEY}
```

**Payment Flow**:
1. Backend registers bill with SADAD
2. Returns SADAD bill number to member
3. Member pays via bank (online banking, ATM, or branch)
4. SADAD sends payment confirmation
5. Backend updates invoice status

**Use Cases**:
- Members without credit cards
- Corporate account payments
- Bulk payments

---

### 1.4 Tamara (Buy Now Pay Later)

**Purpose**: BNPL (Buy Now Pay Later) for installment payments

**Configuration**:
```yaml
liyaqa:
  payment:
    tamara:
      api-url: https://api.tamara.co
      api-token: ${TAMARA_API_TOKEN}
      merchant-url: https://app.liyaqa.com
      notification-url: https://api.liyaqa.com/api/payments/tamara/webhook
```

**Payment Flow**:
1. Check if member is eligible (Tamara API)
2. Create Tamara checkout session
3. Redirect member to Tamara
4. Member selects installment plan (3, 6, 12 months)
5. Tamara approves or declines
6. Backend receives webhook
7. Update invoice status

**Eligibility**:
- Minimum order amount (typically 100 SAR)
- Maximum order amount (varies by member credit)
- Saudi Arabia residents only

---

## 2. Communication Channel Integrations

### 2.1 Email (SMTP)

**Purpose**: Transactional and marketing emails

**Configuration**:
```yaml
liyaqa:
  email:
    enabled: true
    from-address: noreply@liyaqa.com
    from-name: Liyaqa
    base-url: https://app.liyaqa.com

spring:
  mail:
    host: ${SMTP_HOST}
    port: ${SMTP_PORT:587}
    username: ${SMTP_USERNAME}
    password: ${SMTP_PASSWORD}
    properties:
      mail.smtp.auth: true
      mail.smtp.starttls.enable: true
```

**Supported Providers**:
- SendGrid
- AWS SES
- Mailgun
- Any SMTP server

**Email Types**:
- Welcome emails
- Booking confirmations
- Payment receipts
- Invoice notifications
- Password reset
- Marketing campaigns

**Template System**:
```kotlin
@Service
class EmailService {
    fun sendBookingConfirmation(booking: ClassBooking) {
        val template = templateEngine.process("booking-confirmation", mapOf(
            "memberName" to booking.member.fullName,
            "className" to booking.session.gymClass.name,
            "dateTime" to booking.session.startTime.format(),
            "location" to booking.session.location
        ))

        send(
            to = booking.member.email,
            subject = "Class Booking Confirmed",
            htmlBody = template
        )
    }
}
```

---

### 2.2 SMS (Twilio)

**Purpose**: SMS notifications and OTP verification

**Configuration**:
```yaml
liyaqa:
  sms:
    enabled: true
    provider: twilio
    twilio:
      account-sid: ${TWILIO_ACCOUNT_SID}
      auth-token: ${TWILIO_AUTH_TOKEN}
      from-number: ${TWILIO_FROM_NUMBER}
```

**Use Cases**:
- Booking reminders
- Payment notifications
- OTP verification
- Class cancellations
- Emergency alerts

**Integration**:
```kotlin
@Service
class SmsService {
    fun sendBookingReminder(booking: ClassBooking) {
        val message = "Reminder: ${booking.session.gymClass.name} class " +
                     "starts in 1 hour at ${booking.session.location}"

        twilioClient.messages.create(
            to = PhoneNumber(booking.member.phone),
            from = PhoneNumber(twilioFromNumber),
            body = message
        )
    }
}
```

**Cost Optimization**:
- Character limit enforcement (160 chars for single SMS)
- Arabic SMS: 70 chars per segment
- Rate limiting per member
- Preference-based opt-in

---

### 2.3 WhatsApp Business API

**Purpose**: Rich messaging via WhatsApp (95%+ penetration in Saudi Arabia)

**Configuration**:
```yaml
liyaqa:
  whatsapp:
    enabled: true
    provider: twilio  # or Meta Cloud API
    business-phone-number-id: ${WHATSAPP_BUSINESS_PHONE_ID}
    access-token: ${WHATSAPP_ACCESS_TOKEN}
```

**Supported Message Types**:
- **Text Messages**: Booking confirmations, reminders
- **Media Messages**: Images (class photos, invoices)
- **Document Messages**: PDF invoices, contracts
- **Template Messages**: Pre-approved marketing templates
- **Interactive Messages**: Buttons, lists

**Template Example**:
```json
{
  "name": "booking_confirmation",
  "language": "en",
  "components": [
    {
      "type": "body",
      "parameters": [
        {"type": "text", "text": "{{memberName}}"},
        {"type": "text", "text": "{{className}}"},
        {"type": "text", "text": "{{dateTime}}"}
      ]
    }
  ]
}
```

**Compliance**:
- 24-hour session window for non-template messages
- Template approval required for marketing
- Opt-in required from members

---

### 2.4 Push Notifications (Firebase Cloud Messaging)

**Purpose**: Real-time mobile app notifications

**Configuration**:
```yaml
liyaqa:
  firebase:
    enabled: true
    service-account-path: ${FIREBASE_SERVICE_ACCOUNT_PATH}
    # Or for containerized deployments:
    service-account-json: ${FIREBASE_SERVICE_ACCOUNT_JSON}
```

**Firebase Setup**:
1. Create Firebase project
2. Download service account JSON
3. Enable FCM API
4. Configure Android and iOS apps

**Notification Types**:
- **Data Notifications**: Silent, for background sync
- **Notification Messages**: Displayed in notification tray
- **Combined**: Data + notification

**Deep Linking**:
```kotlin
// Send notification with deep link
val message = Message.builder()
    .setToken(deviceToken)
    .setNotification(Notification.builder()
        .setTitle("Class Starting Soon")
        .setBody("Your Yoga class starts in 15 minutes")
        .build())
    .putData("type", "booking")
    .putData("bookingId", booking.id.toString())
    .putData("deepLink", "liyaqa://booking/${booking.id}")
    .build()

firebaseMessaging.send(message)
```

**Platform-Specific**:
- **Android**: Handled by FCM directly
- **iOS**: FCM forwards to APNs (requires APNs certificate)

---

## 3. Compliance Integrations

### 3.1 ZATCA E-Invoicing (Saudi Arabia)

**Purpose**: Saudi Arabia tax authority e-invoice compliance

**Phases**:
- **Phase 1** (Dec 2021): Generation phase - QR code on invoices
- **Phase 2** (Jan 2023): Integration phase - Real-time submission to ZATCA

**Configuration**:
```yaml
liyaqa:
  zatca:
    enabled: true
    seller-name: ${ZATCA_SELLER_NAME}
    vat-registration-number: ${ZATCA_VAT_NUMBER}
    environment: production  # or sandbox
    api-url: https://api.zatca.gov.sa
```

**QR Code Generation** (Phase 1):
```kotlin
fun generateZatcaQrCode(invoice: Invoice): String {
    val data = listOf(
        TLV(1, config.sellerName),
        TLV(2, config.vatNumber),
        TLV(3, invoice.invoiceDate.toString()),
        TLV(4, invoice.totalAmount.toString()),
        TLV(5, invoice.taxAmount.toString())
    )

    val base64 = Base64.getEncoder().encodeToString(data.toByteArray())
    return generateQR(base64)
}
```

**E-Invoice Submission** (Phase 2):
1. Generate invoice XML in UBL format
2. Sign XML with cryptographic certificate
3. Submit to ZATCA API in real-time
4. Receive clearance or rejection
5. Store clearance UUID
6. Include UUID on invoice

**Compliance Requirements**:
- Invoice numbering sequence
- VAT rate (15% in Saudi Arabia)
- Seller VAT registration number
- Invoice hash and signature

---

## 4. Equipment Provider Integrations

### 4.1 Supported Equipment Providers

**Integration Type**: OAuth 2.0 + REST API

**Supported Providers**:
1. **TechnoGym** - Cloud API
2. **Precor** - Preva Cloud
3. **Life Fitness** - LFconnect
4. **Milon** - Q Cloud

### 4.2 Equipment Integration Flow

```
┌──────────┐           ┌──────────┐           ┌──────────────┐
│ Liyaqa   │           │ OAuth    │           │ Equipment    │
│ Backend  │           │ Provider │           │ API          │
└────┬─────┘           └────┬─────┘           └──────┬───────┘
     │ 1. Authorize          │                        │
     ├──────────────────────>│                        │
     │ 2. Redirect to OAuth  │                        │
     │<──────────────────────┤                        │
     │ 3. User grants access │                        │
     ├──────────────────────>│                        │
     │ 4. Authorization code │                        │
     │<──────────────────────┤                        │
     │ 5. Exchange for token │                        │
     ├──────────────────────>│                        │
     │ 6. Access token       │                        │
     │<──────────────────────┤                        │
     │ 7. Fetch workout data │                        │
     ├───────────────────────────────────────────────>│
     │ 8. Workout data       │                        │
     │<───────────────────────────────────────────────┤
     │ 9. Store workout      │                        │
```

### 4.3 Workout Data Sync

**Scheduled Sync Job**:
```kotlin
@Scheduled(cron = "0 0 * * * *") // Every hour
fun syncEquipmentWorkouts() {
    val connections = equipmentConnectionRepository.findActiveConnections()

    connections.forEach { connection ->
        try {
            val workouts = equipmentProvider.fetchWorkouts(
                connection = connection,
                since = connection.lastSyncAt
            )

            workouts.forEach { workout ->
                saveWorkout(workout, connection.memberId)
            }

            connection.lastSyncAt = Instant.now()
            connectionRepository.save(connection)
        } catch (e: Exception) {
            handleSyncError(connection, e)
        }
    }
}
```

**Workout Data**:
- Member identification (via equipment login)
- Workout type (cardio, strength)
- Duration
- Distance
- Calories burned
- Heart rate data
- Resistance/incline settings
- Machine ID and type

---

## 5. Wearable Device Integrations

### 5.1 Supported Wearable Platforms

**OAuth-Based Integrations**:
1. **Fitbit** - OAuth 2.0
2. **Garmin Connect** - OAuth 1.0a
3. **Google Fit** - OAuth 2.0
4. **Strava** - OAuth 2.0
5. **Oura Ring** - OAuth 2.0
6. **WHOOP** - OAuth 2.0

**SDK-Based Integrations**:
1. **Apple Health** - HealthKit (iOS only)
2. **Samsung Health** - Health SDK (Android only)

### 5.2 Wearable Connection Flow

**OAuth Flow** (Fitbit example):
```kotlin
@RestController
@RequestMapping("/api/wearables")
class WearableController {
    @GetMapping("/fitbit/connect")
    fun connectFitbit(): ResponseEntity<String> {
        val authUrl = "https://www.fitbit.com/oauth2/authorize?" +
            "client_id=${fitbitClientId}&" +
            "response_type=code&" +
            "scope=activity+heartrate+sleep&" +
            "redirect_uri=${redirectUri}"

        return ResponseEntity.ok(authUrl)
    }

    @GetMapping("/fitbit/callback")
    fun fitbitCallback(@RequestParam code: String) {
        // Exchange code for access token
        val tokens = exchangeCodeForToken(code)

        // Save connection
        val connection = MemberWearableConnection(
            memberId = currentMemberId,
            platform = WearablePlatform.FITBIT,
            accessToken = encrypt(tokens.accessToken),
            refreshToken = encrypt(tokens.refreshToken),
            expiresAt = Instant.now().plusSeconds(tokens.expiresIn)
        )

        wearableConnectionRepository.save(connection)
    }
}
```

### 5.3 Data Synchronization

**Daily Activity Sync**:
```kotlin
@Scheduled(cron = "0 0 2 * * *") // 2 AM daily
fun syncWearableData() {
    val connections = wearableConnectionRepository.findAll()

    connections.forEach { connection ->
        when (connection.platform) {
            WearablePlatform.FITBIT -> syncFitbitData(connection)
            WearablePlatform.GARMIN -> syncGarminData(connection)
            // ... other platforms
        }
    }
}

fun syncFitbitData(connection: MemberWearableConnection) {
    val yesterday = LocalDate.now().minusDays(1)

    // Fetch activity data
    val activity = fitbitClient.getActivitySummary(
        accessToken = decrypt(connection.accessToken),
        date = yesterday
    )

    // Store activity
    val dailyActivity = WearableDailyActivity(
        memberId = connection.memberId,
        date = yesterday,
        steps = activity.steps,
        distance = activity.distance,
        caloriesBurned = activity.calories,
        activeMinutes = activity.activeMinutes,
        heartRateAvg = activity.heartRateAvg,
        heartRateResting = activity.heartRateResting,
        sleepDuration = activity.sleepMinutes
    )

    dailyActivityRepository.save(dailyActivity)
}
```

**Synced Data**:
- Steps
- Distance
- Calories burned
- Active minutes
- Heart rate (average, resting, max)
- Sleep duration and quality
- VO2 max
- Workouts (with GPS routes if available)

---

## 6. Webhook System

### 6.1 Webhook Overview

**Purpose**: Event-driven integrations for third-party systems

**Event Types**:
- `member.created`, `member.updated`, `member.deleted`
- `subscription.created`, `subscription.renewed`, `subscription.expired`
- `payment.completed`, `payment.failed`, `payment.refunded`
- `attendance.checkin`, `attendance.checkout`
- `booking.created`, `booking.cancelled`
- `invoice.created`, `invoice.paid`

### 6.2 Webhook Registration

**API Endpoint**:
```http
POST /api/webhooks
Authorization: Bearer {api_token}

{
  "url": "https://partner.com/webhooks/liyaqa",
  "secret": "webhook-secret-key",
  "events": ["member.created", "subscription.created"],
  "active": true
}
```

**Response**:
```json
{
  "id": "webhook-uuid",
  "url": "https://partner.com/webhooks/liyaqa",
  "events": ["member.created", "subscription.created"],
  "secret": "webhook-secret-key",
  "active": true,
  "createdAt": "2024-01-15T10:00:00Z"
}
```

### 6.3 Webhook Delivery

**Payload Structure**:
```json
{
  "id": "event-uuid",
  "type": "member.created",
  "timestamp": "2024-01-15T10:00:00Z",
  "data": {
    "id": "member-uuid",
    "firstName": "Ahmed",
    "lastName": "Al-Saud",
    "email": "ahmed@example.com",
    "status": "ACTIVE",
    "organizationId": "org-uuid",
    "createdAt": "2024-01-15T10:00:00Z"
  }
}
```

**Signature Verification** (HMAC-SHA256):
```kotlin
// Liyaqa backend generates signature
val payload = objectMapper.writeValueAsString(event)
val signature = HmacUtils.hmacSha256Hex(webhook.secret, payload)
headers["X-Liyaqa-Signature"] = signature

// Partner verifies signature
fun verifySignature(payload: String, signature: String, secret: String): Boolean {
    val expected = HmacUtils.hmacSha256Hex(secret, payload)
    return MessageDigest.isEqual(expected.toByteArray(), signature.toByteArray())
}
```

**Retry Logic**:
- Retry 1: Immediate
- Retry 2: 5 minutes later
- Retry 3: 30 minutes later
- Retry 4: 2 hours later
- Retry 5: 8 hours later
- Retry 6: 24 hours later

**Webhook Testing**:
```http
POST /api/webhooks/{webhookId}/test
Authorization: Bearer {api_token}

{
  "eventType": "member.created"
}
```

---

## Summary

Liyaqa provides comprehensive integrations for:
- **4 Payment Gateways** (PayTabs, STC Pay, SADAD, Tamara)
- **4 Communication Channels** (Email, SMS, WhatsApp, Push)
- **ZATCA E-Invoicing** (Saudi compliance)
- **4 Equipment Providers** (TechnoGym, Precor, Life Fitness, Milon)
- **6+ Wearable Platforms** (Fitbit, Garmin, Apple Health, Strava, etc.)
- **Webhook System** for custom integrations

All integrations are:
- Secure (OAuth, HTTPS, signature verification)
- Reliable (retry logic, error handling)
- Monitored (delivery status, logs)
- Configurable (environment variables, feature flags)

---

*Last Updated: January 2026*
*Version: 1.0*
