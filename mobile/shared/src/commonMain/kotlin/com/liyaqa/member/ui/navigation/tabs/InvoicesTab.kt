package com.liyaqa.member.ui.navigation.tabs

import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.Receipt
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.graphics.vector.rememberVectorPainter
import cafe.adriel.voyager.navigator.Navigator
import cafe.adriel.voyager.navigator.tab.Tab
import cafe.adriel.voyager.navigator.tab.TabOptions
import cafe.adriel.voyager.transitions.SlideTransition
import com.liyaqa.member.ui.screens.invoices.InvoicesScreen
import liyaqamember.shared.generated.resources.Res
import liyaqamember.shared.generated.resources.nav_invoices
import org.jetbrains.compose.resources.stringResource

/**
 * Invoices tab - displays member invoices and payment history.
 * Uses Navigator for stack navigation within this tab.
 */
object InvoicesTab : Tab {

    override val options: TabOptions
        @Composable
        get() {
            val title = stringResource(Res.string.nav_invoices)
            val icon = rememberVectorPainter(Icons.Outlined.Receipt)

            return remember(title) {
                TabOptions(
                    index = 3u,
                    title = title,
                    icon = icon
                )
            }
        }

    @Composable
    override fun Content() {
        Navigator(InvoicesScreen()) { navigator ->
            SlideTransition(navigator)
        }
    }
}
