package com.liyaqa.member.ui.screens.notifications

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.animateContentSize
import androidx.compose.animation.expandVertically
import androidx.compose.animation.shrinkVertically
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.ExpandLess
import androidx.compose.material.icons.filled.ExpandMore
import androidx.compose.material.icons.outlined.CreditCard
import androidx.compose.material.icons.outlined.Event
import androidx.compose.material.icons.outlined.Notifications
import androidx.compose.material.icons.outlined.Person
import androidx.compose.material.icons.outlined.Receipt
import androidx.compose.material.icons.outlined.Schedule
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FilterChip
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.material3.pulltorefresh.PullToRefreshBox
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.derivedStateOf
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import cafe.adriel.voyager.core.screen.Screen
import cafe.adriel.voyager.navigator.LocalNavigator
import cafe.adriel.voyager.navigator.currentOrThrow
import com.liyaqa.member.domain.model.Notification
import com.liyaqa.member.domain.model.NotificationCategory
import com.liyaqa.member.presentation.base.LoadingState
import com.liyaqa.member.presentation.notifications.NotificationsEffect
import com.liyaqa.member.presentation.notifications.NotificationsIntent
import com.liyaqa.member.presentation.notifications.NotificationsState
import com.liyaqa.member.presentation.notifications.NotificationsViewModel
import com.liyaqa.member.ui.components.EmptyNotifications
import com.liyaqa.member.ui.components.FullScreenLoading
import com.liyaqa.member.ui.components.LoadMoreIndicator
import com.liyaqa.member.ui.theme.LocalAppLocale
import kotlinx.coroutines.delay
import kotlinx.datetime.TimeZone
import kotlinx.datetime.toLocalDateTime
import liyaqamember.shared.generated.resources.Res
import liyaqamember.shared.generated.resources.btn_mark_all_read
import liyaqamember.shared.generated.resources.notifications_all
import liyaqamember.shared.generated.resources.notifications_title
import liyaqamember.shared.generated.resources.notifications_unread
import org.jetbrains.compose.resources.stringResource
import org.koin.compose.viewmodel.koinViewModel

/**
 * Notifications Screen - Shows member notifications with filtering.
 *
 * Features:
 * - Header with unread count
 * - Toggle: All / Unread only
 * - Mark all as read button
 * - LazyColumn with expandable NotificationCard
 * - Mark as read on tap
 * - Infinite scroll pagination
 * - Empty state
 * - Auto-refresh every 60 seconds
 */
class NotificationsScreen : Screen {

