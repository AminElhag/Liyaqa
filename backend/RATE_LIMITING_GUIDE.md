# Rate Limiting Guide

**Status:** ✅ Implemented
**Security Impact:** Prevents brute force attacks
**Last Updated:** February 6, 2026

---

## Overview

Rate limiting has been implemented using Resilience4j to protect authentication endpoints from brute force attacks and abuse.

## Protected Endpoints

### Authentication Endpoints (5 req/min)

| Endpoint | Method | Limit | Window |
|----------|--------|-------|--------|
| `/api/auth/login` | POST | 5 requests | 1 minute |
| `/api/auth/register` | POST | 5 requests | 1 minute |
| `/api/platform/auth/login` | POST | 5 requests | 1 minute |

### Password Reset Endpoints (3 req/15min)

| Endpoint | Method | Limit | Window |
|----------|--------|-------|--------|
| `/api/auth/forgot-password` | POST | 3 requests | 15 minutes |
| `/api/auth/reset-password` | POST | 3 requests | 15 minutes |

**Rationale:** Password reset is more restrictive to prevent:
- Email enumeration attacks
- Spam attacks via password reset emails
- Account takeover attempts

## Implementation Details

### Architecture

```
HTTP Request
    ↓
Rate Limit Filter (checks IP-based limit)
    ↓
Cookie Auth Filter
    ↓
CSRF Validation Filter
    ↓
JWT Auth Filter
    ↓
Controller
```

### Rate Limiter Configuration

**File:** `backend/src/main/kotlin/com/liyaqa/config/RateLimitConfig.kt`

```kotlin
@Bean
fun authRateLimiter(): RateLimiter {
    val config = RateLimiterConfig.custom()
        .limitForPeriod(5)                      // 5 requests
        .limitRefreshPeriod(Duration.ofMinutes(1)) // per minute
        .timeoutDuration(Duration.ofSeconds(0))  // fail immediately
        .build()

    return RateLimiterRegistry.of(config).rateLimiter("auth")
}
```

### Client Identification

Rate limits are applied **per IP address**:

1. Checks `X-Forwarded-For` header (if behind proxy/load balancer)
2. Falls back to `request.remoteAddr`

**Future enhancements:**
- Combined IP + User-Agent fingerprinting
- Device-based rate limiting
- Account-based rate limiting (for authenticated requests)

### Error Response

When rate limit is exceeded, clients receive **HTTP 429 Too Many Requests**:

```json
{
  "status": 429,
  "error": "Too Many Requests",
  "errorAr": "عدد كبير جداً من الطلبات",
  "message": "Too many authentication attempts. Please try again later.",
  "messageAr": "عدد كبير جداً من محاولات المصادقة. يرجى المحاولة لاحقاً.",
  "timestamp": "2026-02-06T10:30:00Z",
  "path": "/api/auth/login"
}
```

## Testing

### Manual Test

```bash
# Test login rate limiting
for i in {1..6}; do
  curl -X POST http://localhost:8080/api/auth/login \
    -H "Content-Type: application/json" \
    -H "X-Tenant-ID: your-tenant-id" \
    -d '{"email":"test@example.com","password":"wrong"}' \
    -w "\nStatus: %{http_code}\n\n"
done

# Expected result:
# First 5 requests: 401 Unauthorized (wrong credentials)
# 6th request: 429 Too Many Requests (rate limited)
```

### Automated Test

```kotlin
@Test
fun `should rate limit login attempts`() {
    val tenantId = UUID.randomUUID()

    // Make 5 login attempts (should succeed in reaching endpoint)
    repeat(5) {
        mockMvc.perform(
            post("/api/auth/login")
                .header("X-Tenant-ID", tenantId)
                .contentType(MediaType.APPLICATION_JSON)
                .content("""{"email":"test@example.com","password":"wrong"}""")
        ).andExpect(status().isUnauthorized) // Wrong credentials
    }

    // 6th attempt should be rate limited
    mockMvc.perform(
        post("/api/auth/login")
            .header("X-Tenant-ID", tenantId)
            .contentType(MediaType.APPLICATION_JSON)
            .content("""{"email":"test@example.com","password":"wrong"}""")
    ).andExpect(status().isTooManyRequests)
}
```

