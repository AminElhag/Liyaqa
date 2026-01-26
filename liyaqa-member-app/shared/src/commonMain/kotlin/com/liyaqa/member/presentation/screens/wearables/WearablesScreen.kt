package com.liyaqa.member.presentation.screens.wearables

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.Link
import androidx.compose.material.icons.filled.LinkOff
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material.icons.filled.Watch
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Snackbar
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import cafe.adriel.voyager.core.screen.Screen
import cafe.adriel.voyager.koin.getScreenModel
import cafe.adriel.voyager.navigator.LocalNavigator
import cafe.adriel.voyager.navigator.currentOrThrow
import com.liyaqa.member.domain.model.WearableConnection
import com.liyaqa.member.domain.model.SyncStatus
import com.liyaqa.member.presentation.components.ErrorView
import com.liyaqa.member.presentation.components.LoadingView
import com.liyaqa.member.presentation.theme.CustomShapes
import com.liyaqa.member.presentation.theme.LocalIsArabic

object WearablesScreen : Screen {
    @OptIn(ExperimentalMaterial3Api::class)
    @Composable
    override fun Content() {
        val navigator = LocalNavigator.currentOrThrow
        val screenModel = getScreenModel<WearablesScreenModel>()
        val state by screenModel.state.collectAsState()
        val isArabic = LocalIsArabic.current

        val snackbarHostState = remember { SnackbarHostState() }
        var showDisconnectDialog by remember { mutableStateOf<String?>(null) }

        // Show error/success messages
        LaunchedEffect(state.error) {
            state.error?.let { error ->
                val message = if (isArabic) error.messageAr ?: error.message else error.message
                snackbarHostState.showSnackbar(message)
                screenModel.clearError()
            }
        }

        LaunchedEffect(state.successMessage) {
            state.successMessage?.let { message ->
                snackbarHostState.showSnackbar(message)
                screenModel.clearSuccessMessage()
            }
        }

        Scaffold(
            topBar = {
                TopAppBar(
                    title = {
                        Text(
                            text = if (isArabic) "الأجهزة القابلة للارتداء" else "Wearables",
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
                    },
                    actions = {
                        IconButton(onClick = { screenModel.openHealthSettings() }) {
                            Icon(
                                imageVector = Icons.Default.Settings,
                                contentDescription = if (isArabic) "الإعدادات" else "Settings"
                            )
                        }
                    }
                )
            },
            snackbarHost = { SnackbarHost(snackbarHostState) }
        ) { paddingValues ->
            when {
                state.isLoading && state.connections.isEmpty() -> {
                    LoadingView(modifier = Modifier.padding(paddingValues))
                }
                state.error != null && state.connections.isEmpty() -> {
                    val errorMessage = if (isArabic) {
                        state.error?.messageAr ?: state.error?.message
                    } else {
                        state.error?.message
                    }
                    ErrorView(
                        message = errorMessage ?: "Error loading wearables",
                        onRetry = screenModel::loadData,
                        modifier = Modifier.padding(paddingValues)
                    )
                }
                else -> {
                    Column(
                        modifier = Modifier
                            .fillMaxSize()
                            .padding(paddingValues)
                            .verticalScroll(rememberScrollState())
                            .padding(16.dp)
                    ) {
                        // Device Health Platform Section
                        DeviceHealthPlatformCard(
                            platformStatus = state.devicePlatformStatus,
                            isConnected = screenModel.isDevicePlatformConnected(),
                            connection = screenModel.getDevicePlatformConnection(),
                            isConnecting = state.isConnecting,
                            isSyncing = state.isSyncing,
                            isArabic = isArabic,
                            onConnect = { screenModel.connectDevicePlatform() },
                            onDisconnect = { connectionId -> showDisconnectDialog = connectionId },
                            onSync = { connectionId -> screenModel.syncDeviceData(connectionId) },
                            onOpenSettings = { screenModel.openHealthSettings() }
                        )

                        Spacer(modifier = Modifier.height(24.dp))

                        // Connected Wearables Section
                        if (state.connections.isNotEmpty()) {
                            Text(
                                text = if (isArabic) "الأجهزة المتصلة" else "Connected Devices",
                                style = MaterialTheme.typography.titleMedium,
                                fontWeight = FontWeight.SemiBold
                            )
                            Spacer(modifier = Modifier.height(12.dp))

                            state.connections.forEach { connection ->
                                ConnectedWearableCard(
                                    connection = connection,
                                    isArabic = isArabic,
                                    isSyncing = state.isSyncing,
                                    onSync = { screenModel.syncDeviceData(connection.id) },
                                    onDisconnect = { showDisconnectDialog = connection.id }
                                )
                                Spacer(modifier = Modifier.height(12.dp))
                            }
                        }

                        // Activity Dashboard Link
                        if (state.connections.isNotEmpty()) {
                            Spacer(modifier = Modifier.height(16.dp))
                            Button(
                                onClick = { navigator.push(ActivityDashboardScreen) },
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                Text(
                                    text = if (isArabic) "عرض لوحة النشاط" else "View Activity Dashboard"
                                )
                            }
                        }

                        Spacer(modifier = Modifier.height(32.dp))
                    }
                }
            }
        }

        // Disconnect Confirmation Dialog
        showDisconnectDialog?.let { connectionId ->
            AlertDialog(
                onDismissRequest = { showDisconnectDialog = null },
                title = {
                    Text(if (isArabic) "قطع الاتصال" else "Disconnect")
                },
                text = {
                    Text(
                        if (isArabic)
                            "هل أنت متأكد من قطع الاتصال بهذا الجهاز؟ سيتم حذف جميع البيانات المتزامنة."
                        else
                            "Are you sure you want to disconnect this device? All synced data will be removed."
                    )
                },
                confirmButton = {
                    TextButton(
                        onClick = {
                            screenModel.disconnectPlatform(connectionId)
                            showDisconnectDialog = null
                        }
                    ) {
                        Text(if (isArabic) "قطع الاتصال" else "Disconnect")
                    }
                },
                dismissButton = {
                    TextButton(onClick = { showDisconnectDialog = null }) {
                        Text(if (isArabic) "إلغاء" else "Cancel")
                    }
                }
            )
        }
    }
}

@Composable
private fun DeviceHealthPlatformCard(
    platformStatus: com.liyaqa.member.data.health.HealthPlatformStatus?,
    isConnected: Boolean,
    connection: WearableConnection?,
    isConnecting: Boolean,
    isSyncing: Boolean,
    isArabic: Boolean,
    onConnect: () -> Unit,
    onDisconnect: (String) -> Unit,
    onSync: (String) -> Unit,
    onOpenSettings: () -> Unit
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = CustomShapes.card,
        colors = CardDefaults.cardColors(
            containerColor = if (isConnected)
                MaterialTheme.colorScheme.primaryContainer
            else
                MaterialTheme.colorScheme.surfaceVariant
        )
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(20.dp)
        ) {
            Row(
                verticalAlignment = Alignment.CenterVertically
            ) {
                Icon(
                    imageVector = Icons.Default.Watch,
                    contentDescription = null,
                    modifier = Modifier.size(40.dp),
                    tint = if (isConnected)
                        MaterialTheme.colorScheme.onPrimaryContainer
                    else
                        MaterialTheme.colorScheme.onSurfaceVariant
                )
                Spacer(modifier = Modifier.width(16.dp))
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = platformStatus?.displayName ?: "Health Data",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.SemiBold
                    )
                    if (isConnected && connection != null) {
                        val statusText = when (connection.syncStatusEnum) {
                            SyncStatus.SUCCESS -> if (isArabic) "متزامن" else "Synced"
                            SyncStatus.FAILED -> if (isArabic) "فشل المزامنة" else "Sync Failed"
                            SyncStatus.PARTIAL -> if (isArabic) "مزامنة جزئية" else "Partial Sync"
                            null -> if (isArabic) "لم تتم المزامنة" else "Not Synced"
                        }
                        Text(
                            text = statusText,
                            style = MaterialTheme.typography.bodySmall,
                            color = if (isConnected)
                                MaterialTheme.colorScheme.onPrimaryContainer.copy(alpha = 0.7f)
                            else
                                MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.7f)
                        )
                    }
                }
                if (isConnected) {
                    Icon(
                        imageVector = Icons.Default.Check,
                        contentDescription = null,
                        tint = MaterialTheme.colorScheme.primary
                    )
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            if (platformStatus?.isAvailable == false) {
                Text(
                    text = if (isArabic)
                        "بيانات الصحة غير متوفرة على هذا الجهاز"
                    else
                        "Health data is not available on this device",
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.error
                )
            } else if (isConnected && connection != null) {
                // Connected - show sync button
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    OutlinedButton(
                        onClick = { onSync(connection.id) },
                        enabled = !isSyncing,
                        modifier = Modifier.weight(1f)
                    ) {
                        if (isSyncing) {
                            CircularProgressIndicator(
                                modifier = Modifier.size(16.dp),
                                strokeWidth = 2.dp
                            )
                            Spacer(modifier = Modifier.width(8.dp))
                        } else {
                            Icon(
                                imageVector = Icons.Default.Refresh,
                                contentDescription = null,
                                modifier = Modifier.size(16.dp)
                            )
                            Spacer(modifier = Modifier.width(8.dp))
                        }
                        Text(if (isArabic) "مزامنة" else "Sync")
                    }
                    OutlinedButton(
                        onClick = { onDisconnect(connection.id) },
                        modifier = Modifier.weight(1f)
                    ) {
                        Icon(
                            imageVector = Icons.Default.LinkOff,
                            contentDescription = null,
                            modifier = Modifier.size(16.dp)
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(if (isArabic) "قطع" else "Disconnect")
                    }
                }
            } else {
                // Not connected - show connect button
                Button(
                    onClick = onConnect,
                    enabled = !isConnecting,
                    modifier = Modifier.fillMaxWidth()
                ) {
                    if (isConnecting) {
                        CircularProgressIndicator(
                            modifier = Modifier.size(16.dp),
                            strokeWidth = 2.dp,
                            color = MaterialTheme.colorScheme.onPrimary
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                    } else {
                        Icon(
                            imageVector = Icons.Default.Link,
                            contentDescription = null,
                            modifier = Modifier.size(16.dp)
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                    }
                    Text(if (isArabic) "ربط" else "Connect")
                }

                if (platformStatus?.hasPermissions == false) {
                    Spacer(modifier = Modifier.height(8.dp))
                    TextButton(
                        onClick = onOpenSettings,
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Text(
                            text = if (isArabic)
                                "افتح الإعدادات لمنح الأذونات"
                            else
                                "Open Settings to Grant Permissions",
                            style = MaterialTheme.typography.bodySmall
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun ConnectedWearableCard(
    connection: WearableConnection,
    isArabic: Boolean,
    isSyncing: Boolean,
    onSync: () -> Unit,
    onDisconnect: () -> Unit
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = CustomShapes.card
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Icon(
                imageVector = Icons.Default.Watch,
                contentDescription = null,
                modifier = Modifier.size(32.dp),
                tint = MaterialTheme.colorScheme.primary
            )
            Spacer(modifier = Modifier.width(12.dp))
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = connection.platformDisplayName ?: connection.platformName ?: "Unknown",
                    style = MaterialTheme.typography.bodyLarge,
                    fontWeight = FontWeight.Medium
                )
                val statusText = when (connection.syncStatusEnum) {
                    SyncStatus.SUCCESS -> if (isArabic) "متزامن" else "Synced"
                    SyncStatus.FAILED -> if (isArabic) "فشل" else "Failed"
                    SyncStatus.PARTIAL -> if (isArabic) "جزئي" else "Partial"
                    null -> if (isArabic) "لم تتم المزامنة" else "Not Synced"
                }
                Text(
                    text = statusText,
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
            IconButton(
                onClick = onSync,
                enabled = !isSyncing
            ) {
                if (isSyncing) {
                    CircularProgressIndicator(
                        modifier = Modifier.size(20.dp),
                        strokeWidth = 2.dp
                    )
                } else {
                    Icon(
                        imageVector = Icons.Default.Refresh,
                        contentDescription = if (isArabic) "مزامنة" else "Sync"
                    )
                }
            }
            IconButton(onClick = onDisconnect) {
                Icon(
                    imageVector = Icons.Default.LinkOff,
                    contentDescription = if (isArabic) "قطع الاتصال" else "Disconnect"
                )
            }
        }
    }
}
