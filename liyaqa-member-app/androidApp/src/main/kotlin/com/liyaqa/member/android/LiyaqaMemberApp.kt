package com.liyaqa.member.android

import android.app.Application
import com.liyaqa.member.di.getAndroidModules
import org.koin.android.ext.koin.androidContext
import org.koin.android.ext.koin.androidLogger
import org.koin.core.context.startKoin
import org.koin.core.logger.Level

class LiyaqaMemberApp : Application() {

    override fun onCreate() {
        super.onCreate()

        // Initialize Koin
        startKoin {
            androidLogger(if (BuildConfig.DEBUG) Level.DEBUG else Level.NONE)
            androidContext(this@LiyaqaMemberApp)

            // Set properties
            properties(
                mapOf(
                    "API_BASE_URL" to BuildConfig.API_BASE_URL,
                    "IS_DEBUG" to BuildConfig.DEBUG.toString()
                )
            )

            modules(getAndroidModules())
        }
    }
}
