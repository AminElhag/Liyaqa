package com.liyaqa.member.ui.screens.profile

import androidx.compose.foundation.background
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
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowForwardIos
import androidx.compose.material.icons.automirrored.outlined.Logout
import androidx.compose.material.icons.filled.CalendarMonth
import androidx.compose.material.icons.filled.Email
import androidx.compose.material.icons.filled.LocationOn
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.Phone
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material.icons.outlined.CardMembership
import androidx.compose.material.icons.outlined.Edit
import androidx.compose.material.icons.outlined.History
import androidx.compose.material.icons.outlined.Lock
import androidx.compose.material.icons.outlined.Notifications
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.pulltorefresh.PullToRefreshBox
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import cafe.adriel.voyager.core.screen.Screen
import cafe.adriel.voyager.navigator.LocalNavigator
import cafe.adriel.voyager.navigator.currentOrThrow
import com.liyaqa.member.domain.model.Address
import com.liyaqa.member.domain.model.EmergencyContact
import com.liyaqa.member.domain.model.Member
import com.liyaqa.member.domain.model.MemberStatus
import com.liyaqa.member.domain.model.Subscription
import com.liyaqa.member.domain.model.SubscriptionStatus
import com.liyaqa.member.presentation.base.LoadingState
import com.liyaqa.member.presentation.viewmodel.ProfileEffect
import com.liyaqa.member.presentation.viewmodel.ProfileIntent
import com.liyaqa.member.presentation.viewmodel.ProfileState
import com.liyaqa.member.presentation.viewmodel.ProfileViewModel
import com.liyaqa.member.ui.components.MemberAvatar
import com.liyaqa.member.ui.components.SubscriptionStatusBadge
import com.liyaqa.member.ui.theme.LocalAppLocale
import kotlinx.datetime.LocalDate
import liyaqamember.shared.generated.resources.Res
import liyaqamember.shared.generated.resources.attendance_title
import liyaqamember.shared.generated.resources.btn_change_password
import liyaqamember.shared.generated.resources.btn_edit_profile
import liyaqamember.shared.generated.resources.btn_logout
import liyaqamember.shared.generated.resources.btn_retry
import liyaqamember.shared.generated.resources.common_loading
import liyaqamember.shared.generated.resources.notifications_settings
import liyaqamember.shared.generated.resources.profile_address
import liyaqamember.shared.generated.resources.profile_emergency_contact
import liyaqamember.shared.generated.resources.profile_personal_info
import liyaqamember.shared.generated.resources.subscriptions_title
import org.jetbrains.compose.resources.stringResource
import org.koin.compose.viewmodel.koinViewModel

/**
 * Profile Screen - Shows member profile and settings.
 *
 * Features:
 * - Profile header with avatar
 * - Personal info card
 * - Address card
 * - Emergency contact card
 * - Active subscription card
 * - Quick action buttons
 * - Logout button
 */
class ProfileScreen : Screen {

