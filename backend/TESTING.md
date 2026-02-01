# Backend Testing Guide

This guide explains how to run tests, view coverage reports, and maintain code quality in the Liyaqa backend.

## 🧪 Running Tests

### Run All Tests
```bash
cd backend
./gradlew test
```

### Run Tests with Coverage
```bash
./gradlew test jacocoTestReport
```

### Run Specific Test Class
```bash
./gradlew test --tests "com.liyaqa.service.MemberServiceTest"
```

### Run Tests Matching Pattern
```bash
./gradlew test --tests "*ServiceTest"
```

### Run Tests in Specific Package
```bash
./gradlew test --tests "com.liyaqa.crm.*"
```

### Run Tests with Detailed Output
```bash
./gradlew test --info
```

---

## 📊 Code Coverage

### Coverage Requirements
- **Overall Coverage:** 80% minimum
- **Per-Class Coverage:** 70% minimum
- **Branch Coverage:** 70% minimum

### Generate Coverage Report
```bash
./gradlew jacocoTestReport
```

Report locations:
- **HTML:** `build/reports/jacoco/test/html/index.html`
- **XML:** `build/reports/jacoco/test/jacocoTestReport.xml`

### Verify Coverage Thresholds
```bash
./gradlew jacocoTestCoverageVerification
```

This command will fail if coverage is below the thresholds.

### View Coverage in Browser
```bash
# macOS
open build/reports/jacoco/test/html/index.html

# Linux
xdg-open build/reports/jacoco/test/html/index.html

# Windows
start build/reports/jacoco/test/html/index.html
```

---

## 🎯 Coverage Exclusions

The following are excluded from coverage requirements:

- **Configuration classes** (`**/config/**`)
- **DTOs** (`**/dto/**`, `**/request/**`, `**/response/**`)
- **Entities** (`**/entity/**`, `**/model/**`)
- **Application entry point** (`*Application*`)
- **Generated code** (QueryDSL Q-classes)
- **Kotlin companion objects**

---

## 📝 Test Types

### Unit Tests
Test individual classes in isolation with mocked dependencies.

**Location:** `src/test/kotlin/com/liyaqa/`
**Naming:** `*Test.kt`

**Example:**
```kotlin
@Test
fun `should create member successfully`() {
    // Given
    val request = CreateMemberRequest(...)
    given(memberRepository.save(any())).willReturn(savedMember)

    // When
    val result = memberService.create(request)

    // Then
    assertThat(result.id).isNotNull()
    verify(memberRepository).save(any())
}
```

### Integration Tests
Test multiple components together with real database (H2 in-memory).

**Location:** `src/test/kotlin/com/liyaqa/integration/`
**Naming:** `*IntegrationTest.kt`
**Annotations:** `@SpringBootTest`, `@Transactional`

**Example:**
```kotlin
@SpringBootTest
@ActiveProfiles("test")
@Transactional
class MemberIntegrationTest : IntegrationTestBase() {

    @Test
    fun `should handle complete member lifecycle`() {
        // Create, update, delete
        val member = memberService.create(...)
        memberService.update(member.id, ...)
        memberService.delete(member.id)

        // Verify
        assertThrows<NotFoundException> {
            memberService.findById(member.id)
        }
    }
}
```

### Repository Tests
Test JPA repositories with real database operations.

**Location:** `src/test/kotlin/com/liyaqa/repository/`
**Naming:** `*RepositoryTest.kt`
**Annotations:** `@DataJpaTest`

**Example:**
```kotlin
@DataJpaTest
@ActiveProfiles("test")
class MemberRepositoryTest {

    @Autowired
    private lateinit var memberRepository: MemberRepository

    @Test
    fun `should find active members`() {
        // Given
        val member = memberRepository.save(createTestMember())

        // When
        val result = memberRepository.findByStatus(MemberStatus.ACTIVE)

        // Then
        assertThat(result).hasSize(1)
    }
}
```

### Controller Tests (MVC Tests)
Test REST endpoints with MockMvc.

