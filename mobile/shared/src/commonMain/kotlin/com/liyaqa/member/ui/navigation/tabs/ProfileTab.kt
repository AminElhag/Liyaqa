package com.liyaqa.member.ui.navigation.tabs

import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.Person
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.graphics.vector.rememberVectorPainter
import cafe.adriel.voyager.navigator.Navigator
import cafe.adriel.voyager.navigator.tab.Tab
import cafe.adriel.voyager.navigator.tab.TabOptions
import cafe.adriel.voyager.transitions.SlideTransition
import com.liyaqa.member.ui.screens.profile.ProfileScreen
import liyaqamember.shared.generated.resources.Res
import liyaqamember.shared.generated.resources.nav_profile
import org.jetbrains.compose.resources.stringResource

/**
 * Profile tab - displays member profile and settings.
 * Uses Navigator for stack navigation within this tab.
 */
object ProfileTab : Tab {

    override val options: TabOptions
        @Composable
        get() {
            val title = stringResource(Res.string.nav_profile)
            val icon = rememberVectorPainter(Icons.Outlined.Person)

            return remember(title) {
                TabOptions(
                    index = 4u,
                    title = title,
                    icon = icon
                )
            }
        }

    @Composable
    override fun Content() {
        Navigator(ProfileScreen()) { navigator ->
            SlideTransition(navigator)
        }
    }
}
