package com.liyaqa.platform.config.service

import com.fasterxml.jackson.databind.ObjectMapper
import com.liyaqa.platform.config.exception.SettingNotFoundException
import com.liyaqa.platform.config.exception.SettingNotEditableException
import com.liyaqa.platform.config.exception.SettingValueTypeMismatchException
import com.liyaqa.platform.config.model.GlobalSetting
import com.liyaqa.platform.config.model.SettingCategory
import com.liyaqa.platform.config.model.SettingValueType
import com.liyaqa.platform.config.repository.GlobalSettingRepository
import com.liyaqa.shared.infrastructure.audit.AuditService
import com.liyaqa.shared.infrastructure.security.SecurityService
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertNotNull
import org.junit.jupiter.api.Assertions.assertThrows
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.extension.ExtendWith
import org.mockito.Mock
import org.mockito.junit.jupiter.MockitoExtension
import org.mockito.junit.jupiter.MockitoSettings
import org.mockito.kotlin.any
import org.mockito.kotlin.eq
import org.mockito.kotlin.verify
import org.mockito.kotlin.whenever
import org.mockito.quality.Strictness
import java.util.Optional
import java.util.UUID

@ExtendWith(MockitoExtension::class)
@MockitoSettings(strictness = Strictness.LENIENT)
class GlobalSettingServiceTest {

    @Mock
    private lateinit var globalSettingRepository: GlobalSettingRepository

    @Mock
    private lateinit var auditService: AuditService

    @Mock
    private lateinit var securityService: SecurityService

    private val objectMapper = ObjectMapper()

    private lateinit var service: GlobalSettingService

    private val userId = UUID.randomUUID()

    @BeforeEach
    fun setUp() {
        service = GlobalSettingService(
            globalSettingRepository,
            auditService,
            securityService,
            objectMapper
        )
        whenever(securityService.getCurrentUserId()).thenReturn(userId)
    }

    // ========================================
    // validateValueType
    // ========================================

    @Test
    fun `validateValueType accepts valid NUMBER`() {
        service.validateValueType("test.key", SettingValueType.NUMBER, "42")
        service.validateValueType("test.key", SettingValueType.NUMBER, "3.14")
        service.validateValueType("test.key", SettingValueType.NUMBER, "-10")
    }

    @Test
    fun `validateValueType rejects invalid NUMBER`() {
        assertThrows(SettingValueTypeMismatchException::class.java) {
            service.validateValueType("test.key", SettingValueType.NUMBER, "not-a-number")
        }
    }

    @Test
    fun `validateValueType accepts valid BOOLEAN`() {
        service.validateValueType("test.key", SettingValueType.BOOLEAN, "true")
        service.validateValueType("test.key", SettingValueType.BOOLEAN, "false")
    }

    @Test
    fun `validateValueType rejects invalid BOOLEAN`() {
        assertThrows(SettingValueTypeMismatchException::class.java) {
            service.validateValueType("test.key", SettingValueType.BOOLEAN, "yes")
        }
        assertThrows(SettingValueTypeMismatchException::class.java) {
            service.validateValueType("test.key", SettingValueType.BOOLEAN, "1")
        }
    }

    @Test
    fun `validateValueType accepts valid JSON`() {
        service.validateValueType("test.key", SettingValueType.JSON, """{"key":"value"}""")
        service.validateValueType("test.key", SettingValueType.JSON, """["a","b"]""")
    }

    @Test
    fun `validateValueType rejects invalid JSON`() {
        assertThrows(SettingValueTypeMismatchException::class.java) {
            service.validateValueType("test.key", SettingValueType.JSON, "not json {")
        }
    }

    @Test
    fun `validateValueType accepts any STRING`() {
        service.validateValueType("test.key", SettingValueType.STRING, "anything goes")
        service.validateValueType("test.key", SettingValueType.STRING, "")
        service.validateValueType("test.key", SettingValueType.STRING, "123")
    }

    // ========================================
    // updateSetting
    // ========================================