**Location:** `src/test/kotlin/com/liyaqa/controller/`
**Naming:** `*ControllerTest.kt`
**Annotations:** `@WebMvcTest`, `@MockBean`

**Example:**
```kotlin
@WebMvcTest(MemberController::class)
class MemberControllerTest {

    @Autowired
    private lateinit var mockMvc: MockMvc

    @MockBean
    private lateinit var memberService: MemberService

    @Test
    fun `GET members should return page of members`() {
        // Given
        given(memberService.findAll(any())).willReturn(page)

        // When & Then
        mockMvc.perform(get("/api/members"))
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.content").isArray)
    }
}
```

---

## 🏗️ Test Structure

### Recommended Directory Structure
```
src/test/kotlin/com/liyaqa/
├── controller/           # Controller/API tests
│   ├── MemberControllerTest.kt
│   └── BookingControllerTest.kt
├── service/             # Service layer tests
│   ├── MemberServiceTest.kt
│   └── BookingServiceTest.kt
├── repository/          # Repository tests
│   ├── MemberRepositoryTest.kt
│   └── BookingRepositoryTest.kt
├── integration/         # Integration tests
│   ├── MemberJourneyIntegrationTest.kt
│   └── BookingFlowIntegrationTest.kt
├── security/            # Security tests
│   ├── JwtTokenProviderTest.kt
│   └── SecurityConfigTest.kt
└── utils/               # Test utilities
    ├── IntegrationTestBase.kt
    └── TestDataFactory.kt
```

---

## 🛠️ Test Utilities

### IntegrationTestBase
Base class for integration tests with common setup.

**Location:** `src/test/kotlin/com/liyaqa/utils/IntegrationTestBase.kt`

```kotlin
@SpringBootTest
@ActiveProfiles("test")
@Transactional
abstract class IntegrationTestBase {

    @Autowired
    protected lateinit var testEntityManager: TestEntityManager

    protected fun <T> persist(entity: T): T {
        return testEntityManager.persistAndFlush(entity)
    }

    protected fun createTestMember(
        name: String = "Test Member",
        email: String = "test@example.com"
    ): Member {
        return Member(
            name = name,
            email = email,
            // ... other fields
        )
    }
}
```

### TestDataFactory
Factory for creating test data.

```kotlin
object TestDataFactory {

    fun createMember(
        id: UUID = UUID.randomUUID(),
        name: String = "John Doe",
        email: String = "john@example.com",
        status: MemberStatus = MemberStatus.ACTIVE
    ): Member {
        return Member(
            id = id,
            name = name,
            email = email,
            status = status,
            // ... other fields
        )
    }
}
```

---

## 📈 Coverage Best Practices

### 1. Test Public API, Not Implementation
❌ **Bad:** Testing private methods
```kotlin
@Test
fun `should validate email format`() {
    val result = memberService.validateEmail("invalid")
    assertThat(result).isFalse()
}
```

✅ **Good:** Testing public behavior
```kotlin
@Test
fun `should throw exception when email is invalid`() {
    val request = CreateMemberRequest(email = "invalid")
    assertThrows<ValidationException> {
        memberService.create(request)
    }
}
```

### 2. Test Edge Cases and Boundaries
```kotlin
@Test
fun `should handle empty member list`()

@Test
fun `should handle single member`()

@Test
fun `should handle maximum page size`()

@Test
fun `should throw exception when member not found`()

@Test
fun `should handle duplicate email gracefully`()
```

### 3. Use Descriptive Test Names
```kotlin
// ❌ Bad
@Test
fun test1()

// ✅ Good
@Test
fun `should create member when valid data provided`()

@Test
fun `should throw ValidationException when email is invalid`()

@Test
fun `should return empty page when no members exist`()
```

### 4. Follow AAA Pattern
```kotlin
@Test
fun `should update member status`() {
    // Arrange (Given)
    val member = createTestMember()
    val newStatus = MemberStatus.INACTIVE

    // Act (When)
    val result = memberService.updateStatus(member.id, newStatus)

    // Assert (Then)
    assertThat(result.status).isEqualTo(newStatus)
    verify(memberRepository).save(any())
}
```