    @OptIn(ExperimentalMaterial3Api::class)
    @Composable
    override fun Content() {
        val navigator = LocalNavigator.currentOrThrow
        val viewModel: NotificationsViewModel = koinViewModel()
        val state by viewModel.state.collectAsState()
        val locale = LocalAppLocale.current

        // Handle effects
        LaunchedEffect(Unit) {
            viewModel.effect.collect { effect ->
                when (effect) {
                    is NotificationsEffect.ShowError -> {
                        // TODO: Show snackbar with error.message
                    }
                    is NotificationsEffect.NavigateToAction -> {
                        // Navigate based on notification type
                        // For now just mark as read - deep linking handled by parent
                    }
                    is NotificationsEffect.AllMarkedAsRead -> {
                        // TODO: Show success snackbar
                    }
                }
            }
        }

        // Auto-refresh every 60 seconds
        LaunchedEffect(Unit) {
            while (true) {
                delay(60_000)
                viewModel.onIntent(NotificationsIntent.Refresh)
            }
        }

        Scaffold(
            topBar = {
                TopAppBar(
                    title = {
                        Row(
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(stringResource(Res.string.notifications_title))
                            if (state.unreadCount > 0) {
                                Spacer(modifier = Modifier.width(8.dp))
                                UnreadCountBadge(count = state.unreadCount)
                            }
                        }
                    },
                    navigationIcon = {
                        IconButton(onClick = { navigator.pop() }) {
                            Icon(
                                imageVector = Icons.AutoMirrored.Filled.ArrowBack,
                                contentDescription = "Back"
                            )
                        }
                    },
                    actions = {
                        if (state.hasUnread) {
                            TextButton(
                                onClick = { viewModel.onIntent(NotificationsIntent.MarkAllAsRead) },
                                enabled = !state.isMarkingAllRead
                            ) {
                                Text(
                                    text = stringResource(Res.string.btn_mark_all_read),
                                    style = MaterialTheme.typography.labelMedium
                                )
                            }
                        }
                    },
                    colors = TopAppBarDefaults.topAppBarColors(
                        containerColor = MaterialTheme.colorScheme.surface
                    )
                )
            }
        ) { paddingValues ->
            NotificationsContent(
                state = state,
                onIntent = viewModel::onIntent,
                modifier = Modifier.padding(paddingValues)
            )
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun NotificationsContent(
    state: NotificationsState,
    onIntent: (NotificationsIntent) -> Unit,
    modifier: Modifier = Modifier
) {
    val locale = LocalAppLocale.current
    val listState = rememberLazyListState()

    // Check if we need to load more
    val shouldLoadMore by remember {
        derivedStateOf {
            val lastVisibleIndex = listState.layoutInfo.visibleItemsInfo.lastOrNull()?.index ?: 0
            val totalItems = state.notifications.items.size
            lastVisibleIndex >= totalItems - 3 && state.notifications.hasMore && !state.notifications.isLoadingMore
        }
    }

    LaunchedEffect(shouldLoadMore) {
        if (shouldLoadMore) {
            onIntent(NotificationsIntent.LoadMore)
        }
    }

    Column(modifier = modifier.fillMaxSize()) {
        // Filter chips
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp, vertical = 8.dp),
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            FilterChip(
                selected = !state.unreadOnly,
                onClick = { if (state.unreadOnly) onIntent(NotificationsIntent.ToggleUnreadOnly) },
                label = { Text(stringResource(Res.string.notifications_all)) }
            )
            FilterChip(
                selected = state.unreadOnly,
                onClick = { if (!state.unreadOnly) onIntent(NotificationsIntent.ToggleUnreadOnly) },
                label = { Text(stringResource(Res.string.notifications_unread)) }
            )
        }

        // Content
        when {
            state.notifications.isInitialLoading -> {
                FullScreenLoading()
            }
            state.notifications.error != null && state.notifications.items.isEmpty() -> {
                EmptyNotifications(modifier = Modifier.fillMaxSize())
            }
            state.notifications.items.isEmpty() -> {
                EmptyNotifications(modifier = Modifier.fillMaxSize())
            }
            else -> {
                PullToRefreshBox(
                    isRefreshing = state.notifications.isRefreshing,
                    onRefresh = { onIntent(NotificationsIntent.Refresh) },
                    modifier = Modifier.fillMaxSize()
                ) {
                    LazyColumn(
                        state = listState,
                        contentPadding = PaddingValues(16.dp),
                        verticalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        items(
                            items = state.notifications.items,
                            key = { it.id }
                        ) { notification ->
                            ExpandableNotificationCard(
                                notification = notification,
                                locale = locale,
                                onClick = { onIntent(NotificationsIntent.ViewNotification(notification)) }
                            )
                        }

                        // Load more indicator
                        if (state.notifications.isLoadingMore) {
                            item {
                                LoadMoreIndicator()
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun UnreadCountBadge(
    count: Int,
    modifier: Modifier = Modifier
) {
    Box(
        modifier = modifier
            .clip(CircleShape)
            .background(MaterialTheme.colorScheme.error)
            .padding(horizontal = 8.dp, vertical = 2.dp),
        contentAlignment = Alignment.Center
    ) {
        Text(
            text = if (count > 99) "99+" else count.toString(),
            style = MaterialTheme.typography.labelSmall,
            color = MaterialTheme.colorScheme.onError,
            fontWeight = FontWeight.Bold
        )
    }
}

@Composable
private fun ExpandableNotificationCard(
    notification: Notification,
    locale: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    var isExpanded by remember { mutableStateOf(false) }
    val subject = notification.subject.localized(locale)
    val body = notification.body.localized(locale)
    val tz = TimeZone.currentSystemDefault()
    val dateTime = notification.createdAt.toLocalDateTime(tz)

    Card(
        modifier = modifier
            .fillMaxWidth()
            .animateContentSize()
            .clickable {
                onClick()
                if (!isExpanded) isExpanded = true
            },
        colors = CardDefaults.cardColors(
            containerColor = if (notification.isRead)
                MaterialTheme.colorScheme.surface
            else
                MaterialTheme.colorScheme.primaryContainer.copy(alpha = 0.3f)
        ),
        elevation = CardDefaults.cardElevation(defaultElevation = if (notification.isRead) 0.dp else 1.dp),
        shape = RoundedCornerShape(12.dp)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                // Category icon
                Box(
                    modifier = Modifier
                        .size(40.dp)
                        .clip(CircleShape)
                        .background(
                            if (notification.isRead)
                                MaterialTheme.colorScheme.surfaceVariant
                            else
                                MaterialTheme.colorScheme.primaryContainer
                        ),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        imageVector = notification.category.icon,
                        contentDescription = null,
                        modifier = Modifier.size(20.dp),
                        tint = if (notification.isRead)
                            MaterialTheme.colorScheme.onSurfaceVariant
                        else
                            MaterialTheme.colorScheme.primary
                    )
                }

                Column(
                    modifier = Modifier.weight(1f)
                ) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.Top
                    ) {
                        Text(
                            text = subject,
                            style = MaterialTheme.typography.titleSmall,
                            fontWeight = if (notification.isRead) FontWeight.Normal else FontWeight.SemiBold,
                            maxLines = if (isExpanded) Int.MAX_VALUE else 1,
                            overflow = TextOverflow.Ellipsis,
                            modifier = Modifier.weight(1f)
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            text = formatDate(dateTime.date.toString(), locale),
                            style = MaterialTheme.typography.labelSmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }

                    Spacer(modifier = Modifier.height(4.dp))

                    // Category label
                    Text(
                        text = notification.category.getLabel(locale),
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.primary
                    )
                }

                // Expand/collapse icon
                IconButton(
                    onClick = { isExpanded = !isExpanded },
                    modifier = Modifier.size(24.dp)
                ) {
                    Icon(
                        imageVector = if (isExpanded) Icons.Default.ExpandLess else Icons.Default.ExpandMore,
                        contentDescription = if (isExpanded) "Collapse" else "Expand",
                        tint = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }

            // Expandable body
            AnimatedVisibility(
                visible = isExpanded,
                enter = expandVertically(),
                exit = shrinkVertically()
            ) {
                Column {
                    Spacer(modifier = Modifier.height(12.dp))
                    Text(
                        text = body,
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )

                    // Read status indicator
                    if (!notification.isRead) {
                        Spacer(modifier = Modifier.height(12.dp))
                        Row(
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Icon(
                                imageVector = Icons.Default.CheckCircle,
                                contentDescription = null,
                                modifier = Modifier.size(16.dp),
                                tint = MaterialTheme.colorScheme.primary
                            )
                            Spacer(modifier = Modifier.width(4.dp))
                            Text(
                                text = if (locale == "ar") "انقر للتعليم كمقروء" else "Tap to mark as read",
                                style = MaterialTheme.typography.labelSmall,
                                color = MaterialTheme.colorScheme.primary
                            )
                        }
                    }
                }
            }
        }
    }
}

/**
 * Get icon for notification category.
 */
private val NotificationCategory.icon: ImageVector
    get() = when (this) {
        NotificationCategory.SUBSCRIPTION -> Icons.Outlined.CreditCard
        NotificationCategory.INVOICE -> Icons.Outlined.Receipt
        NotificationCategory.BOOKING -> Icons.Outlined.Event
        NotificationCategory.ATTENDANCE -> Icons.Outlined.Schedule
        NotificationCategory.ACCOUNT -> Icons.Outlined.Person
        NotificationCategory.GENERAL -> Icons.Outlined.Notifications
    }

/**
 * Get localized label for notification category.
 */
private fun NotificationCategory.getLabel(locale: String): String {
    return when (this) {
        NotificationCategory.SUBSCRIPTION -> if (locale == "ar") "الاشتراك" else "Subscription"
        NotificationCategory.INVOICE -> if (locale == "ar") "الفاتورة" else "Invoice"
        NotificationCategory.BOOKING -> if (locale == "ar") "الحجز" else "Booking"
        NotificationCategory.ATTENDANCE -> if (locale == "ar") "الحضور" else "Attendance"
        NotificationCategory.ACCOUNT -> if (locale == "ar") "الحساب" else "Account"
        NotificationCategory.GENERAL -> if (locale == "ar") "عام" else "General"
    }
}

/**
 * Format date for display.
 */
private fun formatDate(dateStr: String, locale: String): String {
    // Simple date formatting - just show the date
    return dateStr
}
