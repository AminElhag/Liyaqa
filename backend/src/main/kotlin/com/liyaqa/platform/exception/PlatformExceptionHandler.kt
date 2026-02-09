package com.liyaqa.platform.exception

import jakarta.servlet.http.HttpServletRequest
import org.slf4j.LoggerFactory
import org.slf4j.MDC
import org.springframework.core.Ordered
import org.springframework.core.annotation.Order
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.ExceptionHandler
import org.springframework.web.bind.annotation.RestControllerAdvice
import java.time.Instant

@RestControllerAdvice(basePackages = ["com.liyaqa.platform"])
@Order(Ordered.HIGHEST_PRECEDENCE)
class PlatformExceptionHandler {

    private val logger = LoggerFactory.getLogger(PlatformExceptionHandler::class.java)

    @ExceptionHandler(PlatformResourceNotFoundException::class)
    fun handleNotFound(
        ex: PlatformResourceNotFoundException,
        request: HttpServletRequest
    ): ResponseEntity<PlatformErrorResponse> {
        logger.debug("Resource not found: {}", ex.message)
        return buildResponse(HttpStatus.NOT_FOUND, ex, request)
    }

    @ExceptionHandler(PlatformDuplicateResourceException::class)
    fun handleDuplicate(
        ex: PlatformDuplicateResourceException,
        request: HttpServletRequest
    ): ResponseEntity<PlatformErrorResponse> {
        logger.debug("Duplicate resource: {}", ex.message)
        return buildResponse(HttpStatus.CONFLICT, ex, request)
    }

    @ExceptionHandler(PlatformInvalidStateException::class)
    fun handleInvalidState(
        ex: PlatformInvalidStateException,
        request: HttpServletRequest
    ): ResponseEntity<PlatformErrorResponse> {
        logger.debug("Invalid state: {}", ex.message)
        return buildResponse(HttpStatus.UNPROCESSABLE_ENTITY, ex, request)
    }

    @ExceptionHandler(PlatformAccessDeniedException::class)
    fun handleAccessDenied(
        ex: PlatformAccessDeniedException,
        request: HttpServletRequest
    ): ResponseEntity<PlatformErrorResponse> {
        logger.warn("Access denied: {}", ex.message)
        return buildResponse(HttpStatus.FORBIDDEN, ex, request)
    }

    @ExceptionHandler(PlatformException::class)
    fun handlePlatformException(
        ex: PlatformException,
        request: HttpServletRequest
    ): ResponseEntity<PlatformErrorResponse> {
        logger.error("Platform error: {}", ex.message, ex)
        return buildResponse(HttpStatus.INTERNAL_SERVER_ERROR, ex, request)
    }

    private fun buildResponse(
        status: HttpStatus,
        ex: PlatformException,
        request: HttpServletRequest
    ): ResponseEntity<PlatformErrorResponse> {
        return ResponseEntity
            .status(status)
            .body(
                PlatformErrorResponse(
                    status = status.value(),
                    errorCode = ex.errorCode.code,
                    message = ex.message,
                    messageAr = ex.errorCode.messageAr,
                    traceId = MDC.get("requestId"),
                    timestamp = Instant.now(),
                    path = request.requestURI
                )
            )
    }
}
