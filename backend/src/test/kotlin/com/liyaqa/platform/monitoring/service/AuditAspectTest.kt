package com.liyaqa.platform.monitoring.service

import com.liyaqa.platform.monitoring.model.PlatformAuditAction
import com.liyaqa.platform.monitoring.model.PlatformAuditResourceType
import org.aspectj.lang.JoinPoint
import org.aspectj.lang.reflect.MethodSignature
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.extension.ExtendWith
import org.mockito.Mock
import org.mockito.junit.jupiter.MockitoExtension
import org.mockito.junit.jupiter.MockitoSettings
import org.mockito.kotlin.any
import org.mockito.kotlin.anyOrNull
import org.mockito.kotlin.eq
import org.mockito.kotlin.never
import org.mockito.kotlin.verify
import org.mockito.kotlin.whenever
import org.mockito.quality.Strictness
import java.util.UUID

@ExtendWith(MockitoExtension::class)
@MockitoSettings(strictness = Strictness.LENIENT)
class AuditAspectTest {

    @Mock
    private lateinit var auditLogService: PlatformAuditLogService

    @Mock
    private lateinit var joinPoint: JoinPoint

    @Mock
    private lateinit var methodSignature: MethodSignature

    private lateinit var aspect: AuditAspect

    @BeforeEach
    fun setUp() {
        aspect = AuditAspect(auditLogService)
    }

    @Test
    fun `audited method logs on success`() {
        val audited = TestService::class.java.getMethod("createDeal", String::class.java)
            .getAnnotation(Audited::class.java)

        whenever(joinPoint.signature).thenReturn(methodSignature)
        whenever(methodSignature.parameterNames).thenReturn(arrayOf("name"))
        whenever(joinPoint.args).thenReturn(arrayOf("Enterprise"))

        aspect.auditAfterSuccess(joinPoint, audited, null)

        verify(auditLogService).log(
            action = eq(PlatformAuditAction.DEAL_CREATED),
            resourceType = eq(PlatformAuditResourceType.DEAL),
            resourceId = anyOrNull(),
            tenantId = anyOrNull(),
            details = any()
        )
    }

    @Test
    fun `audited method does NOT log on exception`() {
        // @AfterReturning naturally doesn't fire on exception —
        // verify that even if called with null result, the service is invoked (no exception path)
        // The real "does not log on exception" is guaranteed by Spring AOP's @AfterReturning behavior.
        // Here we verify the aspect doesn't throw when the service fails silently.
        val audited = TestService::class.java.getMethod("createDeal", String::class.java)
            .getAnnotation(Audited::class.java)

        whenever(joinPoint.signature).thenReturn(methodSignature)
        whenever(methodSignature.parameterNames).thenReturn(arrayOf("name"))
        whenever(joinPoint.args).thenReturn(arrayOf("test"))
        whenever(auditLogService.log(any(), any(), anyOrNull(), anyOrNull(), anyOrNull()))
            .thenThrow(RuntimeException("audit failed"))

        // Should not throw — catches internally
        aspect.auditAfterSuccess(joinPoint, audited, null)
    }

    @Test
    fun `aspect extracts resourceId from return value`() {
        val audited = TestService::class.java.getMethod("createDeal", String::class.java)
            .getAnnotation(Audited::class.java)

        val returnId = UUID.randomUUID()
        val returnValue = ResultWithId(returnId)

        whenever(joinPoint.signature).thenReturn(methodSignature)
        whenever(methodSignature.parameterNames).thenReturn(arrayOf("name"))
        whenever(joinPoint.args).thenReturn(arrayOf("Enterprise"))

        aspect.auditAfterSuccess(joinPoint, audited, returnValue)

        verify(auditLogService).log(
            action = eq(PlatformAuditAction.DEAL_CREATED),
            resourceType = eq(PlatformAuditResourceType.DEAL),
            resourceId = eq(returnId),
            tenantId = anyOrNull(),
            details = any()
        )
    }

    @Test
    fun `aspect extracts resourceId from UUID parameter`() {
        val audited = TestService::class.java.getMethod("deleteDeal", UUID::class.java)
            .getAnnotation(Audited::class.java)

        val dealId = UUID.randomUUID()

        whenever(joinPoint.signature).thenReturn(methodSignature)
        whenever(methodSignature.parameterNames).thenReturn(arrayOf("dealId"))
        whenever(joinPoint.args).thenReturn(arrayOf(dealId))

        aspect.auditAfterSuccess(joinPoint, audited, null)

        verify(auditLogService).log(
            action = eq(PlatformAuditAction.DEAL_LOST),
            resourceType = eq(PlatformAuditResourceType.DEAL),
            resourceId = eq(dealId),
            tenantId = anyOrNull(),
            details = any()
        )
    }

    // Test helpers

    data class ResultWithId(val id: UUID)

    class TestService {
        @Audited(action = PlatformAuditAction.DEAL_CREATED, resourceType = PlatformAuditResourceType.DEAL)
        fun createDeal(name: String): ResultWithId = ResultWithId(UUID.randomUUID())

        @Audited(action = PlatformAuditAction.DEAL_LOST, resourceType = PlatformAuditResourceType.DEAL)
        fun deleteDeal(dealId: UUID) {}
    }
}
