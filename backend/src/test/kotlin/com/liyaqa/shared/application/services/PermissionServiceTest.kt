package com.liyaqa.shared.application.services

import com.liyaqa.shared.domain.LocalizedText
import com.liyaqa.shared.domain.model.Permission
import com.liyaqa.shared.domain.model.UserPermission
import com.liyaqa.shared.domain.ports.PermissionRepository
import com.liyaqa.shared.domain.ports.RoleDefaultPermissionRepository
import com.liyaqa.shared.domain.ports.UserPermissionRepository
import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.extension.ExtendWith
import org.mockito.Mock
import org.mockito.junit.jupiter.MockitoExtension
import org.mockito.junit.jupiter.MockitoSettings
import org.mockito.kotlin.*
import org.mockito.quality.Strictness
import java.util.Optional
import java.util.UUID

@ExtendWith(MockitoExtension::class)
@MockitoSettings(strictness = Strictness.LENIENT)
class PermissionServiceTest {

    @Mock
    private lateinit var permissionRepository: PermissionRepository

    @Mock
    private lateinit var userPermissionRepository: UserPermissionRepository

    @Mock
    private lateinit var roleDefaultPermissionRepository: RoleDefaultPermissionRepository

    private lateinit var permissionService: PermissionService

    private lateinit var testPermission1: Permission
    private lateinit var testPermission2: Permission
    private lateinit var testPermission3: Permission
    private val testUserId = UUID.randomUUID()
    private val testGrantedBy = UUID.randomUUID()

    @BeforeEach
    fun setUp() {
        permissionService = PermissionService(
            permissionRepository,
            userPermissionRepository,
            roleDefaultPermissionRepository
        )

        // Test permissions
        testPermission1 = Permission(
            id = UUID.randomUUID(),
            code = "member.view",
            module = "member",
            action = "view",
            name = LocalizedText(en = "View Members", ar = "عرض الأعضاء"),
            description = LocalizedText(en = "View member information", ar = "عرض معلومات الأعضاء")
        )

        testPermission2 = Permission(
            id = UUID.randomUUID(),
            code = "member.create",
            module = "member",
            action = "create",
            name = LocalizedText(en = "Create Members", ar = "إنشاء الأعضاء"),
            description = LocalizedText(en = "Create new members", ar = "إنشاء أعضاء جدد")
        )

        testPermission3 = Permission(
            id = UUID.randomUUID(),
            code = "booking.view",
            module = "booking",
            action = "view",
            name = LocalizedText(en = "View Bookings", ar = "عرض الحجوزات"),
            description = LocalizedText(en = "View booking information", ar = "عرض معلومات الحجوزات")
        )
    }

    // ===== getAllPermissions Tests =====

    @Test
    fun `getAllPermissions should return all permissions`() {
        // Given
        val permissions = listOf(testPermission1, testPermission2, testPermission3)
        whenever(permissionRepository.findAll()) doReturn permissions

        // When
        val result = permissionService.getAllPermissions()

        // Then
        assertEquals(3, result.size)
        assertEquals(permissions, result)
        verify(permissionRepository).findAll()
    }

    @Test
    fun `getAllPermissions should return empty list when no permissions exist`() {
        // Given
        whenever(permissionRepository.findAll()) doReturn emptyList()

        // When
        val result = permissionService.getAllPermissions()

        // Then
        assertTrue(result.isEmpty())
        verify(permissionRepository).findAll()
    }

    // ===== getPermissionsByModule Tests =====

    @Test
    fun `getPermissionsByModule should group permissions by module`() {
        // Given
        val permissions = listOf(testPermission1, testPermission2, testPermission3)
        whenever(permissionRepository.findAll()) doReturn permissions

        // When
        val result = permissionService.getPermissionsByModule()

        // Then
        assertEquals(2, result.size)
        assertEquals(2, result["member"]?.size)
        assertEquals(1, result["booking"]?.size)
        assertTrue(result["member"]?.contains(testPermission1) == true)
        assertTrue(result["member"]?.contains(testPermission2) == true)
        assertTrue(result["booking"]?.contains(testPermission3) == true)
        verify(permissionRepository).findAll()
    }

