package com.liyaqa.staff.presentation.screens.profile

import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import cafe.adriel.voyager.core.screen.Screen
import cafe.adriel.voyager.koin.getScreenModel
import cafe.adriel.voyager.navigator.LocalNavigator
import cafe.adriel.voyager.navigator.currentOrThrow
import com.liyaqa.staff.presentation.screens.login.LoginScreen
import com.liyaqa.staff.presentation.theme.LocalIsArabic
import com.liyaqa.staff.presentation.theme.Strings

object ProfileScreen : Screen {
    @OptIn(ExperimentalMaterial3Api::class)
    @Composable
    override fun Content() {
        val screenModel = getScreenModel<ProfileScreenModel>()
        val uiState by screenModel.uiState.collectAsState()
        val navigator = LocalNavigator.currentOrThrow
        val isArabic = LocalIsArabic.current

        LaunchedEffect(uiState.loggedOut) {
            if (uiState.loggedOut) {
                navigator.replaceAll(LoginScreen)
            }
        }

        // Logout Confirmation Dialog
        if (uiState.showLogoutDialog) {
            AlertDialog(
                onDismissRequest = screenModel::hideLogoutDialog,
                title = { Text(Strings.logout.get(isArabic)) },
                text = { Text(Strings.logoutConfirm.get(isArabic)) },
                confirmButton = {
                    TextButton(onClick = screenModel::logout) {
                        Text(Strings.yes.get(isArabic))
                    }
                },
                dismissButton = {
                    TextButton(onClick = screenModel::hideLogoutDialog) {
                        Text(Strings.no.get(isArabic))
                    }
                }
            )
        }

        Scaffold(
            topBar = {
                TopAppBar(
                    title = { Text(Strings.profile.get(isArabic)) }
                )
            }
        ) { paddingValues ->
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(paddingValues)
                    .padding(16.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                // Profile Avatar
                Surface(
                    modifier = Modifier.size(100.dp),
                    shape = MaterialTheme.shapes.extraLarge,
                    color = MaterialTheme.colorScheme.primaryContainer
                ) {
                    Box(contentAlignment = Alignment.Center) {
                        Icon(
                            Icons.Default.Person,
                            contentDescription = null,
                            modifier = Modifier.size(60.dp),
                            tint = MaterialTheme.colorScheme.onPrimaryContainer
                        )
                    }
                }

                Spacer(modifier = Modifier.height(16.dp))

                // Name
                uiState.profile?.staff?.let { staff ->
                    Text(
                        text = staff.fullName,
                        style = MaterialTheme.typography.headlineSmall
                    )

                    Spacer(modifier = Modifier.height(4.dp))

                    Text(
                        text = staff.email,
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )

                    Spacer(modifier = Modifier.height(4.dp))

                    Surface(
                        color = MaterialTheme.colorScheme.primaryContainer,
                        shape = MaterialTheme.shapes.small
                    ) {
                        Text(
                            text = staff.role.name,
                            modifier = Modifier.padding(horizontal = 12.dp, vertical = 4.dp),
                            style = MaterialTheme.typography.labelMedium,
                            color = MaterialTheme.colorScheme.onPrimaryContainer
                        )
                    }

                    staff.locationName?.let { location ->
                        Spacer(modifier = Modifier.height(8.dp))
                        Row(
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Icon(
                                Icons.Default.LocationOn,
                                contentDescription = null,
                                modifier = Modifier.size(16.dp),
                                tint = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                            Spacer(modifier = Modifier.width(4.dp))
                            Text(
                                text = location.get(isArabic),
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                    }
                }

                Spacer(modifier = Modifier.height(32.dp))

                // Settings Section
                Card(
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        ListItem(
                            headlineContent = { Text(Strings.language.get(isArabic)) },
                            leadingContent = {
                                Icon(Icons.Default.Language, contentDescription = null)
                            },
                            trailingContent = {
                                Text(
                                    text = if (isArabic) "العربية" else "English",
                                    style = MaterialTheme.typography.bodyMedium,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                            }
                        )

                        HorizontalDivider()

                        ListItem(
                            headlineContent = { Text(Strings.version.get(isArabic)) },
                            leadingContent = {
                                Icon(Icons.Default.Info, contentDescription = null)
                            },
                            trailingContent = {
                                Text(
                                    text = "1.0.0",
                                    style = MaterialTheme.typography.bodyMedium,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                            }
                        )
                    }
                }

                Spacer(modifier = Modifier.weight(1f))

                // Logout Button
                OutlinedButton(
                    onClick = screenModel::showLogoutDialog,
                    modifier = Modifier.fillMaxWidth(),
                    colors = ButtonDefaults.outlinedButtonColors(
                        contentColor = MaterialTheme.colorScheme.error
                    ),
                    enabled = !uiState.isLoggingOut
                ) {
                    if (uiState.isLoggingOut) {
                        CircularProgressIndicator(
                            modifier = Modifier.size(24.dp),
                            color = MaterialTheme.colorScheme.error
                        )
                    } else {
                        Icon(Icons.Default.Logout, contentDescription = null)
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(Strings.logout.get(isArabic))
                    }
                }

                Spacer(modifier = Modifier.height(16.dp))
            }
        }
    }
}
