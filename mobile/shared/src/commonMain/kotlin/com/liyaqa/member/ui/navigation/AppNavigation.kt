package com.liyaqa.member.ui.navigation

import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import com.liyaqa.member.presentation.auth.AuthState
import com.liyaqa.member.presentation.auth.AuthViewModel
import com.liyaqa.member.stores.LocaleStore
import com.liyaqa.member.ui.screens.MainScreen
import com.liyaqa.member.ui.screens.auth.LoginScreen
import com.liyaqa.member.ui.screens.SplashScreen
import org.koin.compose.koinInject
import org.koin.compose.viewmodel.koinViewModel

/**
 * Root navigation composable that handles auth-based navigation.
 * Shows different screens based on authentication state:
 * - Loading: SplashScreen
 * - Unauthenticated: LoginScreen
 * - Authenticated: MainScreen with TabNavigator
 */
@Composable
fun AppNavigation() {
    val authViewModel: AuthViewModel = koinViewModel()
    val localeStore: LocaleStore = koinInject()
    val authState by authViewModel.authState.collectAsState()

    when (val state = authState) {
        is AuthState.Loading -> {
            SplashScreen()
        }
        is AuthState.Unauthenticated -> {
            LoginScreen(
                viewModel = authViewModel,
                localeStore = localeStore
            )
        }
        is AuthState.Authenticated -> {
            MainScreen(
                user = state.user,
                localeStore = localeStore,
                onLogout = { authViewModel.logout() },
                // TODO: Get from NotificationViewModel when implemented
                unreadNotifications = 0,
                onNotificationsClick = {
                    // TODO: Navigate to notifications screen
                }
            )
        }
    }
}
