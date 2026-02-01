package com.liyaqa.auth.domain.model

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.Id
import jakarta.persistence.Table
import java.time.Instant
import java.util.UUID

/**
 * Password history entry for tracking previously used passwords.
 * Used to prevent password reuse within a configurable time window.
 */
@Entity
@Table(name = "password_history")
class PasswordHistory(
    @Id
    @Column(name = "id")
    val id: UUID = UUID.randomUUID(),

    @Column(name = "user_id", nullable = false)
    val userId: UUID,

    @Column(name = "password_hash", nullable = false, length = 255)
    val passwordHash: String,

    @Column(name = "created_at", nullable = false)
    val createdAt: Instant = Instant.now()
)
