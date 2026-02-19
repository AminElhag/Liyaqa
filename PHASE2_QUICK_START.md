# Phase 2: Quick Start Guide

**Goal**: Achieve 80% test coverage, comprehensive integration tests, and production-grade code quality

**Timeline**: 2 weeks
**Difficulty**: Medium
**Prerequisites**: Phase 1 completed ✅

---

## 📋 Overview

Phase 2 focuses on making your codebase **robust, maintainable, and production-ready at scale**.

**What You'll Build:**
- 50+ integration tests covering all critical flows
- 200+ unit tests reaching 80% coverage
- Performance tests validating system can handle load
- Security audit ensuring no vulnerabilities
- Code quality improvements reducing technical debt

---

## 🚀 Quick Start (Choose Your Path)

### Path A: Full Implementation (2 weeks)
Follow the complete plan in `PHASE2_IMPLEMENTATION_PLAN.md`

### Path B: Critical Tests Only (1 week)
Focus on P0 tasks only:
- Integration test infrastructure
- Booking flow tests
- Auth flow tests
- Multi-tenant isolation tests
- Performance benchmarks

### Path C: Gradual Implementation (Ongoing)
Implement tests as you work on features:
- Add integration test for each new feature
- Increase coverage by 10% per sprint
- Run performance tests monthly

---

## 📦 Day 1: Setup (2-4 hours)

### Step 1: Add Dependencies (15 min)

```kotlin
// build.gradle.kts
dependencies {
    // Existing dependencies...

    // Integration testing
    testImplementation("org.testcontainers:testcontainers:1.19.3")
    testImplementation("org.testcontainers:postgresql:1.19.3")
    testImplementation("org.testcontainers:junit-jupiter:1.19.3")

    // Performance testing (K6 runs separately)

    // Code quality
    // SonarQube plugin added in plugins section
}

plugins {
    // Existing plugins...
    id("org.sonarqube") version "4.4.1.3373"
}
```

### Step 2: Create Integration Test Base (30 min)

```bash
cd /Users/waraiotoko/Desktop/Liyaqa/backend

# Create integration test directory
mkdir -p src/test/kotlin/com/liyaqa/integration

# Create base test class
cat > src/test/kotlin/com/liyaqa/integration/IntegrationTestBase.kt << 'EOF'
package com.liyaqa.integration

import org.junit.jupiter.api.BeforeEach
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.boot.test.web.client.TestRestTemplate
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.web.server.LocalServerPort
import org.springframework.test.context.ActiveProfiles
import org.testcontainers.containers.PostgreSQLContainer
import org.testcontainers.junit.jupiter.Container
import org.testcontainers.junit.jupiter.Testcontainers

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
@Testcontainers
abstract class IntegrationTestBase {

    companion object {
        @Container
        val postgres: PostgreSQLContainer<*> = PostgreSQLContainer("postgres:15")
            .withDatabaseName("liyaqa_test")
            .withUsername("test")
            .withPassword("test")
    }

    @LocalServerPort
    protected var port: Int = 0

    @Autowired
    protected lateinit var restTemplate: TestRestTemplate

    @BeforeEach
    fun setup() {
        // Clean database before each test
        cleanDatabase()
    }

    protected fun cleanDatabase() {
        // Implement based on your schema
    }
}
EOF
```

### Step 3: Write First Integration Test (30 min)

```bash
# Create booking flow test
cat > src/test/kotlin/com/liyaqa/integration/BookingFlowIntegrationTest.kt << 'EOF'
package com.liyaqa.integration

import org.junit.jupiter.api.Test
import org.springframework.http.HttpStatus
import org.assertj.core.api.Assertions.assertThat

class BookingFlowIntegrationTest : IntegrationTestBase() {

    @Test
    fun `health check should return UP`() {
        val response = restTemplate.getForEntity(
            "http://localhost:$port/actuator/health",
            Map::class.java
        )

        assertThat(response.statusCode).isEqualTo(HttpStatus.OK)
        assertThat(response.body?.get("status")).isEqualTo("UP")
    }

    @Test
    fun `complete booking flow - happy path`() {
        // TODO: Implement in Phase 2
    }
}
EOF
```

