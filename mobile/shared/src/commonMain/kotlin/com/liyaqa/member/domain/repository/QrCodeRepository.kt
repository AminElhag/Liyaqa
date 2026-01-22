package com.liyaqa.member.domain.repository

import com.liyaqa.member.domain.model.QrCode

/**
 * Repository for QR code operations.
 * Handles generation of member check-in QR codes.
 */
interface QrCodeRepository {

    /**
     * Generates a new QR code for member check-in.
     *
     * @param size The size of the QR code image in pixels. Default is 300.
     * @return Result containing the QR code data and expiry information.
     */
    suspend fun getQrCode(size: Int = 300): Result<QrCode>
}
