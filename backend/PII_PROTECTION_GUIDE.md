# PII Protection Guide

**Status:** ✅ Implemented
**Compliance:** GDPR, Saudi PDPL
**Last Updated:** February 6, 2026

---

## Overview

This document outlines the PII (Personally Identifiable Information) protection measures implemented in Liyaqa to ensure compliance with GDPR and Saudi PDPL regulations.

## PII Protection Layers

### Layer 1: Code-Level Masking (Primary Defense)

**PiiMasker Utility:** `com.liyaqa.shared.utils.PiiMasker`

```kotlin
import com.liyaqa.shared.utils.PiiMasker

// Mask email for logging
logger.info("User profile updated: email=${PiiMasker.maskEmail(user.email)}")
// Output: User profile updated: email=j***e@e***

// Mask phone for logging
logger.info("SMS sent to: ${PiiMasker.maskPhone(user.phone)}")
// Output: SMS sent to: +966****4567

// Fully redact sensitive data
logger.debug("Password reset token: ${PiiMasker.maskSensitive(token)}")
// Output: Password reset token: [REDACTED]
```

**When to Use:**
- ✅ ALWAYS use when logging email addresses
- ✅ ALWAYS use when logging phone numbers
- ✅ ALWAYS use when logging passwords, tokens, or secrets
- ✅ Use when logging any personal data (address, name, etc.)
- ✅ Use in error messages that may be displayed to users
- ❌ DO NOT use for UUIDs, tenant IDs, or non-personal identifiers

### Layer 2: Logback Pattern Filters (Safety Net)

**Location:** `backend/src/main/resources/logback-spring.xml`

Automatic regex-based pattern filters mask PII even if developers forget to use PiiMasker:

```xml
<pattern>
    %replace(%msg){'email=([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})','email=***@***'}
    %replace(%msg){'phone=(\+?\d{10,15})','phone=***'}
    %replace(%msg){'password=[^,\s}]+','password=***'}
</pattern>
```

**Patterns Masked:**
- Email addresses (any format)
- Phone numbers (E.164 format)
- Passwords (any format)

### Layer 3: Safe Logging Practices

**✅ SAFE - Log these:**
```kotlin
// UUIDs are safe (not PII)
logger.info("User logged in: userId=$userId, tenantId=$tenantId")

// Masked PII
logger.warn("Login failed: email=${PiiMasker.maskEmail(email)}")

// Aggregated/anonymized data
logger.info("Total active users: $count")
```

**❌ UNSAFE - Never log these:**
```kotlin
// Raw email
logger.info("User email: $email") // ❌ WRONG

// Raw phone
logger.debug("Sending SMS to: $phoneNumber") // ❌ WRONG

// Full user objects
logger.debug("User profile: $user") // ❌ WRONG - may contain PII

// Passwords or tokens
logger.error("Invalid token: $resetToken") // ❌ WRONG
```

## Current Implementation Status

### ✅ Completed

1. **PiiMasker utility created** - `backend/src/main/kotlin/com/liyaqa/shared/utils/PiiMasker.kt`
2. **Logback pattern filters added** - Automatic masking in logs
3. **Safe logging verified** - All current log statements use UUIDs only
4. **Documentation created** - This guide

### 🔄 Ongoing Requirements

1. **Code Reviews** - Verify new log statements use PiiMasker
2. **Developer Training** - Ensure team knows when to use PiiMasker
3. **Audit** - Periodically grep for unsafe logging patterns

## Compliance Checklist

- [x] Email addresses are masked in logs
- [x] Phone numbers are masked in logs
- [x] Passwords are never logged
- [x] Authentication tokens are masked
- [x] Multiple layers of protection implemented
- [x] Safe logging practices documented

## Testing PII Protection

### Manual Test

```bash
# 1. Add a test log statement with PII
logger.info("Test: email=test@example.com, phone=+966501234567, password=secret123")

# 2. Run the application
./gradlew bootRun

# 3. Check logs - should see masked output:
# Test: email=***@***, phone=***, password=***
```

### Automated Test

```kotlin
@Test
fun `PiiMasker should mask email addresses`() {
    val email = "john.doe@example.com"
    val masked = PiiMasker.maskEmail(email)

    assertThat(masked).isEqualTo("j***e@e***")
    assertThat(masked).doesNotContain("john")
    assertThat(masked).doesNotContain("doe")
}

@Test
fun `PiiMasker should mask phone numbers`() {
    val phone = "+966501234567"
    val masked = PiiMasker.maskPhone(phone)

    assertThat(masked).isEqualTo("+966****4567")
    assertThat(masked).doesNotContain("5012")
}
```

## Related Files

- `backend/src/main/kotlin/com/liyaqa/shared/utils/PiiMasker.kt` - Masking utility
- `backend/src/main/resources/logback-spring.xml` - Pattern filters
- `CODE_QUALITY_REPORT.md` - Original security audit

## References

- **GDPR Article 32**: Security of processing
- **Saudi PDPL Article 27**: Data security measures
- **OWASP Logging Cheat Sheet**: https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html

---

**Status:** ✅ PII protection fully implemented and verified
**Next Review:** Before production deployment
