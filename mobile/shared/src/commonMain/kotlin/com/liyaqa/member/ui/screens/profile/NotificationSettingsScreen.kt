package com.liyaqa.member.ui.screens.profile

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.selection.selectable
import androidx.compose.foundation.selection.selectableGroup
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.RadioButton
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Switch
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import cafe.adriel.voyager.core.screen.Screen
import cafe.adriel.voyager.navigator.LocalNavigator
import cafe.adriel.voyager.navigator.currentOrThrow
import com.liyaqa.member.presentation.base.LoadingState
import com.liyaqa.member.presentation.notifications.NotificationSettingsEffect
import com.liyaqa.member.presentation.notifications.NotificationSettingsIntent
import com.liyaqa.member.presentation.notifications.NotificationSettingsState
import com.liyaqa.member.presentation.notifications.NotificationSettingsViewModel
import com.liyaqa.member.presentation.notifications.PreferenceKey
import com.liyaqa.member.ui.components.FullScreenLoading
import com.liyaqa.member.ui.theme.LocalAppLocale
import kotlinx.coroutines.delay
import liyaqamember.shared.generated.resources.Res
import liyaqamember.shared.generated.resources.btn_retry
import liyaqamember.shared.generated.resources.notifications_booking_updates
import liyaqamember.shared.generated.resources.notifications_channels
import liyaqamember.shared.generated.resources.notifications_class_reminders
import liyaqamember.shared.generated.resources.notifications_email
import liyaqamember.shared.generated.resources.notifications_invoice_alerts
import liyaqamember.shared.generated.resources.notifications_language
import liyaqamember.shared.generated.resources.notifications_marketing
import liyaqamember.shared.generated.resources.notifications_push
import liyaqamember.shared.generated.resources.notifications_settings
import liyaqamember.shared.generated.resources.notifications_sms
import liyaqamember.shared.generated.resources.notifications_subscription_reminders
import liyaqamember.shared.generated.resources.notifications_types
import liyaqamember.shared.generated.resources.common_language_arabic
import liyaqamember.shared.generated.resources.common_language_english
import org.jetbrains.compose.resources.stringResource
import org.koin.compose.viewmodel.koinViewModel

/**
 * Screen for managing notification preferences.
 *
 * Features:
 * - Sections with Switch toggles:
 *   - Channels: Email, SMS, Push (In-app always on)
 *   - Types: Subscription reminders, Invoice alerts, Booking updates, Class reminders, Marketing
 * - Preferred language: Radio (English / Arabic)
 * - Auto-save on toggle change
 * - Success indicator on save
 *
 * @param memberId The member ID for loading/saving preferences
 */
