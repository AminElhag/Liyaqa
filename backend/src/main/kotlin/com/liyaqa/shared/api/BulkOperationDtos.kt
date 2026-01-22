package com.liyaqa.shared.api

import java.time.Instant
import java.util.UUID

/**
 * Common DTOs for bulk operations across the system.
 * Provides consistent request/response patterns for all bulk endpoints.
 */

// ==================== COMMON RESPONSE PATTERNS ====================

/**
 * Status of an individual item in a bulk operation.
 */
enum class BulkItemStatus {
    SUCCESS,    // Operation completed successfully
    FAILED,     // Operation failed with error
    SKIPPED     // Item was skipped (e.g., already in target state)
}

/**
 * Result for a single item in a bulk operation.
 */
data class BulkItemResult(
    val itemId: UUID,
    val status: BulkItemStatus,
    val message: String? = null,
    val messageAr: String? = null
)

/**
 * Summary statistics for a bulk operation.
 */
data class BulkOperationSummary(
    val totalRequested: Int,
    val successCount: Int,
    val failedCount: Int,
    val skippedCount: Int,
    val processingTimeMs: Long
)

/**
 * Standard response for bulk operations.
 */
data class BulkOperationResponse(
    val summary: BulkOperationSummary,
    val results: List<BulkItemResult>,
    val timestamp: Instant = Instant.now()
) {
    companion object {
        fun from(
            results: List<BulkItemResult>,
            startTime: Long
        ): BulkOperationResponse {
            val successCount = results.count { it.status == BulkItemStatus.SUCCESS }
            val failedCount = results.count { it.status == BulkItemStatus.FAILED }
            val skippedCount = results.count { it.status == BulkItemStatus.SKIPPED }

            return BulkOperationResponse(
                summary = BulkOperationSummary(
                    totalRequested = results.size,
                    successCount = successCount,
                    failedCount = failedCount,
                    skippedCount = skippedCount,
                    processingTimeMs = System.currentTimeMillis() - startTime
                ),
                results = results
            )
        }
    }
}

// ==================== VALIDATION ====================

/**
 * Maximum items allowed in a single bulk operation.
 */
const val MAX_BULK_ITEMS = 1000

/**
 * Validates bulk operation request size.
 */
fun validateBulkSize(ids: List<UUID>, maxItems: Int = MAX_BULK_ITEMS) {
    require(ids.isNotEmpty()) { "At least one item ID is required" }
    require(ids.size <= maxItems) { "Maximum $maxItems items allowed per request, got ${ids.size}" }
    require(ids.distinct().size == ids.size) { "Duplicate IDs are not allowed" }
}
