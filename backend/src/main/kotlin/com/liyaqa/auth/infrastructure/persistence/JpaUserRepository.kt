package com.liyaqa.auth.infrastructure.persistence

import com.liyaqa.auth.domain.model.Role
import com.liyaqa.auth.domain.model.User
import com.liyaqa.auth.domain.model.UserStatus
import com.liyaqa.auth.domain.ports.UserRepository
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository
import java.util.Optional
import java.util.UUID

interface SpringDataUserRepository : JpaRepository<User, UUID> {
    fun findByEmail(email: String): Optional<User>
    fun findByEmailAndTenantId(email: String, tenantId: UUID): Optional<User>
    fun findByMemberId(memberId: UUID): Optional<User>
    fun findByStatus(status: UserStatus, pageable: Pageable): Page<User>
    fun findByRole(role: Role, pageable: Pageable): Page<User>
    fun existsByEmailAndTenantId(email: String, tenantId: UUID): Boolean
    fun findByOauthProviderAndOauthProviderId(oauthProvider: String, oauthProviderId: String): User?
    fun findFirstByTenantIdAndRoleInOrderByCreatedAtAsc(tenantId: UUID, roles: List<Role>): Optional<User>
}

@Repository
class JpaUserRepository(
    private val springDataRepository: SpringDataUserRepository
) : UserRepository {

    override fun save(user: User): User =
        springDataRepository.save(user)

    override fun findById(id: UUID): Optional<User> =
        springDataRepository.findById(id)

    override fun findByEmail(email: String): Optional<User> =
        springDataRepository.findByEmail(email)

    override fun findByEmailAndTenantId(email: String, tenantId: UUID): Optional<User> =
        springDataRepository.findByEmailAndTenantId(email, tenantId)

    override fun findByMemberId(memberId: UUID): Optional<User> =
        springDataRepository.findByMemberId(memberId)

    override fun findAll(pageable: Pageable): Page<User> =
        springDataRepository.findAll(pageable)

    override fun findByStatus(status: UserStatus, pageable: Pageable): Page<User> =
        springDataRepository.findByStatus(status, pageable)

    override fun findByRole(role: Role, pageable: Pageable): Page<User> =
        springDataRepository.findByRole(role, pageable)

    override fun existsById(id: UUID): Boolean =
        springDataRepository.existsById(id)

    override fun existsByEmailAndTenantId(email: String, tenantId: UUID): Boolean =
        springDataRepository.existsByEmailAndTenantId(email, tenantId)

    override fun deleteById(id: UUID) =
        springDataRepository.deleteById(id)

    override fun count(): Long =
        springDataRepository.count()

    override fun findByOAuthProviderAndProviderId(oauthProvider: String, oauthProviderId: String): User? =
        springDataRepository.findByOauthProviderAndOauthProviderId(oauthProvider, oauthProviderId)

    override fun findFirstByTenantIdAndRoleIn(tenantId: UUID, roles: List<Role>): Optional<User> =
        springDataRepository.findFirstByTenantIdAndRoleInOrderByCreatedAtAsc(tenantId, roles)
}