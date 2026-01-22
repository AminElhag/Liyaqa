package com.liyaqa.member.ui.navigation.tabs

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.Home
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.rememberVectorPainter
import cafe.adriel.voyager.core.screen.Screen
import cafe.adriel.voyager.navigator.Navigator
import cafe.adriel.voyager.navigator.tab.Tab
import cafe.adriel.voyager.navigator.tab.TabOptions
import cafe.adriel.voyager.transitions.SlideTransition
import liyaqamember.shared.generated.resources.Res
import liyaqamember.shared.generated.resources.nav_home
import org.jetbrains.compose.resources.stringResource

/**
 * Home tab - displays the member dashboard.
 * Uses Navigator for stack navigation within this tab.
 */
object HomeTab : Tab {

    override val options: TabOptions
        @Composable
        get() {
            val title = stringResource(Res.string.nav_home)
            val icon = rememberVectorPainter(Icons.Outlined.Home)

            return remember(title) {
                TabOptions(
                    index = 0u,
                    title = title,
                    icon = icon
                )
            }
        }

    @Composable
    override fun Content() {
        Navigator(HomeRootScreen()) { navigator ->
            SlideTransition(navigator)
        }
    }
}

/**
 * Root screen for the Home tab.
 * This is the initial screen shown in this tab's Navigator.
 */
class HomeRootScreen : Screen {
    @Composable
    override fun Content() {
        // Placeholder - will be replaced with actual HomeScreen with dashboard
        Box(
            modifier = Modifier.fillMaxSize(),
            contentAlignment = Alignment.Center
        ) {
            Text(
                text = "Home Dashboard",
                style = MaterialTheme.typography.headlineMedium,
                color = MaterialTheme.colorScheme.onBackground
            )
        }
    }
}
