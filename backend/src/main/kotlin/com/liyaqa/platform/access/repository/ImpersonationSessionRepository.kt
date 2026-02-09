package com.liyaqa.platform.access.repository

import com.liyaqa.platform.access.model.ImpersonationSession
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import java.time.Instant
import java.util.Optional
import java.util.UUID

interface ImpersonationSessionRepository {
    fun save(session: ImpersonationSession): ImpersonationSession
    fun findById(id: UUID): Optional<ImpersonationSession>
    fun findByPlatformUserIdAndIsActiveTrue(platformUserId: UUID): Optional<ImpersonationSession>
    fun findByIsActiveTrue(): List<ImpersonationSession>
    fun findByFilters(
        platformUserId: UUID?,
        targetTenantId: UUID?,
        dateFrom: Instant?,
        dateTo: Instant?,
        pageable: Pageable
    ): Page<ImpersonationSession>
    fun countByPlatformUserIdAndIsActiveTrue(platformUserId: UUID): Long
}
