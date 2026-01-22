package com.liyaqa.member.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.RowScope
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.selection.selectableGroup
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.QrCode
import androidx.compose.material3.FloatingActionButton
import androidx.compose.material3.FloatingActionButtonDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.NavigationBarItemDefaults
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.rememberVectorPainter
import androidx.compose.ui.unit.dp
import cafe.adriel.voyager.navigator.tab.Tab
import com.liyaqa.member.ui.navigation.tabs.BookingsTab
import com.liyaqa.member.ui.navigation.tabs.HomeTab
import com.liyaqa.member.ui.navigation.tabs.InvoicesTab
import com.liyaqa.member.ui.navigation.tabs.ProfileTab
import com.liyaqa.member.ui.navigation.tabs.QrTab

/**
 * Custom bottom navigation bar with center FAB for QR tab.
 *
 * @param currentTab The currently selected tab
 * @param onTabSelected Callback when a tab is selected
 * @param modifier Modifier for the navigation bar
 */
@Composable
fun LiyaqaBottomNavBar(
    currentTab: Tab,
    onTabSelected: (Tab) -> Unit,
    modifier: Modifier = Modifier
) {
    val tabs = listOf(HomeTab, BookingsTab, QrTab, InvoicesTab, ProfileTab)

    Box(
        modifier = modifier.fillMaxWidth(),
        contentAlignment = Alignment.BottomCenter
    ) {
        // Main Navigation Bar
        NavigationBar(
            modifier = Modifier.fillMaxWidth(),
            containerColor = MaterialTheme.colorScheme.surface,
            tonalElevation = 8.dp
        ) {
            tabs.forEach { tab ->
                if (tab == QrTab) {
                    // Space for center FAB - empty item
                    QrTabSpacer()
                } else {
                    NavigationBarItem(
                        selected = currentTab == tab,
                        onClick = { onTabSelected(tab) },
                        icon = {
                            tab.options.icon?.let { painter ->
                                Icon(
                                    painter = painter,
                                    contentDescription = tab.options.title,
                                    modifier = Modifier.size(24.dp)
                                )
                            }
                        },
                        label = {
                            Text(
                                text = tab.options.title,
                                style = MaterialTheme.typography.labelSmall
                            )
                        },
                        colors = NavigationBarItemDefaults.colors(
                            selectedIconColor = MaterialTheme.colorScheme.primary,
                            selectedTextColor = MaterialTheme.colorScheme.primary,
                            unselectedIconColor = MaterialTheme.colorScheme.onSurfaceVariant,
                            unselectedTextColor = MaterialTheme.colorScheme.onSurfaceVariant,
                            indicatorColor = MaterialTheme.colorScheme.primaryContainer
                        )
                    )
                }
            }
        }

        // Center QR FAB (elevated above the nav bar)
        CenterQrFab(
            isSelected = currentTab == QrTab,
            onClick = { onTabSelected(QrTab) },
            modifier = Modifier.offset(y = (-20).dp)
        )
    }
}

/**
 * Spacer in the navigation bar to make room for the center FAB.
 */
@Composable
private fun RowScope.QrTabSpacer() {
    Box(
        modifier = Modifier.weight(1f),
        contentAlignment = Alignment.Center
    ) {
        // Empty space for the FAB
    }
}

/**
 * Center QR code floating action button.
 *
 * @param isSelected Whether the QR tab is currently selected
 * @param onClick Callback when the FAB is clicked
 * @param modifier Modifier for the FAB
 */
@Composable
private fun CenterQrFab(
    isSelected: Boolean,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    FloatingActionButton(
        onClick = onClick,
        modifier = modifier.size(56.dp),
        shape = CircleShape,
        containerColor = if (isSelected)
            MaterialTheme.colorScheme.primary
        else
            MaterialTheme.colorScheme.primaryContainer,
        contentColor = if (isSelected)
            MaterialTheme.colorScheme.onPrimary
        else
            MaterialTheme.colorScheme.primary,
        elevation = FloatingActionButtonDefaults.elevation(
            defaultElevation = 6.dp,
            pressedElevation = 12.dp
        )
    ) {
        Icon(
            imageVector = Icons.Filled.QrCode,
            contentDescription = "QR Code",
            modifier = Modifier.size(28.dp)
        )
    }
}
