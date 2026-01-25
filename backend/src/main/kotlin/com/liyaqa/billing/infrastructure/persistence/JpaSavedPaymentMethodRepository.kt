package com.liyaqa.billing.infrastructure.persistence

import com.liyaqa.billing.domain.model.SavedPaymentMethod
import com.liyaqa.billing.domain.ports.SavedPaymentMethodRepository
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Modifying
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import org.springframework.stereotype.Repository
import java.util.Optional
import java.util.UUID

/**
 * Spring Data JPA repository interface for SavedPaymentMethod.
 */
interface SpringDataSavedPaymentMethodRepository : JpaRepository<SavedPaymentMethod, UUID> {

    fun findByMemberId(memberId: UUID): List<SavedPaymentMethod>

    @Query("SELECT pm FROM SavedPaymentMethod pm WHERE pm.memberId = :memberId AND pm.isActive = true ORDER BY pm.isDefault DESC, pm.createdAt DESC")
    fun findActiveByMemberId(@Param("memberId") memberId: UUID): List<SavedPaymentMethod>

    @Query("SELECT pm FROM SavedPaymentMethod pm WHERE pm.memberId = :memberId AND pm.isDefault = true AND pm.isActive = true")
    fun findDefaultByMemberId(@Param("memberId") memberId: UUID): Optional<SavedPaymentMethod>

    @Query("SELECT pm FROM SavedPaymentMethod pm WHERE pm.id = :id AND pm.memberId = :memberId")
    fun findByIdAndMemberId(
        @Param("id") id: UUID,
        @Param("memberId") memberId: UUID
    ): Optional<SavedPaymentMethod>

    @Modifying
    @Query("UPDATE SavedPaymentMethod pm SET pm.isDefault = false WHERE pm.memberId = :memberId AND pm.isDefault = true")
    fun clearDefaultForMember(@Param("memberId") memberId: UUID)

    @Query("SELECT COUNT(pm) FROM SavedPaymentMethod pm WHERE pm.memberId = :memberId AND pm.isActive = true")
    fun countActiveByMemberId(@Param("memberId") memberId: UUID): Long
}

/**
 * Implementation of SavedPaymentMethodRepository using Spring Data JPA.
 */
@Repository
class JpaSavedPaymentMethodRepository(
    private val springDataRepository: SpringDataSavedPaymentMethodRepository
) : SavedPaymentMethodRepository {

    override fun save(paymentMethod: SavedPaymentMethod): SavedPaymentMethod =
        springDataRepository.save(paymentMethod)

    override fun findById(id: UUID): Optional<SavedPaymentMethod> =
        springDataRepository.findById(id)

    override fun findByMemberId(memberId: UUID): List<SavedPaymentMethod> =
        springDataRepository.findByMemberId(memberId)

    override fun findActiveByMemberId(memberId: UUID): List<SavedPaymentMethod> =
        springDataRepository.findActiveByMemberId(memberId)

    override fun findDefaultByMemberId(memberId: UUID): Optional<SavedPaymentMethod> =
        springDataRepository.findDefaultByMemberId(memberId)

    override fun existsById(id: UUID): Boolean =
        springDataRepository.existsById(id)

    override fun deleteById(id: UUID) =
        springDataRepository.deleteById(id)

    override fun findByIdAndMemberId(id: UUID, memberId: UUID): Optional<SavedPaymentMethod> =
        springDataRepository.findByIdAndMemberId(id, memberId)

    override fun clearDefaultForMember(memberId: UUID) {
        springDataRepository.clearDefaultForMember(memberId)
    }

    override fun countActiveByMemberId(memberId: UUID): Long =
        springDataRepository.countActiveByMemberId(memberId)
}
