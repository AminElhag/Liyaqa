package com.liyaqa.member.presentation.navigation

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.RowScope
import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CalendarMonth
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.QrCode2
import androidx.compose.material3.Icon
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import cafe.adriel.voyager.core.screen.Screen
import cafe.adriel.voyager.navigator.tab.CurrentTab
import cafe.adriel.voyager.navigator.tab.LocalTabNavigator
import cafe.adriel.voyager.navigator.tab.Tab
import cafe.adriel.voyager.navigator.tab.TabNavigator
import cafe.adriel.voyager.navigator.tab.TabOptions
import com.liyaqa.member.presentation.screens.home.HomeScreen
import com.liyaqa.member.presentation.screens.profile.ProfileScreen
import com.liyaqa.member.presentation.screens.qr.QrCheckInScreen
import com.liyaqa.member.presentation.screens.schedule.ScheduleScreen
import com.liyaqa.member.presentation.theme.LocalIsArabic
import com.liyaqa.member.presentation.theme.Strings

/**
 * Main screen with bottom navigation tabs
 */
object MainTabScreen : Screen {
    @Composable
    override fun Content() {
        TabNavigator(HomeTab) { tabNavigator ->
            Scaffold(
                bottomBar = {
                    NavigationBar {
                        TabNavigationItem(HomeTab)
                        TabNavigationItem(ScheduleTab)
                        TabNavigationItem(QrCodeTab)
                        TabNavigationItem(ProfileTab)
                    }
                }
            ) { paddingValues ->
                Box(modifier = Modifier.padding(paddingValues)) {
                    CurrentTab()
                }
            }
        }
    }
}

@Composable
private fun RowScope.TabNavigationItem(tab: Tab) {
    val tabNavigator = LocalTabNavigator.current

    NavigationBarItem(
        selected = tabNavigator.current == tab,
        onClick = { tabNavigator.current = tab },
        icon = {
            tab.options.icon?.let { painter ->
                Icon(painter, contentDescription = tab.options.title)
            }
        },
        label = { Text(tab.options.title) }
    )
}

// Tab definitions
object HomeTab : Tab {
    override val options: TabOptions
        @Composable
        get() {
            val isArabic = LocalIsArabic.current
            val title = remember(isArabic) { Strings.home.get(isArabic) }

            return TabOptions(
                index = 0u,
                title = title,
                icon = rememberVectorPainter(Icons.Default.Home)
            )
        }

    @Composable
    override fun Content() {
        HomeScreen.Content()
    }
}

object ScheduleTab : Tab {
    override val options: TabOptions
        @Composable
        get() {
            val isArabic = LocalIsArabic.current
            val title = remember(isArabic) { Strings.schedule.get(isArabic) }

            return TabOptions(
                index = 1u,
                title = title,
                icon = rememberVectorPainter(Icons.Default.CalendarMonth)
            )
        }

    @Composable
    override fun Content() {
        ScheduleScreen.Content()
    }
}

object QrCodeTab : Tab {
    override val options: TabOptions
        @Composable
        get() {
            val isArabic = LocalIsArabic.current
            val title = remember(isArabic) { Strings.qrCode.get(isArabic) }

            return TabOptions(
                index = 2u,
                title = title,
                icon = rememberVectorPainter(Icons.Default.QrCode2)
            )
        }

    @Composable
    override fun Content() {
        QrCheckInScreen.Content()
    }
}

object ProfileTab : Tab {
    override val options: TabOptions
        @Composable
        get() {
            val isArabic = LocalIsArabic.current
            val title = remember(isArabic) { Strings.profile.get(isArabic) }

            return TabOptions(
                index = 3u,
                title = title,
                icon = rememberVectorPainter(Icons.Default.Person)
            )
        }

    @Composable
    override fun Content() {
        ProfileScreen.Content()
    }
}

@Composable
private fun rememberVectorPainter(imageVector: ImageVector) =
    androidx.compose.ui.graphics.vector.rememberVectorPainter(imageVector)