    @Test
    fun `updateSetting updates value and creates audit log`() {
        val setting = createSetting("billing.vat_rate", "15", SettingValueType.NUMBER)
        whenever(globalSettingRepository.findByKey("billing.vat_rate")).thenReturn(Optional.of(setting))
        whenever(globalSettingRepository.save(any())).thenReturn(setting)

        val result = service.updateSetting("billing.vat_rate", "20")

        assertEquals("20", setting.value)
        assertEquals(userId, setting.updatedBy)
        verify(auditService).logAsync(
            action = eq(com.liyaqa.shared.domain.AuditAction.UPDATE),
            entityType = eq("GlobalSetting"),
            entityId = eq(setting.id),
            description = eq("Updated setting 'billing.vat_rate'"),
            oldValue = eq("15"),
            newValue = eq("20")
        )
        assertNotNull(result)
    }

    @Test
    fun `updateSetting throws SettingNotFoundException for unknown key`() {
        whenever(globalSettingRepository.findByKey("unknown.key")).thenReturn(Optional.empty())

        assertThrows(SettingNotFoundException::class.java) {
            service.updateSetting("unknown.key", "value")
        }
    }

    @Test
    fun `updateSetting throws SettingNotEditableException for non-editable setting`() {
        val setting = createSetting("localization.supported_languages", """["ar","en"]""", SettingValueType.JSON, isEditable = false)
        whenever(globalSettingRepository.findByKey("localization.supported_languages")).thenReturn(Optional.of(setting))

        assertThrows(SettingNotEditableException::class.java) {
            service.updateSetting("localization.supported_languages", """["ar","en","fr"]""")
        }
    }

    @Test
    fun `updateSetting rejects type mismatch`() {
        val setting = createSetting("security.max_login_attempts", "5", SettingValueType.NUMBER)
        whenever(globalSettingRepository.findByKey("security.max_login_attempts")).thenReturn(Optional.of(setting))

        assertThrows(SettingValueTypeMismatchException::class.java) {
            service.updateSetting("security.max_login_attempts", "not-a-number")
        }
    }

    // ========================================
    // getSetting
    // ========================================

    @Test
    fun `getSetting returns stored value`() {
        val setting = createSetting("billing.vat_rate", "15", SettingValueType.NUMBER)
        whenever(globalSettingRepository.findByKey("billing.vat_rate")).thenReturn(Optional.of(setting))

        val result = service.getSetting("billing.vat_rate")

        assertEquals("15", result)
    }

    @Test
    fun `getSetting throws SettingNotFoundException for unknown key`() {
        whenever(globalSettingRepository.findByKey("unknown")).thenReturn(Optional.empty())

        assertThrows(SettingNotFoundException::class.java) {
            service.getSetting("unknown")
        }
    }

    // ========================================
    // getAllSettingsGrouped
    // ========================================

    @Test
    fun `getAllSettingsGrouped groups by category`() {
        val settings = listOf(
            createSetting("billing.vat_rate", "15", SettingValueType.NUMBER, category = SettingCategory.BILLING),
            createSetting("billing.currency", "SAR", SettingValueType.STRING, category = SettingCategory.BILLING),
            createSetting("security.timeout", "30", SettingValueType.NUMBER, category = SettingCategory.SECURITY)
        )
        whenever(globalSettingRepository.findAll()).thenReturn(settings)

        val result = service.getAllSettingsGrouped()

        assertEquals(2, result.size)
        val billingGroup = result.find { it.category == SettingCategory.BILLING }
        val securityGroup = result.find { it.category == SettingCategory.SECURITY }
        assertNotNull(billingGroup)
        assertNotNull(securityGroup)
        assertEquals(2, billingGroup!!.settings.size)
        assertEquals(1, securityGroup!!.settings.size)
    }

    // ========================================
    // Helpers
    // ========================================

    private fun createSetting(
        key: String,
        value: String,
        valueType: SettingValueType,
        category: SettingCategory = SettingCategory.BILLING,
        isEditable: Boolean = true
    ): GlobalSetting = GlobalSetting(
        key = key,
        value = value,
        valueType = valueType,
        category = category,
        isEditable = isEditable
    )
}
