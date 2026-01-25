package com.liyaqa.member.presentation.screens.settings

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.DarkMode
import androidx.compose.material.icons.filled.Language
import androidx.compose.material.icons.filled.Notifications
import androidx.compose.material.icons.filled.Security
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Switch
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import cafe.adriel.voyager.core.screen.Screen
import cafe.adriel.voyager.koin.getScreenModel
import cafe.adriel.voyager.navigator.LocalNavigator
import cafe.adriel.voyager.navigator.currentOrThrow
import com.liyaqa.member.presentation.theme.LocalIsArabic
import com.liyaqa.member.presentation.theme.Strings
import com.liyaqa.member.presentation.theme.localized

object SettingsScreen : Screen {
    @OptIn(ExperimentalMaterial3Api::class)
    @Composable
    override fun Content() {
        val navigator = LocalNavigator.currentOrThrow
        val screenModel = getScreenModel<SettingsScreenModel>()
        val state by screenModel.state.collectAsState()
        val isArabic = LocalIsArabic.current

        Scaffold(
            topBar = {
                TopAppBar(
                    title = {
                        Text(
                            text = Strings.settings.localized(),
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
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(paddingValues)
                    .verticalScroll(rememberScrollState())
            ) {
                // Language Section
                SettingsSection(
                    title = Strings.language.localized()
                ) {
                    SettingsItem(
                        icon = Icons.Default.Language,
                        title = Strings.language.localized(),
                        subtitle = if (isArabic) Strings.arabic.ar else Strings.english.en,
                        onClick = screenModel::toggleLanguage
                    )
                }

                // Notifications Section
                SettingsSection(
                    title = if (isArabic) "الإشعارات" else "Notifications"
                ) {
                    SettingsToggleItem(
                        icon = Icons.Default.Notifications,
                        title = if (isArabic) "إشعارات الحجز" else "Booking Notifications",
                        subtitle = if (isArabic) {
                            "تذكيرات الحصص والتحديثات"
                        } else {
                            "Class reminders and updates"
                        },
                        isChecked = state.bookingNotificationsEnabled,
                        onCheckedChange = screenModel::toggleBookingNotifications
                    )

                    SettingsToggleItem(
                        icon = Icons.Default.Notifications,
                        title = if (isArabic) "إشعارات الاشتراك" else "Subscription Notifications",
                        subtitle = if (isArabic) {
                            "تنبيهات انتهاء الصلاحية والتجديد"
                        } else {
                            "Expiry and renewal alerts"
                        },
                        isChecked = state.subscriptionNotificationsEnabled,
                        onCheckedChange = screenModel::toggleSubscriptionNotifications
                    )

                    SettingsToggleItem(
                        icon = Icons.Default.Notifications,
                        title = if (isArabic) "العروض والأخبار" else "Promotions & News",
                        subtitle = if (isArabic) {
                            "عروض خاصة وتحديثات"
                        } else {
                            "Special offers and updates"
                        },
                        isChecked = state.promotionalNotificationsEnabled,
                        onCheckedChange = screenModel::togglePromotionalNotifications
                    )
                }

                // Appearance Section
                SettingsSection(
                    title = if (isArabic) "المظهر" else "Appearance"
                ) {
                    SettingsToggleItem(
                        icon = Icons.Default.DarkMode,
                        title = if (isArabic) "الوضع الداكن" else "Dark Mode",
                        subtitle = if (isArabic) {
                            "استخدام المظهر الداكن"
                        } else {
                            "Use dark theme"
                        },
                        isChecked = state.darkModeEnabled,
                        onCheckedChange = screenModel::toggleDarkMode
                    )
                }

                // Security Section
                SettingsSection(
                    title = if (isArabic) "الأمان" else "Security"
                ) {
                    SettingsToggleItem(
                        icon = Icons.Default.Security,
                        title = if (isArabic) "تسجيل الدخول البيومتري" else "Biometric Login",
                        subtitle = if (isArabic) {
                            "استخدام البصمة أو الوجه لتسجيل الدخول"
                        } else {
                            "Use fingerprint or face to login"
                        },
                        isChecked = state.biometricEnabled,
                        onCheckedChange = screenModel::toggleBiometric
                    )
                }

                // App Info Section
                SettingsSection(
                    title = if (isArabic) "معلومات التطبيق" else "App Info"
                ) {
                    SettingsInfoItem(
                        title = if (isArabic) "الإصدار" else "Version",
                        value = state.appVersion
                    )
                }

                Spacer(modifier = Modifier.height(32.dp))
            }
        }
    }
}

@Composable
private fun SettingsSection(
    title: String,
    content: @Composable () -> Unit
) {
    Column(modifier = Modifier.padding(top = 16.dp)) {
        Text(
            text = title,
            style = MaterialTheme.typography.titleSmall,
            fontWeight = FontWeight.SemiBold,
            color = MaterialTheme.colorScheme.primary,
            modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp)
        )
        content()
    }
}

@Composable
private fun SettingsItem(
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    title: String,
    subtitle: String,
    onClick: () -> Unit
) {
    androidx.compose.material3.Surface(
        onClick = onClick,
        color = MaterialTheme.colorScheme.surface
    ) {
        androidx.compose.foundation.layout.Row(
            modifier = Modifier
                .padding(16.dp)
                .fillMaxSize(),
            verticalAlignment = androidx.compose.ui.Alignment.CenterVertically
        ) {
            Icon(
                imageVector = icon,
                contentDescription = null,
                tint = MaterialTheme.colorScheme.onSurfaceVariant
            )
            androidx.compose.foundation.layout.Spacer(modifier = Modifier.padding(8.dp))
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = title,
                    style = MaterialTheme.typography.bodyLarge
                )
                Text(
                    text = subtitle,
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
            Icon(
                imageVector = Icons.AutoMirrored.Filled.ArrowBack,
                contentDescription = null,
                tint = MaterialTheme.colorScheme.onSurfaceVariant,
                modifier = Modifier.padding(start = 8.dp)
            )
        }
    }
}

@Composable
private fun SettingsToggleItem(
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    title: String,
    subtitle: String,
    isChecked: Boolean,
    onCheckedChange: (Boolean) -> Unit
) {
    androidx.compose.foundation.layout.Row(
        modifier = Modifier
            .padding(16.dp)
            .fillMaxSize(),
        verticalAlignment = androidx.compose.ui.Alignment.CenterVertically
    ) {
        Icon(
            imageVector = icon,
            contentDescription = null,
            tint = MaterialTheme.colorScheme.onSurfaceVariant
        )
        androidx.compose.foundation.layout.Spacer(modifier = Modifier.padding(8.dp))
        Column(modifier = Modifier.weight(1f)) {
            Text(
                text = title,
                style = MaterialTheme.typography.bodyLarge
            )
            Text(
                text = subtitle,
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }
        Switch(
            checked = isChecked,
            onCheckedChange = onCheckedChange
        )
    }
}

@Composable
private fun SettingsInfoItem(
    title: String,
    value: String
) {
    androidx.compose.foundation.layout.Row(
        modifier = Modifier
            .padding(16.dp)
            .fillMaxSize(),
        verticalAlignment = androidx.compose.ui.Alignment.CenterVertically
    ) {
        Text(
            text = title,
            style = MaterialTheme.typography.bodyLarge,
            modifier = Modifier.weight(1f)
        )
        Text(
            text = value,
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )
    }
}
