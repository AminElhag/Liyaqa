package com.liyaqa.trainer.infrastructure.persistence

import com.liyaqa.trainer.domain.model.TrainerClient
import com.liyaqa.trainer.domain.model.TrainerClientStatus
import com.liyaqa.trainer.domain.ports.TrainerClientRepository
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import org.springframework.stereotype.Repository
import java.util.Optional
import java.util.UUID

/**
 * Spring Data JPA repository for TrainerClient entity.
 */
interface SpringDataTrainerClientRepository : JpaRepository<TrainerClient, UUID> {
    /**
     * Find client relationship by trainer and member.
     */
    fun findByTrainerIdAndMemberId(trainerId: UUID, memberId: UUID): Optional<TrainerClient>

    /**
     * Find all clients for a trainer.
     */
    fun findByTrainerId(trainerId: UUID, pageable: Pageable): Page<TrainerClient>

    /**
     * Find all clients for a trainer with specific status.
     */
    fun findByTrainerIdAndStatus(trainerId: UUID, status: TrainerClientStatus, pageable: Pageable): Page<TrainerClient>

    /**
     * Find all active clients for a trainer.
     */
    @Query("SELECT tc FROM TrainerClient tc WHERE tc.trainerId = :trainerId AND tc.status = 'ACTIVE'")
    fun findActiveByTrainerId(@Param("trainerId") trainerId: UUID, pageable: Pageable): Page<TrainerClient>

    /**
     * Find client relationships by member ID.
     */
    fun findByMemberId(memberId: UUID, pageable: Pageable): Page<TrainerClient>

    /**
     * Check if a trainer-member relationship exists.
     */
    fun existsByTrainerIdAndMemberId(trainerId: UUID, memberId: UUID): Boolean
}

/**
 * Adapter implementing TrainerClientRepository using Spring Data JPA.
 */
@Repository
class JpaTrainerClientRepository(
    private val springDataRepository: SpringDataTrainerClientRepository
) : TrainerClientRepository {

    override fun save(client: TrainerClient): TrainerClient {
        return springDataRepository.save(client)
    }

    override fun findById(id: UUID): Optional<TrainerClient> {
        return springDataRepository.findById(id)
    }

    override fun findAll(pageable: Pageable): Page<TrainerClient> {
        return springDataRepository.findAll(pageable)
    }

    override fun existsById(id: UUID): Boolean {
        return springDataRepository.existsById(id)
    }

    override fun deleteById(id: UUID) {
        springDataRepository.deleteById(id)
    }

    override fun count(): Long {
        return springDataRepository.count()
    }

    override fun findByTrainerIdAndMemberId(trainerId: UUID, memberId: UUID): Optional<TrainerClient> {
        return springDataRepository.findByTrainerIdAndMemberId(trainerId, memberId)
    }

    override fun findByTrainerId(trainerId: UUID, pageable: Pageable): Page<TrainerClient> {
        return springDataRepository.findByTrainerId(trainerId, pageable)
    }

    override fun findByTrainerIdAndStatus(trainerId: UUID, status: TrainerClientStatus, pageable: Pageable): Page<TrainerClient> {
        return springDataRepository.findByTrainerIdAndStatus(trainerId, status, pageable)
    }

    override fun findActiveByTrainerId(trainerId: UUID, pageable: Pageable): Page<TrainerClient> {
        return springDataRepository.findActiveByTrainerId(trainerId, pageable)
    }

    override fun findByMemberId(memberId: UUID, pageable: Pageable): Page<TrainerClient> {
        return springDataRepository.findByMemberId(memberId, pageable)
    }

    override fun findAllByIds(ids: List<UUID>): List<TrainerClient> {
        return springDataRepository.findAllById(ids).toList()
    }

    override fun existsByTrainerIdAndMemberId(trainerId: UUID, memberId: UUID): Boolean {
        return springDataRepository.existsByTrainerIdAndMemberId(trainerId, memberId)
    }
}