    @Test
    fun `getPermissionsByModule should return empty map when no permissions exist`() {
        // Given
        whenever(permissionRepository.findAll()) doReturn emptyList()

        // When
        val result = permissionService.getPermissionsByModule()

        // Then
        assertTrue(result.isEmpty())
        verify(permissionRepository).findAll()
    }

    // ===== getPermissionByCode Tests =====

    @Test
    fun `getPermissionByCode should return permission when exists`() {
        // Given
        val code = "member.view"
        whenever(permissionRepository.findByCode(code)) doReturn Optional.of(testPermission1)

        // When
        val result = permissionService.getPermissionByCode(code)

        // Then
        assertNotNull(result)
        assertEquals(testPermission1, result)
        assertEquals(code, result?.code)
        verify(permissionRepository).findByCode(code)
    }

    @Test
    fun `getPermissionByCode should return null when permission does not exist`() {
        // Given
        val code = "nonexistent.permission"
        whenever(permissionRepository.findByCode(code)) doReturn Optional.empty()

        // When
        val result = permissionService.getPermissionByCode(code)

        // Then
        assertNull(result)
        verify(permissionRepository).findByCode(code)
    }

    // ===== getUserPermissionCodes Tests =====

    @Test
    fun `getUserPermissionCodes should return permission codes for user`() {
        // Given
        val permissionCodes = listOf("member.view", "member.create", "booking.view")
        whenever(userPermissionRepository.findPermissionCodesByUserId(testUserId)) doReturn permissionCodes

        // When
        val result = permissionService.getUserPermissionCodes(testUserId)

        // Then
        assertEquals(3, result.size)
        assertEquals(permissionCodes, result)
        verify(userPermissionRepository).findPermissionCodesByUserId(testUserId)
    }

    @Test
    fun `getUserPermissionCodes should return empty list when user has no permissions`() {
        // Given
        whenever(userPermissionRepository.findPermissionCodesByUserId(testUserId)) doReturn emptyList()

        // When
        val result = permissionService.getUserPermissionCodes(testUserId)

        // Then
        assertTrue(result.isEmpty())
        verify(userPermissionRepository).findPermissionCodesByUserId(testUserId)
    }

    // ===== getUserPermissions Tests (Phase 1 Optimization) =====

    @Test
    fun `getUserPermissions should return full permission objects using optimized findByIds`() {
        // Given
        val userPermission1 = UserPermission(
            userId = testUserId,
            permissionId = testPermission1.id
        )
        val userPermission2 = UserPermission(
            userId = testUserId,
            permissionId = testPermission2.id
        )
        val userPermissions = listOf(userPermission1, userPermission2)
        val permissionIds = listOf(testPermission1.id, testPermission2.id)
        val permissions = listOf(testPermission1, testPermission2)

        whenever(userPermissionRepository.findByUserId(testUserId)) doReturn userPermissions
        whenever(permissionRepository.findByIds(permissionIds)) doReturn permissions

        // When
        val result = permissionService.getUserPermissions(testUserId)

        // Then
        assertEquals(2, result.size)
        assertEquals(permissions, result)
        verify(userPermissionRepository).findByUserId(testUserId)
        verify(permissionRepository).findByIds(permissionIds)
        // Verify Phase 1 optimization: should NOT call findAll()
        verify(permissionRepository, never()).findAll()
    }

    @Test
    fun `getUserPermissions should return empty list when user has no permissions`() {
        // Given
        whenever(userPermissionRepository.findByUserId(testUserId)) doReturn emptyList()

        // When
        val result = permissionService.getUserPermissions(testUserId)

        // Then
        assertTrue(result.isEmpty())
        verify(userPermissionRepository).findByUserId(testUserId)
        // Should NOT call findByIds when permission list is empty
        verify(permissionRepository, never()).findByIds(any())
    }

    // ===== hasPermission Tests =====

    @Test
    fun `hasPermission should return true when user has permission`() {
        // Given
        val code = "member.view"
        whenever(permissionRepository.findByCode(code)) doReturn Optional.of(testPermission1)
        whenever(userPermissionRepository.existsByUserIdAndPermissionId(testUserId, testPermission1.id)) doReturn true

        // When
        val result = permissionService.hasPermission(testUserId, code)

        // Then
        assertTrue(result)
        verify(permissionRepository).findByCode(code)
        verify(userPermissionRepository).existsByUserIdAndPermissionId(testUserId, testPermission1.id)
    }