### 5. Mock External Dependencies
```kotlin
@Test
fun `should send email notification when member created`() {
    // Mock the email service
    given(emailService.send(any())).willReturn(true)

    // Test the service
    memberService.create(request)

    // Verify email was sent
    verify(emailService).send(argThat { email ->
        email.to == request.email &&
        email.subject.contains("Welcome")
    })
}
```

---

## 🔍 Viewing Coverage in CI/CD

### GitHub Actions
Coverage reports are automatically generated on every push/PR.

**View Coverage:**
1. Go to GitHub Actions run
2. Click on "Build & Test" job
3. Scroll to "Upload coverage reports" step
4. Download the artifact
5. Open `index.html` in browser

### Codecov Integration
If Codecov is configured, view coverage at:
```
https://codecov.io/gh/{owner}/{repo}
```

### Pull Request Comments
Coverage changes are automatically commented on PRs:
- Overall coverage percentage
- Coverage change from base branch
- Files with coverage below threshold

---

## 🚨 Troubleshooting

### Tests Fail Locally But Pass in CI
```bash
# Clean build directory
./gradlew clean

# Clear Gradle cache
rm -rf ~/.gradle/caches/

# Run with --no-daemon
./gradlew test --no-daemon
```

### Coverage Report Not Generated
```bash
# Ensure tests run first
./gradlew clean test jacocoTestReport

# Check report location
ls -la build/reports/jacoco/test/
```

### Coverage Below Threshold
```bash
# Find classes with low coverage
./gradlew jacocoTestCoverageVerification

# View detailed report
open build/reports/jacoco/test/html/index.html
```

### Tests Are Slow
```bash
# Run in parallel
./gradlew test --parallel --max-workers=4

# Skip integration tests
./gradlew test --exclude-task integrationTest
```

---

## 📊 Current Coverage Status

Check the latest coverage badge in the README or run:
```bash
./gradlew jacocoTestReport
open build/reports/jacoco/test/html/index.html
```

**Target Coverage:**
- Overall: 80%+
- Per Class: 70%+
- Branch: 70%+

---

## 🎯 Writing Your First Test

### 1. Create Test File
```bash
# Create test file matching your source file
# Source: src/main/kotlin/com/liyaqa/service/MyService.kt
# Test:   src/test/kotlin/com/liyaqa/service/MyServiceTest.kt
```

### 2. Set Up Test Class
```kotlin
package com.liyaqa.service

import org.junit.jupiter.api.Test
import org.junit.jupiter.api.extension.ExtendWith
import org.mockito.InjectMocks
import org.mockito.Mock
import org.mockito.junit.jupiter.MockitoExtension
import org.mockito.kotlin.any
import org.mockito.kotlin.given
import org.mockito.kotlin.verify

@ExtendWith(MockitoExtension::class)
class MyServiceTest {

    @Mock
    private lateinit var myRepository: MyRepository

    @InjectMocks
    private lateinit var myService: MyService

    @Test
    fun `my first test`() {
        // Your test here
    }
}
```

### 3. Write Tests
```kotlin
@Test
fun `should return items when they exist`() {
    // Given
    val items = listOf(Item(...), Item(...))
    given(myRepository.findAll()).willReturn(items)

    // When
    val result = myService.getAllItems()

    // Then
    assertThat(result).hasSize(2)
    verify(myRepository).findAll()
}
```

### 4. Run Your Test
```bash
./gradlew test --tests "MyServiceTest"
```

---

## 📚 Additional Resources

- [JUnit 5 User Guide](https://junit.org/junit5/docs/current/user-guide/)
- [Mockito Kotlin](https://github.com/mockito/mockito-kotlin)
- [AssertJ Documentation](https://assertj.github.io/doc/)
- [Spring Boot Testing](https://docs.spring.io/spring-boot/docs/current/reference/html/features.html#features.testing)
- [JaCoCo Documentation](https://www.jacoco.org/jacoco/trunk/doc/)

---

**Happy Testing! 🎉**
