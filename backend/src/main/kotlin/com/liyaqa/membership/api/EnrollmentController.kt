package com.liyaqa.membership.api

import com.liyaqa.membership.api.dto.EnrollmentPreviewRequest
import com.liyaqa.membership.api.dto.EnrollmentPreviewResponse
import com.liyaqa.membership.api.dto.EnrollmentRequest
import com.liyaqa.membership.api.dto.EnrollmentResponse
import com.liyaqa.membership.application.services.EnrollmentService
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import jakarta.validation.Valid
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/enrollment")
@Tag(name = "Enrollment", description = "Atomic member enrollment — creates member + contract + subscription + invoice in one step")
class EnrollmentController(
    private val enrollmentService: EnrollmentService
) {

    @PostMapping("/preview")
    @PreAuthorize("hasAuthority('subscriptions_view')")
    @Operation(summary = "Preview enrollment fees", description = "Returns fee breakdown without creating anything")
    fun preview(
        @Valid @RequestBody request: EnrollmentPreviewRequest
    ): ResponseEntity<EnrollmentPreviewResponse> {
        val response = enrollmentService.preview(request)
        return ResponseEntity.ok(response)
    }

    @PostMapping
    @PreAuthorize("hasAuthority('subscriptions_create') and hasAuthority('members_create')")
    @Operation(summary = "Enroll a member", description = "Atomically creates member (or links existing) + contract + subscription + invoice + payment")
    fun enroll(
        @Valid @RequestBody request: EnrollmentRequest
    ): ResponseEntity<EnrollmentResponse> {
        val response = enrollmentService.enroll(request)
        return ResponseEntity.status(HttpStatus.CREATED).body(response)
    }
}
