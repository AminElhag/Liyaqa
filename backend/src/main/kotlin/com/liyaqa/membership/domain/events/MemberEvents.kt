package com.liyaqa.membership.domain.events

import com.liyaqa.shared.domain.BaseDomainEvent
import java.util.UUID

sealed class MemberEvent : BaseDomainEvent()

data class MemberCreatedEvent(
    val memberId: UUID,
    val email: String,
    val firstName: String,
    val lastName: String
) : MemberEvent()

data class MemberUpdatedEvent(
    val memberId: UUID
) : MemberEvent()

data class MemberStatusChangedEvent(
    val memberId: UUID,
    val previousStatus: String,
    val newStatus: String
) : MemberEvent()

data class MemberDeletedEvent(
    val memberId: UUID,
    val email: String
) : MemberEvent()
