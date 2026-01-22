package com.liyaqa.member.ui.components

import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.util.Base64
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape
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
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.BrokenImage
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

/**
 * Android implementation of QR code image display.
 *
 * Decodes base64-encoded QR code data and displays it using Compose Image.
 * Supports both raw base64 and data URL formats (data:image/png;base64,...).
 *
 * Features:
 * - Asynchronous decoding on IO dispatcher to prevent UI blocking
 * - Loading indicator during decode
 * - Error state with broken image icon on failure
 * - Efficient bitmap caching with remember
 *
 * @param data The QR code data (base64 encoded image or data URL)
 * @param modifier Modifier for the composable
 * @param size The size of the QR code image
 * @param contentDescription Accessibility description for the QR code
 * @param showLoadingIndicator Whether to show a loading indicator while decoding
 * @param onError Callback when decoding fails
 */
@Composable
actual fun QrCodeImage(
    data: String,
    modifier: Modifier,
    size: Dp,
    contentDescription: String?,
    showLoadingIndicator: Boolean,
    onError: ((Exception) -> Unit)?
) {
    // State for the decoded bitmap
    var bitmap by remember { mutableStateOf<Bitmap?>(null) }
    var isLoading by remember { mutableStateOf(true) }
    var hasError by remember { mutableStateOf(false) }

    // Decode on a background thread
    LaunchedEffect(data) {
        isLoading = true
        hasError = false
        bitmap = null

        try {
            val decodedBitmap = withContext(Dispatchers.IO) {
                decodeQrCodeBitmap(data)
            }
            bitmap = decodedBitmap
            if (decodedBitmap == null) {
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
            bitmap != null -> {
                Image(
                    bitmap = bitmap!!.asImageBitmap(),
                    contentDescription = contentDescription,
                    modifier = Modifier.size(size),
                    contentScale = ContentScale.Fit
                )
            }
        }
    }
}

/**
 * Decodes base64 QR code data to a Bitmap.
 *
 * @param data The QR code data (base64 or data URL)
 * @return The decoded Bitmap, or null if decoding failed
 */
private fun decodeQrCodeBitmap(data: String): Bitmap? {
    return try {
        // Extract base64 data from data URL if present
        val base64Data = QrCodeUtils.extractBase64Data(data)

        // Decode base64 to byte array
        val decodedBytes = Base64.decode(base64Data, Base64.DEFAULT)

        // Configure bitmap options for better quality
        val options = BitmapFactory.Options().apply {
            // Don't scale the bitmap
            inScaled = false
            // Use ARGB_8888 for best quality
            inPreferredConfig = Bitmap.Config.ARGB_8888
        }

        // Convert to Bitmap
        BitmapFactory.decodeByteArray(decodedBytes, 0, decodedBytes.size, options)
    } catch (e: Exception) {
        null
    }
}
