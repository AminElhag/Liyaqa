# Liyaqa Backend - DTO Catalog

**Complete Reference Guide for Data Transfer Objects**

**Project:** Liyaqa Gym Management System
**Version:** 1.0
**Last Updated:** 2026-02-04
**Total DTOs:** 250+
**Total Files:** 54
**Domains Covered:** 24

---

## Table of Contents

1. [Introduction](#introduction)
2. [DTO Organization](#dto-organization)
3. [Common Patterns](#common-patterns)
4. [Validation Annotations](#validation-annotations)
5. [Domain Catalogs](#domain-catalogs)
   - [Authentication & Authorization](#authentication--authorization)
   - [Membership Management](#membership-management)
   - [Billing & Payments](#billing--payments)
   - [Shop & Products](#shop--products)
   - [Attendance & Check-In](#attendance--check-in)
   - [Classes & Training](#classes--training)
   - [CRM & Leads](#crm--leads)
   - [Loyalty & Referrals](#loyalty--referrals)
   - [Notifications & Webhooks](#notifications--webhooks)
   - [Reporting & Analytics](#reporting--analytics)
   - [Churn Prevention](#churn-prevention)
   - [Access Control](#access-control)
   - [Kiosk Management](#kiosk-management)
   - [Equipment Integration](#equipment-integration)
   - [Wearables Integration](#wearables-integration)
   - [Accounts & Groups](#accounts--groups)
   - [Branding & Customization](#branding--customization)
   - [Compliance & Data Protection](#compliance--data-protection)
   - [Platform Management](#platform-management)
6. [Best Practices](#best-practices)

---

## Introduction

This catalog documents all Data Transfer Objects (DTOs) used in the Liyaqa backend API. DTOs serve as contracts between the API and client applications, defining request payloads and response structures.

### Purpose

- **API Contract Definition:** Clear specification of what data can be sent and received
- **Validation Documentation:** Constraints and rules for each field
- **Type Safety:** Strong typing for all fields with explicit nullable/non-nullable indicators
- **Bilingual Support:** Consistent patterns for English/Arabic content
- **Frontend Integration:** Reference for TypeScript type generation and API clients

### Conventions

- **Request DTOs:** End with `Request` suffix (e.g., `CreateMemberRequest`)
- **Response DTOs:** End with `Response` or `Dto` suffix (e.g., `MemberResponse`, `MemberDto`)
- **Nested DTOs:** Composed within other DTOs for complex structures
- **Factory Methods:** `toCommand()` for requests, `from(entity)` for responses

---

## DTO Organization

### File Structure

```
backend/src/main/kotlin/com/liyaqa/
├── {domain}/api/
│   ├── {Domain}Dto.kt          # Main DTOs for domain
│   └── {Subdomain}Dto.kt       # Specialized DTOs
└── platform/api/dto/
    └── {Platform}Dtos.kt       # Platform management DTOs
```

### Domain-Driven Design

DTOs are organized by bounded contexts:
- **Core Domains:** Membership, Billing, Classes, Attendance
- **Supporting Domains:** Notifications, Reporting, Webhooks
- **Generic Subdomains:** Auth, Compliance, Access Control
- **Platform Domain:** Multi-tenant SaaS management

---

## Common Patterns

### Bilingual Fields

All user-facing text supports English and Arabic:

```kotlin
// Request Pattern
data class CreateMembershipPlanRequest(
    val nameEn: String,           // Required
    val nameAr: String?,          // Optional
    val descriptionEn: String?,
    val descriptionAr: String?
)

// Response Pattern
data class MembershipPlanResponse(
    val id: UUID,
    val name: LocalizedTextResponse,  // { en: String, ar: String? }
    val description: LocalizedTextResponse?
)

// Nested Type
data class LocalizedTextResponse(
    val en: String,
    val ar: String?
)
```

### Money Representation

Financial amounts use dedicated money types:

```kotlin
// Request Pattern
data class CreateInvoiceRequest(
    val amount: BigDecimal,
    val currency: String = "SAR"
)

// Response Pattern
data class InvoiceResponse(
    val id: UUID,
    val totalAmount: MoneyResponse
)

data class MoneyResponse(
    val amount: BigDecimal,
    val currency: String
)
```

### Pagination

List endpoints use standard pagination:

```kotlin
data class PageResponse<T>(
    val content: List<T>,
    val page: Int,
    val size: Int,
    val totalElements: Long,
    val totalPages: Int,
    val first: Boolean,
    val last: Boolean
)
```

### Audit Fields

All responses include timestamps:

```kotlin
data class MemberResponse(
    val id: UUID,
    // ... other fields
    val createdAt: Instant,
    val updatedAt: Instant
)

// Soft deletable entities
data class MemberResponse(
    val id: UUID,
    val isDeleted: Boolean,
    val deletedAt: Instant?,
    val createdAt: Instant,
    val updatedAt: Instant
)
```

### Enum Types

Status fields use enums for type safety:

```kotlin
enum class MemberStatus {
    ACTIVE, SUSPENDED, INACTIVE
}

enum class SubscriptionStatus {
    ACTIVE, EXPIRING, EXPIRED, CANCELLED
}

enum class InvoiceStatus {
    DRAFT, ISSUED, PARTIAL_PAYMENT, PAID, OVERDUE, CANCELLED
}
```

### Request/Response Separation

- **Create Requests:** All required fields for entity creation
- **Update Requests:** Optional fields (nullable) for partial updates
- **Response DTOs:** Complete entity state with IDs and timestamps
- **Summary DTOs:** Subset of fields for list views

---

## Validation Annotations

### Jakarta Bean Validation

All request DTOs use validation annotations:

| Annotation | Purpose | Example |
|------------|---------|---------|
| `@NotNull` | Field cannot be null | `@NotNull val memberId: UUID` |
| `@NotBlank` | String not empty/whitespace | `@NotBlank val email: String` |
| `@NotEmpty` | Collection not empty | `@NotEmpty val items: List<UUID>` |
| `@Email` | Valid email format | `@Email val email: String` |
| `@Pattern` | Regex pattern match | `@Pattern("^[0-9]+$") val phone: String` |
| `@Size` | String/collection size | `@Size(min=3, max=50) val name: String` |
| `@Min` / `@Max` | Numeric bounds | `@Min(1) val quantity: Int` |
| `@Positive` | Number > 0 | `@Positive val price: BigDecimal` |
| `@PositiveOrZero` | Number >= 0 | `@PositiveOrZero val discount: BigDecimal` |
| `@DecimalMin` / `@DecimalMax` | Decimal bounds | `@DecimalMin("0.00") val amount: BigDecimal` |
| `@Future` / `@Past` | Date validation | `@Future val expiryDate: LocalDate` |
| `@Valid` | Nested DTO validation | `@Valid val address: AddressInput` |

### Common Validation Patterns

```kotlin
// Email validation
@Email @NotBlank val email: String

// Phone with pattern
@Pattern(regexp = "^\\+[1-9]\\d{1,14}$") val phone: String

// Password strength
@NotBlank @Size(min=8, max=128) val password: String

// Positive amount
@Positive @DecimalMax("999999.99") val amount: BigDecimal

// Date range
@Future val startDate: LocalDate
@Future val endDate: LocalDate

// Nested validation
@Valid @NotNull val billingAddress: AddressInput

// Collection validation
@NotEmpty @Size(max=100) val memberIds: List<UUID>
```

---

## Domain Catalogs

### Authentication & Authorization

**Location:** `com.liyaqa.auth.api`

#### UserDto.kt

**CreateUserRequest**
- **Purpose:** Create new user account
- **Fields:**
  - `email: String` - Email address (@Email, @NotBlank)
  - `password: String` - Password (@NotBlank, @Size(min=8))
  - `displayName: String` - Display name (@NotBlank)
  - `phoneNumber: String?` - Phone number (optional)
  - `role: String` - User role (@NotBlank)
  - `memberId: UUID?` - Associated member (optional)
- **Usage:** Staff user creation, member portal access

**UpdateUserRequest**
- **Purpose:** Update user profile
- **Fields:**
  - `displayName: String?` - New display name (optional)
  - `phoneNumber: String?` - New phone (optional)
  - `preferredLanguage: String?` - Language (en/ar, optional)
  - `emailNotifications: Boolean?` - Email preference (optional)
  - `smsNotifications: Boolean?` - SMS preference (optional)
  - `pushNotifications: Boolean?` - Push preference (optional)
- **Usage:** Profile updates

**ChangePasswordRequest**
- **Purpose:** Change user password
- **Fields:**
  - `currentPassword: String` - Current password (@NotBlank)
  - `newPassword: String` - New password (@NotBlank, @Size(min=8))
  - `confirmPassword: String` - Password confirmation (@NotBlank)
- **Validation:** Passwords must match, history check
- **Usage:** Authenticated password change

**ResetPasswordRequest**
- **Purpose:** Reset forgotten password
- **Fields:**
  - `token: String` - Reset token (@NotBlank)
  - `newPassword: String` - New password (@NotBlank, @Size(min=8))
  - `confirmPassword: String` - Confirmation (@NotBlank)
- **Usage:** Password recovery flow

**UserResponse**
- **Purpose:** User account details
- **Fields:**
  - `id: UUID` - User ID
  - `email: String` - Email
  - `displayName: String` - Display name
  - `phoneNumber: String?` - Phone
  - `role: String` - User role
  - `memberId: UUID?` - Member reference
  - `emailVerified: Boolean` - Verification status
  - `phoneVerified: Boolean` - Phone verification
  - `mfaEnabled: Boolean` - MFA status
  - `preferredLanguage: String` - Language preference
  - `lastLoginAt: Instant?` - Last login time
  - `createdAt: Instant` - Account creation
  - `updatedAt: Instant` - Last update
- **Usage:** User profile display

**UserListResponse**
- **Purpose:** Paginated user list
- **Fields:**
  - `id: UUID` - User ID
  - `email: String` - Email
  - `displayName: String` - Display name
  - `role: String` - Role
  - `status: UserStatus` - Status (ACTIVE, SUSPENDED, INACTIVE)
  - `lastLoginAt: Instant?` - Last login
  - `createdAt: Instant` - Creation date
- **Usage:** User management lists

#### AuthDto.kt

**LoginRequest**
- **Purpose:** User authentication
- **Fields:**
  - `email: String` - Email (@Email, @NotBlank)
  - `password: String` - Password (@NotBlank)
  - `rememberMe: Boolean?` - Extended session (optional)
  - `deviceId: String?` - Device identifier (optional)
  - `deviceName: String?` - Device name (optional)
- **Usage:** Login endpoint

**RegisterRequest**
- **Purpose:** New user registration
- **Fields:**
  - `email: String` - Email (@Email, @NotBlank)
  - `password: String` - Password (@NotBlank, @Size(min=8))
  - `confirmPassword: String` - Confirmation (@NotBlank)
  - `displayName: String` - Display name (@NotBlank)
  - `phoneNumber: String?` - Phone (optional)
  - `acceptedTerms: Boolean` - Terms acceptance (@AssertTrue)
- **Usage:** Public registration

**RefreshTokenRequest**
- **Purpose:** Token refresh
- **Fields:**
  - `refreshToken: String` - Refresh token (@NotBlank)
- **Usage:** Token refresh endpoint

**AuthResponse**
- **Purpose:** Authentication result
- **Fields:**
  - `accessToken: String` - JWT access token (15 min)
  - `refreshToken: String` - Refresh token (7 days)
  - `expiresIn: Long` - Token expiration seconds
  - `tokenType: String` - Token type ("Bearer")
  - `user: UserResponse` - User details
  - `mfaRequired: Boolean` - MFA challenge needed
  - `mfaToken: String?` - MFA challenge token (if required)
- **Usage:** Login/register response

**LogoutRequest**
- **Purpose:** End user session
- **Fields:**
  - `deviceId: String?` - Device to logout (optional, all if null)
- **Usage:** Logout endpoint

**VerifyEmailRequest**
- **Purpose:** Verify email address
- **Fields:**
  - `token: String` - Verification token (@NotBlank)
- **Usage:** Email verification link

**VerifyPhoneRequest**
- **Purpose:** Verify phone number
- **Fields:**
  - `code: String` - OTP code (@NotBlank, @Size(6))
- **Usage:** SMS verification

#### MfaDto.kt

**EnableMfaRequest**
- **Purpose:** Enable MFA for user
- **Fields:**
  - `method: MfaMethod` - Method (TOTP, SMS, EMAIL)
  - `phoneNumber: String?` - Phone for SMS (required if SMS method)
- **Usage:** MFA enrollment

**EnableMfaResponse**
- **Purpose:** MFA enrollment result
- **Fields:**
  - `secret: String?` - TOTP secret (if TOTP method)
  - `qrCodeUrl: String?` - QR code data URL (if TOTP)
  - `backupCodes: List<String>` - Recovery codes
- **Usage:** Display QR code for TOTP setup

**VerifyMfaRequest**
- **Purpose:** Verify MFA code
- **Fields:**
  - `mfaToken: String` - MFA challenge token (@NotBlank)
  - `code: String` - MFA code (@NotBlank, @Size(6))
- **Usage:** MFA verification during login

**VerifyMfaResponse**
- **Purpose:** MFA verification result
- **Fields:**
  - `accessToken: String` - Access token (after successful MFA)
  - `refreshToken: String` - Refresh token
  - `expiresIn: Long` - Token expiration
  - `user: UserResponse` - User details
- **Usage:** Complete login after MFA

**DisableMfaRequest**
- **Purpose:** Disable MFA
- **Fields:**
  - `password: String` - User password (@NotBlank)
  - `code: String` - Current MFA code (@NotBlank)
- **Usage:** MFA removal

**RegenerateMfaBackupCodesRequest**
- **Purpose:** Generate new backup codes
- **Fields:**
  - `password: String` - User password (@NotBlank)
- **Usage:** Backup code regeneration

**RegenerateMfaBackupCodesResponse**
- **Purpose:** New backup codes
- **Fields:**
  - `backupCodes: List<String>` - New recovery codes
- **Usage:** Display new codes to user

**MfaStatusResponse**
- **Purpose:** MFA configuration status
- **Fields:**
  - `enabled: Boolean` - MFA enabled flag
  - `method: MfaMethod?` - Configured method
  - `backupCodesRemaining: Int` - Unused backup codes
- **Usage:** MFA settings display

#### SessionDto.kt

**SessionResponse**
- **Purpose:** Active session details
- **Fields:**
  - `id: UUID` - Session ID
  - `userId: UUID` - User ID
  - `deviceId: String?` - Device identifier
  - `deviceName: String?` - Device name
  - `ipAddress: String` - Login IP
  - `userAgent: String` - Browser/client
  - `location: String?` - Geographic location
  - `isCurrent: Boolean` - Current session flag
  - `createdAt: Instant` - Login time
  - `lastActivityAt: Instant` - Last activity
  - `expiresAt: Instant` - Absolute expiration (24h)
- **Usage:** Session management

**RevokeSessionRequest**
- **Purpose:** End specific session
- **Fields:**
  - `sessionId: UUID` - Session to revoke (@NotNull)
- **Usage:** Remote logout

**RevokeAllSessionsRequest**
- **Purpose:** End all sessions except current
- **Fields:**
  - `password: String` - User password (@NotBlank)
- **Usage:** Security breach response

---

### Membership Management

**Location:** `com.liyaqa.membership.api`

#### MemberDto.kt

**CreateMemberRequest**
- **Purpose:** Register new gym member
- **Fields:**
  - `firstNameEn: String` - First name English (@NotBlank)
  - `firstNameAr: String?` - First name Arabic (optional)
  - `lastNameEn: String` - Last name English (@NotBlank)
  - `lastNameAr: String?` - Last name Arabic (optional)
  - `email: String` - Email (@Email, @NotBlank)
  - `phoneNumber: String` - Phone (@NotBlank)
  - `dateOfBirth: LocalDate` - Birth date (@Past)
  - `gender: Gender` - Gender (MALE, FEMALE, OTHER)
  - `nationalId: String?` - National ID (optional)
  - `address: AddressInput?` - Address (optional, @Valid)
  - `emergencyContactName: String?` - Emergency contact (optional)
  - `emergencyContactPhone: String?` - Emergency phone (optional)
  - `referralSource: String?` - How heard about us (optional)
  - `referredByMemberId: UUID?` - Referral member (optional)
  - `tags: List<String>?` - Custom tags (optional)
- **Usage:** Member registration form

**UpdateMemberRequest**
- **Purpose:** Update member profile
- **Fields:** (All optional)
  - `firstNameEn: String?` - First name English
  - `firstNameAr: String?` - First name Arabic
  - `lastNameEn: String?` - Last name English
  - `lastNameAr: String?` - Last name Arabic
  - `email: String?` - Email (@Email if provided)
  - `phoneNumber: String?` - Phone
  - `dateOfBirth: LocalDate?` - Birth date
  - `gender: Gender?` - Gender
  - `address: AddressInput?` - Address
  - `emergencyContactName: String?` - Emergency contact
  - `emergencyContactPhone: String?` - Emergency phone
  - `profilePictureUrl: String?` - Profile image URL
- **Usage:** Profile edit

**MemberResponse**
- **Purpose:** Complete member profile
- **Fields:**
  - `id: UUID` - Member ID
  - `memberNumber: String` - Unique member number
  - `firstName: LocalizedTextResponse` - First name (bilingual)
  - `lastName: LocalizedTextResponse` - Last name (bilingual)
  - `email: String` - Email
  - `phoneNumber: String` - Phone
  - `dateOfBirth: LocalDate` - Birth date
  - `age: Int` - Calculated age
  - `gender: Gender` - Gender
  - `nationalId: String?` - National ID
  - `profilePictureUrl: String?` - Profile image
  - `address: AddressResponse?` - Address
  - `emergencyContact: EmergencyContactResponse?` - Emergency details
  - `status: MemberStatus` - Status (ACTIVE, SUSPENDED, INACTIVE)
  - `memberSince: LocalDate` - Join date
  - `tags: List<String>` - Custom tags
  - `subscription: SubscriptionSummaryResponse?` - Current subscription
  - `wallet: WalletSummaryResponse` - Wallet balance
  - `referralSource: String?` - Acquisition channel
  - `referredBy: MemberSummaryResponse?` - Referrer
  - `loyaltyPoints: Int` - Loyalty balance
  - `createdAt: Instant` - Registration time
  - `updatedAt: Instant` - Last update
- **Usage:** Member profile display

**MemberListResponse**
- **Purpose:** Summary for member lists
- **Fields:**
  - `id: UUID` - Member ID
  - `memberNumber: String` - Member number
  - `fullName: String` - Display name
  - `email: String` - Email
  - `phoneNumber: String` - Phone
  - `status: MemberStatus` - Status
  - `subscriptionStatus: SubscriptionStatus?` - Subscription status
  - `memberSince: LocalDate` - Join date
  - `profilePictureUrl: String?` - Profile image
- **Usage:** Member tables, search results

**MemberSummaryResponse**
- **Purpose:** Minimal member reference
- **Fields:**
  - `id: UUID` - Member ID
  - `memberNumber: String` - Member number
  - `fullName: String` - Display name
  - `profilePictureUrl: String?` - Profile image
- **Usage:** References in other DTOs

**SuspendMemberRequest**
- **Purpose:** Suspend member account
- **Fields:**
  - `reason: String` - Suspension reason (@NotBlank)
  - `internalNotes: String?` - Staff notes (optional)
- **Usage:** Member suspension

**ReactivateMemberRequest**
- **Purpose:** Reactivate suspended member
- **Fields:**
  - `notes: String?` - Reactivation notes (optional)
- **Usage:** Member reactivation

**BulkMemberActionRequest**
- **Purpose:** Bulk operations
- **Fields:**
  - `memberIds: List<UUID>` - Member IDs (@NotEmpty)
  - `action: BulkAction` - Action (SUSPEND, REACTIVATE, ADD_TAG, REMOVE_TAG)
  - `parameters: Map<String, String>?` - Action parameters (optional)
- **Usage:** Bulk operations

#### MemberHealthDto.kt

**CreateHealthInfoRequest**
- **Purpose:** Record member health information
- **Fields:**
  - `memberId: UUID` - Member (@NotNull)
  - `bloodType: BloodType?` - Blood type (optional)
  - `height: Double?` - Height in cm (@Positive, optional)
  - `weight: Double?` - Weight in kg (@Positive, optional)
  - `medicalConditions: List<String>?` - Conditions (optional)
  - `allergies: List<String>?` - Allergies (optional)
  - `medications: List<String>?` - Current medications (optional)
  - `injuries: List<String>?` - Past injuries (optional)
  - `fitnessLevel: FitnessLevel?` - Level (BEGINNER, INTERMEDIATE, ADVANCED, ELITE, optional)
  - `goals: List<String>?` - Fitness goals (optional)
  - `notes: String?` - Additional notes (optional)
- **Usage:** Health profile creation

**UpdateHealthInfoRequest**
- **Purpose:** Update health information
- **Fields:** (All optional)
  - `bloodType: BloodType?` - Blood type
  - `height: Double?` - Height cm
  - `weight: Double?` - Weight kg
  - `medicalConditions: List<String>?` - Conditions
  - `allergies: List<String>?` - Allergies
  - `medications: List<String>?` - Medications
  - `injuries: List<String>?` - Injuries
  - `fitnessLevel: FitnessLevel?` - Fitness level
  - `goals: List<String>?` - Goals
  - `notes: String?` - Notes
- **Usage:** Health profile updates

**HealthInfoResponse**
- **Purpose:** Complete health profile
- **Fields:**
  - `id: UUID` - Health record ID
  - `memberId: UUID` - Member ID
  - `bloodType: BloodType?` - Blood type
  - `height: Double?` - Height cm
  - `weight: Double?` - Weight kg
  - `bmi: Double?` - Calculated BMI
  - `bmiCategory: String?` - BMI category (underweight, normal, overweight, obese)
  - `medicalConditions: List<String>` - Conditions
  - `allergies: List<String>` - Allergies
  - `medications: List<String>` - Medications
  - `injuries: List<String>` - Injuries
  - `fitnessLevel: FitnessLevel?` - Fitness level
  - `goals: List<String>` - Goals
  - `notes: String?` - Notes
  - `updatedAt: Instant` - Last update
- **Usage:** Health profile display

**RecordBodyMeasurementRequest**
- **Purpose:** Log body metrics
- **Fields:**
  - `memberId: UUID` - Member (@NotNull)
  - `weight: Double` - Weight kg (@Positive)
  - `bodyFatPercentage: Double?` - Body fat % (optional, @DecimalMin("0"), @DecimalMax("100"))
  - `muscleMass: Double?` - Muscle mass kg (optional, @Positive)
  - `visceralFat: Int?` - Visceral fat level (optional, @Min(1), @Max(60))
  - `measurements: Map<String, Double>?` - Body measurements (chest, waist, hips, etc., optional)
  - `notes: String?` - Measurement notes (optional)
- **Usage:** Body composition tracking

**BodyMeasurementResponse**
- **Purpose:** Body measurement record
- **Fields:**
  - `id: UUID` - Measurement ID
  - `memberId: UUID` - Member ID
  - `date: LocalDate` - Measurement date
  - `weight: Double` - Weight kg
  - `bmi: Double?` - BMI
  - `bodyFatPercentage: Double?` - Body fat %
  - `muscleMass: Double?` - Muscle mass kg
  - `visceralFat: Int?` - Visceral fat
  - `measurements: Map<String, Double>?` - Circumference measurements
  - `notes: String?` - Notes
  - `recordedBy: String?` - Staff who recorded
  - `createdAt: Instant` - Record time
- **Usage:** Progress tracking display

#### SubscriptionDto.kt

**CreateSubscriptionRequest**
- **Purpose:** Create member subscription
- **Fields:**
  - `memberId: UUID` - Member (@NotNull)
  - `planId: UUID` - Membership plan (@NotNull)
  - `startDate: LocalDate` - Start date (@NotNull, @FutureOrPresent)
  - `endDate: LocalDate?` - End date (optional, calculated if null)
  - `autoRenew: Boolean?` - Auto-renewal flag (optional, default true)
  - `paymentMethodId: UUID?` - Payment method (optional)
  - `promoCode: String?` - Promo code (optional)
  - `notes: String?` - Subscription notes (optional)
- **Usage:** New subscription creation

**RenewSubscriptionRequest**
- **Purpose:** Renew expiring subscription
- **Fields:**
  - `subscriptionId: UUID` - Subscription (@NotNull)
  - `planId: UUID?` - New plan (optional, same if null)
  - `paymentMethodId: UUID?` - Payment method (optional)
  - `promoCode: String?` - Promo code (optional)
- **Usage:** Subscription renewal

**FreezeSubscriptionRequest**
- **Purpose:** Freeze active subscription
- **Fields:**
  - `subscriptionId: UUID` - Subscription (@NotNull)
  - `startDate: LocalDate` - Freeze start (@FutureOrPresent)
  - `endDate: LocalDate` - Freeze end (@Future)
  - `reason: String?` - Freeze reason (optional)
- **Usage:** Subscription freeze

**CancelSubscriptionRequest**
- **Purpose:** Cancel subscription
- **Fields:**
  - `subscriptionId: UUID` - Subscription (@NotNull)
  - `reason: String?` - Cancellation reason (optional)
  - `feedback: String?` - Member feedback (optional)
  - `effectiveDate: LocalDate?` - Effective date (optional, immediate if null)
  - `refundAmount: BigDecimal?` - Refund amount (optional)
- **Usage:** Subscription cancellation

**SubscriptionResponse**
- **Purpose:** Complete subscription details
- **Fields:**
  - `id: UUID` - Subscription ID
  - `memberId: UUID` - Member ID
  - `memberName: String` - Member name
  - `plan: MembershipPlanSummaryResponse` - Plan details
  - `status: SubscriptionStatus` - Status (ACTIVE, EXPIRING, FROZEN, EXPIRED, CANCELLED)
  - `startDate: LocalDate` - Start date
  - `endDate: LocalDate` - End date
  - `autoRenew: Boolean` - Auto-renewal flag
  - `daysRemaining: Int` - Days until expiration
  - `isFrozen: Boolean` - Frozen flag
  - `freezeDetails: FreezeDetailsResponse?` - Freeze info (if frozen)
  - `totalPaid: MoneyResponse` - Amount paid
  - `nextBillingDate: LocalDate?` - Next payment date (if auto-renew)
  - `nextBillingAmount: MoneyResponse?` - Next payment amount
  - `notes: String?` - Notes
  - `createdAt: Instant` - Creation time
  - `updatedAt: Instant` - Last update
  - `cancelledAt: Instant?` - Cancellation time
  - `cancellationReason: String?` - Cancel reason
- **Usage:** Subscription detail view

**SubscriptionSummaryResponse**
- **Purpose:** Brief subscription info
- **Fields:**
  - `id: UUID` - Subscription ID
  - `planName: String` - Plan name
  - `status: SubscriptionStatus` - Status
  - `startDate: LocalDate` - Start date
  - `endDate: LocalDate` - End date
  - `daysRemaining: Int` - Days left
  - `autoRenew: Boolean` - Auto-renewal
- **Usage:** References in member profile

**FreezeDetailsResponse**
- **Purpose:** Freeze period information
- **Fields:**
  - `freezeId: UUID` - Freeze ID
  - `startDate: LocalDate` - Freeze start
  - `endDate: LocalDate` - Freeze end
  - `daysFrozen: Int` - Total days frozen
  - `daysRemaining: Int` - Days remaining in freeze
  - `reason: String?` - Freeze reason
- **Usage:** Freeze info display

#### MembershipPlanDto.kt

**CreateMembershipPlanRequest**
- **Purpose:** Create membership plan
- **Fields:**
  - `nameEn: String` - Plan name English (@NotBlank)
  - `nameAr: String?` - Plan name Arabic (optional)
  - `descriptionEn: String?` - Description English (optional)
  - `descriptionAr: String?` - Description Arabic (optional)
  - `price: BigDecimal` - Plan price (@Positive)
  - `currency: String?` - Currency (optional, default SAR)
  - `durationDays: Int` - Plan duration (@Positive)
  - `maxFreezeDays: Int?` - Max freeze days (optional, @PositiveOrZero)
  - `accessType: AccessType` - Access type (UNLIMITED, LIMITED)
  - `maxCheckIns: Int?` - Check-in limit (required if LIMITED)
  - `features: List<String>?` - Plan features (optional)
  - `termsAndConditions: String?` - Terms (optional)
  - `isActive: Boolean?` - Active flag (optional, default true)
- **Usage:** Plan creation

**UpdateMembershipPlanRequest**
- **Purpose:** Update membership plan
- **Fields:** (All optional)
  - `nameEn: String?` - Plan name English
  - `nameAr: String?` - Plan name Arabic
  - `descriptionEn: String?` - Description English
  - `descriptionAr: String?` - Description Arabic
  - `price: BigDecimal?` - Plan price
  - `durationDays: Int?` - Duration
  - `maxFreezeDays: Int?` - Max freeze days
  - `accessType: AccessType?` - Access type
  - `maxCheckIns: Int?` - Check-in limit
  - `features: List<String>?` - Features
  - `termsAndConditions: String?` - Terms
  - `isActive: Boolean?` - Active flag
- **Usage:** Plan updates

**MembershipPlanResponse**
- **Purpose:** Complete plan details
- **Fields:**
  - `id: UUID` - Plan ID
  - `name: LocalizedTextResponse` - Plan name (bilingual)
  - `description: LocalizedTextResponse?` - Description (bilingual)
  - `price: MoneyResponse` - Plan price
  - `durationDays: Int` - Plan duration
  - `durationDisplay: String` - Human-readable duration (e.g., "3 Months")
  - `maxFreezeDays: Int?` - Max freeze days
  - `accessType: AccessType` - Access type
  - `maxCheckIns: Int?` - Check-in limit
  - `features: List<String>` - Plan features
  - `termsAndConditions: String?` - Terms
  - `isActive: Boolean` - Active flag
  - `activeSubscriptions: Int` - Current subscribers
  - `createdAt: Instant` - Creation time
  - `updatedAt: Instant` - Last update
- **Usage:** Plan detail view

**MembershipPlanSummaryResponse**
- **Purpose:** Brief plan info
- **Fields:**
  - `id: UUID` - Plan ID
  - `name: LocalizedTextResponse` - Plan name
  - `price: MoneyResponse` - Price
  - `durationDisplay: String` - Duration
  - `accessType: AccessType` - Access type
- **Usage:** Plan references

#### WalletDto.kt

**AddWalletCreditRequest**
- **Purpose:** Add credit to member wallet
- **Fields:**
  - `memberId: UUID` - Member (@NotNull)
  - `amount: BigDecimal` - Credit amount (@Positive)
  - `currency: String?` - Currency (optional, default SAR)
  - `paymentMethodId: UUID?` - Payment method (optional)
  - `notes: String?` - Credit notes (optional)
- **Usage:** Wallet top-up

**DeductWalletCreditRequest**
- **Purpose:** Deduct from wallet
- **Fields:**
  - `memberId: UUID` - Member (@NotNull)
  - `amount: BigDecimal` - Deduction amount (@Positive)
  - `reason: String` - Deduction reason (@NotBlank)
  - `notes: String?` - Deduction notes (optional)
- **Usage:** Wallet deduction

**WalletResponse**
- **Purpose:** Complete wallet details
- **Fields:**
  - `id: UUID` - Wallet ID
  - `memberId: UUID` - Member ID
  - `balance: MoneyResponse` - Current balance
  - `currency: String` - Currency
  - `transactions: List<WalletTransactionResponse>` - Recent transactions
  - `createdAt: Instant` - Wallet creation
  - `updatedAt: Instant` - Last transaction
- **Usage:** Wallet detail view

**WalletSummaryResponse**
- **Purpose:** Brief wallet info
- **Fields:**
  - `balance: MoneyResponse` - Current balance
- **Usage:** References in member profile

**WalletTransactionResponse**
- **Purpose:** Wallet transaction record
- **Fields:**
  - `id: UUID` - Transaction ID
  - `type: WalletTransactionType` - Type (CREDIT, DEBIT, REFUND)
  - `amount: MoneyResponse` - Transaction amount
  - `balanceAfter: MoneyResponse` - Balance after transaction
  - `description: String` - Transaction description
  - `notes: String?` - Transaction notes
  - `createdAt: Instant` - Transaction time
  - `createdBy: String?` - Staff who created
- **Usage:** Transaction history

#### CheckInDto.kt

**CheckInMemberRequest**
- **Purpose:** Record member check-in
- **Fields:**
  - `memberIdentifier: String` - Member ID/number/email (@NotBlank)
  - `checkInMethod: CheckInMethod` - Method (MANUAL, QR_CODE, FACE_RECOGNITION, CARD)
  - `deviceId: String?` - Check-in device (optional)
  - `notes: String?` - Check-in notes (optional)
- **Usage:** Check-in recording

**CheckOutMemberRequest**
- **Purpose:** Record member check-out
- **Fields:**
  - `checkInId: UUID` - Check-in record (@NotNull)
  - `checkOutMethod: CheckInMethod?` - Method (optional)
  - `notes: String?` - Check-out notes (optional)
- **Usage:** Check-out recording

**CheckInResponse**
- **Purpose:** Check-in record details
- **Fields:**
  - `id: UUID` - Check-in ID
  - `memberId: UUID` - Member ID
  - `memberName: String` - Member name
  - `memberNumber: String` - Member number
  - `checkInTime: Instant` - Check-in time
  - `checkOutTime: Instant?` - Check-out time
  - `duration: Long?` - Duration minutes (if checked out)
  - `checkInMethod: CheckInMethod` - Check-in method
  - `checkOutMethod: CheckInMethod?` - Check-out method
  - `deviceId: String?` - Device used
  - `subscriptionStatus: String` - Subscription status at check-in
  - `remainingCheckIns: Int?` - Remaining check-ins (if limited plan)
  - `notes: String?` - Notes
  - `createdAt: Instant` - Record creation
- **Usage:** Check-in history

**CheckInStatsResponse**
- **Purpose:** Check-in statistics
- **Fields:**
  - `totalCheckIns: Int` - Total check-ins (period)
  - `uniqueMembers: Int` - Unique members
  - `averageDuration: Long` - Average duration minutes
  - `peakHour: Int` - Busiest hour (0-23)
  - `peakDay: DayOfWeek` - Busiest day
  - `currentOccupancy: Int` - Currently checked in
  - `maxOccupancy: Int?` - Max capacity
- **Usage:** Analytics dashboard

#### AgreementDto.kt

**CreateAgreementRequest**
- **Purpose:** Create member agreement
- **Fields:**
  - `memberId: UUID` - Member (@NotNull)
  - `type: AgreementType` - Type (MEMBERSHIP, WAIVER, TERMS_OF_SERVICE, PRIVACY_POLICY, PHOTO_CONSENT)
  - `content: String` - Agreement text (@NotBlank)
  - `requiresSignature: Boolean?` - Signature required (optional, default true)
  - `expiresAt: LocalDate?` - Expiration date (optional)
- **Usage:** Agreement creation

**SignAgreementRequest**
- **Purpose:** Sign agreement
- **Fields:**
  - `agreementId: UUID` - Agreement (@NotNull)
  - `signatureData: String?` - Digital signature base64 (optional)
  - `ipAddress: String?` - Signing IP (optional)
- **Usage:** Agreement signing

**AgreementResponse**
- **Purpose:** Agreement details
- **Fields:**
  - `id: UUID` - Agreement ID
  - `memberId: UUID` - Member ID
  - `memberName: String` - Member name
  - `type: AgreementType` - Agreement type
  - `content: String` - Agreement text
  - `requiresSignature: Boolean` - Signature flag
  - `isSigned: Boolean` - Signed status
  - `signedAt: Instant?` - Signature time
  - `signatureData: String?` - Signature image
  - `ipAddress: String?` - Signing IP
  - `expiresAt: LocalDate?` - Expiration
  - `isExpired: Boolean` - Expired flag
  - `createdAt: Instant` - Creation time
- **Usage:** Agreement display

---

### Billing & Payments

**Location:** `com.liyaqa.billing.api`

#### InvoiceDto.kt

**CreateInvoiceRequest**
- **Purpose:** Create invoice for member
- **Fields:**
  - `memberId: UUID` - Member (@NotNull)
  - `items: List<InvoiceItemInput>` - Line items (@NotEmpty, @Valid)
  - `dueDate: LocalDate?` - Payment due date (optional)
  - `notes: String?` - Invoice notes (optional)
  - `internalNotes: String?` - Staff notes (optional)
- **Usage:** Manual invoice creation

**InvoiceItemInput**
- **Purpose:** Invoice line item
- **Fields:**
  - `description: String` - Item description (@NotBlank)
  - `quantity: Int` - Quantity (@Positive)
  - `unitPrice: BigDecimal` - Unit price (@Positive)
  - `taxRate: BigDecimal?` - Tax rate % (optional, @DecimalMin("0"), @DecimalMax("100"))
  - `discountAmount: BigDecimal?` - Discount amount (optional, @PositiveOrZero)
- **Validation:** Factory method

**RecordPaymentRequest**
- **Purpose:** Record payment for invoice
- **Fields:**
  - `invoiceId: UUID` - Invoice (@NotNull)
  - `amount: BigDecimal` - Payment amount (@Positive)
  - `paymentMethod: PaymentMethod` - Method (CASH, CARD, BANK_TRANSFER, WALLET, ONLINE)
  - `paymentDate: LocalDate?` - Payment date (optional, default today)
  - `transactionId: String?` - Payment gateway transaction ID (optional)
  - `notes: String?` - Payment notes (optional)
- **Usage:** Payment recording

**InvoiceResponse**
- **Purpose:** Complete invoice details
- **Fields:**
  - `id: UUID` - Invoice ID
  - `invoiceNumber: String` - Unique invoice number
  - `memberId: UUID` - Member ID
  - `memberName: String` - Member name
  - `status: InvoiceStatus` - Status (DRAFT, ISSUED, PARTIAL_PAYMENT, PAID, OVERDUE, CANCELLED)
  - `issueDate: LocalDate` - Issue date
  - `dueDate: LocalDate?` - Due date
  - `items: List<InvoiceItemResponse>` - Line items
  - `subtotal: MoneyResponse` - Subtotal
  - `taxAmount: MoneyResponse` - Total tax
  - `discountAmount: MoneyResponse` - Total discount
  - `totalAmount: MoneyResponse` - Grand total
  - `paidAmount: MoneyResponse` - Amount paid
  - `balanceAmount: MoneyResponse` - Amount due
  - `payments: List<PaymentResponse>` - Payment history
  - `notes: String?` - Invoice notes
  - `internalNotes: String?` - Staff notes
  - `zatcaQrCode: String?` - ZATCA QR code (if enabled)
  - `pdfUrl: String?` - Invoice PDF URL
  - `createdAt: Instant` - Creation time
  - `updatedAt: Instant` - Last update
  - `paidAt: Instant?` - Full payment time
- **Usage:** Invoice detail view

**InvoiceItemResponse**
- **Purpose:** Invoice line item details
- **Fields:**
  - `id: UUID` - Item ID
  - `description: String` - Item description
  - `quantity: Int` - Quantity
  - `unitPrice: MoneyResponse` - Unit price
  - `taxRate: BigDecimal` - Tax rate %
  - `taxAmount: MoneyResponse` - Tax amount
  - `discountAmount: MoneyResponse` - Discount amount
  - `totalAmount: MoneyResponse` - Line total
- **Usage:** Invoice line items

**PaymentResponse**
- **Purpose:** Payment record details
- **Fields:**
  - `id: UUID` - Payment ID
  - `invoiceId: UUID` - Invoice ID
  - `amount: MoneyResponse` - Payment amount
  - `paymentMethod: PaymentMethod` - Payment method
  - `paymentDate: LocalDate` - Payment date
  - `transactionId: String?` - Transaction ID
  - `status: PaymentStatus` - Status (PENDING, COMPLETED, FAILED, REFUNDED)
  - `notes: String?` - Payment notes
  - `createdAt: Instant` - Record time
  - `createdBy: String?` - Staff who recorded
- **Usage:** Payment history

---

### Shop & Products

**Location:** `com.liyaqa.shop.api`

#### ProductDto.kt

**CreateProductRequest**
- **Purpose:** Create product for sale
- **Fields:**
  - `nameEn: String` - Product name English (@NotBlank)
  - `nameAr: String?` - Product name Arabic (optional)
  - `descriptionEn: String?` - Description English (optional)
  - `descriptionAr: String?` - Description Arabic (optional)
  - `sku: String?` - SKU code (optional, @Size(1-50))
  - `barcode: String?` - Barcode (optional)
  - `category: ProductCategory` - Category (SUPPLEMENT, APPAREL, EQUIPMENT, ACCESSORY, SERVICE)
  - `price: BigDecimal` - Selling price (@Positive)
  - `costPrice: BigDecimal?` - Cost price (optional, @PositiveOrZero)
  - `taxRate: BigDecimal?` - Tax rate % (optional, @DecimalMin("0"), @DecimalMax("100"))
  - `stockQuantity: Int?` - Initial stock (optional, @PositiveOrZero)
  - `lowStockThreshold: Int?` - Low stock alert (optional, @PositiveOrZero)
  - `imageUrl: String?` - Product image (optional)
  - `isActive: Boolean?` - Active flag (optional, default true)
- **Usage:** Product creation

**UpdateProductRequest**
- **Purpose:** Update product
- **Fields:** (All optional, same as CreateProductRequest)
- **Usage:** Product updates

**ProductResponse**
- **Purpose:** Complete product details
- **Fields:**
  - `id: UUID` - Product ID
  - `name: LocalizedTextResponse` - Product name
  - `description: LocalizedTextResponse?` - Description
  - `sku: String?` - SKU
  - `barcode: String?` - Barcode
  - `category: ProductCategory` - Category
  - `price: MoneyResponse` - Selling price
  - `costPrice: MoneyResponse?` - Cost price
  - `taxRate: BigDecimal?` - Tax rate %
  - `stockQuantity: Int` - Current stock
  - `lowStockThreshold: Int?` - Low stock threshold
  - `isLowStock: Boolean` - Low stock flag
  - `imageUrl: String?` - Product image
  - `isActive: Boolean` - Active flag
  - `totalSales: Int` - Units sold (lifetime)
  - `revenue: MoneyResponse` - Total revenue
  - `createdAt: Instant` - Creation time
  - `updatedAt: Instant` - Last update
- **Usage:** Product detail view

**CreateShopOrderRequest**
- **Purpose:** Create product order
- **Fields:**
  - `memberId: UUID` - Member (@NotNull)
  - `items: List<ShopOrderItemInput>` - Order items (@NotEmpty, @Valid)
  - `paymentMethod: PaymentMethod?` - Payment method (optional)
  - `notes: String?` - Order notes (optional)
- **Usage:** Shop order creation

**ShopOrderItemInput**
- **Purpose:** Order item input
- **Fields:**
  - `productId: UUID` - Product (@NotNull)
  - `quantity: Int` - Quantity (@Positive)
- **Validation:** Factory method

**ShopOrderResponse**
- **Purpose:** Shop order details
- **Fields:**
  - `id: UUID` - Order ID
  - `orderNumber: String` - Unique order number
  - `memberId: UUID` - Member ID
  - `memberName: String` - Member name
  - `items: List<ShopOrderItemResponse>` - Order items
  - `subtotal: MoneyResponse` - Subtotal
  - `taxAmount: MoneyResponse` - Total tax
  - `totalAmount: MoneyResponse` - Grand total
  - `paymentMethod: PaymentMethod?` - Payment method
  - `paymentStatus: PaymentStatus` - Payment status
  - `fulfillmentStatus: FulfillmentStatus` - Fulfillment (PENDING, PROCESSING, READY, DELIVERED, CANCELLED)
  - `notes: String?` - Order notes
  - `invoiceId: UUID?` - Generated invoice ID
  - `createdAt: Instant` - Order time
  - `updatedAt: Instant` - Last update
  - `fulfilledAt: Instant?` - Fulfillment time
- **Usage:** Order detail view

**ShopOrderItemResponse**
- **Purpose:** Order item details
- **Fields:**
  - `id: UUID` - Item ID
  - `productId: UUID` - Product ID
  - `productName: String` - Product name
  - `productImage: String?` - Product image
  - `quantity: Int` - Quantity
  - `unitPrice: MoneyResponse` - Unit price
  - `taxRate: BigDecimal` - Tax rate %
  - `taxAmount: MoneyResponse` - Tax amount
  - `totalAmount: MoneyResponse` - Line total
- **Usage:** Order line items

---

### Attendance & Check-In

**Location:** `com.liyaqa.attendance.api`

#### AttendanceDto.kt

**MarkAttendanceRequest**
- **Purpose:** Mark class attendance
- **Fields:**
  - `classSessionId: UUID` - Class session (@NotNull)
  - `memberId: UUID` - Member (@NotNull)
  - `status: AttendanceStatus` - Status (PRESENT, ABSENT, LATE, EXCUSED)
  - `notes: String?` - Attendance notes (optional)
- **Usage:** Class attendance marking

**BulkMarkAttendanceRequest**
- **Purpose:** Mark multiple attendances
- **Fields:**
  - `classSessionId: UUID` - Class session (@NotNull)
  - `attendances: List<BulkAttendanceInput>` - Attendances (@NotEmpty, @Valid)
- **Usage:** Bulk attendance marking

**BulkAttendanceInput**
- **Purpose:** Bulk attendance input
- **Fields:**
  - `memberId: UUID` - Member (@NotNull)
  - `status: AttendanceStatus` - Status (@NotNull)
  - `notes: String?` - Notes (optional)
- **Validation:** Factory method

**AttendanceResponse**
- **Purpose:** Attendance record details
- **Fields:**
  - `id: UUID` - Attendance ID
  - `classSessionId: UUID` - Class session ID
  - `classSessionName: String` - Class name
  - `memberId: UUID` - Member ID
  - `memberName: String` - Member name
  - `status: AttendanceStatus` - Attendance status
  - `markedAt: Instant` - Marking time
  - `markedBy: String?` - Staff who marked
  - `notes: String?` - Attendance notes
  - `createdAt: Instant` - Record time
  - `updatedAt: Instant` - Last update
- **Usage:** Attendance records

**AttendanceStatsResponse**
- **Purpose:** Attendance statistics
- **Fields:**
  - `memberId: UUID?` - Member ID (if member-specific)
  - `totalSessions: Int` - Total sessions
  - `presentCount: Int` - Present count
  - `absentCount: Int` - Absent count
  - `lateCount: Int` - Late count
  - `excusedCount: Int` - Excused count
  - `attendanceRate: Double` - Attendance %
  - `period: String` - Period (e.g., "Last 30 days")
- **Usage:** Attendance analytics

---

### CRM & Leads

**Location:** `com.liyaqa.crm.api`

#### LeadDto.kt

**CreateLeadRequest**
- **Purpose:** Create new lead
- **Fields:**
  - `firstName: String` - First name (@NotBlank)
  - `lastName: String` - Last name (@NotBlank)
  - `email: String?` - Email (@Email, optional)
  - `phoneNumber: String?` - Phone (optional)
  - `source: LeadSource` - Source (WALK_IN, PHONE_CALL, WEBSITE, SOCIAL_MEDIA, REFERRAL, OTHER)
  - `sourceDetails: String?` - Source details (optional)
  - `interests: List<String>?` - Interests (optional)
  - `notes: String?` - Lead notes (optional)
  - `assignedToUserId: UUID?` - Assigned staff (optional)
- **Usage:** Lead creation

**UpdateLeadRequest**
- **Purpose:** Update lead
- **Fields:** (All optional)
  - `firstName: String?`
  - `lastName: String?`
  - `email: String?` (@Email if provided)
  - `phoneNumber: String?`
  - `source: LeadSource?`
  - `sourceDetails: String?`
  - `interests: List<String>?`
  - `notes: String?`
  - `assignedToUserId: UUID?`
- **Usage:** Lead updates

**ConvertLeadRequest**
- **Purpose:** Convert lead to member
- **Fields:**
  - `leadId: UUID` - Lead (@NotNull)
  - `memberData: CreateMemberRequest` - Member details (@Valid)
  - `subscriptionPlanId: UUID?` - Initial subscription (optional)
- **Usage:** Lead conversion

**LeadResponse**
- **Purpose:** Lead details
- **Fields:**
  - `id: UUID` - Lead ID
  - `firstName: String` - First name
  - `lastName: String` - Last name
  - `email: String?` - Email
  - `phoneNumber: String?` - Phone
  - `source: LeadSource` - Lead source
  - `sourceDetails: String?` - Source details
  - `status: LeadStatus` - Status (NEW, CONTACTED, QUALIFIED, PROPOSAL, NEGOTIATION, CLOSED_WON, CLOSED_LOST)
  - `interests: List<String>` - Interests
  - `notes: String?` - Notes
  - `assignedTo: UserSummaryResponse?` - Assigned staff
  - `score: Int?` - Lead score (0-100)
  - `temperature: LeadTemperature?` - Temperature (COLD, WARM, HOT)
  - `activities: List<LeadActivitySummaryResponse>` - Recent activities
  - `convertedToMemberId: UUID?` - Member ID (if converted)
  - `convertedAt: Instant?` - Conversion time
  - `createdAt: Instant` - Creation time
  - `updatedAt: Instant` - Last update
- **Usage:** Lead detail view

**LogLeadActivityRequest**
- **Purpose:** Log lead interaction
- **Fields:**
  - `leadId: UUID` - Lead (@NotNull)
  - `activityType: ActivityType` - Type (CALL, EMAIL, MEETING, TOUR, NOTE)
  - `description: String` - Activity description (@NotBlank)
  - `scheduledFor: Instant?` - Scheduled time (optional, for future activities)
  - `completedAt: Instant?` - Completion time (optional)
- **Usage:** Activity logging

---

### Loyalty & Referrals

**Location:** `com.liyaqa.loyalty.api`, `com.liyaqa.referral.api`

#### LoyaltyDto.kt

**AwardPointsRequest**
- **Purpose:** Award loyalty points
- **Fields:**
  - `memberId: UUID` - Member (@NotNull)
  - `points: Int` - Points (@Positive)
  - `reason: String` - Award reason (@NotBlank)
  - `reference: String?` - Reference ID (optional)
- **Usage:** Points awarding

**RedeemPointsRequest**
- **Purpose:** Redeem loyalty points
- **Fields:**
  - `memberId: UUID` - Member (@NotNull)
  - `points: Int` - Points to redeem (@Positive)
  - `rewardId: UUID?` - Reward selected (optional)
  - `notes: String?` - Redemption notes (optional)
- **Usage:** Points redemption

**LoyaltyAccountResponse**
- **Purpose:** Loyalty account details
- **Fields:**
  - `memberId: UUID` - Member ID
  - `currentPoints: Int` - Available points
  - `totalEarned: Int` - Lifetime earned
  - `totalRedeemed: Int` - Lifetime redeemed
  - `tier: LoyaltyTier?` - Member tier (BRONZE, SILVER, GOLD, PLATINUM)
  - `transactions: List<LoyaltyTransactionResponse>` - Recent transactions
  - `createdAt: Instant` - Account creation
- **Usage:** Loyalty account view

**LoyaltyTransactionResponse**
- **Purpose:** Loyalty transaction record
- **Fields:**
  - `id: UUID` - Transaction ID
  - `type: TransactionType` - Type (EARN, REDEEM, ADJUST, EXPIRE)
  - `points: Int` - Points amount (positive for earn, negative for redeem)
  - `balance: Int` - Balance after transaction
  - `reason: String` - Transaction reason
  - `reference: String?` - Reference ID
  - `createdAt: Instant` - Transaction time
- **Usage:** Transaction history

#### ReferralDto.kt

**CreateReferralRequest**
- **Purpose:** Record referral
- **Fields:**
  - `referrerId: UUID` - Referrer member (@NotNull)
  - `refereeEmail: String?` - Referee email (@Email, optional)
  - `refereePhone: String?` - Referee phone (optional)
  - `refereeName: String?` - Referee name (optional)
- **Validation:** Email or phone required
- **Usage:** Referral recording

**ReferralResponse**
- **Purpose:** Referral details
- **Fields:**
  - `id: UUID` - Referral ID
  - `referrerId: UUID` - Referrer ID
  - `referrerName: String` - Referrer name
  - `refereeEmail: String?` - Referee email
  - `refereePhone: String?` - Referee phone
  - `refereeName: String?` - Referee name
  - `refereeId: UUID?` - Referee member ID (if converted)
  - `status: ReferralStatus` - Status (PENDING, CONVERTED, EXPIRED)
  - `referralCode: String` - Unique referral code
  - `rewardAmount: MoneyResponse?` - Reward amount
  - `rewardStatus: RewardStatus?` - Reward status (PENDING, CLAIMED, PAID)
  - `convertedAt: Instant?` - Conversion time
  - `createdAt: Instant` - Referral time
- **Usage:** Referral tracking

---

### Churn Prevention

**Location:** `com.liyaqa.churn.api`

#### ChurnDto.kt

**CreateChurnInterventionRequest**
- **Purpose:** Create churn intervention
- **Fields:**
  - `memberId: UUID` - Member (@NotNull)
  - `type: InterventionType` - Type (DISCOUNT, UPGRADE, CHECK_IN, SURVEY, COACHING, FEEDBACK)
  - `offerDetails: Map<String, String>?` - Offer parameters (optional)
  - `assignedToUserId: UUID?` - Assigned staff (optional)
  - `scheduledFor: LocalDate?` - Schedule date (optional)
  - `notes: String?` - Intervention notes (optional)
- **Usage:** Intervention creation

**ChurnRiskResponse**
- **Purpose:** Member churn risk assessment
- **Fields:**
  - `memberId: UUID` - Member ID
  - `memberName: String` - Member name
  - `riskScore: Int` - Risk score (0-100)
  - `riskLevel: RiskLevel` - Risk level (LOW, MEDIUM, HIGH, CRITICAL)
  - `factors: List<RiskFactorResponse>` - Contributing factors
  - `lastCheckIn: Instant?` - Last check-in
  - `daysSinceLastCheckIn: Int?` - Days since check-in
  - `subscriptionEndDate: LocalDate?` - Subscription end
  - `daysUntilExpiry: Int?` - Days to expiry
  - `interventions: List<ChurnInterventionResponse>` - Applied interventions
  - `assessedAt: Instant` - Assessment time
- **Usage:** Churn risk dashboard

**RiskFactorResponse**
- **Purpose:** Churn risk factor
- **Fields:**
  - `factor: String` - Factor name (e.g., "Low Attendance", "Expiring Soon")
  - `weight: Double` - Factor weight (contribution to risk)
  - `value: String` - Factor value/description
- **Usage:** Risk factor breakdown

**ChurnInterventionResponse**
- **Purpose:** Intervention record
- **Fields:**
  - `id: UUID` - Intervention ID
  - `memberId: UUID` - Member ID
  - `type: InterventionType` - Type
  - `status: InterventionStatus` - Status (SCHEDULED, IN_PROGRESS, COMPLETED, FAILED)
  - `offerDetails: Map<String, String>?` - Offer details
  - `assignedToUserId: UUID?` - Assigned staff
  - `scheduledFor: LocalDate?` - Scheduled date
  - `completedAt: Instant?` - Completion time
  - `outcome: InterventionOutcome?` - Result (SUCCESSFUL, UNSUCCESSFUL, PENDING)
  - `notes: String?` - Notes
  - `createdAt: Instant` - Creation time
- **Usage:** Intervention tracking

---

### Platform Management

**Location:** `com.liyaqa.platform.api.dto`

#### ClientDtos.kt

**OnboardClientRequest**
- **Purpose:** Onboard new client company
- **Fields:**
  - `companyName: String` - Company name (@NotBlank)
  - `contactEmail: String` - Contact email (@Email)
  - `contactPhone: String?` - Contact phone (optional)
  - `industryType: String?` - Industry (optional)
  - `employeeCount: Int?` - Employees (optional)
  - `contractStartDate: LocalDate?` - Contract start (optional)
  - `planId: UUID?` - Subscription plan (optional)
- **Usage:** Client onboarding

**ClientResponse**
- **Purpose:** Complete client information
- **Fields:**
  - `id: UUID` - Client ID
  - `companyName: String` - Company name
  - `contactEmail: String` - Contact email
  - `contactPhone: String?` - Contact phone
  - `industryType: String?` - Industry
  - `employeeCount: Int?` - Employees
  - `adminUser: AdminUserResponse` - Admin info
  - `clubs: List<ClientClubResponse>` - Clubs
  - `subscription: ClientSubscriptionSummaryResponse` - Plan info
  - `healthScore: Int` - Health (0-100)
  - `memberCount: Int` - Total members
  - `monthlyRevenue: MoneyResponse` - MRR
  - `status: ClientStatus` - Status (TRIAL, ACTIVE, SUSPENDED, CHURNED)
  - `createdAt: Instant` - Signup date
  - `updatedAt: Instant` - Last update
- **Usage:** Client management

#### PlatformDashboardDtos.kt

**PlatformSummaryResponse**
- **Purpose:** Platform-wide overview
- **Fields:**
  - `totalClients: Int` - Client count
  - `totalMembers: Int` - Across all clients
  - `totalRevenue: MoneyResponse` - Platform revenue (MRR)
  - `newClientsThisMonth: Int` - Monthly new
  - `churnRate: Double` - Monthly churn %
  - `activeSubscriptions: Int` - Client subscriptions
  - `healthScore: Int` - Platform health (0-100)
- **Usage:** Platform dashboard

---

## Best Practices

### 1. Request Validation

Always validate request DTOs:
```kotlin
data class CreateMemberRequest(
    @field:NotBlank val firstNameEn: String,
    @field:Email @field:NotBlank val email: String,
    @field:Past val dateOfBirth: LocalDate,
    @field:Valid val address: AddressInput?
)
```

### 2. Bilingual Support

Use consistent bilingual patterns:
```kotlin
// Request
val nameEn: String
val nameAr: String?

// Response
val name: LocalizedTextResponse
```

### 3. Money Representation

Always use MoneyResponse for amounts:
```kotlin
data class MoneyResponse(
    val amount: BigDecimal,
    val currency: String
)
```

### 4. Pagination

Use PageResponse for lists:
```kotlin
val members: PageResponse<MemberListResponse>
```

### 5. Factory Methods

Implement factory methods for conversion:
```kotlin
companion object {
    fun from(entity: Member): MemberResponse {
        // Conversion logic
    }
}

fun toCommand(): CreateMemberCommand {
    // Command conversion
}
```

### 6. Nullable vs Non-Nullable

- **Create Requests:** Required fields non-null
- **Update Requests:** All fields nullable (optional)
- **Responses:** Match entity nullability

### 7. Validation Messages

Provide clear validation messages:
```kotlin
@field:NotBlank(message = "Email is required")
@field:Email(message = "Invalid email format")
val email: String
```

### 8. Enum Usage

Use enums for fixed sets:
```kotlin
enum class MemberStatus {
    ACTIVE, SUSPENDED, INACTIVE
}
```

### 9. Nested Validation

Validate nested DTOs:
```kotlin
@field:Valid
@field:NotNull
val address: AddressInput
```

### 10. Response Consistency

Always include audit fields in responses:
```kotlin
val createdAt: Instant
val updatedAt: Instant
```

---

## Summary

This catalog documents **250+ DTOs** across **24 business domains** in the Liyaqa gym management system. Key characteristics:

- **Consistent Patterns:** Bilingual support, money representation, pagination
- **Strong Validation:** Jakarta Bean Validation throughout
- **Type Safety:** Kotlin nullable types, enums
- **Audit Trail:** Timestamps on all entities
- **Factory Methods:** Clean conversion between DTOs and domain models
- **Multi-Tenant:** Implicit tenant isolation via BaseEntity

### Coverage

- **Request DTOs:** 120+ (Create, Update, Action requests)
- **Response DTOs:** 130+ (Full details, summaries, lists)
- **Domains:** Auth, Membership, Billing, Shop, CRM, Loyalty, Platform, Compliance, etc.
- **Validation Annotations:** 12+ standard constraints

### Frontend Integration

For TypeScript type generation:
1. Use DTOs as single source of truth
2. Generate types from DTO class definitions
3. Match validation rules in frontend forms
4. Use bilingual fields consistently
5. Handle pagination uniformly

---

**Document Version:** 1.0
**Last Updated:** 2026-02-04
**Maintained By:** Liyaqa Development Team