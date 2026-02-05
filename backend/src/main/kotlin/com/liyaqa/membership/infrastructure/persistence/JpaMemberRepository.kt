package com.liyaqa.membership.infrastructure.persistence

import com.liyaqa.membership.domain.model.Member
import com.liyaqa.membership.domain.model.MemberStatus
import com.liyaqa.membership.domain.ports.MemberRepository
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import org.springframework.stereotype.Repository
import java.time.Instant
import java.time.LocalDate
import java.time.ZoneOffset
import java.util.Optional
import java.util.UUID

/**
 * Spring Data JPA repository interface.
 */
interface SpringDataMemberRepository : JpaRepository<Member, UUID> {
    fun findByEmail(email: String): Optional<Member>
    fun existsByEmail(email: String): Boolean
    fun findByUserId(userId: UUID): Optional<Member>
    fun countByStatus(status: MemberStatus): Long

    @Query("SELECT COUNT(m) FROM Member m WHERE m.createdAt >= :date")
    fun countByCreatedAtAfter(@Param("date") date: Instant): Long

    @Query("SELECT COUNT(m) FROM Member m WHERE m.status = 'ACTIVE' AND m.createdAt <= :date")
    fun countActiveAtDate(@Param("date") date: Instant): Long

    @Query("SELECT COUNT(m) FROM Member m WHERE m.createdAt >= :startDate AND m.createdAt < :endDate")
    fun countJoinedBetween(@Param("startDate") startDate: Instant, @Param("endDate") endDate: Instant): Long

    @Query("SELECT m FROM Member m WHERE m.email = :email AND m.tenantId = :tenantId")
    fun findByEmailAndTenantId(email: String, tenantId: UUID): Optional<Member>

    // Uniqueness check methods
    @Query("SELECT CASE WHEN COUNT(m) > 0 THEN true ELSE false END FROM Member m WHERE m.phone = :phone")
    fun existsByPhone(@Param("phone") phone: String): Boolean

    @Query("SELECT CASE WHEN COUNT(m) > 0 THEN true ELSE false END FROM Member m WHERE m.nationalId = :nationalId")
    fun existsByNationalId(@Param("nationalId") nationalId: String): Boolean

    @Query("SELECT CASE WHEN COUNT(m) > 0 THEN true ELSE false END FROM Member m WHERE LOWER(m.email) = LOWER(:email) AND m.id != :excludeId")
    fun existsByEmailAndIdNot(@Param("email") email: String, @Param("excludeId") excludeId: UUID): Boolean

    @Query("SELECT CASE WHEN COUNT(m) > 0 THEN true ELSE false END FROM Member m WHERE m.phone = :phone AND m.id != :excludeId")
    fun existsByPhoneAndIdNot(@Param("phone") phone: String, @Param("excludeId") excludeId: UUID): Boolean

    @Query("SELECT CASE WHEN COUNT(m) > 0 THEN true ELSE false END FROM Member m WHERE m.nationalId = :nationalId AND m.id != :excludeId")
    fun existsByNationalIdAndIdNot(@Param("nationalId") nationalId: String, @Param("excludeId") excludeId: UUID): Boolean

    @Query(value = """
        SELECT * FROM members m
        WHERE (:search IS NULL OR (
            LOWER(m.first_name_en) LIKE LOWER(CONCAT('%', CAST(:search AS text), '%'))
            OR LOWER(m.last_name_en) LIKE LOWER(CONCAT('%', CAST(:search AS text), '%'))
            OR LOWER(m.first_name_ar) LIKE LOWER(CONCAT('%', CAST(:search AS text), '%'))
            OR LOWER(m.last_name_ar) LIKE LOWER(CONCAT('%', CAST(:search AS text), '%'))
            OR LOWER(m.email) LIKE LOWER(CONCAT('%', CAST(:search AS text), '%'))
        ))
        AND (CAST(:status AS text) IS NULL OR m.status = CAST(:status AS text))
        AND (CAST(:joinedAfter AS timestamp) IS NULL OR m.created_at >= CAST(:joinedAfter AS timestamp))
        AND (CAST(:joinedBefore AS timestamp) IS NULL OR m.created_at <= CAST(:joinedBefore AS timestamp))
    """, nativeQuery = true)
    fun search(
        @Param("search") search: String?,
        @Param("status") status: MemberStatus?,
        @Param("joinedAfter") joinedAfter: Instant?,
        @Param("joinedBefore") joinedBefore: Instant?,
        pageable: Pageable
    ): Page<Member>
}

