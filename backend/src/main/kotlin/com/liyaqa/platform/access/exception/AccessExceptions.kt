package com.liyaqa.platform.access.exception

import com.liyaqa.platform.exception.*
import java.util.UUID

class ReadOnlyImpersonationException :
    PlatformAccessDeniedException(PlatformErrorCode.IMPERSONATION_READ_ONLY, "Write operations are not allowed during impersonation")

class ImpersonationSessionNotFoundException(id: UUID) :
    PlatformResourceNotFoundException(PlatformErrorCode.IMPERSONATION_SESSION_NOT_FOUND, "Impersonation session not found: $id")

class ActiveImpersonationSessionExistsException(userId: UUID) :
    PlatformDuplicateResourceException(PlatformErrorCode.ACTIVE_IMPERSONATION_EXISTS, "An active impersonation session already exists for platform user: $userId")

class ImpersonationSessionExpiredException :
    PlatformInvalidStateException(PlatformErrorCode.IMPERSONATION_SESSION_EXPIRED, "Impersonation session has expired")

class InviteTokenNotFoundException :
    PlatformResourceNotFoundException(PlatformErrorCode.INVITE_TOKEN_NOT_FOUND, "Invite token not found or invalid")

class InviteTokenExpiredException :
    PlatformInvalidStateException(PlatformErrorCode.INVITE_TOKEN_EXPIRED, "Invite token has expired")

class InviteTokenAlreadyUsedException :
    PlatformInvalidStateException(PlatformErrorCode.INVITE_TOKEN_USED, "Invite token has already been used")

class ApiKeyNotFoundException(id: UUID) :
    PlatformResourceNotFoundException(PlatformErrorCode.API_KEY_NOT_FOUND, "API key not found: $id")

class ApiKeyAlreadyRevokedException(id: UUID) :
    PlatformInvalidStateException(PlatformErrorCode.API_KEY_REVOKED, "API key already revoked: $id")
