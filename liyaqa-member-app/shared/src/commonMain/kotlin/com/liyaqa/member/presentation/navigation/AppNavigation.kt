package com.liyaqa.member.presentation.navigation

import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import cafe.adriel.voyager.core.screen.Screen
import cafe.adriel.voyager.navigator.LocalNavigator
import cafe.adriel.voyager.navigator.Navigator
import cafe.adriel.voyager.navigator.currentOrThrow
import cafe.adriel.voyager.transitions.SlideTransition
import com.liyaqa.member.presentation.screens.attendance.AttendanceScreen
import com.liyaqa.member.presentation.screens.invoices.InvoiceDetailScreen
import com.liyaqa.member.presentation.screens.invoices.InvoicesScreen
import com.liyaqa.member.presentation.screens.login.LoginScreen
import com.liyaqa.member.presentation.screens.profile.ProfileScreen
import com.liyaqa.member.presentation.screens.schedule.ScheduleScreen
import com.liyaqa.member.presentation.screens.subscription.SubscriptionDetailScreen
import com.liyaqa.member.presentation.screens.trainers.TrainerDetailScreen
import com.liyaqa.member.presentation.screens.trainers.TrainersScreen
import com.liyaqa.member.presentation.screens.wallet.WalletScreen

/**
 * Main app navigation entry point
 */
@Composable
fun AppNavigation(
    isAuthenticated: Boolean,
    initialRoute: String? = null
) {
    val startScreen: Screen = if (isAuthenticated) {
        MainTabScreen
    } else {
        LoginScreen
    }

    Navigator(startScreen) { navigator ->
        SlideTransition(navigator)

        // Handle deep link navigation when authenticated
        if (isAuthenticated && initialRoute != null) {
            DeepLinkHandler(initialRoute)
        }
    }
}

/**
 * Handles deep link navigation to specific screens.
 * This composable navigates to the appropriate screen based on the route.
 */
@Composable
private fun DeepLinkHandler(route: String) {
    val navigator = LocalNavigator.currentOrThrow

    LaunchedEffect(route) {
        val screen = routeToScreen(route)
        if (screen != null) {
            navigator.push(screen)
        }
    }
}

/**
 * Maps a route string to a Screen.
 * Routes follow the pattern: "screenName" or "screenName/id"
 */
private fun routeToScreen(route: String): Screen? {
    val parts = route.split("/")
    val screenName = parts.firstOrNull() ?: return null
    val id = parts.getOrNull(1)

    return when (screenName) {
        "subscriptions" -> SubscriptionDetailScreen
        "invoices" -> if (id != null) InvoiceDetailScreen(id) else InvoicesScreen
        "profile" -> ProfileScreen
        "schedule" -> ScheduleScreen
        "wallet" -> WalletScreen
        "attendance" -> AttendanceScreen
        "bookings" -> ScheduleScreen // No dedicated bookings screen, use schedule
        "classes" -> null // No class detail screen exists
        "trainers" -> if (id != null) TrainerDetailScreen(id) else TrainersScreen
        else -> null
    }
}
