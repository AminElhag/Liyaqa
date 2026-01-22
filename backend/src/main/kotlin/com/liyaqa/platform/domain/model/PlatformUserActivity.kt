package com.liyaqa.platform.domain.model

import com.liyaqa.shared.domain.OrganizationLevelEntity
import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.FetchType
import jakarta.persistence.JoinColumn
import jakarta.persistence.ManyToOne
import jakarta.persistence.Table
import java.util.UUID

/**
 * Activity log entry for platform users.
 * Tracks actions like login, viewing deals, updating tickets, etc.
 */
@Entity
@Table(name = "platform_user_activities")
class PlatformUserActivity(
    id: UUID = UUID.randomUUID(),

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    var user: PlatformUser,

    @Column(name = "action", nullable = false)
    var action: String,

    @Column(name = "description", nullable = false)
    var description: String,

    @Column(name = "ip_address")
    var ipAddress: String? = null,

    @Column(name = "user_agent")
    var userAgent: String? = null

) : OrganizationLevelEntity(id) {

    companion object {
        // Common action types
        const val ACTION_LOGIN = "LOGIN"
        const val ACTION_LOGOUT = "LOGOUT"
        const val ACTION_VIEW_DEAL = "VIEW_DEAL"
        const val ACTION_CREATE_DEAL = "CREATE_DEAL"
        const val ACTION_UPDATE_DEAL = "UPDATE_DEAL"
        const val ACTION_VIEW_TICKET = "VIEW_TICKET"
        const val ACTION_CREATE_TICKET = "CREATE_TICKET"
        const val ACTION_UPDATE_TICKET = "UPDATE_TICKET"
        const val ACTION_ASSIGN_TICKET = "ASSIGN_TICKET"
        const val ACTION_CLOSE_TICKET = "CLOSE_TICKET"
        const val ACTION_VIEW_CLIENT = "VIEW_CLIENT"
        const val ACTION_CREATE_CLIENT = "CREATE_CLIENT"
        const val ACTION_UPDATE_CLIENT = "UPDATE_CLIENT"
        const val ACTION_CREATE_USER = "CREATE_USER"
        const val ACTION_UPDATE_USER = "UPDATE_USER"
        const val ACTION_CHANGE_STATUS = "CHANGE_STATUS"
        const val ACTION_RESET_PASSWORD = "RESET_PASSWORD"

        /**
         * Create a new activity log entry.
         */
        fun create(
            user: PlatformUser,
            action: String,
            description: String,
            ipAddress: String? = null,
            userAgent: String? = null
        ): PlatformUserActivity {
            return PlatformUserActivity(
                user = user,
                action = action,
                description = description,
                ipAddress = ipAddress,
                userAgent = userAgent
            )
        }

        /**
         * Create a login activity.
         */
        fun loginActivity(user: PlatformUser, ipAddress: String? = null, userAgent: String? = null): PlatformUserActivity {
            return create(
                user = user,
                action = ACTION_LOGIN,
                description = "User logged in",
                ipAddress = ipAddress,
                userAgent = userAgent
            )
        }

        /**
         * Create a status change activity.
         */
        fun statusChangeActivity(
            user: PlatformUser,
            targetUser: PlatformUser,
            newStatus: PlatformUserStatus,
            reason: String? = null
        ): PlatformUserActivity {
            val description = buildString {
                append("Changed user ${targetUser.email} status to $newStatus")
                if (!reason.isNullOrBlank()) {
                    append(". Reason: $reason")
                }
            }
            return create(
                user = user,
                action = ACTION_CHANGE_STATUS,
                description = description
            )
        }
    }
}
