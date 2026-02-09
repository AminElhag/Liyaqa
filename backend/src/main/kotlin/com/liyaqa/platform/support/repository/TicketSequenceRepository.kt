package com.liyaqa.platform.support.repository

import com.liyaqa.platform.support.model.TicketSequence
import java.util.Optional

interface TicketSequenceRepository {
    fun findForUpdate(): Optional<TicketSequence>
    fun save(seq: TicketSequence): TicketSequence
}