    @Test
    fun `hasPermission should return false when user does not have permission`() {
        // Given
        val code = "member.view"
        whenever(permissionRepository.findByCode(code)) doReturn Optional.of(testPermission1)
        whenever(userPermissionRepository.existsByUserIdAndPermissionId(testUserId, testPermission1.id)) doReturn false

        // When
        val result = permissionService.hasPermission(testUserId, code)

        // Then
        assertFalse(result)
        verify(permissionRepository).findByCode(code)
        verify(userPermissionRepository).existsByUserIdAndPermissionId(testUserId, testPermission1.id)
    }

    @Test
    fun `hasPermission should return false when permission does not exist`() {
        // Given
        val code = "nonexistent.permission"
        whenever(permissionRepository.findByCode(code)) doReturn Optional.empty()

        // When
        val result = permissionService.hasPermission(testUserId, code)

        // Then
        assertFalse(result)
        verify(permissionRepository).findByCode(code)
        // Should NOT check user permissions when permission doesn't exist
        verify(userPermissionRepository, never()).existsByUserIdAndPermissionId(any(), any())
    }

    // ===== grantPermissions Tests =====

    @Test
    fun `grantPermissions should grant new permissions to user`() {
        // Given
        val permissionCodes = listOf("member.view", "member.create")
        val permissions = listOf(testPermission1, testPermission2)

        whenever(permissionRepository.findByCodes(permissionCodes)) doReturn permissions
        whenever(userPermissionRepository.existsByUserIdAndPermissionId(testUserId, testPermission1.id)) doReturn false
        whenever(userPermissionRepository.existsByUserIdAndPermissionId(testUserId, testPermission2.id)) doReturn false
        whenever(userPermissionRepository.saveAll(any<List<UserPermission>>())).thenAnswer { it.getArgument(0) }

        // When
        permissionService.grantPermissions(testUserId, permissionCodes, testGrantedBy)

        // Then
        verify(permissionRepository).findByCodes(permissionCodes)
        verify(userPermissionRepository).existsByUserIdAndPermissionId(testUserId, testPermission1.id)
        verify(userPermissionRepository).existsByUserIdAndPermissionId(testUserId, testPermission2.id)

        val captor = argumentCaptor<List<UserPermission>>()
        verify(userPermissionRepository).saveAll(captor.capture())
        val savedPermissions = captor.firstValue
        assertEquals(2, savedPermissions.size)
        assertEquals(testUserId, savedPermissions[0].userId)
        assertEquals(testGrantedBy, savedPermissions[0].grantedBy)
    }

    @Test
    fun `grantPermissions should skip permissions user already has`() {
        // Given
        val permissionCodes = listOf("member.view", "member.create")
        val permissions = listOf(testPermission1, testPermission2)

        whenever(permissionRepository.findByCodes(permissionCodes)) doReturn permissions
        whenever(userPermissionRepository.existsByUserIdAndPermissionId(testUserId, testPermission1.id)) doReturn true  // Already has
        whenever(userPermissionRepository.existsByUserIdAndPermissionId(testUserId, testPermission2.id)) doReturn false

        whenever(userPermissionRepository.saveAll(any<List<UserPermission>>())).thenAnswer { it.getArgument(0) }

        // When
        permissionService.grantPermissions(testUserId, permissionCodes, testGrantedBy)

        // Then
        val captor = argumentCaptor<List<UserPermission>>()
        verify(userPermissionRepository).saveAll(captor.capture())
        val savedPermissions = captor.firstValue
        assertEquals(1, savedPermissions.size) // Only one new permission
        assertEquals(testPermission2.id, savedPermissions[0].permissionId)
    }

    @Test
    fun `grantPermissions should not save anything when all permissions already granted`() {
        // Given
        val permissionCodes = listOf("member.view", "member.create")
        val permissions = listOf(testPermission1, testPermission2)

        whenever(permissionRepository.findByCodes(permissionCodes)) doReturn permissions
        whenever(userPermissionRepository.existsByUserIdAndPermissionId(testUserId, testPermission1.id)) doReturn true
        whenever(userPermissionRepository.existsByUserIdAndPermissionId(testUserId, testPermission2.id)) doReturn true

        // When
        permissionService.grantPermissions(testUserId, permissionCodes, testGrantedBy)

        // Then
        verify(userPermissionRepository, never()).saveAll(any())
    }

