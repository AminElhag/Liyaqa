package com.liyaqa.shared.infrastructure.persistence

import com.liyaqa.shared.domain.model.Permission
import com.liyaqa.shared.domain.ports.PermissionRepository
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.stereotype.Repository
import java.util.Optional
import java.util.UUID

/**
 * Spring Data JPA repository for Permission.
 */
interface SpringDataPermissionRepository : JpaRepository<Permission, UUID> {
    fun findByCode(code: String): Optional<Permission>
    fun findByCodeIn(codes: List<String>): List<Permission>
    fun findByModule(module: String): List<Permission>
    fun existsByCode(code: String): Boolean
}

/**
 * JPA implementation of PermissionRepository.
 */
@Repository
class JpaPermissionRepository(
    private val springDataRepository: SpringDataPermissionRepository
) : PermissionRepository {

    override fun findAll(): List<Permission> {
        return springDataRepository.findAll()
    }

    override fun findById(id: UUID): Optional<Permission> {
        return springDataRepository.findById(id)
    }

    override fun findByCode(code: String): Optional<Permission> {
        return springDataRepository.findByCode(code)
    }

    override fun findByCodes(codes: List<String>): List<Permission> {
        return springDataRepository.findByCodeIn(codes)
    }

    override fun findByModule(module: String): List<Permission> {
        return springDataRepository.findByModule(module)
    }

    override fun existsByCode(code: String): Boolean {
        return springDataRepository.existsByCode(code)
    }
}
