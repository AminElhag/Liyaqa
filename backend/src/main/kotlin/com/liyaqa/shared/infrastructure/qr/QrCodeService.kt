package com.liyaqa.shared.infrastructure.qr

import com.google.zxing.BarcodeFormat
import com.google.zxing.EncodeHintType
import com.google.zxing.client.j2se.MatrixToImageWriter
import com.google.zxing.qrcode.QRCodeWriter
import com.google.zxing.qrcode.decoder.ErrorCorrectionLevel
import io.jsonwebtoken.Jwts
import io.jsonwebtoken.security.Keys
import org.springframework.beans.factory.annotation.Value
import org.springframework.stereotype.Service
import java.io.ByteArrayOutputStream
import java.time.Instant
import java.time.temporal.ChronoUnit
import java.util.Base64
import java.util.Date
import java.util.UUID
import javax.crypto.SecretKey

/**
 * Service for generating and validating QR codes for member check-in.
 */
@Service
class QrCodeService(
    @Value("\${liyaqa.jwt.secret:default-secret-key-for-development-only-32-chars}")
    private val jwtSecret: String
) {
    private val signingKey: SecretKey by lazy {
        Keys.hmacShaKeyFor(jwtSecret.toByteArray())
    }

    /**
     * Generates a QR code token for a member.
     * The token is signed and contains member ID and expiration.
     *
     * @param memberId The member's UUID
     * @param expirationMinutes How long the QR code is valid (default: 24 hours)
     * @return QR token string
     */
    fun generateMemberQrToken(memberId: UUID, expirationMinutes: Long = 1440): String {
        val now = Instant.now()
        val expiration = now.plus(expirationMinutes, ChronoUnit.MINUTES)

        return Jwts.builder()
            .subject(memberId.toString())
            .claim("type", "check_in")
            .issuedAt(Date.from(now))
            .expiration(Date.from(expiration))
            .signWith(signingKey)
            .compact()
    }

    /**
     * Generates a QR code token for a specific session check-in.
     *
     * @param sessionId The session UUID
     * @param expirationMinutes How long the QR code is valid (default: 4 hours)
     * @return QR token string
     */
    fun generateSessionQrToken(sessionId: UUID, expirationMinutes: Long = 240): String {
        val now = Instant.now()
        val expiration = now.plus(expirationMinutes, ChronoUnit.MINUTES)

        return Jwts.builder()
            .subject(sessionId.toString())
            .claim("type", "session_check_in")
            .issuedAt(Date.from(now))
            .expiration(Date.from(expiration))
            .signWith(signingKey)
            .compact()
    }

    /**
     * Validates a QR token and returns the member/session ID if valid.
     *
     * @param token The QR token to validate
     * @return Pair of (ID, type) or null if invalid/expired
     */
    fun validateQrToken(token: String): QrTokenPayload? {
        return try {
            val claims = Jwts.parser()
                .verifyWith(signingKey)
                .build()
                .parseSignedClaims(token)
                .payload

            QrTokenPayload(
                id = UUID.fromString(claims.subject),
                type = claims["type"] as? String ?: "unknown",
                expiresAt = claims.expiration.toInstant()
            )
        } catch (e: Exception) {
            null
        }
    }

    /**
     * Generates a QR code image as PNG bytes.
     *
     * @param content The content to encode in the QR code
     * @param width QR code width in pixels
     * @param height QR code height in pixels
     * @return PNG image bytes
     */
    fun generateQrCodeImage(content: String, width: Int = 300, height: Int = 300): ByteArray {
        val hints = mapOf(
            EncodeHintType.CHARACTER_SET to "UTF-8",
            EncodeHintType.ERROR_CORRECTION to ErrorCorrectionLevel.M,
            EncodeHintType.MARGIN to 2
        )

        val writer = QRCodeWriter()
        val bitMatrix = writer.encode(content, BarcodeFormat.QR_CODE, width, height, hints)

        val outputStream = ByteArrayOutputStream()
        MatrixToImageWriter.writeToStream(bitMatrix, "PNG", outputStream)

        return outputStream.toByteArray()
    }

    /**
     * Generates a QR code as a base64 data URL for embedding in HTML/JSON.
     *
     * @param content The content to encode
     * @param width QR code width
     * @param height QR code height
     * @return Data URL string (data:image/png;base64,...)
     */
    fun generateQrCodeDataUrl(content: String, width: Int = 300, height: Int = 300): String {
        val imageBytes = generateQrCodeImage(content, width, height)
        val base64 = Base64.getEncoder().encodeToString(imageBytes)
        return "data:image/png;base64,$base64"
    }
}

/**
 * Payload extracted from a validated QR token.
 */
data class QrTokenPayload(
    val id: UUID,
    val type: String,
    val expiresAt: Instant
)
