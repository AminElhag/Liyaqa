package com.liyaqa.scheduling.application.services

import com.liyaqa.scheduling.domain.model.RoomLayout
import com.liyaqa.scheduling.domain.ports.RoomLayoutRepository
import com.liyaqa.shared.domain.LocalizedText
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.util.UUID

@Service
@Transactional
class RoomLayoutService(
    private val roomLayoutRepository: RoomLayoutRepository
) {

    fun createLayout(command: CreateRoomLayoutCommand): RoomLayout {
        val layout = RoomLayout(
            name = command.name,
            rows = command.rows,
            columns = command.columns,
            layoutJson = command.layoutJson
        )
        return roomLayoutRepository.save(layout)
    }

    @Transactional(readOnly = true)
    fun getLayout(id: UUID): RoomLayout {
        return roomLayoutRepository.findById(id)
            .orElseThrow { IllegalArgumentException("Room layout not found: $id") }
    }

    @Transactional(readOnly = true)
    fun getLayouts(pageable: Pageable): Page<RoomLayout> {
        return roomLayoutRepository.findAll(pageable)
    }

    @Transactional(readOnly = true)
    fun getActiveLayouts(): List<RoomLayout> {
        return roomLayoutRepository.findByIsActiveOrderByNameEn(true)
    }

    fun updateLayout(id: UUID, command: UpdateRoomLayoutCommand): RoomLayout {
        val layout = getLayout(id)
        command.name?.let { layout.name = it }
        command.rows?.let { layout.rows = it }
        command.columns?.let { layout.columns = it }
        command.layoutJson?.let { layout.layoutJson = it }
        return roomLayoutRepository.save(layout)
    }

    fun activateLayout(id: UUID): RoomLayout {
        val layout = getLayout(id)
        layout.activate()
        return roomLayoutRepository.save(layout)
    }

    fun deactivateLayout(id: UUID): RoomLayout {
        val layout = getLayout(id)
        layout.deactivate()
        return roomLayoutRepository.save(layout)
    }

    fun deleteLayout(id: UUID) {
        roomLayoutRepository.deleteById(id)
    }
}

data class CreateRoomLayoutCommand(
    val name: LocalizedText,
    val rows: Int = 4,
    val columns: Int = 5,
    val layoutJson: String = "[]"
)

data class UpdateRoomLayoutCommand(
    val name: LocalizedText? = null,
    val rows: Int? = null,
    val columns: Int? = null,
    val layoutJson: String? = null
)
