package com.liyaqa.trainer.api

import com.liyaqa.shared.domain.Money
import com.liyaqa.trainer.application.services.TrainerEarningsService
import com.liyaqa.trainer.application.services.TrainerSecurityService
import com.liyaqa.trainer.domain.model.EarningStatus
import com.liyaqa.trainer.domain.model.EarningType
import com.liyaqa.trainer.infrastructure.persistence.JpaTrainerEarningsRepository
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import jakarta.validation.Valid
import org.slf4j.LoggerFactory
import org.springframework.data.domain.PageRequest
import org.springframework.data.domain.Sort
import org.springframework.format.annotation.DateTimeFormat
import org.springframework.http.ResponseEntity
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.web.bind.annotation.*
import java.math.BigDecimal
import java.time.LocalDate
import java.util.UUID

/**
 * REST controller for trainer earnings management.
 *
 * Endpoints:
 * - List earnings with filtering
 * - Get earning details
 * - Get earnings summary
 * - Update earning status (admin only)
 */
@RestController
@RequestMapping("/api/trainer-portal/earnings")
@Tag(name = "Trainer Portal - Earnings", description = "Trainer earnings management")
class TrainerEarningsController(
    private val trainerEarningsService: TrainerEarningsService,
    private val trainerEarningsRepository: JpaTrainerEarningsRepository,
    private val trainerSecurityService: TrainerSecurityService
) {
    private val logger = LoggerFactory.getLogger(TrainerEarningsController::class.java)

    @GetMapping
    @PreAuthorize("hasAuthority('trainer_portal_view') or @trainerSecurityService.isTrainer()")
    @Operation(summary = "List trainer earnings", description = "Get paginated list of trainer's earnings with optional filtering")
    fun getEarnings(
        @RequestParam(required = false) trainerId: UUID? = null,
        @RequestParam(required = false) status: EarningStatus?,
        @RequestParam(required = false) earningType: EarningType?,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) startDate: LocalDate?,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) endDate: LocalDate?,
        @RequestParam(defaultValue = "0") page: Int,
        @RequestParam(defaultValue = "20") size: Int,
        @RequestParam(defaultValue = "earningDate") sortBy: String,
        @RequestParam(defaultValue = "DESC") sortDirection: String
    ): ResponseEntity<PageResponse<TrainerEarningsResponse>> {
        val resolvedTrainerId = trainerId ?: trainerSecurityService.getCurrentTrainerId()
            ?: throw NoSuchElementException("No trainer profile found for current user")
        logger.debug("Fetching earnings for trainer $resolvedTrainerId (status: $status, type: $earningType, dates: $startDate to $endDate)")

        val direction = Sort.Direction.valueOf(sortDirection.uppercase())
        val pageable = PageRequest.of(page, size, Sort.by(direction, sortBy))

        val earningsPage = when {
            startDate != null && endDate != null -> {
                trainerEarningsService.getEarningsByDateRange(resolvedTrainerId, startDate, endDate, pageable)
            }
            status != null -> {
                trainerEarningsService.getEarningsByStatus(resolvedTrainerId, status, pageable)
            }
            else -> {
                trainerEarningsService.getEarningsForTrainer(resolvedTrainerId, pageable)
            }
        }

        val response = PageResponse(
            content = earningsPage.content.map { TrainerEarningsResponse.from(it) },
            page = earningsPage.number,
            size = earningsPage.size,
            totalElements = earningsPage.totalElements,
            totalPages = earningsPage.totalPages,
            first = earningsPage.isFirst,
            last = earningsPage.isLast
        )

        return ResponseEntity.ok(response)
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('trainer_portal_view')")
    @Operation(summary = "Get earning details", description = "Get detailed information about a specific earning")
    fun getEarning(@PathVariable id: UUID): ResponseEntity<TrainerEarningsResponse> {
        logger.debug("Fetching earning $id")

        val earning = trainerEarningsService.getEarning(id)
        return ResponseEntity.ok(TrainerEarningsResponse.from(earning))
    }

    @GetMapping("/summary")
    @PreAuthorize("hasAuthority('trainer_portal_view') or @trainerSecurityService.isTrainer()")
    @Operation(summary = "Get earnings summary", description = "Get summary statistics of trainer's earnings")
    fun getEarningsSummary(
        @RequestParam(required = false) trainerId: UUID? = null,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) startDate: LocalDate?,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) endDate: LocalDate?
    ): ResponseEntity<EarningsSummaryResponse> {
        val resolvedTrainerId = trainerId ?: trainerSecurityService.getCurrentTrainerId()
            ?: throw NoSuchElementException("No trainer profile found for current user")
        logger.debug("Fetching earnings summary for trainer $resolvedTrainerId")

        val start = startDate ?: LocalDate.now().minusMonths(12)
        val end = endDate ?: LocalDate.now()

        val allEarnings = trainerEarningsService.getEarningsByDateRange(resolvedTrainerId, start, end, PageRequest.of(0, 10000)).content

        // Calculate current month
        val currentMonthStart = LocalDate.now().withDayOfMonth(1)
        val currentMonthEarnings = allEarnings.filter { it.earningDate >= currentMonthStart }

        // Calculate last month
        val lastMonthStart = LocalDate.now().minusMonths(1).withDayOfMonth(1)
        val lastMonthEnd = currentMonthStart.minusDays(1)
        val lastMonthEarnings = allEarnings.filter { it.earningDate >= lastMonthStart && it.earningDate <= lastMonthEnd }

        // Group by status
        val pending = allEarnings.filter { it.status == EarningStatus.PENDING }
        val approved = allEarnings.filter { it.status == EarningStatus.APPROVED }
        val paid = allEarnings.filter { it.status == EarningStatus.PAID }

        // Group by type
        val byType = allEarnings.groupBy { it.earningType }
            .mapValues { (_, earnings) ->
                val total = earnings.sumOf { it.netAmount.amount }
                Money(total, earnings.firstOrNull()?.netAmount?.currency ?: "SAR")
            }

        val currency = allEarnings.firstOrNull()?.netAmount?.currency ?: "SAR"

        val summary = EarningsSummaryResponse(
            totalEarnings = Money(allEarnings.sumOf { it.netAmount.amount }, currency),
            pendingEarnings = Money(pending.sumOf { it.netAmount.amount }, currency),
            approvedEarnings = Money(approved.sumOf { it.netAmount.amount }, currency),
            paidEarnings = Money(paid.sumOf { it.netAmount.amount }, currency),
            currentMonthEarnings = Money(currentMonthEarnings.sumOf { it.netAmount.amount }, currency),
            lastMonthEarnings = Money(lastMonthEarnings.sumOf { it.netAmount.amount }, currency),
            earningsByType = byType,
            recentEarnings = allEarnings.sortedByDescending { it.earningDate }
                .take(5)
                .map { TrainerEarningsResponse.from(it) }
        )

        return ResponseEntity.ok(summary)
    }

    @PutMapping("/{id}/status")
    @PreAuthorize("hasAuthority('trainer_earnings_manage')")
    @Operation(summary = "Update earning status (admin only)", description = "Update the payment status of an earning")
    fun updateEarningStatus(
        @PathVariable id: UUID,
        @Valid @RequestBody request: UpdateEarningStatusRequest
    ): ResponseEntity<TrainerEarningsResponse> {
        logger.debug("Updating earning $id status to ${request.status}")

        val earning = trainerEarningsService.getEarning(id)

        // Update status
        when (request.status) {
            EarningStatus.APPROVED -> earning.approve()
            EarningStatus.PAID -> {
                earning.approve()
                earning.markAsPaid(request.paymentDate ?: LocalDate.now(), request.notes ?: "")
            }
            EarningStatus.DISPUTED -> {
                // Set status directly as there's no markAsDisputed method
                earning.status = EarningStatus.DISPUTED
            }
            else -> throw IllegalArgumentException("Cannot transition to status: ${request.status}")
        }

        val updated = trainerEarningsRepository.save(earning)

        logger.info("Updated earning $id status to ${request.status}")
        return ResponseEntity.ok(TrainerEarningsResponse.from(updated))
    }
}
