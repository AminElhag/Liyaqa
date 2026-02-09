package com.liyaqa.platform.exception

import com.liyaqa.platform.support.exception.TicketNotFoundException
import jakarta.servlet.http.HttpServletRequest
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertNotNull
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.mockito.Mockito.mock
import org.mockito.Mockito.`when`
import org.slf4j.MDC
import org.springframework.http.HttpStatus
import java.util.UUID

class PlatformExceptionHandlerTest {

    private lateinit var handler: PlatformExceptionHandler
    private lateinit var request: HttpServletRequest

    @BeforeEach
    fun setUp() {
        handler = PlatformExceptionHandler()
        request = mock(HttpServletRequest::class.java)
        `when`(request.requestURI).thenReturn("/api/platform/test")
        MDC.put("requestId", "test-trace-id")
    }

    @Test
    fun `PlatformResourceNotFoundException returns 404`() {
        val ex = PlatformResourceNotFoundException(
            PlatformErrorCode.RESOURCE_NOT_FOUND,
            "Test resource not found"
        )

        val response = handler.handleNotFound(ex, request)

        assertEquals(HttpStatus.NOT_FOUND, response.statusCode)
        val body = response.body!!
        assertEquals(404, body.status)
        assertEquals("PLATFORM_001", body.errorCode)
        assertEquals("Test resource not found", body.message)
        assertEquals("المورد غير موجود", body.messageAr)
        assertEquals("test-trace-id", body.traceId)
        assertEquals("/api/platform/test", body.path)
        assertNotNull(body.timestamp)
    }

    @Test
    fun `PlatformDuplicateResourceException returns 409`() {
        val ex = PlatformDuplicateResourceException(
            PlatformErrorCode.DUPLICATE_RESOURCE,
            "Resource already exists"
        )

        val response = handler.handleDuplicate(ex, request)

        assertEquals(HttpStatus.CONFLICT, response.statusCode)
        val body = response.body!!
        assertEquals(409, body.status)
        assertEquals("PLATFORM_002", body.errorCode)
        assertEquals("Resource already exists", body.message)
        assertEquals("المورد موجود بالفعل", body.messageAr)
    }

    @Test
    fun `PlatformInvalidStateException returns 422`() {
        val ex = PlatformInvalidStateException(
            PlatformErrorCode.INVALID_STATE,
            "Invalid state transition"
        )

        val response = handler.handleInvalidState(ex, request)

        assertEquals(HttpStatus.UNPROCESSABLE_ENTITY, response.statusCode)
        val body = response.body!!
        assertEquals(422, body.status)
        assertEquals("PLATFORM_003", body.errorCode)
        assertEquals("Invalid state transition", body.message)
        assertEquals("انتقال حالة غير صالح", body.messageAr)
    }

    @Test
    fun `PlatformAccessDeniedException returns 403`() {
        val ex = PlatformAccessDeniedException(
            PlatformErrorCode.ACCESS_DENIED,
            "Access denied"
        )

        val response = handler.handleAccessDenied(ex, request)

        assertEquals(HttpStatus.FORBIDDEN, response.statusCode)
        val body = response.body!!
        assertEquals(403, body.status)
        assertEquals("PLATFORM_004", body.errorCode)
        assertEquals("Access denied", body.message)
        assertEquals("تم رفض الوصول", body.messageAr)
    }

    @Test
    fun `response includes traceId from MDC`() {
        MDC.put("requestId", "custom-trace-123")
        val ex = PlatformResourceNotFoundException()

        val response = handler.handleNotFound(ex, request)

        assertEquals("custom-trace-123", response.body!!.traceId)
    }

    @Test
    fun `response includes request path`() {
        `when`(request.requestURI).thenReturn("/api/platform/tickets/123")
        val ex = PlatformResourceNotFoundException()

        val response = handler.handleNotFound(ex, request)

        assertEquals("/api/platform/tickets/123", response.body!!.path)
    }

    @Test
    fun `traceId is null when MDC has no requestId`() {
        MDC.clear()
        val ex = PlatformResourceNotFoundException()

        val response = handler.handleNotFound(ex, request)

        assertEquals(null, response.body!!.traceId)
    }

    @Test
    fun `TicketNotFoundException returns correct error code via handler`() {
        val ticketId = UUID.randomUUID()
        val ex = TicketNotFoundException(ticketId)

        val response = handler.handleNotFound(ex, request)

        assertEquals(HttpStatus.NOT_FOUND, response.statusCode)
        val body = response.body!!
        assertEquals("TKT_001", body.errorCode)
        assertEquals("Ticket not found: $ticketId", body.message)
        assertEquals("التذكرة غير موجودة", body.messageAr)
    }

    @Test
    fun `fallback PlatformException handler returns 500`() {
        val ex = object : PlatformException(
            PlatformErrorCode.VALIDATION_FAILED,
            "Unexpected platform error"
        ) {}

        val response = handler.handlePlatformException(ex, request)

        assertEquals(HttpStatus.INTERNAL_SERVER_ERROR, response.statusCode)
        val body = response.body!!
        assertEquals(500, body.status)
        assertEquals("PLATFORM_005", body.errorCode)
    }
}