    @Composable
    override fun Content() {
        val navigator = LocalNavigator.currentOrThrow
        val viewModel: ProfileViewModel = koinViewModel()
        val state by viewModel.state.collectAsState()

        // Handle effects
        LaunchedEffect(Unit) {
            viewModel.effect.collect { effect ->
                when (effect) {
                    is ProfileEffect.NavigateToEditProfile -> navigator.push(EditProfileScreen())
                    is ProfileEffect.NavigateToNotificationSettings -> {
                        state.member?.id?.let { memberId ->
                            navigator.push(NotificationSettingsScreen(memberId = memberId))
                        }
                    }
                    is ProfileEffect.NavigateToChangePassword -> navigator.push(ChangePasswordScreen())
                    is ProfileEffect.NavigateToSubscriptionHistory -> navigator.push(SubscriptionsScreen())
                    is ProfileEffect.NavigateToAttendanceHistory -> navigator.push(AttendanceHistoryScreen())
                    is ProfileEffect.LoggedOut -> {
                        // Navigate handled by auth state observer
                    }
                    is ProfileEffect.ShowError -> {
                        // TODO: Show snackbar
                    }
                }
            }
        }

        ProfileScreenContent(
            state = state,
            onIntent = viewModel::onIntent
        )
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun ProfileScreenContent(
    state: ProfileState,
    onIntent: (ProfileIntent) -> Unit
) {
    val locale = LocalAppLocale.current

    PullToRefreshBox(
        isRefreshing = state.isRefreshing,
        onRefresh = { onIntent(ProfileIntent.Refresh) },
        modifier = Modifier.fillMaxSize()
    ) {
        when {
            state.loading is LoadingState.Loading && state.member == null -> {
                LoadingContent()
            }
            state.loading is LoadingState.Error && state.member == null -> {
                ErrorContent(
                    message = (state.loading as LoadingState.Error).message,
                    onRetry = { onIntent(ProfileIntent.LoadProfile) }
                )
            }
            else -> {
                Column(
                    modifier = Modifier
                        .fillMaxSize()
                        .verticalScroll(rememberScrollState())
                        .padding(16.dp),
                    verticalArrangement = Arrangement.spacedBy(16.dp)
                ) {
                    // Profile Header
                    ProfileHeader(
                        member = state.member,
                        locale = locale
                    )

                    // Personal Info Card
                    state.member?.let { member ->
                        PersonalInfoCard(
                            member = member,
                            locale = locale
                        )
                    }

                    // Address Card
                    state.member?.address?.let { address ->
                        if (hasAddressData(address)) {
                            AddressCard(
                                address = address,
                                locale = locale
                            )
                        }
                    }

                    // Emergency Contact Card
                    state.member?.emergencyContact?.let { contact ->
                        if (hasEmergencyContactData(contact)) {
                            EmergencyContactCard(
                                contact = contact,
                                locale = locale
                            )
                        }
                    }

                    // Active Subscription Card
                    state.subscription?.let { subscription ->
                        SubscriptionCard(
                            subscription = subscription,
                            locale = locale,
                            onViewHistory = { onIntent(ProfileIntent.NavigateToSubscriptionHistory) }
                        )
                    }

                    // Quick Actions Section
                    QuickActionsSection(
                        locale = locale,
                        onEditProfile = { onIntent(ProfileIntent.NavigateToEditProfile) },
                        onNotificationSettings = { onIntent(ProfileIntent.NavigateToNotificationSettings) },
                        onChangePassword = { onIntent(ProfileIntent.NavigateToChangePassword) },
                        onSubscriptionHistory = { onIntent(ProfileIntent.NavigateToSubscriptionHistory) },
                        onAttendanceHistory = { onIntent(ProfileIntent.NavigateToAttendanceHistory) }
                    )

                    Spacer(modifier = Modifier.height(8.dp))

                    // Logout Button
                    Button(
                        onClick = { onIntent(ProfileIntent.Logout) },
                        modifier = Modifier.fillMaxWidth(),
                        colors = ButtonDefaults.buttonColors(
                            containerColor = MaterialTheme.colorScheme.error
                        )
                    ) {
                        Icon(
                            imageVector = Icons.AutoMirrored.Outlined.Logout,
                            contentDescription = null,
                            modifier = Modifier.size(18.dp)
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(stringResource(Res.string.btn_logout))
                    }

                    Spacer(modifier = Modifier.height(16.dp))
                }
            }
        }
    }
}

@Composable
private fun ProfileHeader(
    member: Member?,
    locale: String
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
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
            MemberAvatar(
                name = member?.fullName ?: "",
                size = 80.dp
            )

            Spacer(modifier = Modifier.height(12.dp))

            Text(
                text = member?.fullName ?: "",
                style = MaterialTheme.typography.titleLarge,
                fontWeight = FontWeight.Bold,
                color = MaterialTheme.colorScheme.onPrimaryContainer
            )

            Text(
                text = member?.email ?: "",
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onPrimaryContainer.copy(alpha = 0.8f)
            )

            if (member?.status != null && member.status != MemberStatus.ACTIVE) {
                Spacer(modifier = Modifier.height(8.dp))
                MemberStatusBadge(status = member.status, locale = locale)
            }
        }
    }
}

@Composable
private fun MemberStatusBadge(
    status: MemberStatus,
    locale: String
) {
    val (backgroundColor, text) = when (status) {
        MemberStatus.ACTIVE -> MaterialTheme.colorScheme.primaryContainer to
                (if (locale == "ar") "نشط" else "Active")
        MemberStatus.SUSPENDED -> MaterialTheme.colorScheme.errorContainer to
                (if (locale == "ar") "معلق" else "Suspended")
        MemberStatus.FROZEN -> MaterialTheme.colorScheme.surfaceVariant to
                (if (locale == "ar") "مجمد" else "Frozen")
        MemberStatus.CANCELLED -> MaterialTheme.colorScheme.errorContainer to
                (if (locale == "ar") "ملغي" else "Cancelled")
        MemberStatus.PENDING -> MaterialTheme.colorScheme.tertiaryContainer to
                (if (locale == "ar") "قيد الانتظار" else "Pending")
    }

    Box(
        modifier = Modifier
            .clip(MaterialTheme.shapes.small)
            .background(backgroundColor)
            .padding(horizontal = 12.dp, vertical = 4.dp)
    ) {
        Text(
            text = text,
            style = MaterialTheme.typography.labelMedium,
            color = MaterialTheme.colorScheme.onSurface
        )
    }
}

@Composable
private fun PersonalInfoCard(
    member: Member,
    locale: String
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surface
        )
    ) {
        Column(
            modifier = Modifier.padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            Text(
                text = stringResource(Res.string.profile_personal_info),
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.SemiBold
            )

            InfoRow(
                icon = Icons.Default.Person,
                label = if (locale == "ar") "الاسم الكامل" else "Full Name",
                value = member.fullName
            )

            HorizontalDivider(color = MaterialTheme.colorScheme.outlineVariant)

            InfoRow(
                icon = Icons.Default.Email,
                label = if (locale == "ar") "البريد الإلكتروني" else "Email",
                value = member.email
            )

            if (!member.phone.isNullOrBlank()) {
                HorizontalDivider(color = MaterialTheme.colorScheme.outlineVariant)
                InfoRow(
                    icon = Icons.Default.Phone,
                    label = if (locale == "ar") "الهاتف" else "Phone",
                    value = member.phone
                )
            }

            member.dateOfBirth?.let { dob ->
                HorizontalDivider(color = MaterialTheme.colorScheme.outlineVariant)
                InfoRow(
                    icon = Icons.Default.CalendarMonth,
                    label = if (locale == "ar") "تاريخ الميلاد" else "Date of Birth",
                    value = formatDate(dob, locale)
                )
            }
        }
    }
}