    @Test
    fun `grantPermissions should do nothing when no valid permissions found`() {
        // Given
        val permissionCodes = listOf("invalid.code1", "invalid.code2")
        whenever(permissionRepository.findByCodes(permissionCodes)) doReturn emptyList()

        // When
        permissionService.grantPermissions(testUserId, permissionCodes, testGrantedBy)

        // Then
        verify(permissionRepository).findByCodes(permissionCodes)
        verify(userPermissionRepository, never()).existsByUserIdAndPermissionId(any(), any())
        verify(userPermissionRepository, never()).saveAll(any())
    }

    @Test
    fun `grantPermissions should allow null grantedBy`() {
        // Given
        val permissionCodes = listOf("member.view")
        val permissions = listOf(testPermission1)

        whenever(permissionRepository.findByCodes(permissionCodes)) doReturn permissions
        whenever(userPermissionRepository.existsByUserIdAndPermissionId(testUserId, testPermission1.id)) doReturn false
        whenever(userPermissionRepository.saveAll(any<List<UserPermission>>())).thenAnswer { it.getArgument(0) }

        // When
        permissionService.grantPermissions(testUserId, permissionCodes, null)

        // Then
        val captor = argumentCaptor<List<UserPermission>>()
        verify(userPermissionRepository).saveAll(captor.capture())
        val savedPermissions = captor.firstValue
        assertNull(savedPermissions[0].grantedBy)
    }

    // ===== revokePermissions Tests =====

    @Test
    fun `revokePermissions should revoke permissions from user`() {
        // Given
        val permissionCodes = listOf("member.view", "member.create")
        val permissions = listOf(testPermission1, testPermission2)
        val permissionIds = listOf(testPermission1.id, testPermission2.id)

        whenever(permissionRepository.findByCodes(permissionCodes)) doReturn permissions

        // When
        permissionService.revokePermissions(testUserId, permissionCodes)

        // Then
        verify(permissionRepository).findByCodes(permissionCodes)
        verify(userPermissionRepository).deleteByUserIdAndPermissionIds(testUserId, permissionIds)
    }

    @Test
    fun `revokePermissions should do nothing when no valid permissions found`() {
        // Given
        val permissionCodes = listOf("invalid.code1", "invalid.code2")
        whenever(permissionRepository.findByCodes(permissionCodes)) doReturn emptyList()

        // When
        permissionService.revokePermissions(testUserId, permissionCodes)

        // Then
        verify(permissionRepository).findByCodes(permissionCodes)
        verify(userPermissionRepository, never()).deleteByUserIdAndPermissionIds(any(), any())
    }

    // ===== setUserPermissions Tests =====

    @Test
    fun `setUserPermissions should replace all user permissions`() {
        // Given
        val permissionCodes = listOf("member.view", "booking.view")
        val permissions = listOf(testPermission1, testPermission3)

        whenever(permissionRepository.findByCodes(permissionCodes)) doReturn permissions
        whenever(userPermissionRepository.existsByUserIdAndPermissionId(any(), any())) doReturn false
        whenever(userPermissionRepository.saveAll(any<List<UserPermission>>())).thenAnswer { it.getArgument(0) }

        // When
        permissionService.setUserPermissions(testUserId, permissionCodes, testGrantedBy)

        // Then
        verify(userPermissionRepository).deleteByUserId(testUserId)
        verify(permissionRepository).findByCodes(permissionCodes)

        val captor = argumentCaptor<List<UserPermission>>()
        verify(userPermissionRepository).saveAll(captor.capture())
        assertEquals(2, captor.firstValue.size)
    }

    @Test
    fun `setUserPermissions should clear all permissions when empty list provided`() {
        // Given
        val permissionCodes = emptyList<String>()

        // When
        permissionService.setUserPermissions(testUserId, permissionCodes, testGrantedBy)

        // Then
        verify(userPermissionRepository).deleteByUserId(testUserId)
        verify(permissionRepository, never()).findByCodes(any())
        verify(userPermissionRepository, never()).saveAll(any())
    }

    // ===== grantDefaultPermissionsForRole Tests (Phase 1 Optimization) =====

