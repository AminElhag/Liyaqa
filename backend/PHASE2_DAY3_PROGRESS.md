# Phase 2 Day 3-4 Progress - Critical Flow Tests

**Date:** February 5, 2026
**Status:** 🔄 **IN PROGRESS**

---

## Overview

Day 3-4 focuses on implementing comprehensive integration tests for critical user flows:
- Booking flow (10 scenarios)
- Auth flow (10 scenarios)
- Payment flow (8 scenarios)

---

## Current Status

### ✅ Completed
1. Integration test infrastructure (Day 1-2)
2. BookingFlowIntegrationTest.kt template created with:
   - Comprehensive test data setup methods
   - Helper methods for creating bookings, users, sessions
   - 5 working test scenarios (health checks)
   - 7 TODO scenarios mapped out

### 🔄 In Progress
1. Fixing Testcontainers PostgreSQL configuration
2. Implementing authorization tests for Phase 1 fixes

### ⏳ To Do
1. Complete booking flow tests (10 scenarios)
2. Auth flow integration tests (10 scenarios)
3. Payment flow integration tests (8 scenarios)
4. Unit test coverage improvements

---

## Current Challenge: Test Database Configuration

**Issue:** Tests are using H2 in-memory database instead of Testcontainers PostgreSQL

**Root Cause:**
- Testcontainers PostgreSQL container is defined in IntegrationTestBase
- But Spring Boot test configuration doesn't automatically connect to it
- Need to configure datasource dynamically from Test containers

**Solution Options:**

### Option 1: Use @DynamicPropertySource (Recommended)
```kotlin
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
@Testcontainers
abstract class IntegrationTestBase {

    companion object {
        @Container
        @JvmStatic
        val postgres: PostgreSQLContainer<*> = PostgreSQLContainer("postgres:15")
            .withDatabaseName("liyaqa_test")
            .withUsername("test")
            .withPassword("test")
    }

    @DynamicPropertySource
    @JvmStatic
    fun configureProperties(registry: DynamicPropertyRegistry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl)
        registry.add("spring.datasource.username", postgres::getUsername)
        registry.add("spring.datasource.password", postgres::getPassword)
    }
}
```

### Option 2: Use Spring Boot Testcontainers Support
```kotlin
dependencies {
    testImplementation("org.springframework.boot:spring-boot-testcontainers")
}
```

### Option 3: Simplified Approach - Use H2 for Basic Tests
For rapid development, continue with H2 and focus on:
- API contract testing
- Authorization logic testing
- Tenant isolation testing

Real database integration can be added later.

---

## Integration Test Approach - Two Strategies

### Strategy A: Full Integration (Complex, More Realistic)
**Pros:**
- Tests real database interactions
- Catches database-specific issues
- More confidence in production behavior

**Cons:**
- Slower test execution
- More complex setup
- Requires managing test data carefully

**Best For:**
- Final pre-production validation
- Testing complex database queries
- Performance testing

### Strategy B: Focused API Testing (Simpler, Faster)
**Pros:**
- Fast test execution
- Easier to write and maintain
- Focus on business logic and authorization

**Cons:**
- Might miss database-specific issues
- Less realistic than full integration

**Best For:**
- Day-to-day development
- TDD workflow
- CI/CD pipelines

---

## Recommended Path Forward

### Immediate (Next 2 hours)
1. **Fix Testcontainers configuration** using @DynamicPropertySource
2. **Simplify test data setup** - remove complex SQL, use entity repositories
3. **Focus on 3-5 core scenarios:**
   - User can cancel own booking ✓
   - User CANNOT cancel another user's booking ✓
   - Admin CAN cancel any booking ✓
   - Cross-tenant isolation ✓
   - Basic booking creation ✓

### Short-term (Rest of Week 1)
1. Complete booking flow tests with simplified setup
2. Add auth flow tests (login, password reset, session management)
3. Add basic payment flow tests
4. Reach 60% code coverage target

### Medium-term (Week 2)
1. Add performance tests with K6
2. Run SonarQube analysis
3. Security audit
4. Documentation updates

---

## Alternative: Unit Tests + API Contract Tests

If integration tests prove too complex to set up quickly, consider this hybrid approach:

### Unit Tests (80% of coverage)
- Test service layer with mocked dependencies
- Fast, isolated, easy to write
- Already have some: BookingServiceTest, AuthServiceTest

### API Contract Tests (20% of coverage)
- Test REST API contracts (request/response format)
- Use @WebMvcTest for lightweight testing
- Mock service layer
- Validate JSON structure, status codes, error handling

### Benefits:
- Faster test execution (no database)
- Easier to write and maintain
- Still validates critical authorization logic
- Can add full integration tests later

---

## Code Quality Metrics (Current vs Target)

| Metric | Current | Target (End of Week 1) | Status |
|--------|---------|----------------------|--------|
| Overall Coverage | ~40% | 60% | 🔄 In Progress |
| BookingService | ~45% | 85% | ⏳ To Do |
| MemberService | ~50% | 80% | ⏳ To Do |
| AuthService | ~40% | 80% | ⏳ To Do |
| Integration Tests | 2 | 28+ | 🔄 In Progress |

---

## Files Created/Modified Today

### Created
- `BookingFlowIntegrationTest.kt` (comprehensive template with 12 scenarios)
- `PHASE2_DAY3_PROGRESS.md` (this file)

### Modified
- None yet (waiting on configuration fixes)

---

## Next Steps

### Option A: Fix Integration Tests (Recommended if < 1 hour effort)
1. Add @DynamicPropertySource to IntegrationTestBase
2. Test that PostgreSQL container is used
3. Simplify test data setup using repositories instead of SQL
4. Run and verify 5 core scenarios

### Option B: Pivot to Unit + API Contract Tests (If integration tests take > 1 hour)
1. Create comprehensive unit tests for BookingService
2. Create API contract tests with @WebMvcTest
3. Focus on reaching 60% coverage quickly
4. Add full integration tests in Week 2

---

## Lessons Learned

1. **Testcontainers requires explicit configuration** - @DynamicPropertySource is essential
2. **Manual SQL setup is error-prone** - prefer using repositories and entities
3. **Start simple, add complexity later** - 2-3 working tests better than 10 failing tests
4. **Test pyramid matters** - More unit tests, fewer integration tests
5. **Mock authentication for speed** - Use @WithMockUser instead of real JWT

---

## Recommendations for User

**If you want rapid progress (next 4 hours):**
- Focus on unit tests to reach 60% coverage
- Use @WebMvcTest for lightweight API testing
- Add full integration tests later

**If you want comprehensive integration tests:**
- I'll fix the Testcontainers configuration
- Simplify test data setup
- Focus on 5-10 core scenarios
- Expect slower progress but higher confidence

**Which approach would you prefer?**

---

**Status:** Waiting for user direction on test strategy
**Estimated time to complete Day 3-4:**
- Approach A (Unit + API): 6-8 hours
- Approach B (Full Integration): 12-16 hours

---

**Prepared by:** Claude Code
**Phase:** 2 - Day 3-4 - Critical Flow Tests
**Status:** 🔄 IN PROGRESS
