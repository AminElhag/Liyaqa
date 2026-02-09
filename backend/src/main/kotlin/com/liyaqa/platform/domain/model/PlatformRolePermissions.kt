package com.liyaqa.platform.domain.model

/**
 * Static mapping from [PlatformUserRole] to the set of [PlatformPermission]s granted.
 *
 * Hierarchy (each role is a superset of the one below):
 *   PLATFORM_SUPER_ADMIN  ⊃  PLATFORM_ADMIN  ⊃  ACCOUNT_MANAGER
 *   PLATFORM_SUPER_ADMIN  ⊃  PLATFORM_ADMIN  ⊃  SUPPORT_LEAD  ⊃  SUPPORT_AGENT
 *   PLATFORM_VIEWER  — read-only subset
 */
object PlatformRolePermissions {

    private val allPermissions: Set<PlatformPermission> =
        PlatformPermission.entries.toSet()

    private val viewPermissions: Set<PlatformPermission> =
        PlatformPermission.entries.filter { it.name.endsWith("_VIEW") }.toSet()

    private val supportAgentPermissions: Set<PlatformPermission> = setOf(
        // Tickets — basic CRUD
        PlatformPermission.TICKETS_VIEW,
        PlatformPermission.TICKETS_CREATE,
        PlatformPermission.TICKETS_EDIT,
        // Client read-only
        PlatformPermission.CLIENTS_VIEW,
        PlatformPermission.SUBSCRIPTIONS_VIEW,
        PlatformPermission.INVOICES_VIEW,
        // Dashboard
        PlatformPermission.DASHBOARD_VIEW,
        // Notes
        PlatformPermission.NOTES_VIEW,
        PlatformPermission.NOTES_CREATE,
        PlatformPermission.NOTES_EDIT,
        // Health & Alerts read-only
        PlatformPermission.HEALTH_VIEW,
        PlatformPermission.ALERTS_VIEW,
        // Onboarding read-only
        PlatformPermission.ONBOARDING_VIEW,
        // Clubs read-only
        PlatformPermission.CLUBS_VIEW,
        // Plans read-only
        PlatformPermission.PLANS_VIEW,
        // Dunning read-only
        PlatformPermission.DUNNING_VIEW,
        // Agreements read-only
        PlatformPermission.AGREEMENTS_VIEW,
        // Tenants read-only
        PlatformPermission.TENANTS_VIEW,
        PlatformPermission.TENANTS_EXPORT_DATA,
        // Knowledge Base read-only
        PlatformPermission.KNOWLEDGE_BASE_VIEW
    )

    private val supportLeadPermissions: Set<PlatformPermission> = supportAgentPermissions + setOf(
        PlatformPermission.TICKETS_ASSIGN,
        PlatformPermission.TICKETS_DELETE,
        PlatformPermission.IMPERSONATE_USER,
        PlatformPermission.NOTES_DELETE,
        PlatformPermission.ANALYTICS_VIEW,
        PlatformPermission.API_KEYS_VIEW
    )

    private val accountManagerPermissions: Set<PlatformPermission> = setOf(
        // Clients
        PlatformPermission.CLIENTS_VIEW,
        PlatformPermission.CLIENTS_CREATE,
        PlatformPermission.CLIENTS_EDIT,
        // Subscriptions
        PlatformPermission.SUBSCRIPTIONS_VIEW,
        PlatformPermission.SUBSCRIPTIONS_CREATE,
        PlatformPermission.SUBSCRIPTIONS_EDIT,
        PlatformPermission.SUBSCRIPTIONS_LIFECYCLE,
        // Deals
        PlatformPermission.DEALS_VIEW,
        PlatformPermission.DEALS_CREATE,
        PlatformPermission.DEALS_EDIT,
        PlatformPermission.DEALS_DELETE,
        // Invoices
        PlatformPermission.INVOICES_VIEW,
        PlatformPermission.INVOICES_CREATE,
        PlatformPermission.INVOICES_EDIT,
        PlatformPermission.INVOICES_LIFECYCLE,
        // Dashboard & Analytics
        PlatformPermission.DASHBOARD_VIEW,
        PlatformPermission.ANALYTICS_VIEW,
        PlatformPermission.ANALYTICS_EXPORT,
        // Notes
        PlatformPermission.NOTES_VIEW,
        PlatformPermission.NOTES_CREATE,
        PlatformPermission.NOTES_EDIT,
        PlatformPermission.NOTES_DELETE,
        // Health & Alerts
        PlatformPermission.HEALTH_VIEW,
        PlatformPermission.ALERTS_VIEW,
        // Onboarding
        PlatformPermission.ONBOARDING_VIEW,
        // Clubs
        PlatformPermission.CLUBS_VIEW,
        // Plans
        PlatformPermission.PLANS_VIEW,
        PlatformPermission.PLANS_CREATE,
        PlatformPermission.PLANS_LIFECYCLE,
        // Dunning
        PlatformPermission.DUNNING_VIEW,
        // Announcements
        PlatformPermission.ANNOUNCEMENTS_VIEW,
        PlatformPermission.ANNOUNCEMENTS_CREATE,
        PlatformPermission.ANNOUNCEMENTS_MANAGE,
        // Notifications
        PlatformPermission.NOTIFICATIONS_VIEW,
        PlatformPermission.NOTIFICATIONS_MANAGE,
        // Agreements
        PlatformPermission.AGREEMENTS_VIEW,
        // Tenants
        PlatformPermission.TENANTS_VIEW,
        PlatformPermission.TENANTS_CREATE,
        PlatformPermission.TENANTS_UPDATE,
        PlatformPermission.TENANTS_DEACTIVATE,
        PlatformPermission.TENANTS_EXPORT_DATA,
        // API Keys
        PlatformPermission.API_KEYS_VIEW,
        // Compliance
        PlatformPermission.COMPLIANCE_VIEW,
        // Configuration
        PlatformPermission.CONFIG_VIEW,
        // Knowledge Base & Templates
        PlatformPermission.KNOWLEDGE_BASE_VIEW,
        PlatformPermission.TEMPLATES_VIEW
    )

    private val platformAdminPermissions: Set<PlatformPermission> = allPermissions - setOf(
        PlatformPermission.SYSTEM_SETTINGS,
        PlatformPermission.USERS_ROLE_ASSIGN
    )

    private val permissionsByRole: Map<PlatformUserRole, Set<PlatformPermission>> = mapOf(
        PlatformUserRole.PLATFORM_SUPER_ADMIN to allPermissions,
        PlatformUserRole.PLATFORM_ADMIN to platformAdminPermissions,
        PlatformUserRole.ACCOUNT_MANAGER to accountManagerPermissions,
        PlatformUserRole.SUPPORT_LEAD to supportLeadPermissions,
        PlatformUserRole.SUPPORT_AGENT to supportAgentPermissions,
        PlatformUserRole.PLATFORM_VIEWER to viewPermissions
    )

    /**
     * Returns the set of permissions granted to the given role.
     */
    fun permissionsFor(role: PlatformUserRole): Set<PlatformPermission> =
        permissionsByRole[role] ?: emptySet()

    /**
     * Returns true if the given role has the specified permission.
     */
    fun hasPermission(role: PlatformUserRole, permission: PlatformPermission): Boolean =
        permission in permissionsFor(role)
}