## Configuration

Rate limits can be adjusted via environment variables (future enhancement):

```properties
# application-prod.yml
resilience4j.ratelimiter.instances.auth.limitForPeriod=5
resilience4j.ratelimiter.instances.auth.limitRefreshPeriod=1m

resilience4j.ratelimiter.instances.passwordReset.limitForPeriod=3
resilience4j.ratelimiter.instances.passwordReset.limitRefreshPeriod=15m
```

## Monitoring

### Metrics

Rate limiting events are logged:

```
WARN  [RateLimitFilter] Rate limit exceeded for client 192.168.1.100 on /api/auth/login
```

### Dashboards

**Recommended metrics to track:**
- Rate limit violations per minute
- Top 10 IP addresses hitting rate limits
- Success rate after rate limit reset

**Grafana Query Example:**
```promql
rate(http_requests_total{status="429"}[5m])
```

## Security Considerations

### Bypass Prevention

- Rate limits applied **before** authentication (can't bypass by logging in)
- IP-based limiting prevents single user from consuming all attempts
- Fail-fast design (returns 429 immediately, not after timeout)

### Distributed Environments

**Current:** In-memory rate limiting (single instance)

**Production:** Should use Redis-backed rate limiting for multi-instance deployments:

```kotlin
@Bean
fun redisRateLimiter(): RateLimiter {
    // TODO: Implement Redis-backed rate limiter
    // Shares limits across all backend instances
}
```

### Known Limitations

1. **Single Instance Only**: Current implementation uses in-memory counters
   - **Impact:** In load-balanced setup, each instance has separate limits
   - **Solution:** Implement Redis-backed rate limiter before horizontal scaling

2. **IP Spoofing**: Attackers behind NAT share the same public IP
   - **Impact:** Legitimate users may be blocked if attacker shares their IP
   - **Solution:** Consider additional fingerprinting (User-Agent, etc.)

3. **IPv6 Addresses**: Large IPv6 space allows easy bypass
   - **Impact:** Attacker can rotate through many IPv6 addresses
   - **Solution:** Rate limit by /64 subnet for IPv6

## Next Steps

### Priority 1: Production Readiness
- [ ] Implement Redis-backed rate limiter for distributed deployments
- [ ] Add Prometheus metrics for rate limit violations
- [ ] Set up alerting for unusual rate limit patterns

### Priority 2: Enhanced Protection
- [ ] Add CAPTCHA after X failed attempts
- [ ] Implement progressive delays (exponential backoff)
- [ ] Add account lockout after repeated violations

### Priority 3: Monitoring
- [ ] Dashboard showing rate limit violations by endpoint
- [ ] Alerts for potential DDoS attacks (high volume from single IP)
- [ ] Whitelist for trusted IPs (internal tools, monitoring)

## Related Files

- `backend/src/main/kotlin/com/liyaqa/config/RateLimitConfig.kt` - Rate limiter configuration
- `backend/src/main/kotlin/com/liyaqa/config/RateLimitFilter.kt` - Servlet filter implementation
- `backend/src/main/kotlin/com/liyaqa/config/SecurityConfig.kt` - Filter chain registration
- `backend/build.gradle.kts` - Resilience4j dependency

## References

- **Resilience4j Docs**: https://resilience4j.readme.io/docs/ratelimiter
- **OWASP Brute Force Guide**: https://owasp.org/www-community/controls/Blocking_Brute_Force_Attacks
- **RFC 6585 - HTTP 429**: https://tools.ietf.org/html/rfc6585

---

**Status:** ✅ Rate limiting implemented for auth endpoints
**Production Ready:** ⚠️ Requires Redis backend for multi-instance deployments
**Next Review:** Before horizontal scaling
