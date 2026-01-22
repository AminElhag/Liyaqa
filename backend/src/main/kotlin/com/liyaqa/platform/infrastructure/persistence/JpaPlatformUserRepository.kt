package com.liyaqa.platform.infrastructure.persistence

import com.liyaqa.platform.domain.model.PlatformUser
import com.liyaqa.platform.domain.model.PlatformUserActivity
import com.liyaqa.platform.domain.model.PlatformUserRole
import com.liyaqa.platform.domain.model.PlatformUserStatus
import com.liyaqa.platform.domain.ports.PlatformUserActivityRepository
import com.liyaqa.platform.domain.ports.PlatformUserRepository
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import org.springframework.stereotype.Repository
import java.util.Optional
import java.util.UUID

/**
 * Spring Data JPA interface for PlatformUser.
 */
interface SpringDataPlatformUserRepository : JpaRepository<PlatformUser, UUID> {
    fun findByEmail(email: String): Optional<PlatformUser>
    fun findByStatus(status: PlatformUserStatus, pageable: Pageable): Page<PlatformUser>
    fun findByRole(role: PlatformUserRole, pageable: Pageable): Page<PlatformUser>
    fun findByStatusAndRole(status: PlatformUserStatus, role: PlatformUserRole, pageable: Pageable): Page<PlatformUser>
    fun existsByEmail(email: String): Boolean
    fun countByStatus(status: PlatformUserStatus): Long
    fun countByRole(role: PlatformUserRole): Long

    @Query("""
        SELECT u FROM PlatformUser u
        WHERE LOWER(u.email) LIKE LOWER(CONCAT('%', :search, '%'))
        OR LOWER(u.displayName.en) LIKE LOWER(CONCAT('%', :search, '%'))
        OR LOWER(u.displayName.ar) LIKE LOWER(CONCAT('%', :search, '%'))
    """)
    fun searchByEmailOrName(@Param("search") search: String, pageable: Pageable): Page<PlatformUser>
}

/**
 * Spring Data JPA interface for PlatformUserActivity.
 */
interface SpringDataPlatformUserActivityRepository : JpaRepository<PlatformUserActivity, UUID> {
    fun findByUserId(userId: UUID, pageable: Pageable): Page<PlatformUserActivity>
}

/**
 * JPA adapter implementation for PlatformUserRepository.
 */
@Repository
class JpaPlatformUserRepository(
    private val springDataRepository: SpringDataPlatformUserRepository
) : PlatformUserRepository {

    override fun save(user: PlatformUser): PlatformUser =
        springDataRepository.save(user)

    override fun findById(id: UUID): Optional<PlatformUser> =
        springDataRepository.findById(id)

    override fun findByEmail(email: String): Optional<PlatformUser> =
        springDataRepository.findByEmail(email)

    override fun findAll(pageable: Pageable): Page<PlatformUser> =
        springDataRepository.findAll(pageable)

    override fun findByStatus(status: PlatformUserStatus, pageable: Pageable): Page<PlatformUser> =
        springDataRepository.findByStatus(status, pageable)

    override fun findByRole(role: PlatformUserRole, pageable: Pageable): Page<PlatformUser> =
        springDataRepository.findByRole(role, pageable)

    override fun findByStatusAndRole(status: PlatformUserStatus, role: PlatformUserRole, pageable: Pageable): Page<PlatformUser> =
        springDataRepository.findByStatusAndRole(status, role, pageable)

    override fun searchByEmailOrName(search: String, pageable: Pageable): Page<PlatformUser> =
        springDataRepository.searchByEmailOrName(search, pageable)

    override fun existsByEmail(email: String): Boolean =
        springDataRepository.existsByEmail(email)

    override fun existsById(id: UUID): Boolean =
        springDataRepository.existsById(id)

    override fun deleteById(id: UUID) =
        springDataRepository.deleteById(id)

    override fun count(): Long =
        springDataRepository.count()

    override fun countByStatus(status: PlatformUserStatus): Long =
        springDataRepository.countByStatus(status)

    override fun countByRole(role: PlatformUserRole): Long =
        springDataRepository.countByRole(role)
}

/**
 * JPA adapter implementation for PlatformUserActivityRepository.
 */
@Repository
class JpaPlatformUserActivityRepository(
    private val springDataRepository: SpringDataPlatformUserActivityRepository
) : PlatformUserActivityRepository {

    override fun save(activity: PlatformUserActivity): PlatformUserActivity =
        springDataRepository.save(activity)

    override fun findByUserId(userId: UUID, pageable: Pageable): Page<PlatformUserActivity> =
        springDataRepository.findByUserId(userId, pageable)
}
