package com.liyaqa.auth.domain.ports

import com.liyaqa.auth.domain.model.Role
import com.liyaqa.auth.domain.model.User
import com.liyaqa.auth.domain.model.UserStatus
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import java.util.Optional
import java.util.UUID

/**
 * Repository port for User entity.
 * Users are tenant-scoped (belong to a club).
 */
interface UserRepository {
    fun save(user: User): User
    fun findById(id: UUID): Optional<User>
    fun findByEmail(email: String): Optional<User>
    fun findByEmailAndTenantId(email: String, tenantId: UUID): Optional<User>
    fun findByMemberId(memberId: UUID): Optional<User>
    fun findAll(pageable: Pageable): Page<User>
    fun findByStatus(status: UserStatus, pageable: Pageable): Page<User>
    fun findByRole(role: Role, pageable: Pageable): Page<User>
    fun existsById(id: UUID): Boolean
    fun existsByEmailAndTenantId(email: String, tenantId: UUID): Boolean
    fun deleteById(id: UUID)
    fun count(): Long
    fun findByOAuthProviderAndProviderId(oauthProvider: String, oauthProviderId: String): User?
    fun findFirstByTenantIdAndRoleIn(tenantId: UUID, roles: List<Role>): Optional<User>
}