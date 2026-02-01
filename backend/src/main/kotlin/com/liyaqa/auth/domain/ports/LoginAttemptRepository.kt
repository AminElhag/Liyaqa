package com.liyaqa.auth.domain.ports

import com.liyaqa.auth.domain.model.LoginAttempt
import com.liyaqa.auth.domain.model.LoginAttemptType
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import org.springframework.stereotype.Repository
import java.time.Instant
import java.util.UUID

/**
 * Repository for login attempt management and audit queries.
 */
@Repository
interface LoginAttemptRepository : JpaRepository<LoginAttempt, UUID> {

    /**
     * Finds all login attempts for a specific user.
     *
     * @param userId The user ID
     * @param pageable Pagination parameters
     * @return Page of login attempts
     */
    fun findByUserIdOrderByTimestampDesc(userId: UUID, pageable: Pageable): Page<LoginAttempt>

    /**
     * Finds all login attempts for a user within a time range.
     *
     * @param userId The user ID
     * @param startTime Start of time range
     * @param endTime End of time range
     * @return List of login attempts
     */
    fun findByUserIdAndTimestampBetweenOrderByTimestampDesc(
        userId: UUID,
        startTime: Instant,
        endTime: Instant
    ): List<LoginAttempt>

    /**
     * Finds suspicious login attempts for a user.
     *
     * @param userId The user ID
     * @param pageable Pagination parameters
     * @return Page of suspicious login attempts
     */
    fun findByUserIdAndFlaggedAsSuspiciousTrueOrderByTimestampDesc(
        userId: UUID,
        pageable: Pageable
    ): Page<LoginAttempt>

    /**
     * Finds recent login attempts from a specific IP address.
     *
     * @param ipAddress The IP address
     * @param since Time threshold
     * @return List of login attempts
     */
    fun findByIpAddressAndTimestampAfterOrderByTimestampDesc(
        ipAddress: String,
        since: Instant
    ): List<LoginAttempt>

    /**
     * Finds failed login attempts for a specific email within a time window.
     * Used for brute force detection.
     *
     * @param email The email address
     * @param since Time threshold
     * @return List of failed attempts
     */
    @Query(
        """
        SELECT la FROM LoginAttempt la
        WHERE la.email = :email
        AND la.attemptType = 'FAILED'
        AND la.timestamp >= :since
        ORDER BY la.timestamp DESC
        """
    )
    fun findRecentFailedAttempts(
        @Param("email") email: String,
        @Param("since") since: Instant
    ): List<LoginAttempt>

    /**
     * Finds the most recent successful login for a user before a given timestamp.
     *
     * @param userId The user ID
     * @param before Timestamp threshold
     * @return The most recent successful login, if any
     */
    @Query(
        """
        SELECT la FROM LoginAttempt la
        WHERE la.userId = :userId
        AND la.attemptType IN ('SUCCESS', 'MFA_SUCCESS')
        AND la.timestamp < :before
        ORDER BY la.timestamp DESC
        LIMIT 1
        """
    )
    fun findMostRecentSuccessfulLogin(
        @Param("userId") userId: UUID,
        @Param("before") before: Instant
    ): LoginAttempt?

    /**
     * Finds all unique device fingerprints for a user.
     * Used for new device detection.
     *
     * @param userId The user ID
     * @return List of unique device fingerprints
     */
    @Query(
        """
        SELECT DISTINCT la.deviceFingerprint FROM LoginAttempt la
        WHERE la.userId = :userId
        AND la.deviceFingerprint IS NOT NULL
        AND la.attemptType IN ('SUCCESS', 'MFA_SUCCESS')
        """
    )
    fun findUniqueDeviceFingerprintsForUser(@Param("userId") userId: UUID): List<String>

    /**
     * Counts login attempts by type for a user within a time range.
     *
     * @param userId The user ID
     * @param attemptType The attempt type
     * @param since Time threshold
     * @return Count of attempts
     */
    fun countByUserIdAndAttemptTypeAndTimestampAfter(
        userId: UUID,
        attemptType: LoginAttemptType,
        since: Instant
    ): Long

    /**
     * Deletes old login attempts before a given timestamp.
     * Used for cleanup of audit logs.
     *
     * @param before Timestamp threshold
     */
    fun deleteByTimestampBefore(before: Instant)

    /**
     * Counts failed login attempts from a specific IP address since a given time.
     * Used for brute force detection.
     *
     * @param ipAddress The IP address
     * @param since Time threshold
     * @return Count of failed attempts
     */
    @Query(
        """
        SELECT COUNT(la) FROM LoginAttempt la
        WHERE la.ipAddress = :ipAddress
        AND la.attemptType = 'FAILED'
        AND la.timestamp >= :since
        """
    )
    fun countFailedAttemptsByIpSince(
        @Param("ipAddress") ipAddress: String,
        @Param("since") since: Instant
    ): Long

    /**
     * Finds recent login attempts from a specific IP address.
     *
     * @param ipAddress The IP address
     * @param since Time threshold
     * @return List of login attempts
     */
    @Query(
        """
        SELECT la FROM LoginAttempt la
        WHERE la.ipAddress = :ipAddress
        AND la.timestamp >= :since
        ORDER BY la.timestamp DESC
        """
    )
    fun findRecentByIp(
        @Param("ipAddress") ipAddress: String,
        @Param("since") since: Instant
    ): List<LoginAttempt>

    /**
     * Finds successful login attempts for a user since a given time.
     * Used for anomaly detection.
     *
     * @param userId The user ID
     * @param since Time threshold
     * @return List of successful login attempts
     */
    @Query(
        """
        SELECT la FROM LoginAttempt la
        WHERE la.userId = :userId
        AND la.attemptType IN ('SUCCESS', 'MFA_SUCCESS')
        AND la.timestamp >= :since
        ORDER BY la.timestamp DESC
        """
    )
    fun findSuccessfulByUserSince(
        @Param("userId") userId: UUID,
        @Param("since") since: Instant
    ): List<LoginAttempt>
}