    @Test
    fun `grantDefaultPermissionsForRole should grant default permissions using optimized findByIds`() {
        // Given
        val role = "MEMBER"
        val defaultPermissionIds = listOf(testPermission1.id, testPermission2.id)
        val permissions = listOf(testPermission1, testPermission2)

        whenever(roleDefaultPermissionRepository.findPermissionIdsByRole(role)) doReturn defaultPermissionIds
        whenever(permissionRepository.findByIds(defaultPermissionIds)) doReturn permissions
        whenever(userPermissionRepository.saveAll(any<List<UserPermission>>())).thenAnswer { it.getArgument(0) }

        // When
        permissionService.grantDefaultPermissionsForRole(testUserId, role)

        // Then
        verify(roleDefaultPermissionRepository).findPermissionIdsByRole(role)
        verify(permissionRepository).findByIds(defaultPermissionIds)
        // Verify Phase 1 optimization: should NOT call findAll()
        verify(permissionRepository, never()).findAll()

        val captor = argumentCaptor<List<UserPermission>>()
        verify(userPermissionRepository).saveAll(captor.capture())
        val savedPermissions = captor.firstValue
        assertEquals(2, savedPermissions.size)
        assertEquals(testUserId, savedPermissions[0].userId)
        assertNull(savedPermissions[0].grantedBy) // Default permissions have no granter
    }

    @Test
    fun `grantDefaultPermissionsForRole should do nothing when no defaults exist for role`() {
        // Given
        val role = "CUSTOM_ROLE"
        whenever(roleDefaultPermissionRepository.findPermissionIdsByRole(role)) doReturn emptyList()

        // When
        permissionService.grantDefaultPermissionsForRole(testUserId, role)

        // Then
        verify(roleDefaultPermissionRepository).findPermissionIdsByRole(role)
        verify(permissionRepository, never()).findByIds(any())
        verify(userPermissionRepository, never()).saveAll(any())
    }

    // ===== clearUserPermissions Tests =====

    @Test
    fun `clearUserPermissions should delete all user permissions`() {
        // Given
        // No mocks needed - just verify the call

        // When
        permissionService.clearUserPermissions(testUserId)

        // Then
        verify(userPermissionRepository).deleteByUserId(testUserId)
    }

    // ===== Edge Cases and Integration Tests =====

    @Test
    fun `grantPermissions should handle mixed valid and invalid permission codes`() {
        // Given
        val permissionCodes = listOf("member.view", "invalid.code", "member.create")
        val permissions = listOf(testPermission1, testPermission2) // Only 2 valid

        whenever(permissionRepository.findByCodes(permissionCodes)) doReturn permissions
        whenever(userPermissionRepository.existsByUserIdAndPermissionId(any(), any())) doReturn false
        whenever(userPermissionRepository.saveAll(any<List<UserPermission>>())).thenAnswer { it.getArgument(0) }

        // When
        permissionService.grantPermissions(testUserId, permissionCodes, testGrantedBy)

        // Then
        val captor = argumentCaptor<List<UserPermission>>()
        verify(userPermissionRepository).saveAll(captor.capture())
        assertEquals(2, captor.firstValue.size) // Only valid permissions granted
    }

    @Test
    fun `getUserPermissions should maintain permission order from repository`() {
        // Given
        val userPermission1 = UserPermission(userId = testUserId, permissionId = testPermission1.id)
        val userPermission2 = UserPermission(userId = testUserId, permissionId = testPermission2.id)
        val userPermission3 = UserPermission(userId = testUserId, permissionId = testPermission3.id)
        val userPermissions = listOf(userPermission1, userPermission2, userPermission3)
        val permissionIds = listOf(testPermission1.id, testPermission2.id, testPermission3.id)
        val permissions = listOf(testPermission1, testPermission2, testPermission3)

        whenever(userPermissionRepository.findByUserId(testUserId)) doReturn userPermissions
        whenever(permissionRepository.findByIds(permissionIds)) doReturn permissions

        // When
        val result = permissionService.getUserPermissions(testUserId)

        // Then
        assertEquals(3, result.size)
        assertEquals(testPermission1, result[0])
        assertEquals(testPermission2, result[1])
        assertEquals(testPermission3, result[2])
    }
}
