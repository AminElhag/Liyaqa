package com.liyaqa.referral.api

import com.liyaqa.membership.domain.ports.MemberRepository
import com.liyaqa.referral.application.services.ReferralCodeService
import com.liyaqa.referral.application.services.ReferralTrackingService
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/public/ref")
@Tag(name = "Referral Public", description = "Public referral endpoints (no auth)")
class ReferralPublicController(
    private val trackingService: ReferralTrackingService,
    private val codeService: ReferralCodeService,
    private val memberRepository: MemberRepository
) {

    @GetMapping("/{code}")
    @Operation(summary = "Track referral click and get referral info")
    fun trackClick(@PathVariable code: String): ResponseEntity<ReferralTrackResponse> {
        val referral = trackingService.trackClick(code)
        return if (referral != null) {
            ResponseEntity.ok(ReferralTrackResponse(
                referralId = referral.id,
                success = true,
                message = "Referral tracked successfully"
            ))
        } else {
            ResponseEntity.ok(ReferralTrackResponse(
                referralId = null,
                success = false,
                message = "Invalid or inactive referral code"
            ))
        }
    }

    @PostMapping("/{code}/validate")
    @Operation(summary = "Validate a referral code for signup")
    fun validateCode(
        @PathVariable code: String
    ): ResponseEntity<ReferralCodeValidationResponse> {
        val isValid = trackingService.validateCode(code)

        if (!isValid) {
            return ResponseEntity.ok(ReferralCodeValidationResponse(
                valid = false,
                code = null,
                referrerName = null
            ))
        }

        val referralCode = codeService.getByCode(code)
        var referrerName: String? = null

        if (referralCode != null) {
            val member = memberRepository.findById(referralCode.memberId).orElse(null)
            referrerName = member?.fullName?.en
        }

        return ResponseEntity.ok(ReferralCodeValidationResponse(
            valid = true,
            code = code,
            referrerName = referrerName
        ))
    }

    @GetMapping("/{code}/info")
    @Operation(summary = "Get referral code information without tracking")
    fun getCodeInfo(@PathVariable code: String): ResponseEntity<ReferralCodeValidationResponse> {
        val referralCode = codeService.getByCode(code)

        if (referralCode == null || !referralCode.isActive) {
            return ResponseEntity.ok(ReferralCodeValidationResponse(
                valid = false,
                code = null,
                referrerName = null
            ))
        }

        val member = memberRepository.findById(referralCode.memberId).orElse(null)
        val referrerName = member?.fullName?.en

        return ResponseEntity.ok(ReferralCodeValidationResponse(
            valid = true,
            code = code,
            referrerName = referrerName
        ))
    }
}
