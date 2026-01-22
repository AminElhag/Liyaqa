package com.liyaqa.platform.domain.ports

import com.liyaqa.platform.domain.model.PlatformUser
import com.liyaqa.platform.domain.model.PlatformUserActivity
import com.liyaqa.platform.domain.model.PlatformUserRole
import com.liyaqa.platform.domain.model.PlatformUserStatus
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import java.util.Optional
import java.util.UUID

/**
 * Repository port for PlatformUser aggregate.
 */
interface PlatformUserRepository {
    fun save(user: PlatformUser): PlatformUser
    fun findById(id: UUID): Optional<PlatformUser>
    fun findByEmail(email: String): Optional<PlatformUser>
    fun findAll(pageable: Pageable): Page<PlatformUser>
    fun findByStatus(status: PlatformUserStatus, pageable: Pageable): Page<PlatformUser>
    fun findByRole(role: PlatformUserRole, pageable: Pageable): Page<PlatformUser>
    fun findByStatusAndRole(status: PlatformUserStatus, role: PlatformUserRole, pageable: Pageable): Page<PlatformUser>
    fun searchByEmailOrName(search: String, pageable: Pageable): Page<PlatformUser>
    fun existsByEmail(email: String): Boolean
    fun existsById(id: UUID): Boolean
    fun deleteById(id: UUID)
    fun count(): Long
    fun countByStatus(status: PlatformUserStatus): Long
    fun countByRole(role: PlatformUserRole): Long
}

/**
 * Repository port for PlatformUserActivity.
 */
interface PlatformUserActivityRepository {
    fun save(activity: PlatformUserActivity): PlatformUserActivity
    fun findByUserId(userId: UUID, pageable: Pageable): Page<PlatformUserActivity>
}
