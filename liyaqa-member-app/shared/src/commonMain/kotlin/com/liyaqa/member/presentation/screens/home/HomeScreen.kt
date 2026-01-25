package com.liyaqa.member.presentation.screens.home

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.pulltorefresh.PullToRefreshBox
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import cafe.adriel.voyager.core.screen.Screen
import cafe.adriel.voyager.koin.getScreenModel
import com.liyaqa.member.domain.model.Language
import com.liyaqa.member.presentation.components.BookingCard
import com.liyaqa.member.presentation.components.EmptyView
import com.liyaqa.member.presentation.components.ErrorView
import com.liyaqa.member.presentation.components.LoadingView
import com.liyaqa.member.presentation.components.SectionHeader
import com.liyaqa.member.presentation.components.SubscriptionCard
import com.liyaqa.member.presentation.theme.LocalIsArabic
import com.liyaqa.member.presentation.theme.Strings
import com.liyaqa.member.presentation.theme.localized

object HomeScreen : Screen {
    @OptIn(ExperimentalMaterial3Api::class)
    @Composable
    override fun Content() {
        val screenModel = getScreenModel<HomeScreenModel>()
        val state by screenModel.state.collectAsState()
        val isArabic = LocalIsArabic.current
        val language = if (isArabic) Language.ARABIC else Language.ENGLISH

        LaunchedEffect(Unit) {
            screenModel.loadDashboard()
        }

        Scaffold(
            topBar = {
                TopAppBar(
                    title = {
                        Column {
                            Text(
                                text = "${Strings.welcomeMessage.localized()},",
                                style = MaterialTheme.typography.bodyMedium,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                            state.dashboard?.member?.name?.get(language)?.let { name ->
                                Text(
                                    text = name,
                                    style = MaterialTheme.typography.titleLarge,
                                    fontWeight = FontWeight.Bold
                                )
                            }
                        }
                    }
                )
            }
        ) { paddingValues ->
            PullToRefreshBox(
                isRefreshing = state.isRefreshing,
                onRefresh = screenModel::refresh,
                modifier = Modifier
                    .fillMaxSize()
                    .padding(paddingValues)
            ) {
                when {
                    state.isLoading && state.dashboard == null -> {
                        LoadingView()
                    }
                    state.error != null && state.dashboard == null -> {
                        val errorMessage = if (isArabic) {
                            state.error?.messageAr ?: state.error?.message
                        } else {
                            state.error?.message
                        }
                        ErrorView(
                            message = errorMessage ?: "Error loading dashboard",
                            onRetry = screenModel::loadDashboard
                        )
                    }
                    else -> {
                        LazyColumn(
                            modifier = Modifier.fillMaxSize(),
                            contentPadding = PaddingValues(vertical = 16.dp)
                        ) {
                            // Subscription Card
                            state.dashboard?.subscription?.let { sub ->
                                item {
                                    SubscriptionCard(
                                        subscription = com.liyaqa.member.domain.model.Subscription(
                                            id = sub.id,
                                            planId = "",
                                            planName = sub.planName,
                                            status = sub.status,
                                            startDate = "",
                                            endDate = "",
                                            daysRemaining = sub.daysRemaining,
                                            classesRemaining = sub.classesRemaining
                                        ),
                                        modifier = Modifier.padding(horizontal = 16.dp)
                                    )
                                    Spacer(modifier = Modifier.height(24.dp))
                                }
                            }

                            // Upcoming Classes Section
                            item {
                                SectionHeader(
                                    title = Strings.upcomingClasses.localized(),
                                    action = Strings.viewAll.localized() to { /* TODO */ }
                                )
                            }

                            if (state.dashboard?.upcomingClasses.isNullOrEmpty()) {
                                item {
                                    EmptyView(
                                        message = Strings.noUpcomingClasses.localized(),
                                        action = Strings.bookNow.localized() to { /* TODO */ },
                                        modifier = Modifier.height(200.dp)
                                    )
                                }
                            } else {
                                item {
                                    LazyRow(
                                        contentPadding = PaddingValues(horizontal = 16.dp),
                                        horizontalArrangement = Arrangement.spacedBy(12.dp)
                                    ) {
                                        items(
                                            items = state.dashboard?.upcomingClasses ?: emptyList(),
                                            key = { it.id }
                                        ) { booking ->
                                            BookingCard(
                                                booking = booking,
                                                modifier = Modifier
                                                    .fillParentMaxWidth(0.85f)
                                            )
                                        }
                                    }
                                }
                            }

                            // Pending Invoices Section
                            if (!state.dashboard?.pendingInvoices.isNullOrEmpty()) {
                                item {
                                    Spacer(modifier = Modifier.height(24.dp))
                                    SectionHeader(
                                        title = Strings.pendingPayments.localized()
                                    )
                                }

                                items(
                                    items = state.dashboard?.pendingInvoices ?: emptyList(),
                                    key = { it.id }
                                ) { invoice ->
                                    // TODO: Invoice card
                                    Text(
                                        text = "${invoice.invoiceNumber} - ${invoice.totalAmount.format()}",
                                        modifier = Modifier.padding(16.dp)
                                    )
                                }
                            }

                            item {
                                Spacer(modifier = Modifier.height(80.dp)) // Bottom nav space
                            }
                        }
                    }
                }
            }
        }
    }
}