@Composable
private fun AddressCard(
    address: Address,
    locale: String
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surface
        )
    ) {
        Column(
            modifier = Modifier.padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            Row(
                verticalAlignment = Alignment.CenterVertically
            ) {
                Icon(
                    imageVector = Icons.Default.LocationOn,
                    contentDescription = null,
                    tint = MaterialTheme.colorScheme.primary,
                    modifier = Modifier.size(24.dp)
                )
                Spacer(modifier = Modifier.width(8.dp))
                Text(
                    text = stringResource(Res.string.profile_address),
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.SemiBold
                )
            }

            val addressParts = buildList {
                address.street?.let { street ->
                    val streetText = if (locale == "ar" && street.ar != null) street.ar else street.en
                    if (streetText.isNotBlank()) add(streetText)
                }
                address.city?.let { if (it.isNotBlank()) add(it) }
                address.state?.let { if (it.isNotBlank()) add(it) }
                address.postalCode?.let { if (it.isNotBlank()) add(it) }
                address.country?.let { if (it.isNotBlank()) add(it) }
            }

            Text(
                text = addressParts.joinToString(", "),
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                modifier = Modifier.padding(start = 32.dp)
            )
        }
    }
}

@Composable
private fun EmergencyContactCard(
    contact: EmergencyContact,
    locale: String
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.errorContainer.copy(alpha = 0.3f)
        )
    ) {
        Column(
            modifier = Modifier.padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            Row(
                verticalAlignment = Alignment.CenterVertically
            ) {
                Icon(
                    imageVector = Icons.Default.Warning,
                    contentDescription = null,
                    tint = MaterialTheme.colorScheme.error,
                    modifier = Modifier.size(24.dp)
                )
                Spacer(modifier = Modifier.width(8.dp))
                Text(
                    text = stringResource(Res.string.profile_emergency_contact),
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.SemiBold
                )
            }

            contact.name?.let { name ->
                if (name.isNotBlank()) {
                    Text(
                        text = name,
                        style = MaterialTheme.typography.bodyLarge,
                        modifier = Modifier.padding(start = 32.dp)
                    )
                }
            }

            contact.phone?.let { phone ->
                if (phone.isNotBlank()) {
                    Text(
                        text = phone,
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        modifier = Modifier.padding(start = 32.dp)
                    )
                }
            }
        }
    }
}