### Step 4: Run First Test (15 min)

```bash
# Run integration tests
./gradlew integrationTest

# Or run all tests
./gradlew test
```

---

## 📊 Week 1 Checklist

### Day 1-2: Infrastructure ✅
- [ ] Testcontainers setup
- [ ] Integration test base class
- [ ] Test database configuration
- [ ] First test passing

### Day 3-4: Critical Flows ✅
- [ ] Booking flow tests (10 scenarios)
- [ ] Auth flow tests (10 scenarios)
- [ ] Payment flow tests (8 scenarios)

### Day 5: Coverage ✅
- [ ] Unit tests for BookingService (85%)
- [ ] Unit tests for MemberService (80%)
- [ ] Current coverage report generated

**End of Week 1 Target**: 60% coverage, critical flows tested

---

## 📊 Week 2 Checklist

### Day 6-7: Performance ✅
- [ ] K6 setup
- [ ] Load test (100 concurrent users)
- [ ] Database performance benchmarks
- [ ] Response time < 200ms P95

### Day 8-9: Quality ✅
- [ ] SonarQube analysis
- [ ] Fix critical code smells
- [ ] Error handling improvements
- [ ] Quality gate passed

### Day 10: Security ✅
- [ ] SQL injection tests
- [ ] XSS tests
- [ ] Penetration test
- [ ] Security audit report

**End of Week 2 Target**: 80% coverage, all quality gates passed

---

## 🎯 Metrics to Track

### Test Coverage
```bash
# Generate coverage report
./gradlew jacocoTestReport

# View report
open build/reports/jacoco/test/html/index.html

# Current vs Target:
# - Overall: 40% → 80%
# - BookingService: 45% → 85%
# - MemberService: 50% → 80%
```

### Performance
```bash
# Run load test
k6 run performance-tests/load-test.js

# Targets:
# - P95 response time: < 200ms
# - P99 response time: < 500ms
# - Error rate: < 1%
# - Concurrent users: 100+
```

### Code Quality
```bash
# Run SonarQube analysis
./gradlew sonarqube

# Targets:
# - Quality gate: PASSED
# - Code smells: < 50
# - Duplicated code: < 3%
# - Bugs: 0
# - Vulnerabilities: 0
```

---

## 🛠️ Essential Commands

```bash
# Run all tests
./gradlew test

# Run integration tests only
./gradlew integrationTest

# Run specific test
./gradlew test --tests "BookingFlowIntegrationTest"

# Generate coverage report
./gradlew jacocoTestReport

# Run performance test
k6 run performance-tests/load-test.js

# SonarQube analysis
./gradlew sonarqube

# Check code quality
./gradlew check
```

---

## 📁 Project Structure After Phase 2

```
backend/
├── src/
│   ├── main/kotlin/
│   │   └── com/liyaqa/
│   │       ├── [existing code]
│   │       └── shared/
│   │           ├── utils/
│   │           │   └── PiiMasker.kt ✅ (Phase 1)
│   │           └── exception/
│   │               └── GlobalExceptionHandler.kt ✅ (Phase 2)
│   └── test/kotlin/
│       └── com/liyaqa/
│           ├── unit/
│           │   ├── BookingServiceTest.kt ✅
│           │   ├── MemberServiceTest.kt ✅
│           │   └── [200+ unit tests] ✅
│           └── integration/
│               ├── IntegrationTestBase.kt ✅
│               ├── BookingFlowIntegrationTest.kt ✅
│               ├── AuthFlowIntegrationTest.kt ✅
│               ├── PaymentFlowIntegrationTest.kt ✅
│               └── [50+ integration tests] ✅
├── performance-tests/
│   ├── load-test.js ✅
│   ├── stress-test.js ✅
│   └── soak-test.js ✅
└── build/reports/
    ├── jacoco/ (coverage) ✅
    ├── tests/ (test results) ✅
    └── performance/ (K6 reports) ✅
```

