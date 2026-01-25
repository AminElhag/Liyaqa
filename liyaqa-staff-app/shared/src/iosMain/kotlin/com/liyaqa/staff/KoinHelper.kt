package com.liyaqa.staff

import com.liyaqa.staff.di.getCommonModules
import org.koin.core.context.startKoin

fun initKoin() {
    startKoin {
        properties(
            mapOf(
                "API_BASE_URL" to "https://api.liyaqa.com",
                "IS_DEBUG" to "true"
            )
        )
        modules(getCommonModules())
    }
}
