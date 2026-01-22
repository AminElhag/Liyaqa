package com.liyaqa.member.data.api

import io.ktor.client.HttpClient
import io.ktor.client.engine.okhttp.OkHttp
import okhttp3.OkHttpClient
import java.util.concurrent.TimeUnit

/**
 * Android-specific HttpClient implementation using OkHttp engine.
 *
 * OkHttp is preferred on Android because:
 * - Better connection pooling and HTTP/2 support
 * - Efficient handling of network changes
 * - Built-in response caching
 * - Better integration with Android's network stack
 */
actual fun createPlatformHttpClient(): HttpClient {
    return HttpClient(OkHttp) {
        engine {
            // Configure OkHttp client
            config {
                // Connection timeouts
                connectTimeout(30, TimeUnit.SECONDS)
                readTimeout(60, TimeUnit.SECONDS)
                writeTimeout(60, TimeUnit.SECONDS)

                // Enable connection pooling
                retryOnConnectionFailure(true)

                // Enable HTTP/2
                protocols(listOf(okhttp3.Protocol.HTTP_2, okhttp3.Protocol.HTTP_1_1))
            }

            // Add interceptors for logging, etc. if needed
            addInterceptor { chain ->
                val request = chain.request()
                val response = chain.proceed(request)

                // Log request/response for debugging (can be conditionally enabled)
                // println("OkHttp: ${request.method} ${request.url} -> ${response.code}")

                response
            }
        }
    }
}

/**
 * Creates a custom OkHttpClient for advanced configuration.
 * Can be used when more control over the HTTP client is needed.
 */
fun createCustomOkHttpClient(
    connectTimeoutSeconds: Long = 30,
    readTimeoutSeconds: Long = 60,
    writeTimeoutSeconds: Long = 60,
    enableHttp2: Boolean = true
): OkHttpClient {
    return OkHttpClient.Builder().apply {
        connectTimeout(connectTimeoutSeconds, TimeUnit.SECONDS)
        readTimeout(readTimeoutSeconds, TimeUnit.SECONDS)
        writeTimeout(writeTimeoutSeconds, TimeUnit.SECONDS)
        retryOnConnectionFailure(true)

        if (enableHttp2) {
            protocols(listOf(okhttp3.Protocol.HTTP_2, okhttp3.Protocol.HTTP_1_1))
        } else {
            protocols(listOf(okhttp3.Protocol.HTTP_1_1))
        }
    }.build()
}

/**
 * Creates an HttpClient with a custom OkHttpClient.
 */
fun createHttpClientWithOkHttp(okHttpClient: OkHttpClient): HttpClient {
    return HttpClient(OkHttp) {
        engine {
            preconfigured = okHttpClient
        }
    }
}
