package com.liyaqa.member.data.dto

import kotlinx.serialization.Serializable

/**
 * QR Code DTOs matching backend QrCheckInController responses.
 */

/**
 * QR code response from /api/qr/me.
 * Matches backend QrCodeResponse.
 *
 * Note: Backend uses 'qrCode' field (not 'qrCodeData').
 * The qrCode is a data URL: "data:image/png;base64,..."
 */
@Serializable
data class QrCodeResponseDto(
    val qrCode: String, // data:image/png;base64,... format
    val token: String,
    val memberId: String? = null,
    val sessionId: String? = null,
    val expiresAt: String, // ISO-8601 Instant
    val type: String // "member_check_in" or "session_check_in"
)
