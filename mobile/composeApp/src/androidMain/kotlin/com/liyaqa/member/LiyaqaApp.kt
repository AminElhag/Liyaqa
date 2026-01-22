package com.liyaqa.member

import android.app.Application
import coil3.ImageLoader
import coil3.PlatformContext
import coil3.SingletonImageLoader
import coil3.disk.DiskCache
import coil3.disk.directory
import coil3.memory.MemoryCache
import coil3.network.ktor3.KtorNetworkFetcherFactory
import coil3.request.CachePolicy
import coil3.request.crossfade
import coil3.util.DebugLogger
import com.liyaqa.member.di.appModules
import org.koin.android.ext.koin.androidContext
import org.koin.android.ext.koin.androidLogger
import org.koin.core.context.startKoin
import org.koin.core.logger.Level

/**
 * Main Application class for the Liyaqa Member Android app.
 *
 * Initializes:
 * - Koin dependency injection with all app modules
 * - Coil image loader with memory and disk caching
 */
class LiyaqaApp : Application(), SingletonImageLoader.Factory {

    override fun onCreate() {
        super.onCreate()

        // Initialize Koin for dependency injection
        startKoin {
            // Use Android logger with INFO level (ERROR in production)
            androidLogger(Level.INFO)

            // Provide Android context
            androidContext(this@LiyaqaApp)

            // Load all app modules (shared + platform)
            modules(appModules)
        }
    }

    /**
     * Creates the singleton Coil ImageLoader with optimized caching.
     *
     * Configuration:
     * - Memory cache: 25% of available memory
     * - Disk cache: 100MB in cache directory
     * - Crossfade animation: 200ms
     * - Ktor network fetcher for HTTP requests
     */
    override fun newImageLoader(context: PlatformContext): ImageLoader {
        return ImageLoader.Builder(context)
            // Enable crossfade animation
            .crossfade(true)
            .crossfade(200)

            // Memory cache configuration
            .memoryCache {
                MemoryCache.Builder()
                    .maxSizePercent(context, 0.25) // 25% of available memory
                    .build()
            }

            // Disk cache configuration
            .diskCache {
                DiskCache.Builder()
                    .directory(cacheDir.resolve("image_cache"))
                    .maxSizeBytes(100L * 1024 * 1024) // 100MB
                    .build()
            }

            // Use Ktor for network requests (shares config with API client)
            .components {
                add(KtorNetworkFetcherFactory())
            }

            // Cache policies
            .memoryCachePolicy(CachePolicy.ENABLED)
            .diskCachePolicy(CachePolicy.ENABLED)
            .networkCachePolicy(CachePolicy.ENABLED)

            // Debug logging (only in debug builds)
            .apply {
                if (BuildConfig.DEBUG) {
                    logger(DebugLogger())
                }
            }

            .build()
    }
}
