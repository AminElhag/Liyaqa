package com.liyaqa.staff.android

import android.app.Application
import com.liyaqa.staff.di.getCommonModules
import org.koin.android.ext.koin.androidContext
import org.koin.android.ext.koin.androidLogger
import org.koin.core.context.startKoin
import org.koin.core.logger.Level

class LiyaqaStaffApplication : Application() {

    override fun onCreate() {
        super.onCreate()

        startKoin {
            androidLogger(Level.ERROR)
            androidContext(this@LiyaqaStaffApplication)
            properties(
                mapOf(
                    "API_BASE_URL" to BuildConfig.API_BASE_URL,
                    "IS_DEBUG" to BuildConfig.IS_DEBUG.toString()
                )
            )
            modules(getCommonModules())
        }
    }
}
