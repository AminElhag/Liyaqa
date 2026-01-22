package com.liyaqa.member

import androidx.compose.runtime.Composable
import com.liyaqa.member.ui.navigation.AppNavigation

/**
 * Root composable for the Liyaqa Member App.
 * Delegates to AppNavigation which handles auth-based routing.
 */
@Composable
fun App() {
    AppNavigation()
}
