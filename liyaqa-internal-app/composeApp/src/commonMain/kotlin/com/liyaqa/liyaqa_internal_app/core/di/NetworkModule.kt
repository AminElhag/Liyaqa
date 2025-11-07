package com.liyaqa.liyaqa_internal_app.core.di

import com.liyaqa.liyaqa_internal_app.core.network.HttpClientFactory
import io.ktor.client.*
import org.koin.dsl.module

/**
 * Koin module for network dependencies.
 * Provides HttpClient configured for the app.
 */
val networkModule = module {
    // HttpClient Factory
    single { HttpClientFactory() }

    // HttpClient instance
    single<HttpClient> {
        get<HttpClientFactory>().create(
            tokenProvider = {
                // TODO: Get token from secure storage
                null
            }
        )
    }
}
