package com.liyaqa.member.ui.screens

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Scaffold
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import cafe.adriel.voyager.navigator.tab.CurrentTab
import cafe.adriel.voyager.navigator.tab.TabNavigator
import com.liyaqa.member.data.auth.model.User
import com.liyaqa.member.stores.LocaleStore
import com.liyaqa.member.ui.components.LiyaqaBottomNavBar
import com.liyaqa.member.ui.components.LiyaqaTopBar
import com.liyaqa.member.ui.navigation.tabs.HomeTab
import com.liyaqa.member.ui.navigation.tabs.QrTab
import com.liyaqa.member.ui.theme.LiyaqaTheme

/**
 * Main screen container with TabNavigator and navigation bars.
 * This is the root screen after authentication.
 *
 * @param user The authenticated user
 * @param localeStore Store for managing locale/language
 * @param onLogout Callback when user logs out
 * @param unreadNotifications Count of unread notifications
 * @param onNotificationsClick Callback when notification bell is clicked
 */
@Composable
fun MainScreen(
    user: User,
    localeStore: LocaleStore,
    onLogout: () -> Unit,
    unreadNotifications: Int = 0,
    onNotificationsClick: () -> Unit = {}
) {
    val locale by localeStore.locale.collectAsState()

    LiyaqaTheme(locale = locale) {
        TabNavigator(HomeTab) { tabNavigator ->
            // Determine if we should show top/bottom bars
            // Hide bottom bar when QR tab is selected (full screen QR display)
            val currentTab = tabNavigator.current
            val showBottomBar = currentTab != QrTab

            Scaffold(
                topBar = {
                    if (showBottomBar) {
                        LiyaqaTopBar(
                            user = user,
                            locale = locale,
                            unreadNotifications = unreadNotifications,
                            onLanguageToggle = { localeStore.toggleLocale() },
                            onNotificationsClick = onNotificationsClick,
                            onAvatarClick = {
                                // Navigate to profile tab
                                tabNavigator.current = com.liyaqa.member.ui.navigation.tabs.ProfileTab
                            }
                        )
                    }
                },
                bottomBar = {
                    if (showBottomBar) {
                        LiyaqaBottomNavBar(
                            currentTab = currentTab,
                            onTabSelected = { tab ->
                                tabNavigator.current = tab
                            }
                        )
                    }
                }
            ) { paddingValues ->
                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(paddingValues)
                ) {
                    CurrentTab()
                }
            }
        }
    }
}
