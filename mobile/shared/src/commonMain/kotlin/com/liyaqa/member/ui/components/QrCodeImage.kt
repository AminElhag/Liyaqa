package com.liyaqa.member.ui.components

import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp

/**
 * Platform-specific QR code image display.
 *
 * Renders a QR code from base64-encoded data or data URL.
 * Each platform implements this using native QR rendering capabilities:
 *
 * **Android Implementation:**
 * - Uses Android's Base64 decoder for efficient decoding
 * - Converts to Bitmap via BitmapFactory
 * - Displays with Compose Image composable
 * - Shows loading indicator during decode, error state on failure
 *
 * **iOS Implementation:**
 * - Uses native NSData and UIImage for decoding
 * - Converts UIImage to Skia ImageBitmap for Compose rendering
 * - Custom base64 decoder for cross-platform compatibility
 * - Shows loading indicator during decode, error state on failure
 *
 * **Supported Data Formats:**
 * - Raw base64 string: `iVBORw0KGgoAAAANSUhEUg...`
 * - Data URL: `data:image/png;base64,iVBORw0KGgoAAAANSUhEUg...`
 *
 * @param data The QR code data (base64 encoded image or data URL)
 * @param modifier Modifier for the composable
 * @param size The size of the QR code image (default 250.dp)
 * @param contentDescription Accessibility description for the QR code
 * @param showLoadingIndicator Whether to show a loading indicator while decoding
 * @param onError Callback when decoding fails (optional)
 */
@Composable
expect fun QrCodeImage(
    data: String,
    modifier: Modifier = Modifier,
    size: Dp = 250.dp,
    contentDescription: String? = null,
    showLoadingIndicator: Boolean = true,
    onError: ((Exception) -> Unit)? = null
)

/**
 * Utility functions for QR code data handling.
 */
object QrCodeUtils {
    /**
     * Extracts base64 data from a data URL or returns the raw string.
     *
     * @param data The input data (may be data URL or raw base64)
     * @return The base64 string without data URL prefix
     */
    fun extractBase64Data(data: String): String {
        return if (data.startsWith("data:")) {
            data.substringAfter("base64,")
        } else {
            data
        }
    }

    /**
     * Checks if the data appears to be a valid base64 string.
     *
     * @param data The data to check
     * @return true if it appears to be valid base64
     */
    fun isValidBase64(data: String): Boolean {
        val base64Data = extractBase64Data(data)
        val base64Regex = Regex("^[A-Za-z0-9+/]*={0,2}$")
        return base64Data.isNotEmpty() && base64Regex.matches(base64Data)
    }
}
