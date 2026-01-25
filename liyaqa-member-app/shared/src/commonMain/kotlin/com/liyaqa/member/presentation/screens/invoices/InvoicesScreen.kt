package com.liyaqa.member.presentation.screens.invoices

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FilterChip
import androidx.compose.material3.pulltorefresh.PullToRefreshBox
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
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
import cafe.adriel.voyager.navigator.LocalNavigator
import cafe.adriel.voyager.navigator.currentOrThrow
import com.liyaqa.member.domain.model.InvoiceStatus
import com.liyaqa.member.presentation.components.EmptyView
import com.liyaqa.member.presentation.components.ErrorView
import com.liyaqa.member.presentation.components.InvoiceCard
import com.liyaqa.member.presentation.components.LoadingView
import com.liyaqa.member.presentation.screens.payment.PaymentWebViewScreen
import com.liyaqa.member.presentation.theme.LocalIsArabic
import com.liyaqa.member.presentation.theme.Strings
import com.liyaqa.member.presentation.theme.localized

object InvoicesScreen : Screen {
    @OptIn(ExperimentalMaterial3Api::class)
    @Composable
    override fun Content() {
        val navigator = LocalNavigator.currentOrThrow
        val screenModel = getScreenModel<InvoicesScreenModel>()
        val state by screenModel.state.collectAsState()
        val isArabic = LocalIsArabic.current

        LaunchedEffect(Unit) {
            screenModel.loadInvoices()
        }

        Scaffold(
            topBar = {
                TopAppBar(
                    title = {
                        Text(
                            text = Strings.invoices.localized(),
                            fontWeight = FontWeight.Bold
                        )
                    },
                    navigationIcon = {
                        IconButton(onClick = { navigator.pop() }) {
                            Icon(
                                imageVector = Icons.AutoMirrored.Filled.ArrowBack,
                                contentDescription = if (isArabic) "رجوع" else "Back"
                            )
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
                    state.isLoading && state.invoices.isEmpty() -> {
                        LoadingView()
                    }
                    state.error != null && state.invoices.isEmpty() -> {
                        val errorMessage = if (isArabic) {
                            state.error?.messageAr ?: state.error?.message
                        } else {
                            state.error?.message
                        }
                        ErrorView(
                            message = errorMessage ?: "Error loading invoices",
                            onRetry = screenModel::loadInvoices
                        )
                    }
                    state.invoices.isEmpty() -> {
                        EmptyView(
                            message = if (isArabic) "لا توجد فواتير" else "No invoices found"
                        )
                    }
                    else -> {
                        LazyColumn(
                            modifier = Modifier.fillMaxSize(),
                            contentPadding = PaddingValues(16.dp),
                            verticalArrangement = Arrangement.spacedBy(12.dp)
                        ) {
                            // Filter chips
                            item {
                                androidx.compose.foundation.layout.Row(
                                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                                ) {
                                    FilterChip(
                                        selected = state.selectedFilter == null,
                                        onClick = { screenModel.setFilter(null) },
                                        label = {
                                            Text(if (isArabic) "الكل" else "All")
                                        }
                                    )
                                    FilterChip(
                                        selected = state.selectedFilter == InvoiceStatus.ISSUED,
                                        onClick = { screenModel.setFilter(InvoiceStatus.ISSUED) },
                                        label = {
                                            Text(if (isArabic) "مستحقة" else "Pending")
                                        }
                                    )
                                    FilterChip(
                                        selected = state.selectedFilter == InvoiceStatus.PAID,
                                        onClick = { screenModel.setFilter(InvoiceStatus.PAID) },
                                        label = {
                                            Text(Strings.paid.localized())
                                        }
                                    )
                                    FilterChip(
                                        selected = state.selectedFilter == InvoiceStatus.OVERDUE,
                                        onClick = { screenModel.setFilter(InvoiceStatus.OVERDUE) },
                                        label = {
                                            Text(Strings.overdue.localized())
                                        }
                                    )
                                }
                            }

                            items(
                                items = state.invoices,
                                key = { it.id }
                            ) { invoice ->
                                InvoiceCard(
                                    invoice = invoice,
                                    onClick = {
                                        navigator.push(InvoiceDetailScreen(invoice.id))
                                    },
                                    onPayClick = if (invoice.canPay) {
                                        { screenModel.initiatePayment(invoice.id) }
                                    } else null
                                )
                            }
                        }
                    }
                }
            }
        }

        // Handle payment URL
        LaunchedEffect(state.paymentUrl) {
            state.paymentUrl?.let { url ->
                navigator.push(PaymentWebViewScreen(
                    paymentUrl = url,
                    paymentReference = state.paymentReference ?: ""
                ))
                screenModel.clearPaymentUrl()
            }
        }
    }
}