data class NotificationSettingsScreen(
    val memberId: String
) : Screen {

    @OptIn(ExperimentalMaterial3Api::class)
    @Composable
    override fun Content() {
        val navigator = LocalNavigator.currentOrThrow
        val viewModel: NotificationSettingsViewModel = koinViewModel()
        val state by viewModel.state.collectAsState()
        val locale = LocalAppLocale.current

        // Track save success for showing indicator
        var showSaveSuccess by remember { mutableStateOf(false) }

        // Load preferences on mount
        LaunchedEffect(memberId) {
            viewModel.onIntent(NotificationSettingsIntent.LoadPreferences(memberId))
        }

        // Handle effects
        LaunchedEffect(Unit) {
            viewModel.effect.collect { effect ->
                when (effect) {
                    is NotificationSettingsEffect.PreferencesSaved -> {
                        showSaveSuccess = true
                        delay(2000)
                        showSaveSuccess = false
                    }
                    is NotificationSettingsEffect.ShowError -> {
                        // TODO: Show snackbar with error.message
                    }
                    is NotificationSettingsEffect.NavigateBack -> {
                        navigator.pop()
                    }
                }
            }
        }

        Scaffold(
            topBar = {
                TopAppBar(
                    title = { Text(stringResource(Res.string.notifications_settings)) },
                    navigationIcon = {
                        IconButton(onClick = { navigator.pop() }) {
                            Icon(
                                imageVector = Icons.AutoMirrored.Filled.ArrowBack,
                                contentDescription = "Back"
                            )
                        }
                    },
                    actions = {
                        // Save indicator
                        if (state.saving) {
                            CircularProgressIndicator(
                                modifier = Modifier
                                    .padding(end = 16.dp)
                                    .size(20.dp),
                                strokeWidth = 2.dp
                            )
                        } else if (showSaveSuccess) {
                            Icon(
                                imageVector = Icons.Default.Check,
                                contentDescription = "Saved",
                                modifier = Modifier.padding(end = 16.dp),
                                tint = MaterialTheme.colorScheme.primary
                            )
                        }
                    },
                    colors = TopAppBarDefaults.topAppBarColors(
                        containerColor = MaterialTheme.colorScheme.surface
                    )
                )
            }
        ) { paddingValues ->
            when {
                state.loading is LoadingState.Loading -> {
                    FullScreenLoading()
                }
                state.loading is LoadingState.Error -> {
                    ErrorContent(
                        message = (state.loading as LoadingState.Error).message,
                        onRetry = { viewModel.onIntent(NotificationSettingsIntent.LoadPreferences(memberId)) }
                    )
                }
                else -> {
                    NotificationSettingsContent(
                        state = state,
                        onIntent = viewModel::onIntent,
                        modifier = Modifier.padding(paddingValues)
                    )
                }
            }
        }
    }
}

