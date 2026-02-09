package com.liyaqa.platform.support.model

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.Id
import jakarta.persistence.Table
import java.util.UUID

@Entity
@Table(name = "ticket_sequences")
class TicketSequence(
    @Id
    @Column(name = "id", nullable = false)
    val id: UUID = SINGLETON_ID,

    @Column(name = "current_year", nullable = false)
    var currentYear: Int,

    @Column(name = "current_sequence", nullable = false)
    var currentSequence: Long = 0
) {
    fun getNextTicketNumber(year: Int): String {
        if (year != currentYear) {
            currentYear = year
            currentSequence = 0
        }
        currentSequence++
        return "TKT-$currentYear${currentSequence.toString().padStart(5, '0')}"
    }

    companion object {
        val SINGLETON_ID: UUID = UUID.fromString("00000000-0000-0000-0000-000000000004")
    }
}
