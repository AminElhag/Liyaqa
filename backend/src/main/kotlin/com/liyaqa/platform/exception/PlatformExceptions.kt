package com.liyaqa.platform.exception

abstract class PlatformException(
    val errorCode: PlatformErrorCode,
    override val message: String = errorCode.messageEn,
    override val cause: Throwable? = null
) : RuntimeException(message, cause)

open class PlatformResourceNotFoundException(
    errorCode: PlatformErrorCode = PlatformErrorCode.RESOURCE_NOT_FOUND,
    message: String = errorCode.messageEn
) : PlatformException(errorCode, message)

open class PlatformDuplicateResourceException(
    errorCode: PlatformErrorCode = PlatformErrorCode.DUPLICATE_RESOURCE,
    message: String = errorCode.messageEn
) : PlatformException(errorCode, message)

open class PlatformInvalidStateException(
    errorCode: PlatformErrorCode = PlatformErrorCode.INVALID_STATE,
    message: String = errorCode.messageEn,
    cause: Throwable? = null
) : PlatformException(errorCode, message, cause)

open class PlatformAccessDeniedException(
    errorCode: PlatformErrorCode = PlatformErrorCode.ACCESS_DENIED,
    message: String = errorCode.messageEn
) : PlatformException(errorCode, message)
