package com.liyaqa.platform.infrastructure.security

import com.liyaqa.auth.domain.model.Role
import com.liyaqa.auth.infrastructure.security.JwtUserPrincipal
import com.liyaqa.platform.domain.model.PlatformPermission
import com.liyaqa.platform.domain.model.PlatformUserRole
import org.aspectj.lang.ProceedingJoinPoint
import org.aspectj.lang.reflect.MethodSignature
import org.junit.jupiter.api.AfterEach
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertThrows
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.extension.ExtendWith
import org.mockito.Mock
import org.mockito.junit.jupiter.MockitoExtension
import org.mockito.junit.jupiter.MockitoSettings
import org.mockito.kotlin.whenever
import org.mockito.quality.Strictness
import org.springframework.security.access.AccessDeniedException
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken
import org.springframework.security.core.context.SecurityContextHolder
import java.lang.reflect.Method
import java.util.UUID

@ExtendWith(MockitoExtension::class)
@MockitoSettings(strictness = Strictness.LENIENT)
class PlatformSecuredAspectTest {

    private lateinit var aspect: PlatformSecuredAspect

    @Mock
    private lateinit var joinPoint: ProceedingJoinPoint

    @Mock
    private lateinit var methodSignature: MethodSignature

    private val tenantId = UUID.randomUUID()

    @BeforeEach
    fun setUp() {
        aspect = PlatformSecuredAspect()
    }

    @AfterEach
    fun tearDown() {
        SecurityContextHolder.clearContext()
    }

    // === Helper methods ===

    private fun setPlatformPrincipal(role: PlatformUserRole) {
        val principal = JwtUserPrincipal(
            userId = UUID.randomUUID(),
            tenantId = tenantId,
            email = "admin@liyaqa.com",
            role = Role.PLATFORM_ADMIN,
            scope = "platform",
            platformRole = role
        )
        val auth = UsernamePasswordAuthenticationToken(principal, null, emptyList())
        SecurityContextHolder.getContext().authentication = auth
    }

    private fun setFacilityPrincipal() {
        val principal = JwtUserPrincipal(
            userId = UUID.randomUUID(),
            tenantId = tenantId,
            email = "staff@club.com",
            role = Role.CLUB_ADMIN,
            scope = "facility",
            platformRole = null
        )
        val auth = UsernamePasswordAuthenticationToken(principal, null, emptyList())
        SecurityContextHolder.getContext().authentication = auth
    }

    private fun setupJoinPointForMethod(method: Method) {
        whenever(joinPoint.signature).thenReturn(methodSignature)
        whenever(methodSignature.method).thenReturn(method)
        whenever(joinPoint.target).thenReturn(TestController())
        whenever(joinPoint.proceed()).thenReturn("success")
    }

    // === Test cases ===

    @Test
    fun `platform user with correct role passes`() {
        setPlatformPrincipal(PlatformUserRole.PLATFORM_SUPER_ADMIN)
        val method = TestController::class.java.getMethod("adminOnly")
        setupJoinPointForMethod(method)

        val result = aspect.checkPlatformAccess(joinPoint)
        assertEquals("success", result)
    }

    @Test
    fun `platform user with wrong role throws AccessDeniedException`() {
        setPlatformPrincipal(PlatformUserRole.PLATFORM_VIEWER)
        val method = TestController::class.java.getMethod("adminOnly")
        setupJoinPointForMethod(method)

        assertThrows(AccessDeniedException::class.java) {
            aspect.checkPlatformAccess(joinPoint)
        }
    }

    @Test
    fun `facility user throws AccessDeniedException regardless of method`() {
        setFacilityPrincipal()
        val method = TestController::class.java.getMethod("anyPlatformUser")
        setupJoinPointForMethod(method)

        assertThrows(AccessDeniedException::class.java) {
            aspect.checkPlatformAccess(joinPoint)
        }
    }

    @Test
    fun `unauthenticated user throws AccessDeniedException`() {
        SecurityContextHolder.clearContext()
        val method = TestController::class.java.getMethod("anyPlatformUser")
        setupJoinPointForMethod(method)

        assertThrows(AccessDeniedException::class.java) {
            aspect.checkPlatformAccess(joinPoint)
        }
    }

    @Test
    fun `any platform role passes when no roles specified`() {
        setPlatformPrincipal(PlatformUserRole.SUPPORT_AGENT)
        val method = TestController::class.java.getMethod("anyPlatformUser")
        setupJoinPointForMethod(method)

        val result = aspect.checkPlatformAccess(joinPoint)
        assertEquals("success", result)
    }

    @Test
    fun `role with required permission passes`() {
        setPlatformPrincipal(PlatformUserRole.PLATFORM_SUPER_ADMIN)
        val method = TestController::class.java.getMethod("requiresImpersonation")
        setupJoinPointForMethod(method)

        val result = aspect.checkPlatformAccess(joinPoint)
        assertEquals("success", result)
    }

    @Test
    fun `role without required permission throws AccessDeniedException`() {
        setPlatformPrincipal(PlatformUserRole.SUPPORT_AGENT)
        val method = TestController::class.java.getMethod("requiresImpersonation")
        setupJoinPointForMethod(method)

        assertThrows(AccessDeniedException::class.java) {
            aspect.checkPlatformAccess(joinPoint)
        }
    }

    @Test
    fun `SUPPORT_LEAD with IMPERSONATE_USER permission passes`() {
        setPlatformPrincipal(PlatformUserRole.SUPPORT_LEAD)
        val method = TestController::class.java.getMethod("requiresImpersonation")
        setupJoinPointForMethod(method)

        val result = aspect.checkPlatformAccess(joinPoint)
        assertEquals("success", result)
    }

    @Test
    fun `class-level annotation applies to unannotated methods`() {
        setPlatformPrincipal(PlatformUserRole.PLATFORM_VIEWER)
        val method = ClassLevelSecuredController::class.java.getMethod("someMethod")
        whenever(joinPoint.signature).thenReturn(methodSignature)
        whenever(methodSignature.method).thenReturn(method)
        whenever(joinPoint.target).thenReturn(ClassLevelSecuredController())
        whenever(joinPoint.proceed()).thenReturn("success")

        val result = aspect.checkPlatformAccess(joinPoint)
        assertEquals("success", result)
    }

    @Test
    fun `class-level secured controller blocks facility user`() {
        setFacilityPrincipal()
        val method = ClassLevelSecuredController::class.java.getMethod("someMethod")
        whenever(joinPoint.signature).thenReturn(methodSignature)
        whenever(methodSignature.method).thenReturn(method)
        whenever(joinPoint.target).thenReturn(ClassLevelSecuredController())

        assertThrows(AccessDeniedException::class.java) {
            aspect.checkPlatformAccess(joinPoint)
        }
    }

    // === Test controller stubs ===

    class TestController {
        @PlatformSecured(roles = [PlatformUserRole.PLATFORM_SUPER_ADMIN, PlatformUserRole.PLATFORM_ADMIN])
        fun adminOnly(): String = "admin"

        @PlatformSecured
        fun anyPlatformUser(): String = "any"

        @PlatformSecured(permissions = [PlatformPermission.IMPERSONATE_USER])
        fun requiresImpersonation(): String = "impersonate"
    }

    @PlatformSecured
    class ClassLevelSecuredController {
        fun someMethod(): String = "class-level"
    }
}
