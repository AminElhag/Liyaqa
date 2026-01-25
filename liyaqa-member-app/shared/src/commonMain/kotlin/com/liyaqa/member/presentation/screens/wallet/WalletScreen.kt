package com.liyaqa.member.presentation.screens.wallet

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
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.AccountBalanceWallet
import androidx.compose.material.icons.filled.ArrowDownward
import androidx.compose.material.icons.filled.ArrowUpward
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.pulltorefresh.PullToRefreshBox
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
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
import cafe.adriel.voyager.navigator.LocalNavigator
import cafe.adriel.voyager.navigator.currentOrThrow
import com.liyaqa.member.domain.model.Language
import com.liyaqa.member.domain.model.WalletTransaction
import com.liyaqa.member.presentation.components.EmptyView
import com.liyaqa.member.presentation.components.ErrorView
import com.liyaqa.member.presentation.components.LoadingView
import com.liyaqa.member.presentation.theme.CustomShapes
import com.liyaqa.member.presentation.theme.LocalIsArabic
import com.liyaqa.member.presentation.theme.StatusColors

object WalletScreen : Screen {
    @OptIn(ExperimentalMaterial3Api::class)
    @Composable
    override fun Content() {
        val navigator = LocalNavigator.currentOrThrow
        val screenModel = getScreenModel<WalletScreenModel>()
        val state by screenModel.state.collectAsState()
        val isArabic = LocalIsArabic.current
        val language = if (isArabic) Language.ARABIC else Language.ENGLISH

        LaunchedEffect(Unit) {
            screenModel.loadWallet()
        }

        Scaffold(
            topBar = {
                TopAppBar(
                    title = {
                        Text(
                            text = if (isArabic) "المحفظة" else "Wallet",
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
                    state.isLoading && state.balance == null -> {
                        LoadingView()
                    }
                    state.error != null && state.balance == null -> {
                        val errorMessage = if (isArabic) {
                            state.error?.messageAr ?: state.error?.message
                        } else {
                            state.error?.message
                        }
                        ErrorView(
                            message = errorMessage ?: "Error loading wallet",
                            onRetry = screenModel::loadWallet
                        )
                    }
                    else -> {
                        LazyColumn(
                            modifier = Modifier.fillMaxSize(),
                            contentPadding = PaddingValues(16.dp),
                            verticalArrangement = Arrangement.spacedBy(16.dp)
                        ) {
                            // Balance Card
                            item {
                                Card(
                                    modifier = Modifier.fillMaxWidth(),
                                    shape = CustomShapes.card,
                                    colors = CardDefaults.cardColors(
                                        containerColor = MaterialTheme.colorScheme.primaryContainer
                                    )
                                ) {
                                    Column(
                                        modifier = Modifier
                                            .fillMaxWidth()
                                            .padding(24.dp),
                                        horizontalAlignment = Alignment.CenterHorizontally
                                    ) {
                                        Icon(
                                            imageVector = Icons.Default.AccountBalanceWallet,
                                            contentDescription = null,
                                            tint = MaterialTheme.colorScheme.onPrimaryContainer,
                                            modifier = Modifier.size(48.dp)
                                        )
                                        Spacer(modifier = Modifier.height(16.dp))
                                        Text(
                                            text = if (isArabic) "الرصيد المتاح" else "Available Balance",
                                            style = MaterialTheme.typography.bodyMedium,
                                            color = MaterialTheme.colorScheme.onPrimaryContainer.copy(alpha = 0.7f)
                                        )
                                        Spacer(modifier = Modifier.height(8.dp))
                                        Text(
                                            text = state.balance?.balance?.format() ?: "SAR 0.00",
                                            style = MaterialTheme.typography.headlineLarge,
                                            fontWeight = FontWeight.Bold,
                                            color = when {
                                                state.balance?.hasCredit == true -> StatusColors.active
                                                state.balance?.hasDebt == true -> StatusColors.overdue
                                                else -> MaterialTheme.colorScheme.onPrimaryContainer
                                            }
                                        )
                                    }
                                }
                            }

                            // Transactions Header
                            item {
                                Text(
                                    text = if (isArabic) "المعاملات الأخيرة" else "Recent Transactions",
                                    style = MaterialTheme.typography.titleMedium,
                                    fontWeight = FontWeight.SemiBold
                                )
                            }

                            // Transactions List
                            if (state.transactions.isEmpty()) {
                                item {
                                    EmptyView(
                                        message = if (isArabic) {
                                            "لا توجد معاملات"
                                        } else {
                                            "No transactions yet"
                                        },
                                        modifier = Modifier.height(200.dp)
                                    )
                                }
                            } else {
                                items(
                                    items = state.transactions,
                                    key = { it.id }
                                ) { transaction ->
                                    TransactionItem(
                                        transaction = transaction,
                                        language = language
                                    )
                                    if (transaction != state.transactions.last()) {
                                        HorizontalDivider()
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun TransactionItem(
    transaction: WalletTransaction,
    language: Language
) {
    val isArabic = language == Language.ARABIC

    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 12.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        // Transaction icon
        Icon(
            imageVector = if (transaction.isCredit) {
                Icons.Default.ArrowDownward
            } else {
                Icons.Default.ArrowUpward
            },
            contentDescription = null,
            tint = if (transaction.isCredit) {
                StatusColors.active
            } else {
                StatusColors.overdue
            },
            modifier = Modifier.size(24.dp)
        )

        Spacer(modifier = Modifier.width(12.dp))

        // Transaction details
        Column(modifier = Modifier.weight(1f)) {
            Text(
                text = transaction.description?.get(language)
                    ?: getTransactionTypeName(transaction.type.name, isArabic),
                style = MaterialTheme.typography.bodyMedium,
                fontWeight = FontWeight.Medium
            )
            Text(
                text = transaction.createdAt,
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }

        // Amount
        Text(
            text = "${if (transaction.isCredit) "+" else "-"} ${transaction.amount.format()}",
            style = MaterialTheme.typography.bodyMedium,
            fontWeight = FontWeight.SemiBold,
            color = if (transaction.isCredit) {
                StatusColors.active
            } else {
                StatusColors.overdue
            }
        )
    }
}

private fun getTransactionTypeName(type: String, isArabic: Boolean): String {
    return when (type) {
        "CREDIT" -> if (isArabic) "إيداع" else "Credit"
        "DEBIT" -> if (isArabic) "خصم" else "Debit"
        "REFUND" -> if (isArabic) "استرداد" else "Refund"
        "ADJUSTMENT" -> if (isArabic) "تعديل" else "Adjustment"
        "REWARD" -> if (isArabic) "مكافأة" else "Reward"
        "GIFT_CARD" -> if (isArabic) "بطاقة هدية" else "Gift Card"
        else -> type
    }
}
