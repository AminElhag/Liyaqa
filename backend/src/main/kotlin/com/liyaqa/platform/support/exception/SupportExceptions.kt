package com.liyaqa.platform.support.exception

import com.liyaqa.platform.exception.*
import com.liyaqa.platform.support.model.TicketStatus
import java.util.UUID

class TicketNotFoundException(id: UUID) :
    PlatformResourceNotFoundException(PlatformErrorCode.TICKET_NOT_FOUND, "Ticket not found: $id")

class InvalidTicketStatusTransitionException(from: TicketStatus, to: TicketStatus) :
    PlatformInvalidStateException(PlatformErrorCode.INVALID_TICKET_TRANSITION, "Invalid status transition from $from to $to")

class CannedResponseNotFoundException(id: UUID) :
    PlatformResourceNotFoundException(PlatformErrorCode.CANNED_RESPONSE_NOT_FOUND, "Canned response not found: $id")

class TicketRatingException(message: String) :
    PlatformInvalidStateException(PlatformErrorCode.TICKET_RATING_ERROR, message)
