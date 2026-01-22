package com.liyaqa.member.ui.navigation.tabs

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.outlined.CalendarMonth
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.FloatingActionButton
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Tab
import androidx.compose.material3.TabRow
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.rememberVectorPainter
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import cafe.adriel.voyager.core.screen.Screen
import cafe.adriel.voyager.navigator.LocalNavigator
import cafe.adriel.voyager.navigator.Navigator
import cafe.adriel.voyager.navigator.currentOrThrow
import cafe.adriel.voyager.navigator.tab.TabOptions
import cafe.adriel.voyager.transitions.SlideTransition
import com.liyaqa.member.ui.screens.bookings.BookingDetailScreen
import com.liyaqa.member.ui.screens.bookings.NewBookingScreen
import liyaqamember.shared.generated.resources.Res
import liyaqamember.shared.generated.resources.nav_classes
import liyaqamember.shared.generated.resources.bookings_upcoming
import liyaqamember.shared.generated.resources.bookings_past
import org.jetbrains.compose.resources.stringResource

/**
 * Bookings/Classes tab - displays member bookings and available sessions.
 * Uses Navigator for stack navigation within this tab.
 */
object BookingsTab : cafe.adriel.voyager.navigator.tab.Tab {

    override val options: TabOptions
        @Composable
        get() {
            val title = stringResource(Res.string.nav_classes)
            val icon = rememberVectorPainter(Icons.Outlined.CalendarMonth)

            return remember(title) {
                TabOptions(
                    index = 1u,
                    title = title,
                    icon = icon
                )
            }
        }

    @Composable
    override fun Content() {
        Navigator(BookingsRootScreen()) { navigator ->
            SlideTransition(navigator)
        }
    }
}

/**
 * Root screen for the Bookings tab showing upcoming and past bookings.
 */
class BookingsRootScreen : Screen {
    @Composable
    override fun Content() {
        val navigator = LocalNavigator.currentOrThrow
        var selectedTab by remember { mutableIntStateOf(0) }
        val tabs = listOf(
            stringResource(Res.string.bookings_upcoming),
            stringResource(Res.string.bookings_past)
        )

        Scaffold(
            floatingActionButton = {
                FloatingActionButton(
                    onClick = { navigator.push(NewBookingScreen()) }
                ) {
                    Icon(
                        imageVector = Icons.Filled.Add,
                        contentDescription = "Book a Class"
                    )
                }
            }
        ) { paddingValues ->
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(paddingValues)
            ) {
                // Tab row
                TabRow(selectedTabIndex = selectedTab) {
                    tabs.forEachIndexed { index, title ->
                        Tab(
                            selected = selectedTab == index,
                            onClick = { selectedTab = index },
                            text = { Text(title) }
                        )
                    }
                }

                // Content based on selected tab
                when (selectedTab) {
                    0 -> UpcomingBookingsList(
                        onBookingClick = { bookingId ->
                            navigator.push(BookingDetailScreen(bookingId))
                        }
                    )
                    1 -> PastBookingsList(
                        onBookingClick = { bookingId ->
                            navigator.push(BookingDetailScreen(bookingId))
                        }
                    )
                }
            }
        }
    }
}

@Composable
private fun UpcomingBookingsList(
    onBookingClick: (String) -> Unit
) {
    LazyColumn(
        contentPadding = PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        items(5) { index ->
            BookingListCard(
                bookingId = "booking_$index",
                className = "Yoga Class",
                dateTime = "Tomorrow, 9:00 AM",
                status = "CONFIRMED",
                onClick = { onBookingClick("booking_$index") }
            )
        }
    }
}

@Composable
private fun PastBookingsList(
    onBookingClick: (String) -> Unit
) {
    LazyColumn(
        contentPadding = PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        items(10) { index ->
            BookingListCard(
                bookingId = "past_booking_$index",
                className = "Spin Class",
                dateTime = "Jan ${15 - index}, 2024",
                status = "COMPLETED",
                onClick = { onBookingClick("past_booking_$index") }
            )
        }
    }
}

@Composable
private fun BookingListCard(
    bookingId: String,
    className: String,
    dateTime: String,
    status: String,
    onClick: () -> Unit
) {
    Card(
        onClick = onClick,
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surfaceVariant
        )
    ) {
        Column(
            modifier = Modifier.padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(4.dp)
        ) {
            Text(
                text = className,
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.SemiBold
            )
            Text(
                text = dateTime,
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
            Text(
                text = status,
                style = MaterialTheme.typography.labelSmall,
                color = if (status == "CONFIRMED")
                    MaterialTheme.colorScheme.primary
                else
                    MaterialTheme.colorScheme.onSurfaceVariant
            )
        }
    }
}