/**
 * Adapter implementing the domain port using Spring Data JPA.
 */
@Repository
class JpaMemberRepository(
    private val springDataRepository: SpringDataMemberRepository
) : MemberRepository {

    override fun save(member: Member): Member {
        return springDataRepository.save(member)
    }

    override fun findById(id: UUID): Optional<Member> {
        return springDataRepository.findById(id)
    }

    override fun findByEmail(email: String): Optional<Member> {
        return springDataRepository.findByEmail(email)
    }

    override fun findAll(pageable: Pageable): Page<Member> {
        return springDataRepository.findAll(pageable)
    }

    override fun existsById(id: UUID): Boolean {
        return springDataRepository.existsById(id)
    }

    override fun existsByEmail(email: String): Boolean {
        return springDataRepository.existsByEmail(email)
    }

    override fun deleteById(id: UUID) {
        springDataRepository.deleteById(id)
    }

    override fun count(): Long {
        return springDataRepository.count()
    }

    override fun countByStatus(status: MemberStatus): Long {
        return springDataRepository.countByStatus(status)
    }

    override fun countByJoinedAfter(date: LocalDate): Long {
        val instant = date.atStartOfDay().toInstant(ZoneOffset.UTC)
        return springDataRepository.countByCreatedAtAfter(instant)
    }

    override fun findByUserId(userId: UUID): Optional<Member> {
        return springDataRepository.findByUserId(userId)
    }

    override fun search(
        search: String?,
        status: MemberStatus?,
        joinedAfter: LocalDate?,
        joinedBefore: LocalDate?,
        pageable: Pageable
    ): Page<Member> {
        val joinedAfterInstant = joinedAfter?.atStartOfDay()?.toInstant(ZoneOffset.UTC)
        val joinedBeforeInstant = joinedBefore?.plusDays(1)?.atStartOfDay()?.toInstant(ZoneOffset.UTC)

        return springDataRepository.search(
            search = search?.takeIf { it.isNotBlank() },
            status = status,
            joinedAfter = joinedAfterInstant,
            joinedBefore = joinedBeforeInstant,
            pageable = pageable
        )
    }

    override fun findAllByIds(ids: List<UUID>): List<Member> {
        return springDataRepository.findAllById(ids).toList()
    }

    override fun countActiveAtDate(date: LocalDate): Long {
        val instant = date.atStartOfDay().toInstant(ZoneOffset.UTC)
        return springDataRepository.countActiveAtDate(instant)
    }

    override fun countJoinedBetween(startDate: LocalDate, endDate: LocalDate): Long {
        val startInstant = startDate.atStartOfDay().toInstant(ZoneOffset.UTC)
        val endInstant = endDate.plusDays(1).atStartOfDay().toInstant(ZoneOffset.UTC)
        return springDataRepository.countJoinedBetween(startInstant, endInstant)
    }

    // ==================== UNIQUENESS CHECKS ====================

    override fun existsByPhone(phone: String): Boolean {
        return springDataRepository.existsByPhone(phone)
    }

    override fun existsByNationalId(nationalId: String): Boolean {
        return springDataRepository.existsByNationalId(nationalId)
    }

    override fun existsByEmailAndIdNot(email: String, excludeId: UUID): Boolean {
        return springDataRepository.existsByEmailAndIdNot(email, excludeId)
    }

    override fun existsByPhoneAndIdNot(phone: String, excludeId: UUID): Boolean {
        return springDataRepository.existsByPhoneAndIdNot(phone, excludeId)
    }

    override fun existsByNationalIdAndIdNot(nationalId: String, excludeId: UUID): Boolean {
        return springDataRepository.existsByNationalIdAndIdNot(nationalId, excludeId)
    }
}