---

## 💡 Pro Tips

### Writing Good Integration Tests
```kotlin
// ✅ Good: Clear, focused, tests one flow
@Test
fun `member can book available session`() {
    val member = createTestMember()
    val session = createAvailableSession()

    val response = bookSession(member, session)

    assertThat(response.status).isEqualTo("CONFIRMED")
}

// ❌ Bad: Tests multiple things, unclear
@Test
fun `test booking`() {
    // Too much setup, tests multiple scenarios
}
```

### Performance Testing Tips
- Start with realistic load (50-100 users)
- Gradually increase to find breaking point
- Monitor database connections
- Check for memory leaks
- Use production-like data volume

### Code Quality Tips
- Fix critical issues first
- Don't obsess over minor code smells
- Focus on reducing complexity
- Add missing error handling
- Improve logging

---

## 🚨 Common Issues & Solutions

### Issue: Testcontainers slow to start
**Solution**: Use singleton containers
```kotlin
companion object {
    @Container
    @JvmStatic
    val postgres = PostgreSQLContainer("postgres:15")
        .withReuse(true) // Reuse between test runs
}
```

### Issue: Integration tests flaky
**Solution**: Clean database before each test, use transactions

### Issue: Can't reach 80% coverage
**Solution**: Focus on service layer first, skip trivial code

### Issue: Performance tests failing
**Solution**: Check database indexes, connection pool size, query optimization

---

## 📚 Resources

**Documentation:**
- Full plan: `PHASE2_IMPLEMENTATION_PLAN.md`
- Phase 1 report: `PHASE1_COMPLETION_REPORT.md`
- Deployment guide: `backend/DEPLOYMENT_PHASE1.md`

**Tools:**
- Testcontainers: https://testcontainers.com/
- K6 Performance: https://k6.io/docs/
- SonarQube: https://docs.sonarqube.org/

**Testing Guides:**
- Integration testing: Martin Fowler's guide
- Performance testing: K6 best practices
- Security testing: OWASP Testing Guide

---

## ✅ Phase 2 Completion Checklist

Before marking Phase 2 complete, verify:

### Tests ✅
- [ ] 80%+ code coverage achieved
- [ ] 50+ integration tests written
- [ ] All critical flows tested
- [ ] Tests run in CI/CD

### Performance ✅
- [ ] Load test passes (100 users)
- [ ] P95 response time < 200ms
- [ ] No N+1 queries detected
- [ ] Database optimized

### Quality ✅
- [ ] SonarQube quality gate passed
- [ ] < 50 code smells
- [ ] All critical bugs fixed
- [ ] Error handling standardized

### Security ✅
- [ ] Penetration test passed
- [ ] No SQL injection vulnerabilities
- [ ] No XSS vulnerabilities
- [ ] Security audit documented

### Documentation ✅
- [ ] Test strategy documented
- [ ] Performance benchmarks recorded
- [ ] Security audit report completed
- [ ] Code quality metrics tracked

---

## 🎉 What's Next?

After Phase 2:
1. **Phase 3**: Resilience patterns (circuit breakers, fallbacks)
2. **Phase 4**: Production scaling (load balancing, caching)
3. **Full Launch**: Scale to 10+ clubs

---

**Ready to start?**

```bash
cd /Users/waraiotoko/Desktop/Liyaqa
open PHASE2_IMPLEMENTATION_PLAN.md

# Or jump straight to coding:
cd backend
mkdir -p src/test/kotlin/com/liyaqa/integration
# Copy the integration test template from above
```

**Estimated time to complete**: 2 weeks (80 hours)
**Start date**: When Phase 1 is deployed to production
**End goal**: Production-grade, well-tested, high-quality codebase ✅