@Composable
private fun SubscriptionCard(
    subscription: Subscription,
    locale: String,
    onViewHistory: () -> Unit
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.secondaryContainer.copy(alpha = 0.5f)
        )
    ) {
        Column(
            modifier = Modifier.padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(
                        imageVector = Icons.Outlined.CardMembership,
                        contentDescription = null,
                        tint = MaterialTheme.colorScheme.secondary,
                        modifier = Modifier.size(24.dp)
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(
                        text = if (locale == "ar") "الاشتراك الحالي" else "Active Subscription",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.SemiBold
                    )
                }
                SubscriptionStatusBadge(status = subscription.status)
            }

            Text(
                text = subscription.planName.let {
                    if (locale == "ar" && it.ar != null) it.ar else it.en
                },
                style = MaterialTheme.typography.titleLarge,
                fontWeight = FontWeight.Bold
            )

            // Days remaining progress
            Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Text(
                        text = if (locale == "ar") "الأيام المتبقية" else "Days Remaining",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    Text(
                        text = "${subscription.daysRemaining}",
                        style = MaterialTheme.typography.bodySmall,
                        fontWeight = FontWeight.Bold
                    )
                }
                LinearProgressIndicator(
                    progress = { (subscription.daysRemaining.toFloat() / 30f).coerceIn(0f, 1f) },
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(6.dp)
                        .clip(CircleShape),
                    color = if (subscription.daysRemaining <= 7)
                        MaterialTheme.colorScheme.error
                    else
                        MaterialTheme.colorScheme.secondary
                )
            }

            // Classes remaining (if applicable)
            subscription.classesRemaining?.let { remaining ->
                subscription.totalClasses?.let { total ->
                    Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Text(
                                text = if (locale == "ar") "الحصص المتبقية" else "Classes Remaining",
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                            Text(
                                text = "$remaining / $total",
                                style = MaterialTheme.typography.bodySmall,
                                fontWeight = FontWeight.Bold
                            )
                        }
                        LinearProgressIndicator(
                            progress = { (remaining.toFloat() / total.toFloat()).coerceIn(0f, 1f) },
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(6.dp)
                                .clip(CircleShape),
                            color = MaterialTheme.colorScheme.tertiary
                        )
                    }
                }
            }

            // Expiry warning
            if (subscription.isExpiringSoon) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(MaterialTheme.shapes.small)
                        .background(MaterialTheme.colorScheme.errorContainer)
                        .padding(8.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(
                        imageVector = Icons.Default.Warning,
                        contentDescription = null,
                        tint = MaterialTheme.colorScheme.error,
                        modifier = Modifier.size(16.dp)
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(
                        text = if (locale == "ar")
                            "اشتراكك ينتهي قريباً"
                        else
                            "Your subscription is expiring soon",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.error
                    )
                }
            }

            TextButton(
                onClick = onViewHistory,
                modifier = Modifier.align(Alignment.End)
            ) {
                Text(if (locale == "ar") "عرض السجل" else "View History")
                Icon(
                    imageVector = Icons.AutoMirrored.Filled.ArrowForwardIos,
                    contentDescription = null,
                    modifier = Modifier.size(14.dp)
                )
            }
        }
    }
}

