package com.liyaqa.staff.presentation.screens.checkin

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import cafe.adriel.voyager.core.screen.Screen
import cafe.adriel.voyager.koin.getScreenModel
import com.liyaqa.staff.domain.model.MemberSummary
import com.liyaqa.staff.domain.model.MembershipStatus
import com.liyaqa.staff.presentation.theme.LocalIsArabic
import com.liyaqa.staff.presentation.theme.Strings

object CheckInScreen : Screen {
    @OptIn(ExperimentalMaterial3Api::class)
    @Composable
    override fun Content() {
        val screenModel = getScreenModel<CheckInScreenModel>()
        val uiState by screenModel.uiState.collectAsState()
        val isArabic = LocalIsArabic.current

        Scaffold(
            topBar = {
                TopAppBar(
                    title = { Text(Strings.checkIn.get(isArabic)) }
                )
            }
        ) { paddingValues ->
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(paddingValues)
                    .padding(16.dp)
            ) {
                // QR Scanner Button
                OutlinedButton(
                    onClick = screenModel::toggleScanner,
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Icon(Icons.Default.QrCode2, contentDescription = null)
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(Strings.scanQrCode.get(isArabic))
                }

                Spacer(modifier = Modifier.height(16.dp))

                // Search Field
                OutlinedTextField(
                    value = uiState.searchQuery,
                    onValueChange = screenModel::onSearchQueryChange,
                    label = { Text(Strings.searchMember.get(isArabic)) },
                    placeholder = { Text(Strings.searchPlaceholder.get(isArabic)) },
                    leadingIcon = { Icon(Icons.Default.Search, contentDescription = null) },
                    trailingIcon = {
                        if (uiState.searchQuery.isNotEmpty()) {
                            IconButton(onClick = { screenModel.onSearchQueryChange("") }) {
                                Icon(Icons.Default.Clear, contentDescription = null)
                            }
                        }
                    },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth()
                )

                Spacer(modifier = Modifier.height(16.dp))

                // Success/Error Messages
                uiState.checkInMessage?.let { message ->
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        colors = CardDefaults.cardColors(
                            containerColor = MaterialTheme.colorScheme.primaryContainer
                        )
                    ) {
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(16.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Icon(
                                Icons.Default.CheckCircle,
                                contentDescription = null,
                                tint = MaterialTheme.colorScheme.primary
                            )
                            Spacer(modifier = Modifier.width(8.dp))
                            Text(
                                text = message,
                                color = MaterialTheme.colorScheme.onPrimaryContainer
                            )
                        }
                    }
                    Spacer(modifier = Modifier.height(16.dp))
                }

                uiState.error?.let { error ->
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        colors = CardDefaults.cardColors(
                            containerColor = MaterialTheme.colorScheme.errorContainer
                        )
                    ) {
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(16.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Icon(
                                Icons.Default.Error,
                                contentDescription = null,
                                tint = MaterialTheme.colorScheme.error
                            )
                            Spacer(modifier = Modifier.width(8.dp))
                            Text(
                                text = error,
                                color = MaterialTheme.colorScheme.onErrorContainer
                            )
                        }
                    }
                    Spacer(modifier = Modifier.height(16.dp))
                }

                // Selected Member Card
                uiState.selectedMember?.let { member ->
                    SelectedMemberCard(
                        member = member,
                        isArabic = isArabic,
                        isCheckingIn = uiState.isCheckingIn,
                        onCheckIn = { screenModel.checkInMember(member.id) },
                        onClear = screenModel::clearSelectedMember
                    )
                }

                // Search Results
                if (uiState.isSearching) {
                    Box(
                        modifier = Modifier.fillMaxWidth(),
                        contentAlignment = Alignment.Center
                    ) {
                        CircularProgressIndicator()
                    }
                } else if (uiState.searchResults.isNotEmpty()) {
                    LazyColumn(
                        verticalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        items(uiState.searchResults) { member ->
                            MemberSearchResultCard(
                                member = member,
                                isArabic = isArabic,
                                onClick = { screenModel.selectMember(member) }
                            )
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun MemberSearchResultCard(
    member: MemberSummary,
    isArabic: Boolean,
    onClick: () -> Unit
) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onClick)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(12.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Icon(
                imageVector = Icons.Default.Person,
                contentDescription = null,
                modifier = Modifier.size(48.dp),
                tint = MaterialTheme.colorScheme.primary
            )
            Spacer(modifier = Modifier.width(12.dp))
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = member.fullName,
                    style = MaterialTheme.typography.bodyLarge
                )
                Text(
                    text = member.memberNumber,
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                member.phone?.let {
                    Text(
                        text = it,
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }
            MembershipStatusChip(status = member.membershipStatus)
        }
    }
}

@Composable
private fun SelectedMemberCard(
    member: MemberSummary,
    isArabic: Boolean,
    isCheckingIn: Boolean,
    onCheckIn: () -> Unit,
    onClear: () -> Unit
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.secondaryContainer
        )
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.Top
            ) {
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = member.fullName,
                        style = MaterialTheme.typography.titleMedium
                    )
                    Text(
                        text = member.memberNumber,
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSecondaryContainer.copy(alpha = 0.7f)
                    )
                    member.subscriptionName?.let {
                        Text(
                            text = it.get(isArabic),
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSecondaryContainer.copy(alpha = 0.7f)
                        )
                    }
                }
                IconButton(onClick = onClear) {
                    Icon(Icons.Default.Close, contentDescription = null)
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            if (member.canCheckIn) {
                Button(
                    onClick = onCheckIn,
                    modifier = Modifier.fillMaxWidth(),
                    enabled = !isCheckingIn
                ) {
                    if (isCheckingIn) {
                        CircularProgressIndicator(
                            modifier = Modifier.size(24.dp),
                            color = MaterialTheme.colorScheme.onPrimary
                        )
                    } else {
                        Icon(Icons.Default.Login, contentDescription = null)
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(Strings.manualCheckIn.get(isArabic))
                    }
                }
            } else {
                Text(
                    text = member.checkInRestrictionReason ?: Strings.cannotCheckIn.get(isArabic),
                    color = MaterialTheme.colorScheme.error,
                    style = MaterialTheme.typography.bodyMedium
                )
            }
        }
    }
}

@Composable
private fun MembershipStatusChip(status: MembershipStatus) {
    val (color, text) = when (status) {
        MembershipStatus.ACTIVE -> MaterialTheme.colorScheme.primary to "Active"
        MembershipStatus.EXPIRED -> MaterialTheme.colorScheme.error to "Expired"
        MembershipStatus.FROZEN -> MaterialTheme.colorScheme.tertiary to "Frozen"
        MembershipStatus.CANCELLED -> MaterialTheme.colorScheme.error to "Cancelled"
    }

    Surface(
        color = color.copy(alpha = 0.12f),
        shape = MaterialTheme.shapes.small
    ) {
        Text(
            text = text,
            modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
            style = MaterialTheme.typography.labelSmall,
            color = color
        )
    }
}
