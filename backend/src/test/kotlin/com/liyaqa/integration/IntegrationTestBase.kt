package com.liyaqa.integration

import org.junit.jupiter.api.BeforeEach
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.boot.test.web.client.TestRestTemplate
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.web.server.LocalServerPort
import org.springframework.test.context.ActiveProfiles
import org.springframework.test.context.DynamicPropertyRegistry
import org.springframework.test.context.DynamicPropertySource
import org.testcontainers.postgresql.PostgreSQLContainer
import org.testcontainers.junit.jupiter.Container
import org.testcontainers.junit.jupiter.Testcontainers

/**
 * Base class for all integration tests.
 *
 * Provides:
 * - Testcontainers PostgreSQL database
 * - Spring Boot test context with random port
 * - RestTemplate for API testing
 * - Database cleanup before each test
 *
 * Usage:
 * ```kotlin
 * class MyIntegrationTest : IntegrationTestBase() {
 *     @Test
 *     fun `test something`() {
 *         val response = restTemplate.getForEntity(
 *             "http://localhost:$port/api/endpoint",
 *             String::class.java
 *         )
 *         assertThat(response.statusCode).isEqualTo(HttpStatus.OK)
 *     }
 * }
 * ```
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
@Testcontainers
abstract class IntegrationTestBase {

    companion object {
        @Container
        @JvmStatic
        val postgres: PostgreSQLContainer = PostgreSQLContainer("postgres:15")
            .withDatabaseName("liyaqa_test")
            .withUsername("test")
            .withPassword("test")
            .withReuse(true) // Reuse container between test runs for faster execution

        /**
         * Configures Spring Boot datasource to use Testcontainers PostgreSQL.
         * This ensures tests use the containerized PostgreSQL instead of H2.
         */
        @DynamicPropertySource
        @JvmStatic
        fun configureProperties(registry: DynamicPropertyRegistry) {
            registry.add("spring.datasource.url") { postgres.jdbcUrl }
            registry.add("spring.datasource.username") { postgres.username }
            registry.add("spring.datasource.password") { postgres.password }
            registry.add("spring.datasource.driver-class-name") { "org.postgresql.Driver" }
        }
    }

    @LocalServerPort
    protected var port: Int = 0

    @Autowired
    protected lateinit var restTemplate: TestRestTemplate

    @BeforeEach
    fun setup() {
        // Clean database before each test to ensure test isolation
        cleanDatabase()
    }

    /**
     * Clean database tables before each test.
     * Override this method to add custom cleanup logic.
     */
    protected open fun cleanDatabase() {
        // TODO: Implement based on schema
        // Example:
        // jdbcTemplate.execute("DELETE FROM bookings")
        // jdbcTemplate.execute("DELETE FROM members")
        // jdbcTemplate.execute("DELETE FROM clubs")
    }

    /**
     * Helper method to build full URL for API endpoints.
     */
    protected fun url(path: String): String {
        val cleanPath = if (path.startsWith("/")) path else "/$path"
        return "http://localhost:$port$cleanPath"
    }
}
