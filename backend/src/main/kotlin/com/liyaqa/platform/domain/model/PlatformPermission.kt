package com.liyaqa.platform.domain.model

/**
 * Fine-grained permissions for platform operations.
 * Used by [PlatformRolePermissions] to build the role → permission matrix.
 */
enum class PlatformPermission {
    // Clients
    CLIENTS_VIEW,
    CLIENTS_CREATE,
    CLIENTS_EDIT,
    CLIENTS_ACTIVATE,
    CLIENTS_SUSPEND,

    // Subscriptions
    SUBSCRIPTIONS_VIEW,
    SUBSCRIPTIONS_CREATE,
    SUBSCRIPTIONS_EDIT,
    SUBSCRIPTIONS_LIFECYCLE,

    // Deals
    DEALS_VIEW,
    DEALS_CREATE,
    DEALS_EDIT,
    DEALS_DELETE,
    DEALS_REASSIGN,

    // Invoices
    INVOICES_VIEW,
    INVOICES_CREATE,
    INVOICES_EDIT,
    INVOICES_LIFECYCLE,

    // Support Tickets
    TICKETS_VIEW,
    TICKETS_CREATE,
    TICKETS_EDIT,
    TICKETS_DELETE,
    TICKETS_ASSIGN,

    // Platform Users
    USERS_VIEW,
    USERS_CREATE,
    USERS_EDIT,
    USERS_DELETE,
    USERS_ROLE_ASSIGN,

    // Dashboard & Analytics
    DASHBOARD_VIEW,
    ANALYTICS_VIEW,
    ANALYTICS_EXPORT,

    // Impersonation
    IMPERSONATE_USER,

    // System
    SYSTEM_SETTINGS,
    AUDIT_LOGS_VIEW,

    // Announcements / Communications
    ANNOUNCEMENTS_VIEW,
    ANNOUNCEMENTS_CREATE,
    ANNOUNCEMENTS_MANAGE,
    NOTIFICATIONS_VIEW,
    NOTIFICATIONS_MANAGE,

    // Compliance
    COMPLIANCE_VIEW,
    COMPLIANCE_MANAGE,

    // Onboarding
    ONBOARDING_VIEW,
    ONBOARDING_MANAGE,

    // Health & Alerts
    HEALTH_VIEW,
    HEALTH_RECALCULATE,
    ALERTS_VIEW,
    ALERTS_MANAGE,

    // Dunning
    DUNNING_VIEW,
    DUNNING_MANAGE,

    // Clubs
    CLUBS_VIEW,
    CLUBS_EDIT,
    CLUBS_LIFECYCLE,

    // Plans
    PLANS_VIEW,
    PLANS_CREATE,
    PLANS_EDIT,
    PLANS_DELETE,
    PLANS_LIFECYCLE,

    // Client Notes
    NOTES_VIEW,
    NOTES_CREATE,
    NOTES_EDIT,
    NOTES_DELETE,

    // Agreements
    AGREEMENTS_VIEW,
    AGREEMENTS_CREATE,
    AGREEMENTS_EDIT,
    AGREEMENTS_DELETE,
    AGREEMENTS_LIFECYCLE,

    // Tenants
    TENANTS_VIEW,
    TENANTS_CREATE,
    TENANTS_UPDATE,
    TENANTS_STATUS_CHANGE,
    TENANTS_DEACTIVATE,
    TENANTS_EXPORT_DATA,
    TENANTS_ARCHIVE,

    // API Keys
    API_KEYS_VIEW,
    API_KEYS_MANAGE,

    // Configuration
    CONFIG_VIEW,
    CONFIG_EDIT,
    MAINTENANCE_MANAGE,
    FEATURE_FLAG_MANAGE,

    // Knowledge Base
    KNOWLEDGE_BASE_VIEW,
    KNOWLEDGE_BASE_MANAGE,

    // Document Templates
    TEMPLATES_VIEW,
    TEMPLATES_MANAGE
}
