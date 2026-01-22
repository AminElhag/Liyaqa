package com.liyaqa.shared.infrastructure.persistence

import com.liyaqa.shared.domain.model.RoleDefaultPermission
import com.liyaqa.shared.domain.model.UserPermission
import com.liyaqa.shared.domain.ports.RoleDefaultPermissionRepository
import com.liyaqa.shared.domain.ports.UserPermissionRepository
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Modifying
import org.springframework.data.jpa.repository.Query
import org.springframework.stereotype.Repository
import java.util.UUID

/**
 * Spring Data JPA repository for UserPermission.
 */
interface SpringDataUserPermissionRepository : JpaRepository<UserPermission, UUID> {
    fun findByUserId(userId: UUID): List<UserPermission>

    @Query("""
        SELECT p.code FROM Permission p
        JOIN UserPermission up ON up.permissionId = p.id
        WHERE up.userId = :userId
    """)
    fun findPermissionCodesByUserId(userId: UUID): List<String>

    fun existsByUserIdAndPermissionId(userId: UUID, permissionId: UUID): Boolean

    @Modifying
    fun deleteByUserIdAndPermissionId(userId: UUID, permissionId: UUID)

    @Modifying
    fun deleteByUserId(userId: UUID)

    @Modifying
    @Query("DELETE FROM UserPermission up WHERE up.userId = :userId AND up.permissionId IN :permissionIds")
    fun deleteByUserIdAndPermissionIdIn(userId: UUID, permissionIds: List<UUID>)
}

/**
 * JPA implementation of UserPermissionRepository.
 */
@Repository
class JpaUserPermissionRepository(
    private val springDataRepository: SpringDataUserPermissionRepository
) : UserPermissionRepository {

    override fun save(userPermission: UserPermission): UserPermission {
        return springDataRepository.save(userPermission)
    }

    override fun saveAll(userPermissions: List<UserPermission>): List<UserPermission> {
        return springDataRepository.saveAll(userPermissions)
    }

    override fun findByUserId(userId: UUID): List<UserPermission> {
        return springDataRepository.findByUserId(userId)
    }

    override fun findPermissionCodesByUserId(userId: UUID): List<String> {
        return springDataRepository.findPermissionCodesByUserId(userId)
    }

    override fun existsByUserIdAndPermissionId(userId: UUID, permissionId: UUID): Boolean {
        return springDataRepository.existsByUserIdAndPermissionId(userId, permissionId)
    }

    override fun deleteByUserIdAndPermissionId(userId: UUID, permissionId: UUID) {
        springDataRepository.deleteByUserIdAndPermissionId(userId, permissionId)
    }

    override fun deleteByUserId(userId: UUID) {
        springDataRepository.deleteByUserId(userId)
    }

    override fun deleteByUserIdAndPermissionIds(userId: UUID, permissionIds: List<UUID>) {
        springDataRepository.deleteByUserIdAndPermissionIdIn(userId, permissionIds)
    }
}

/**
 * Spring Data JPA repository for RoleDefaultPermission.
 */
interface SpringDataRoleDefaultPermissionRepository : JpaRepository<RoleDefaultPermission, UUID> {
    fun findByRole(role: String): List<RoleDefaultPermission>

    @Query("SELECT rdp.permissionId FROM RoleDefaultPermission rdp WHERE rdp.role = :role")
    fun findPermissionIdsByRole(role: String): List<UUID>
}

/**
 * JPA implementation of RoleDefaultPermissionRepository.
 */
@Repository
class JpaRoleDefaultPermissionRepository(
    private val springDataRepository: SpringDataRoleDefaultPermissionRepository
) : RoleDefaultPermissionRepository {

    override fun findPermissionIdsByRole(role: String): List<UUID> {
        return springDataRepository.findPermissionIdsByRole(role)
    }

    override fun findByRole(role: String): List<RoleDefaultPermission> {
        return springDataRepository.findByRole(role)
    }
}
