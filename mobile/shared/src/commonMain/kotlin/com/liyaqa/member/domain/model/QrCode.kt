package com.liyaqa.member.domain.model

import kotlinx.datetime.Clock
import kotlinx.datetime.Instant

/**
 * QR code domain model for member check-in.
 * Aligned with backend QrCodeResponseDto.
 */
data class QrCode(
    val qrCodeData: String,
    val token: String,
    val memberId: String,
    val expiresAt: Instant,
    val type: String
) {
    /**
     * Returns true if this QR code has expired.
     */
    val isExpired: Boolean
        get() = Clock.System.now() >= expiresAt

    /**
     * Returns the remaining time until expiry in seconds.
     * Returns 0 if already expired.
     */
    val remainingSeconds: Long
        get() {
            val now = Clock.System.now()
            val remaining = (expiresAt - now).inWholeSeconds
            return if (remaining > 0) remaining else 0
        }

    /**
     * Returns true if the QR code is expiring soon (within 5 minutes).
     */
    val isExpiringSoon: Boolean
        get() = remainingSeconds in 1..300
}
