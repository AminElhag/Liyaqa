package com.liyaqa.billing.infrastructure.zatca

import com.google.zxing.BarcodeFormat
import com.google.zxing.EncodeHintType
import com.google.zxing.qrcode.QRCodeWriter
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Component
import java.io.ByteArrayOutputStream
import java.math.BigDecimal
import java.time.ZonedDateTime
import java.time.format.DateTimeFormatter
import java.util.Base64

/**
 * Generates Zatca-compliant QR codes for Saudi Arabian e-invoicing.
 *
 * ZATCA Phase 1 requires invoices to contain a QR code with seller information
 * encoded in TLV (Tag-Length-Value) format:
 * - Tag 1: Seller name
 * - Tag 2: VAT registration number
 * - Tag 3: Invoice timestamp (ISO 8601)
 * - Tag 4: Invoice total with VAT
 * - Tag 5: VAT amount
 */
@Component
class ZatcaQrCodeGenerator {
    private val logger = LoggerFactory.getLogger(ZatcaQrCodeGenerator::class.java)

    companion object {
        // Zatca TLV tags
        const val TAG_SELLER_NAME = 1
        const val TAG_VAT_NUMBER = 2
        const val TAG_TIMESTAMP = 3
        const val TAG_TOTAL_WITH_VAT = 4
        const val TAG_VAT_AMOUNT = 5

        // QR code settings
        const val QR_CODE_SIZE = 200
        private val ISO_8601_FORMATTER = DateTimeFormatter.ISO_OFFSET_DATE_TIME
    }

    /**
     * Generates TLV (Tag-Length-Value) encoded data for Zatca QR code.
     *
     * TLV format: [Tag (1 byte)][Length (1 byte)][Value (n bytes)]
     *
     * @param sellerName Business name
     * @param vatNumber VAT registration number
     * @param timestamp Invoice timestamp
     * @param totalWithVat Total amount including VAT
     * @param vatAmount VAT amount
     * @return ByteArray containing TLV encoded data
     */
    fun generateTlvData(
        sellerName: String,
        vatNumber: String,
        timestamp: ZonedDateTime,
        totalWithVat: BigDecimal,
        vatAmount: BigDecimal
    ): ByteArray {
        val outputStream = ByteArrayOutputStream()

        // Tag 1: Seller name
        writeTlv(outputStream, TAG_SELLER_NAME, sellerName.toByteArray(Charsets.UTF_8))

        // Tag 2: VAT registration number
        writeTlv(outputStream, TAG_VAT_NUMBER, vatNumber.toByteArray(Charsets.UTF_8))

        // Tag 3: Invoice timestamp in ISO 8601 format
        val formattedTimestamp = timestamp.format(ISO_8601_FORMATTER)
        writeTlv(outputStream, TAG_TIMESTAMP, formattedTimestamp.toByteArray(Charsets.UTF_8))

        // Tag 4: Invoice total with VAT (decimal string)
        val totalString = totalWithVat.setScale(2).toPlainString()
        writeTlv(outputStream, TAG_TOTAL_WITH_VAT, totalString.toByteArray(Charsets.UTF_8))

        // Tag 5: VAT amount (decimal string)
        val vatString = vatAmount.setScale(2).toPlainString()
        writeTlv(outputStream, TAG_VAT_AMOUNT, vatString.toByteArray(Charsets.UTF_8))

        return outputStream.toByteArray()
    }

    /**
     * Writes a single TLV record to the output stream.
     */
    private fun writeTlv(outputStream: ByteArrayOutputStream, tag: Int, value: ByteArray) {
        outputStream.write(tag)
        outputStream.write(value.size)
        outputStream.write(value)
    }

    /**
     * Generates a Base64-encoded QR code image from TLV data.
     *
     * @param tlvData TLV encoded data
     * @return Base64-encoded PNG image of the QR code
     */
    fun generateBase64QrCode(tlvData: ByteArray): String {
        // First encode TLV data as Base64 (this is what goes in the QR code)
        val base64TlvData = Base64.getEncoder().encodeToString(tlvData)

        // Generate QR code containing the Base64 TLV data
        val qrCodeWriter = QRCodeWriter()
        val hints = mapOf(
            EncodeHintType.CHARACTER_SET to "UTF-8",
            EncodeHintType.MARGIN to 1
        )

        val bitMatrix = qrCodeWriter.encode(
            base64TlvData,
            BarcodeFormat.QR_CODE,
            QR_CODE_SIZE,
            QR_CODE_SIZE,
            hints
        )

        // Convert BitMatrix to PNG bytes
        val pngBytes = matrixToPng(bitMatrix)

        // Return as Base64
        return Base64.getEncoder().encodeToString(pngBytes)
    }

    /**
     * Converts a BitMatrix to PNG bytes without using BufferedImage.
     * Uses a simple PNG encoder.
     */
    private fun matrixToPng(bitMatrix: com.google.zxing.common.BitMatrix): ByteArray {
        val width = bitMatrix.width
        val height = bitMatrix.height

        // Create pixel data (RGBA)
        val pixels = ByteArray(width * height * 4)
        for (y in 0 until height) {
            for (x in 0 until width) {
                val offset = (y * width + x) * 4
                val isBlack = bitMatrix.get(x, y)
                val color = if (isBlack) 0x00.toByte() else 0xFF.toByte()
                pixels[offset] = color     // R
                pixels[offset + 1] = color // G
                pixels[offset + 2] = color // B
                pixels[offset + 3] = 0xFF.toByte() // A (fully opaque)
            }
        }

        // Use ZXing's built-in matrix to image conversion
        val outputStream = ByteArrayOutputStream()
        val image = com.google.zxing.client.j2se.MatrixToImageWriter.toBufferedImage(bitMatrix)
        javax.imageio.ImageIO.write(image, "PNG", outputStream)
        return outputStream.toByteArray()
    }

    /**
     * Generates a complete Zatca-compliant QR code as Base64 PNG.
     *
     * @param sellerName Business name
     * @param vatNumber VAT registration number
     * @param timestamp Invoice timestamp
     * @param totalWithVat Total amount including VAT
     * @param vatAmount VAT amount
     * @return Base64-encoded PNG image of the QR code
     */
    fun generateZatcaQrCode(
        sellerName: String,
        vatNumber: String,
        timestamp: ZonedDateTime,
        totalWithVat: BigDecimal,
        vatAmount: BigDecimal
    ): String {
        val tlvData = generateTlvData(sellerName, vatNumber, timestamp, totalWithVat, vatAmount)
        return generateBase64QrCode(tlvData)
    }

    /**
     * Decodes Base64 TLV data back to readable format (for verification/testing).
     */
    fun decodeTlvData(base64Data: String): Map<Int, String> {
        val tlvData = Base64.getDecoder().decode(base64Data)
        val result = mutableMapOf<Int, String>()

        var i = 0
        while (i < tlvData.size) {
            val tag = tlvData[i].toInt() and 0xFF
            val length = tlvData[i + 1].toInt() and 0xFF
            val value = String(tlvData.copyOfRange(i + 2, i + 2 + length), Charsets.UTF_8)
            result[tag] = value
            i += 2 + length
        }

        return result
    }
}