@Composable
private fun NotificationSettingsContent(
    state: NotificationSettingsState,
    onIntent: (NotificationSettingsIntent) -> Unit,
    modifier: Modifier = Modifier
) {
    val locale = LocalAppLocale.current

    Column(
        modifier = modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        // Channels Section
        Card(
            modifier = Modifier.fillMaxWidth(),
            colors = CardDefaults.cardColors(
                containerColor = MaterialTheme.colorScheme.surface
            )
        ) {
            Column(
                modifier = Modifier.padding(16.dp)
            ) {
                Text(
                    text = stringResource(Res.string.notifications_channels),
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.SemiBold,
                    modifier = Modifier.padding(bottom = 8.dp)
                )

                Text(
                    text = if (locale == "ar")
                        "اختر كيف تريد تلقي الإشعارات"
                    else
                        "Choose how you want to receive notifications",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    modifier = Modifier.padding(bottom = 16.dp)
                )

                SettingRow(
                    label = stringResource(Res.string.notifications_email),
                    description = if (locale == "ar") "إشعارات عبر البريد الإلكتروني" else "Get notified via email",
                    checked = state.emailEnabled,
                    onCheckedChange = { onIntent(NotificationSettingsIntent.UpdateBooleanPreference(PreferenceKey.EMAIL_ENABLED, it)) },
                    enabled = !state.saving,
                    isSaving = state.savingKey == PreferenceKey.EMAIL_ENABLED
                )
                HorizontalDivider(modifier = Modifier.padding(vertical = 8.dp))

                SettingRow(
                    label = stringResource(Res.string.notifications_sms),
                    description = if (locale == "ar") "إشعارات عبر الرسائل النصية" else "Get notified via SMS",
                    checked = state.smsEnabled,
                    onCheckedChange = { onIntent(NotificationSettingsIntent.UpdateBooleanPreference(PreferenceKey.SMS_ENABLED, it)) },
                    enabled = !state.saving,
                    isSaving = state.savingKey == PreferenceKey.SMS_ENABLED
                )
                HorizontalDivider(modifier = Modifier.padding(vertical = 8.dp))

                SettingRow(
                    label = stringResource(Res.string.notifications_push),
                    description = if (locale == "ar") "إشعارات فورية على الجهاز" else "Push notifications on device",
                    checked = state.pushEnabled,
                    onCheckedChange = { onIntent(NotificationSettingsIntent.UpdateBooleanPreference(PreferenceKey.PUSH_ENABLED, it)) },
                    enabled = !state.saving,
                    isSaving = state.savingKey == PreferenceKey.PUSH_ENABLED
                )

                // In-app always on note
                Spacer(modifier = Modifier.height(8.dp))
                Text(
                    text = if (locale == "ar")
                        "الإشعارات داخل التطبيق تكون دائماً مفعّلة"
                    else
                        "In-app notifications are always enabled",
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        }

        // Types Section
        Card(
            modifier = Modifier.fillMaxWidth(),
            colors = CardDefaults.cardColors(
                containerColor = MaterialTheme.colorScheme.surface
            )
        ) {
            Column(
                modifier = Modifier.padding(16.dp)
            ) {
                Text(
                    text = stringResource(Res.string.notifications_types),
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.SemiBold,
                    modifier = Modifier.padding(bottom = 8.dp)
                )

                Text(
                    text = if (locale == "ar")
                        "اختر أنواع الإشعارات التي تريد تلقيها"
                    else
                        "Choose what types of notifications you want",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    modifier = Modifier.padding(bottom = 16.dp)
                )

                SettingRow(
                    label = stringResource(Res.string.notifications_subscription_reminders),
                    description = if (locale == "ar") "تذكير بانتهاء الاشتراك" else "Reminders about subscription expiry",
                    checked = state.subscriptionReminders,
                    onCheckedChange = { onIntent(NotificationSettingsIntent.UpdateBooleanPreference(PreferenceKey.SUBSCRIPTION_REMINDERS, it)) },
                    enabled = !state.saving,
                    isSaving = state.savingKey == PreferenceKey.SUBSCRIPTION_REMINDERS
                )
                HorizontalDivider(modifier = Modifier.padding(vertical = 8.dp))

                SettingRow(
                    label = stringResource(Res.string.notifications_invoice_alerts),
                    description = if (locale == "ar") "تنبيهات الفواتير والمدفوعات" else "Invoice and payment alerts",
                    checked = state.invoiceAlerts,
                    onCheckedChange = { onIntent(NotificationSettingsIntent.UpdateBooleanPreference(PreferenceKey.INVOICE_ALERTS, it)) },
                    enabled = !state.saving,
                    isSaving = state.savingKey == PreferenceKey.INVOICE_ALERTS
                )
                HorizontalDivider(modifier = Modifier.padding(vertical = 8.dp))

                SettingRow(
                    label = stringResource(Res.string.notifications_booking_updates),
                    description = if (locale == "ar") "تحديثات الحجوزات" else "Booking confirmation and changes",
                    checked = state.bookingUpdates,
                    onCheckedChange = { onIntent(NotificationSettingsIntent.UpdateBooleanPreference(PreferenceKey.BOOKING_UPDATES, it)) },
                    enabled = !state.saving,
                    isSaving = state.savingKey == PreferenceKey.BOOKING_UPDATES
                )
                HorizontalDivider(modifier = Modifier.padding(vertical = 8.dp))

                SettingRow(
                    label = stringResource(Res.string.notifications_class_reminders),
                    description = if (locale == "ar") "تذكير بالحصص قبل 24 ساعة وساعة واحدة" else "24h and 1h class reminders",
                    checked = state.classReminders,
                    onCheckedChange = { onIntent(NotificationSettingsIntent.UpdateBooleanPreference(PreferenceKey.CLASS_REMINDERS, it)) },
                    enabled = !state.saving,
                    isSaving = state.savingKey == PreferenceKey.CLASS_REMINDERS
                )
                HorizontalDivider(modifier = Modifier.padding(vertical = 8.dp))

                SettingRow(
                    label = stringResource(Res.string.notifications_marketing),
                    description = if (locale == "ar") "العروض والأخبار الترويجية" else "Promotional offers and news",
                    checked = state.marketing,
                    onCheckedChange = { onIntent(NotificationSettingsIntent.UpdateBooleanPreference(PreferenceKey.MARKETING, it)) },
                    enabled = !state.saving,
                    isSaving = state.savingKey == PreferenceKey.MARKETING
                )
            }
        }

        // Language Section
        Card(
            modifier = Modifier.fillMaxWidth(),
            colors = CardDefaults.cardColors(
                containerColor = MaterialTheme.colorScheme.surface
            )
        ) {
            Column(
                modifier = Modifier.padding(16.dp)
            ) {
                Text(
                    text = stringResource(Res.string.notifications_language),
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.SemiBold,
                    modifier = Modifier.padding(bottom = 8.dp)
                )

                Text(
                    text = if (locale == "ar")
                        "اختر لغة الإشعارات المفضلة"
                    else
                        "Choose your preferred notification language",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    modifier = Modifier.padding(bottom = 16.dp)
                )

                Column(
                    modifier = Modifier.selectableGroup()
                ) {
                    LanguageOption(
                        label = stringResource(Res.string.common_language_english),
                        selected = state.preferredLanguage == "en",
                        onClick = { onIntent(NotificationSettingsIntent.UpdateLanguage("en")) },
                        enabled = !state.saving,
                        isSaving = state.savingKey == PreferenceKey.PREFERRED_LANGUAGE && state.preferredLanguage == "en"
                    )

                    Spacer(modifier = Modifier.height(8.dp))

                    LanguageOption(
                        label = stringResource(Res.string.common_language_arabic),
                        selected = state.preferredLanguage == "ar",
                        onClick = { onIntent(NotificationSettingsIntent.UpdateLanguage("ar")) },
                        enabled = !state.saving,
                        isSaving = state.savingKey == PreferenceKey.PREFERRED_LANGUAGE && state.preferredLanguage == "ar"
                    )
                }
            }
        }

        Spacer(modifier = Modifier.height(16.dp))
    }
}

@Composable
private fun SettingRow(
    label: String,
    description: String,
    checked: Boolean,
    onCheckedChange: (Boolean) -> Unit,
    enabled: Boolean = true,
    isSaving: Boolean = false
) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Column(
            modifier = Modifier.weight(1f)
        ) {
            Text(
                text = label,
                style = MaterialTheme.typography.bodyLarge
            )
            Text(
                text = description,
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }

        if (isSaving) {
            CircularProgressIndicator(
                modifier = Modifier.size(24.dp),
                strokeWidth = 2.dp
            )
        } else {
            Switch(
                checked = checked,
                onCheckedChange = onCheckedChange,
                enabled = enabled
            )
        }
    }
}

@Composable
private fun LanguageOption(
    label: String,
    selected: Boolean,
    onClick: () -> Unit,
    enabled: Boolean = true,
    isSaving: Boolean = false
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .selectable(
                selected = selected,
                onClick = onClick,
                role = Role.RadioButton,
                enabled = enabled
            )
            .padding(vertical = 8.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        if (isSaving) {
            CircularProgressIndicator(
                modifier = Modifier.size(20.dp),
                strokeWidth = 2.dp
            )
        } else {
            RadioButton(
                selected = selected,
                onClick = null, // handled by Row
                enabled = enabled
            )
        }

        Text(
            text = label,
            style = MaterialTheme.typography.bodyLarge,
            modifier = Modifier.padding(start = 8.dp)
        )
    }
}

@Composable
private fun ErrorContent(
    message: String,
    onRetry: () -> Unit
) {
    Box(
        modifier = Modifier.fillMaxSize(),
        contentAlignment = Alignment.Center
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(16.dp),
            modifier = Modifier.padding(32.dp)
        ) {
            Icon(
                imageVector = Icons.Default.Warning,
                contentDescription = null,
                modifier = Modifier.size(48.dp),
                tint = MaterialTheme.colorScheme.error
            )
            Text(
                text = message,
                style = MaterialTheme.typography.bodyLarge,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                textAlign = TextAlign.Center
            )
            TextButton(onClick = onRetry) {
                Text(stringResource(Res.string.btn_retry))
            }
        }
    }
}
