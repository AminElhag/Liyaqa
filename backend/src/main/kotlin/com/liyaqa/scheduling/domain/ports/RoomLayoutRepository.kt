package com.liyaqa.scheduling.domain.ports

import com.liyaqa.scheduling.domain.model.RoomLayout
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import java.util.Optional
import java.util.UUID

interface RoomLayoutRepository {
    fun save(roomLayout: RoomLayout): RoomLayout
    fun findById(id: UUID): Optional<RoomLayout>
    fun findAll(pageable: Pageable): Page<RoomLayout>
    fun findByIsActive(isActive: Boolean, pageable: Pageable): Page<RoomLayout>
    fun findByIsActiveOrderByNameEn(isActive: Boolean): List<RoomLayout>
    fun existsById(id: UUID): Boolean
    fun deleteById(id: UUID)
}
