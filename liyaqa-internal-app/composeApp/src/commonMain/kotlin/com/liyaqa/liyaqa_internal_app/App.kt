package com.liyaqa.liyaqa_internal_app

import androidx.compose.material3.MaterialTheme
import androidx.compose.runtime.*
import com.liyaqa.liyaqa_internal_app.core.di.AppModules
import com.liyaqa.liyaqa_internal_app.navigation.NavGraph
import org.jetbrains.compose.ui.tooling.preview.Preview
import org.koin.compose.KoinApplication

/**
 * Main application composable.
 * Initializes Koin DI and sets up navigation with Material 3 theming.
 */
@Composable
@Preview
fun App() {
    KoinApplication(
        application = {
            modules(AppModules.getAll())
        }
    ) {
        MaterialTheme {
            NavGraph()
        }
    }
}