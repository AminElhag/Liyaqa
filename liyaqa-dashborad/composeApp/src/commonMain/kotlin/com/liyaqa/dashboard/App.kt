package com.liyaqa.dashboard

import androidx.compose.material3.MaterialTheme
import androidx.compose.runtime.Composable
import androidx.navigation.compose.rememberNavController
import com.liyaqa.dashboard.core.di.AppModules
import com.liyaqa.dashboard.navigation.NavGraph
import org.jetbrains.compose.ui.tooling.preview.Preview
import org.koin.compose.KoinApplication

/**
 * Main app entry point for Liyaqa Facility Dashboard
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
            val navController = rememberNavController()
            NavGraph(navController = navController)
        }
    }
}
