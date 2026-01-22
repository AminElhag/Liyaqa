package com.liyaqa.member.data.mapper

import com.liyaqa.member.data.dto.QrCodeResponseDto
import com.liyaqa.member.domain.model.QrCode

/**
 * Mappers for QR code related DTOs to domain models.
 */

/**
 * Maps QR code response DTO to domain QrCode.
 *
 * Note: Backend 'qrCode' field maps to domain 'qrCodeData'.
 */
fun QrCodeResponseDto.toDomain(): QrCode = QrCode(
    qrCodeData = qrCode, // Backend uses 'qrCode', domain uses 'qrCodeData'
    token = token,
    memberId = memberId ?: "",
    expiresAt = expiresAt.toInstant(),
    type = type
)
