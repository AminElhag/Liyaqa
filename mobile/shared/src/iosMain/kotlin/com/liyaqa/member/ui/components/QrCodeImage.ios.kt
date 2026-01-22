package com.liyaqa.member.ui.components

import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.BrokenImage
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.ImageBitmap
import androidx.compose.ui.graphics.toComposeImageBitmap
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import kotlinx.cinterop.BetaInteropApi
import kotlinx.cinterop.ExperimentalForeignApi
import kotlinx.cinterop.addressOf
import kotlinx.cinterop.get
import kotlinx.cinterop.usePinned
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.IO
import kotlinx.coroutines.withContext
import org.jetbrains.skia.ColorAlphaType
import org.jetbrains.skia.ColorType
import org.jetbrains.skia.ImageInfo
import platform.CoreFoundation.CFDataGetBytePtr
import platform.CoreFoundation.CFDataGetLength
import platform.CoreGraphics.CGDataProviderCopyData
import platform.CoreGraphics.CGImageGetDataProvider
import platform.CoreGraphics.CGImageGetHeight
import platform.CoreGraphics.CGImageGetWidth
import platform.Foundation.NSData
import platform.Foundation.create
import platform.UIKit.UIImage

/**
 * iOS implementation of QR code image display.
 *
 * Decodes base64-encoded QR code data and displays it using Compose Image.
 * Uses iOS native NSData and UIImage for decoding, then converts to Skia ImageBitmap.
 *
 * Features:
 * - Asynchronous decoding on IO dispatcher to prevent UI blocking
 * - Loading indicator during decode
 * - Error state with broken image icon on failure
 * - Native iOS image decoding for optimal performance
 * - Skia-based rendering for Compose compatibility
 *
 * @param data The QR code data (base64 encoded image or data URL)
 * @param modifier Modifier for the composable
 * @param size The size of the QR code image
 * @param contentDescription Accessibility description for the QR code
 * @param showLoadingIndicator Whether to show a loading indicator while decoding
 * @param onError Callback when decoding fails
 */
@OptIn(ExperimentalForeignApi::class, BetaInteropApi::class)
@Composable
actual fun QrCodeImage(
    data: String,
    modifier: Modifier,
    size: Dp,
    contentDescription: String?,
    showLoadingIndicator: Boolean,
    onError: ((Exception) -> Unit)?
) {
    // State for the decoded image
    var imageBitmap by remember { mutableStateOf<ImageBitmap?>(null) }
    var isLoading by remember { mutableStateOf(true) }
    var hasError by remember { mutableStateOf(false) }

    // Decode on a background thread
    LaunchedEffect(data) {
        isLoading = true
        hasError = false
        imageBitmap = null

        try {
            val decodedImage = withContext(Dispatchers.IO) {
                decodeQrCodeImage(data)
            }
            imageBitmap = decodedImage
            if (decodedImage == null) {
                hasError = true
                onError?.invoke(IllegalStateException("Failed to decode QR code image"))
            }
        } catch (e: Exception) {
            hasError = true
            onError?.invoke(e)
        } finally {
            isLoading = false
        }
    }

    Box(
        modifier = modifier
            .size(size)
            .clip(RoundedCornerShape(8.dp)),
        contentAlignment = Alignment.Center
    ) {
        when {
            // Loading state
            isLoading && showLoadingIndicator -> {
                CircularProgressIndicator(
                    color = MaterialTheme.colorScheme.primary,
                    modifier = Modifier.size(48.dp)
                )
            }

            // Error state
            hasError -> {
                Box(
                    modifier = Modifier
                        .size(size)
                        .background(
                            color = MaterialTheme.colorScheme.errorContainer,
                            shape = RoundedCornerShape(8.dp)
                        ),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        imageVector = Icons.Default.BrokenImage,
                        contentDescription = "Failed to load QR code",
                        tint = MaterialTheme.colorScheme.onErrorContainer,
                        modifier = Modifier.size(48.dp)
                    )
                }
            }

            // Success state
            imageBitmap != null -> {
                Image(
                    bitmap = imageBitmap!!,
                    contentDescription = contentDescription,
                    modifier = Modifier.size(size),
                    contentScale = ContentScale.Fit
                )
            }
        }
    }
}

