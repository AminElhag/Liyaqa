package com.liyaqa.platform.communication.exception

import com.liyaqa.platform.exception.*
import java.util.UUID

class AnnouncementNotFoundException(id: UUID) :
    PlatformResourceNotFoundException(PlatformErrorCode.ANNOUNCEMENT_NOT_FOUND, "Announcement not found: $id")

class InvalidAnnouncementStateException(message: String) :
    PlatformInvalidStateException(PlatformErrorCode.INVALID_ANNOUNCEMENT_STATE, message)

class CommunicationTemplateNotFoundException(identifier: String) :
    PlatformResourceNotFoundException(PlatformErrorCode.COMM_TEMPLATE_NOT_FOUND, "Communication template not found: $identifier")

class DuplicateTemplateCodeException(code: String) :
    PlatformDuplicateResourceException(PlatformErrorCode.DUPLICATE_TEMPLATE_CODE, "A communication template already exists with code: $code")
