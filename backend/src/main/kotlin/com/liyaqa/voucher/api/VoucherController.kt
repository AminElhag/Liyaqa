package com.liyaqa.voucher.api

import com.liyaqa.voucher.application.commands.RedeemGiftCardCommand
import com.liyaqa.voucher.application.commands.RedeemVoucherCommand
import com.liyaqa.voucher.application.commands.ValidateVoucherCommand
import com.liyaqa.voucher.application.services.VoucherRedemptionService
import com.liyaqa.voucher.application.services.VoucherService
import com.liyaqa.voucher.application.services.VoucherValidationService
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import jakarta.validation.Valid
import org.springframework.data.domain.Page
import org.springframework.data.domain.PageRequest
import org.springframework.data.domain.Sort
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.PutMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController
import java.util.UUID

@RestController
@RequestMapping("/api/vouchers")
@Tag(name = "Vouchers", description = "Voucher and promo code management")
class VoucherController(
    private val voucherService: VoucherService,
    private val validationService: VoucherValidationService,
    private val redemptionService: VoucherRedemptionService
) {

    // ============ CRUD Endpoints ============

    @PostMapping
    @PreAuthorize("hasAuthority('vouchers_create')")
    @Operation(summary = "Create a new voucher")
    fun createVoucher(
        @Valid @RequestBody request: CreateVoucherRequest
    ): ResponseEntity<VoucherResponse> {
        val voucher = voucherService.createVoucher(request.toCommand())
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(VoucherResponse.from(voucher))
    }

    @GetMapping
    @PreAuthorize("hasAuthority('vouchers_view')")
    @Operation(summary = "List all vouchers")
    fun listVouchers(
        @RequestParam(defaultValue = "0") page: Int,
        @RequestParam(defaultValue = "20") size: Int,
        @RequestParam(defaultValue = "createdAt") sortBy: String,
        @RequestParam(defaultValue = "desc") sortDir: String,
        @RequestParam(required = false) active: Boolean?
    ): ResponseEntity<Page<VoucherResponse>> {
        val sort = if (sortDir.equals("asc", ignoreCase = true)) {
            Sort.by(sortBy).ascending()
        } else {
            Sort.by(sortBy).descending()
        }
        val pageable = PageRequest.of(page, size, sort)

        val vouchers = if (active != null) {
            voucherService.listActiveVouchers(pageable)
        } else {
            voucherService.listVouchers(pageable)
        }

        return ResponseEntity.ok(vouchers.map { VoucherResponse.from(it) })
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('vouchers_view')")
    @Operation(summary = "Get voucher by ID")
    fun getVoucher(@PathVariable id: UUID): ResponseEntity<VoucherResponse> {
        val voucher = voucherService.getVoucher(id)
        return ResponseEntity.ok(VoucherResponse.from(voucher))
    }

    @GetMapping("/code/{code}")
    @PreAuthorize("hasAuthority('vouchers_view')")
    @Operation(summary = "Get voucher by code")
    fun getVoucherByCode(@PathVariable code: String): ResponseEntity<VoucherResponse> {
        val voucher = voucherService.getVoucherByCode(code)
            ?: throw NoSuchElementException("Voucher not found: $code")
        return ResponseEntity.ok(VoucherResponse.from(voucher))
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('vouchers_edit')")
    @Operation(summary = "Update voucher")
    fun updateVoucher(
        @PathVariable id: UUID,
        @Valid @RequestBody request: UpdateVoucherRequest
    ): ResponseEntity<VoucherResponse> {
        val voucher = voucherService.updateVoucher(request.toCommand(id))
        return ResponseEntity.ok(VoucherResponse.from(voucher))
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('vouchers_delete')")
    @Operation(summary = "Delete voucher")
    fun deleteVoucher(@PathVariable id: UUID): ResponseEntity<Void> {
        voucherService.deleteVoucher(id)
        return ResponseEntity.noContent().build()
    }

    @PostMapping("/{id}/activate")
    @PreAuthorize("hasAuthority('vouchers_edit')")
    @Operation(summary = "Activate voucher")
    fun activateVoucher(@PathVariable id: UUID): ResponseEntity<VoucherResponse> {
        val voucher = voucherService.activateVoucher(id)
        return ResponseEntity.ok(VoucherResponse.from(voucher))
    }

    @PostMapping("/{id}/deactivate")
    @PreAuthorize("hasAuthority('vouchers_edit')")
    @Operation(summary = "Deactivate voucher")
    fun deactivateVoucher(@PathVariable id: UUID): ResponseEntity<VoucherResponse> {
        val voucher = voucherService.deactivateVoucher(id)
        return ResponseEntity.ok(VoucherResponse.from(voucher))
    }

    // ============ Usage Endpoints ============

    @GetMapping("/{id}/usage")
    @PreAuthorize("hasAuthority('vouchers_view')")
    @Operation(summary = "Get voucher usage history")
    fun getVoucherUsage(
        @PathVariable id: UUID,
        @RequestParam(defaultValue = "0") page: Int,
        @RequestParam(defaultValue = "20") size: Int
    ): ResponseEntity<Page<VoucherUsageResponse>> {
        val pageable = PageRequest.of(page, size, Sort.by("usedAt").descending())
        val usage = redemptionService.getVoucherUsage(id, pageable)
        return ResponseEntity.ok(usage.map { VoucherUsageResponse.from(it) })
    }

    // ============ Validation & Redemption Endpoints ============

    @PostMapping("/validate")
    @PreAuthorize("hasAuthority('vouchers_view')")
    @Operation(summary = "Validate a voucher code")
    fun validateVoucher(
        @Valid @RequestBody request: ValidateVoucherRequest
    ): ResponseEntity<VoucherValidationResponse> {
        val result = validationService.validate(
            ValidateVoucherCommand(
                code = request.code,
                memberId = request.memberId,
                purchaseAmount = request.purchaseAmount,
                planId = request.planId,
                productIds = request.productIds,
                isFirstTimeMember = request.isFirstTimeMember
            )
        )
        return ResponseEntity.ok(VoucherValidationResponse.from(result))
    }

    @PostMapping("/redeem")
    @PreAuthorize("hasAuthority('vouchers_edit')")
    @Operation(summary = "Redeem a voucher")
    fun redeemVoucher(
        @Valid @RequestBody request: RedeemVoucherRequest
    ): ResponseEntity<VoucherRedemptionResponse> {
        val result = redemptionService.redeemVoucher(
            RedeemVoucherCommand(
                code = request.code,
                memberId = request.memberId,
                purchaseAmount = request.purchaseAmount,
                usedForType = request.usedForType,
                usedForId = request.usedForId,
                invoiceId = request.invoiceId
            )
        )
        return ResponseEntity.ok(VoucherRedemptionResponse.from(result))
    }

    @PostMapping("/redeem/gift-card")
    @PreAuthorize("hasAuthority('vouchers_edit')")
    @Operation(summary = "Redeem a gift card to wallet")
    fun redeemGiftCard(
        @Valid @RequestBody request: RedeemGiftCardRequest
    ): ResponseEntity<VoucherRedemptionResponse> {
        val result = redemptionService.redeemGiftCard(
            RedeemGiftCardCommand(
                code = request.code,
                memberId = request.memberId,
                amount = request.amount
            )
        )
        return ResponseEntity.ok(VoucherRedemptionResponse.from(result))
    }

    // ============ Public Endpoints ============

    @GetMapping("/check/{code}")
    @Operation(summary = "Check if a voucher code is valid (public)")
    fun checkVoucherCode(@PathVariable code: String): ResponseEntity<Map<String, Any>> {
        val isValid = validationService.isValidCode(code)
        val voucher = if (isValid) voucherService.getVoucherByCode(code) else null

        return ResponseEntity.ok(mapOf(
            "valid" to isValid,
            "code" to code,
            "discountType" to (voucher?.discountType?.name ?: ""),
            "discountAmount" to (voucher?.discountAmount ?: 0),
            "discountPercent" to (voucher?.discountPercent ?: 0)
        ))
    }
}
