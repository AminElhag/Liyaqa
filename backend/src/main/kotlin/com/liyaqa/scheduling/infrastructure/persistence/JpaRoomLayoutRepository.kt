package com.liyaqa.scheduling.infrastructure.persistence

import com.liyaqa.scheduling.domain.model.RoomLayout
import com.liyaqa.scheduling.domain.ports.RoomLayoutRepository
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository
import java.util.Optional
import java.util.UUID

interface SpringDataRoomLayoutRepository : JpaRepository<RoomLayout, UUID> {
    fun findByIsActive(isActive: Boolean, pageable: Pageable): Page<RoomLayout>
    fun findByIsActiveOrderByNameEn(isActive: Boolean): List<RoomLayout>
}

@Repository
class JpaRoomLayoutRepository(
    private val springDataRepository: SpringDataRoomLayoutRepository
) : RoomLayoutRepository {

    override fun save(roomLayout: RoomLayout): RoomLayout =
        springDataRepository.save(roomLayout)

    override fun findById(id: UUID): Optional<RoomLayout> =
        springDataRepository.findById(id)

    override fun findAll(pageable: Pageable): Page<RoomLayout> =
        springDataRepository.findAll(pageable)

    override fun findByIsActive(isActive: Boolean, pageable: Pageable): Page<RoomLayout> =
        springDataRepository.findByIsActive(isActive, pageable)

    override fun findByIsActiveOrderByNameEn(isActive: Boolean): List<RoomLayout> =
        springDataRepository.findByIsActiveOrderByNameEn(isActive)

    override fun existsById(id: UUID): Boolean =
        springDataRepository.existsById(id)

    override fun deleteById(id: UUID) =
        springDataRepository.deleteById(id)
}