/**
 * Decodes base64 QR code data to an ImageBitmap.
 *
 * @param data The QR code data (base64 or data URL)
 * @return The decoded ImageBitmap, or null if decoding failed
 */
@OptIn(ExperimentalForeignApi::class, BetaInteropApi::class)
private fun decodeQrCodeImage(data: String): ImageBitmap? {
    return try {
        // Extract base64 data from data URL if present
        val base64Data = QrCodeUtils.extractBase64Data(data)

        // Decode base64 to byte array
        val decodedBytes = decodeBase64(base64Data)

        // Convert to NSData
        val nsData = decodedBytes.usePinned { pinned ->
            NSData.create(
                bytes = pinned.addressOf(0),
                length = decodedBytes.size.toULong()
            )
        }

        // Create UIImage from NSData
        val uiImage = UIImage.imageWithData(nsData) ?: return null

        // Convert UIImage to Skia ImageBitmap
        convertUIImageToImageBitmap(uiImage)
    } catch (e: Exception) {
        null
    }
}

/**
 * Decodes a base64 string to a ByteArray.
 * Uses standard base64 decoding with proper padding handling.
 *
 * @param base64String The base64 encoded string
 * @return The decoded byte array
 */
private fun decodeBase64(base64String: String): ByteArray {
    val chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/"

    // Clean the input - remove whitespace and validate characters
    val cleaned = base64String.filter { it in chars || it == '=' }

    val output = mutableListOf<Byte>()
    var buffer = 0
    var bitsCollected = 0

    for (char in cleaned) {
        if (char == '=') break

        val value = chars.indexOf(char)
        if (value < 0) continue

        buffer = (buffer shl 6) or value
        bitsCollected += 6

        if (bitsCollected >= 8) {
            bitsCollected -= 8
            output.add(((buffer shr bitsCollected) and 0xFF).toByte())
        }
    }

    return output.toByteArray()
}

/**
 * Converts a UIImage to a Compose ImageBitmap using Skia.
 *
 * This function extracts raw pixel data from the UIImage's CGImage
 * and creates a Skia image that can be displayed in Compose.
 *
 * @param uiImage The UIImage to convert
 * @return The converted ImageBitmap, or null if conversion failed
 */
@OptIn(ExperimentalForeignApi::class)
private fun convertUIImageToImageBitmap(uiImage: UIImage): ImageBitmap? {
    val cgImage = uiImage.CGImage ?: return null

    val width = CGImageGetWidth(cgImage).toInt()
    val height = CGImageGetHeight(cgImage).toInt()

    if (width <= 0 || height <= 0) return null

    // Get raw pixel data from CGImage
    val dataProvider = CGImageGetDataProvider(cgImage) ?: return null
    val cfData = CGDataProviderCopyData(dataProvider) ?: return null

    val length = CFDataGetLength(cfData).toInt()
    val pointer = CFDataGetBytePtr(cfData) ?: return null

    // Copy data to ByteArray
    val bytes = ByteArray(length)
    for (i in 0 until length) {
        bytes[i] = pointer[i].toByte()
    }

    // Create Skia Image from raw pixel data
    // PNG images from base64 are typically RGBA
    val bytesPerRow = width * 4

    return try {
        val skiaImage = org.jetbrains.skia.Image.makeRaster(
            imageInfo = ImageInfo(
                width = width,
                height = height,
                colorType = ColorType.RGBA_8888,
                alphaType = ColorAlphaType.UNPREMUL
            ),
            bytes = bytes,
            rowBytes = bytesPerRow
        )
        skiaImage.toComposeImageBitmap()
    } catch (e: Exception) {
        null
    }
}