@Composable
private fun QuickActionsSection(
    locale: String,
    onEditProfile: () -> Unit,
    onNotificationSettings: () -> Unit,
    onChangePassword: () -> Unit,
    onSubscriptionHistory: () -> Unit,
    onAttendanceHistory: () -> Unit
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surface
        )
    ) {
        Column {
            QuickActionItem(
                icon = Icons.Outlined.Edit,
                label = stringResource(Res.string.btn_edit_profile),
                onClick = onEditProfile
            )

            HorizontalDivider(color = MaterialTheme.colorScheme.outlineVariant)

            QuickActionItem(
                icon = Icons.Outlined.CardMembership,
                label = stringResource(Res.string.subscriptions_title),
                onClick = onSubscriptionHistory
            )

            HorizontalDivider(color = MaterialTheme.colorScheme.outlineVariant)

            QuickActionItem(
                icon = Icons.Outlined.History,
                label = stringResource(Res.string.attendance_title),
                onClick = onAttendanceHistory
            )

            HorizontalDivider(color = MaterialTheme.colorScheme.outlineVariant)

            QuickActionItem(
                icon = Icons.Outlined.Notifications,
                label = stringResource(Res.string.notifications_settings),
                onClick = onNotificationSettings
            )

            HorizontalDivider(color = MaterialTheme.colorScheme.outlineVariant)

            QuickActionItem(
                icon = Icons.Outlined.Lock,
                label = stringResource(Res.string.btn_change_password),
                onClick = onChangePassword
            )
        }
    }
}

@Composable
private fun QuickActionItem(
    icon: ImageVector,
    label: String,
    onClick: () -> Unit
) {
    Card(
        onClick = onClick,
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surface
        ),
        shape = MaterialTheme.shapes.extraSmall
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                Icon(
                    imageVector = icon,
                    contentDescription = null,
                    tint = MaterialTheme.colorScheme.primary
                )
                Text(
                    text = label,
                    style = MaterialTheme.typography.bodyLarge
                )
            }
            Icon(
                imageVector = Icons.AutoMirrored.Filled.ArrowForwardIos,
                contentDescription = null,
                tint = MaterialTheme.colorScheme.onSurfaceVariant,
                modifier = Modifier.size(16.dp)
            )
        }
    }
}

@Composable
private fun InfoRow(
    icon: ImageVector,
    label: String,
    value: String
) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Icon(
            imageVector = icon,
            contentDescription = null,
            tint = MaterialTheme.colorScheme.primary,
            modifier = Modifier.size(20.dp)
        )
        Spacer(modifier = Modifier.width(12.dp))
        Column {
            Text(
                text = label,
                style = MaterialTheme.typography.labelSmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
            Text(
                text = value,
                style = MaterialTheme.typography.bodyMedium
            )
        }
    }
}

@Composable
private fun LoadingContent() {
    Box(
        modifier = Modifier.fillMaxSize(),
        contentAlignment = Alignment.Center
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            CircularProgressIndicator()
            Text(
                text = stringResource(Res.string.common_loading),
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }
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

private fun hasAddressData(address: Address): Boolean {
    return !address.street?.en.isNullOrBlank() ||
            !address.city.isNullOrBlank() ||
            !address.country.isNullOrBlank()
}

private fun hasEmergencyContactData(contact: EmergencyContact): Boolean {
    return !contact.name.isNullOrBlank() || !contact.phone.isNullOrBlank()
}

private fun formatDate(date: LocalDate, locale: String): String {
    val day = date.dayOfMonth.toString().padStart(2, '0')
    val month = date.monthNumber.toString().padStart(2, '0')
    val year = date.year.toString()
    return if (locale == "ar") "$year/$month/$day" else "$day/$month/$year"
}
