package com.liyaqa.member.di

import org.koin.core.context.startKoin
import org.koin.dsl.KoinAppDeclaration

fun initKoin(appDeclaration: KoinAppDeclaration = {}) {
    startKoin {
        appDeclaration()

        // Set properties for iOS
        properties(
            mapOf(
                "API_BASE_URL" to "https://api.liyaqa.com",
                "IS_DEBUG" to "false"
            )
        )

        modules(getIosModules())
    }
}

// Called from Swift
fun initKoin() = initKoin {}
