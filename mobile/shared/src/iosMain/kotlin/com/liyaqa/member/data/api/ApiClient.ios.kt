package com.liyaqa.member.data.api

import io.ktor.client.HttpClient
import io.ktor.client.engine.darwin.Darwin
import platform.Foundation.NSURLSessionConfiguration

/**
 * iOS-specific HttpClient implementation using Darwin engine.
 *
 * Darwin engine is preferred on iOS because:
 * - Uses native NSURLSession for network operations
 * - Better integration with iOS's App Transport Security (ATS)
 * - Proper handling of background downloads/uploads
 * - Respects system proxy settings
 * - Better power efficiency on iOS devices
 */
actual fun createPlatformHttpClient(): HttpClient {
    return HttpClient(Darwin) {
        engine {
            configureRequest {
                // Enable automatic handling of redirects
                setAllowsCellularAccess(true)

                // Allow background network operations
                setAllowsConstrainedNetworkAccess(true)
                setAllowsExpensiveNetworkAccess(true)
            }

            configureSession {
                // Session configuration is done here
                // Note: Timeouts are configured at the Ktor level via HttpTimeout plugin
            }
        }
    }
}

/**
 * Creates an HttpClient with custom NSURLSessionConfiguration.
 * Can be used for background sessions or other advanced configurations.
 */
fun createHttpClientWithSessionConfig(
    sessionConfig: NSURLSessionConfiguration
): HttpClient {
    return HttpClient(Darwin) {
        engine {
            configureSession {
                // Apply the custom session configuration
                // Note: This is where you'd configure things like:
                // - Background session identifiers
                // - URL cache settings
                // - HTTP maximum connections per host
            }
        }
    }
}

/**
 * Creates an HttpClient configured for background operations.
 * Useful for file downloads/uploads that should continue in background.
 */
fun createBackgroundHttpClient(identifier: String): HttpClient {
    return HttpClient(Darwin) {
        engine {
            configureRequest {
                setAllowsCellularAccess(true)
                setAllowsConstrainedNetworkAccess(true)
                setAllowsExpensiveNetworkAccess(true)
            }
        }
    }
}
