package com.liyaqa.shared

import com.liyaqa.config.TestContainersConfiguration
import com.liyaqa.shared.domain.TenantContext
import com.liyaqa.shared.domain.TenantId
import org.junit.jupiter.api.AfterEach
import org.junit.jupiter.api.BeforeEach
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.context.annotation.Import
import org.springframework.test.context.ActiveProfiles
import org.springframework.transaction.annotation.Transactional
import java.util.UUID

/**
 * Base class for integration tests with common setup.
 */
@SpringBootTest
@ActiveProfiles("test")
@Transactional
@Import(TestContainersConfiguration::class)
abstract class IntegrationTestBase {

    protected lateinit var testTenantId: UUID

    @BeforeEach
    open fun setUpTenantContext() {
        testTenantId = UUID.randomUUID()
        TenantContext.setCurrentTenant(TenantId(testTenantId))
    }

    @AfterEach
    open fun tearDownTenantContext() {
        TenantContext.clear()
    }

    /**
     * Sets the tenantId field on an entity using reflection.
     */
    protected fun setTenantId(entity: Any, tenantId: UUID) {
        try {
            val field = entity.javaClass.superclass.getDeclaredField("tenantId")
            field.isAccessible = true
            field.set(entity, tenantId)
        } catch (e: Exception) {
            // Ignore - some entities don't have tenantId
        }
    }
}
