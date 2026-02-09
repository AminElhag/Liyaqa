package com.liyaqa.platform.domain.model

import org.junit.jupiter.api.Assertions.assertFalse
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test

class PlatformRolePermissionsTest {

    @Test
    fun `PLATFORM_SUPER_ADMIN has all permissions`() {
        val allPermissions = PlatformPermission.entries.toSet()
        val superAdminPermissions = PlatformRolePermissions.permissionsFor(PlatformUserRole.PLATFORM_SUPER_ADMIN)
        assertTrue(superAdminPermissions.containsAll(allPermissions))
    }

    @Test
    fun `PLATFORM_VIEWER has only VIEW permissions`() {
        val viewerPermissions = PlatformRolePermissions.permissionsFor(PlatformUserRole.PLATFORM_VIEWER)
        assertTrue(viewerPermissions.isNotEmpty())
        viewerPermissions.forEach { permission ->
            assertTrue(permission.name.endsWith("_VIEW"), "Viewer permission ${permission.name} should end with _VIEW")
        }
    }

    @Test
    fun `PLATFORM_VIEWER has all VIEW permissions`() {
        val viewPermissions = PlatformPermission.entries.filter { it.name.endsWith("_VIEW") }.toSet()
        val viewerPermissions = PlatformRolePermissions.permissionsFor(PlatformUserRole.PLATFORM_VIEWER)
        assertTrue(viewerPermissions.containsAll(viewPermissions))
    }

    @Test
    fun `SUPPORT_AGENT cannot assign tickets`() {
        assertFalse(PlatformRolePermissions.hasPermission(PlatformUserRole.SUPPORT_AGENT, PlatformPermission.TICKETS_ASSIGN))
    }

    @Test
    fun `SUPPORT_LEAD can assign tickets`() {
        assertTrue(PlatformRolePermissions.hasPermission(PlatformUserRole.SUPPORT_LEAD, PlatformPermission.TICKETS_ASSIGN))
    }

    @Test
    fun `ACCOUNT_MANAGER can manage deals but not system settings`() {
        assertTrue(PlatformRolePermissions.hasPermission(PlatformUserRole.ACCOUNT_MANAGER, PlatformPermission.DEALS_CREATE))
        assertTrue(PlatformRolePermissions.hasPermission(PlatformUserRole.ACCOUNT_MANAGER, PlatformPermission.DEALS_EDIT))
        assertFalse(PlatformRolePermissions.hasPermission(PlatformUserRole.ACCOUNT_MANAGER, PlatformPermission.SYSTEM_SETTINGS))
    }

    @Test
    fun `PLATFORM_ADMIN has all permissions except SYSTEM_SETTINGS and USERS_ROLE_ASSIGN`() {
        val adminPermissions = PlatformRolePermissions.permissionsFor(PlatformUserRole.PLATFORM_ADMIN)
        assertFalse(adminPermissions.contains(PlatformPermission.SYSTEM_SETTINGS))
        assertFalse(adminPermissions.contains(PlatformPermission.USERS_ROLE_ASSIGN))
        // But has everything else
        assertTrue(adminPermissions.contains(PlatformPermission.CLIENTS_CREATE))
        assertTrue(adminPermissions.contains(PlatformPermission.USERS_CREATE))
        assertTrue(adminPermissions.contains(PlatformPermission.IMPERSONATE_USER))
    }

    @Test
    fun `role hierarchy - each higher role has superset of lower role permissions`() {
        val superAdmin = PlatformRolePermissions.permissionsFor(PlatformUserRole.PLATFORM_SUPER_ADMIN)
        val admin = PlatformRolePermissions.permissionsFor(PlatformUserRole.PLATFORM_ADMIN)
        val supportLead = PlatformRolePermissions.permissionsFor(PlatformUserRole.SUPPORT_LEAD)
        val supportAgent = PlatformRolePermissions.permissionsFor(PlatformUserRole.SUPPORT_AGENT)

        assertTrue(superAdmin.containsAll(admin), "SUPER_ADMIN should contain all ADMIN permissions")
        assertTrue(supportLead.containsAll(supportAgent), "SUPPORT_LEAD should contain all SUPPORT_AGENT permissions")
    }

    @Test
    fun `SUPPORT_AGENT can create and edit tickets`() {
        assertTrue(PlatformRolePermissions.hasPermission(PlatformUserRole.SUPPORT_AGENT, PlatformPermission.TICKETS_CREATE))
        assertTrue(PlatformRolePermissions.hasPermission(PlatformUserRole.SUPPORT_AGENT, PlatformPermission.TICKETS_EDIT))
    }

    @Test
    fun `SUPPORT_AGENT cannot impersonate users`() {
        assertFalse(PlatformRolePermissions.hasPermission(PlatformUserRole.SUPPORT_AGENT, PlatformPermission.IMPERSONATE_USER))
    }

    @Test
    fun `SUPPORT_LEAD can impersonate users`() {
        assertTrue(PlatformRolePermissions.hasPermission(PlatformUserRole.SUPPORT_LEAD, PlatformPermission.IMPERSONATE_USER))
    }
}
