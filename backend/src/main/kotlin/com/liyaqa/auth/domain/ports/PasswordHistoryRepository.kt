package com.liyaqa.auth.domain.ports

import com.liyaqa.auth.domain.model.PasswordHistory
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import org.springframework.stereotype.Repository
import java.util.UUID

/**
 * Repository for password history management.
 */
@Repository
interface PasswordHistoryRepository : JpaRepository<PasswordHistory, UUID> {

    /**
     * Finds recent password history entries for a user, ordered by most recent first.
     *
     * @param userId The user ID
     * @param limit Maximum number of entries to return
     * @return List of password history entries
     */
    @Query(
        """
        SELECT ph FROM PasswordHistory ph
        WHERE ph.userId = :userId
        ORDER BY ph.createdAt DESC
        LIMIT :limit
        """
    )
    fun findRecentByUserId(
        @Param("userId") userId: UUID,
        @Param("limit") limit: Int
    ): List<PasswordHistory>

    /**
     * Finds all password history entries for a user, ordered by most recent first.
     *
     * @param userId The user ID
     * @return List of password history entries
     */
    fun findByUserIdOrderByCreatedAtDesc(userId: UUID): List<PasswordHistory>

    /**
     * Deletes all password history entries for a user.
     *
     * @param userId The user ID
     */
    fun deleteByUserId(userId: UUID)
}
