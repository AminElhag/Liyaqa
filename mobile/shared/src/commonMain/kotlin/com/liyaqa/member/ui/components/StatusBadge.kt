package com.liyaqa.member.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.liyaqa.member.domain.model.AttendanceStatus
import com.liyaqa.member.domain.model.BookingStatus
import com.liyaqa.member.domain.model.InvoiceStatus
import com.liyaqa.member.domain.model.MemberStatus
import com.liyaqa.member.domain.model.SubscriptionStatus
import com.liyaqa.member.ui.theme.LocalAppLocale

/**
 * Badge colors for different status types.
 */
object BadgeColors {
    // Success - Green
    val successBackground = Color(0xFFDCFCE7)
    val successText = Color(0xFF166534)

    // Error - Red
    val errorBackground = Color(0xFFFEE2E2)
    val errorText = Color(0xFFDC2626)

    // Warning - Amber/Yellow
    val warningBackground = Color(0xFFFEF3C7)
    val warningText = Color(0xFFD97706)

    // Info - Blue
    val infoBackground = Color(0xFFDBEAFE)
    val infoText = Color(0xFF1E40AF)

    // Neutral - Gray
    val neutralBackground = Color(0xFFF1F5F9)
    val neutralText = Color(0xFF475569)
}

/**
 * Base badge composable used by all status badges.
 */
@Composable
fun StatusBadge(
    text: String,
    backgroundColor: Color,
    textColor: Color,
    modifier: Modifier = Modifier
) {
    Box(
        modifier = modifier
            .clip(RoundedCornerShape(4.dp))
            .background(backgroundColor)
            .padding(horizontal = 8.dp, vertical = 4.dp)
    ) {
        Text(
            text = text,
            style = MaterialTheme.typography.labelSmall,
            fontWeight = FontWeight.Medium,
            color = textColor
        )
    }
}

// ============================================
// Subscription Status Badge
// ============================================

@Composable
fun SubscriptionStatusBadge(
    status: SubscriptionStatus,
    modifier: Modifier = Modifier
) {
    val locale = LocalAppLocale.current
    val (backgroundColor, textColor) = when (status) {
        SubscriptionStatus.ACTIVE -> BadgeColors.successBackground to BadgeColors.successText
        SubscriptionStatus.EXPIRED -> BadgeColors.errorBackground to BadgeColors.errorText
        SubscriptionStatus.CANCELLED -> BadgeColors.errorBackground to BadgeColors.errorText
        SubscriptionStatus.FROZEN -> BadgeColors.infoBackground to BadgeColors.infoText
        SubscriptionStatus.PENDING_PAYMENT -> BadgeColors.warningBackground to BadgeColors.warningText
    }

    val text = when (locale) {
        "ar" -> when (status) {
            SubscriptionStatus.ACTIVE -> "نشط"
            SubscriptionStatus.EXPIRED -> "منتهي"
            SubscriptionStatus.CANCELLED -> "ملغي"
            SubscriptionStatus.FROZEN -> "مجمد"
            SubscriptionStatus.PENDING_PAYMENT -> "في انتظار الدفع"
        }
        else -> when (status) {
            SubscriptionStatus.ACTIVE -> "Active"
            SubscriptionStatus.EXPIRED -> "Expired"
            SubscriptionStatus.CANCELLED -> "Cancelled"
            SubscriptionStatus.FROZEN -> "Frozen"
            SubscriptionStatus.PENDING_PAYMENT -> "Pending Payment"
        }
    }

    StatusBadge(
        text = text,
        backgroundColor = backgroundColor,
        textColor = textColor,
        modifier = modifier
    )
}

// ============================================
// Booking Status Badge
// ============================================

@Composable
fun BookingStatusBadge(
    status: BookingStatus,
    modifier: Modifier = Modifier
) {
    val locale = LocalAppLocale.current
    val (backgroundColor, textColor) = when (status) {
        BookingStatus.CONFIRMED -> BadgeColors.successBackground to BadgeColors.successText
        BookingStatus.WAITLISTED -> BadgeColors.warningBackground to BadgeColors.warningText
        BookingStatus.CHECKED_IN -> BadgeColors.infoBackground to BadgeColors.infoText
        BookingStatus.NO_SHOW -> BadgeColors.errorBackground to BadgeColors.errorText
        BookingStatus.CANCELLED -> BadgeColors.neutralBackground to BadgeColors.neutralText
    }

    val text = when (locale) {
        "ar" -> when (status) {
            BookingStatus.CONFIRMED -> "مؤكد"
            BookingStatus.WAITLISTED -> "قائمة الانتظار"
            BookingStatus.CHECKED_IN -> "تم الدخول"
            BookingStatus.NO_SHOW -> "لم يحضر"
            BookingStatus.CANCELLED -> "ملغي"
        }
        else -> when (status) {
            BookingStatus.CONFIRMED -> "Confirmed"
            BookingStatus.WAITLISTED -> "Waitlisted"
            BookingStatus.CHECKED_IN -> "Checked In"
            BookingStatus.NO_SHOW -> "No Show"
            BookingStatus.CANCELLED -> "Cancelled"
        }
    }

    StatusBadge(
        text = text,
        backgroundColor = backgroundColor,
        textColor = textColor,
        modifier = modifier
    )
}

// ============================================
// Invoice Status Badge
// ============================================

@Composable
fun InvoiceStatusBadge(
    status: InvoiceStatus,
    modifier: Modifier = Modifier
) {
    val locale = LocalAppLocale.current
    val (backgroundColor, textColor) = when (status) {
        InvoiceStatus.PAID -> BadgeColors.successBackground to BadgeColors.successText
        InvoiceStatus.ISSUED -> BadgeColors.infoBackground to BadgeColors.infoText
        InvoiceStatus.PARTIALLY_PAID -> BadgeColors.warningBackground to BadgeColors.warningText
        InvoiceStatus.OVERDUE -> BadgeColors.errorBackground to BadgeColors.errorText
        InvoiceStatus.CANCELLED -> BadgeColors.neutralBackground to BadgeColors.neutralText
        InvoiceStatus.REFUNDED -> BadgeColors.neutralBackground to BadgeColors.neutralText
        InvoiceStatus.DRAFT -> BadgeColors.neutralBackground to BadgeColors.neutralText
    }

    val text = when (locale) {
        "ar" -> when (status) {
            InvoiceStatus.PAID -> "مدفوع"
            InvoiceStatus.ISSUED -> "صادر"
            InvoiceStatus.PARTIALLY_PAID -> "مدفوع جزئياً"
            InvoiceStatus.OVERDUE -> "متأخر"
            InvoiceStatus.CANCELLED -> "ملغي"
            InvoiceStatus.REFUNDED -> "مسترد"
            InvoiceStatus.DRAFT -> "مسودة"
        }
        else -> when (status) {
            InvoiceStatus.PAID -> "Paid"
            InvoiceStatus.ISSUED -> "Issued"
            InvoiceStatus.PARTIALLY_PAID -> "Partially Paid"
            InvoiceStatus.OVERDUE -> "Overdue"
            InvoiceStatus.CANCELLED -> "Cancelled"
            InvoiceStatus.REFUNDED -> "Refunded"
            InvoiceStatus.DRAFT -> "Draft"
        }
    }

    StatusBadge(
        text = text,
        backgroundColor = backgroundColor,
        textColor = textColor,
        modifier = modifier
    )
}

// ============================================
// Attendance Status Badge
// ============================================

@Composable
fun AttendanceStatusBadge(
    status: AttendanceStatus,
    modifier: Modifier = Modifier
) {
    val locale = LocalAppLocale.current
    val (backgroundColor, textColor) = when (status) {
        AttendanceStatus.CHECKED_IN -> BadgeColors.successBackground to BadgeColors.successText
        AttendanceStatus.CHECKED_OUT -> BadgeColors.neutralBackground to BadgeColors.neutralText
        AttendanceStatus.AUTO_CHECKED_OUT -> BadgeColors.warningBackground to BadgeColors.warningText
    }

    val text = when (locale) {
        "ar" -> when (status) {
            AttendanceStatus.CHECKED_IN -> "تم الدخول"
            AttendanceStatus.CHECKED_OUT -> "تم الخروج"
            AttendanceStatus.AUTO_CHECKED_OUT -> "خروج تلقائي"
        }
        else -> when (status) {
            AttendanceStatus.CHECKED_IN -> "Checked In"
            AttendanceStatus.CHECKED_OUT -> "Checked Out"
            AttendanceStatus.AUTO_CHECKED_OUT -> "Auto Checked Out"
        }
    }

    StatusBadge(
        text = text,
        backgroundColor = backgroundColor,
        textColor = textColor,
        modifier = modifier
    )
}

// ============================================
// Member Status Badge
// ============================================

@Composable
fun MemberStatusBadge(
    status: MemberStatus,
    modifier: Modifier = Modifier
) {
    val locale = LocalAppLocale.current
    val (backgroundColor, textColor) = when (status) {
        MemberStatus.ACTIVE -> BadgeColors.successBackground to BadgeColors.successText
        MemberStatus.SUSPENDED -> BadgeColors.errorBackground to BadgeColors.errorText
        MemberStatus.FROZEN -> BadgeColors.infoBackground to BadgeColors.infoText
        MemberStatus.CANCELLED -> BadgeColors.neutralBackground to BadgeColors.neutralText
        MemberStatus.PENDING -> BadgeColors.warningBackground to BadgeColors.warningText
    }

    val text = when (locale) {
        "ar" -> when (status) {
            MemberStatus.ACTIVE -> "نشط"
            MemberStatus.SUSPENDED -> "معلق"
            MemberStatus.FROZEN -> "مجمد"
            MemberStatus.CANCELLED -> "ملغي"
            MemberStatus.PENDING -> "قيد الانتظار"
        }
        else -> when (status) {
            MemberStatus.ACTIVE -> "Active"
            MemberStatus.SUSPENDED -> "Suspended"
            MemberStatus.FROZEN -> "Frozen"
            MemberStatus.CANCELLED -> "Cancelled"
            MemberStatus.PENDING -> "Pending"
        }
    }

    StatusBadge(
        text = text,
        backgroundColor = backgroundColor,
        textColor = textColor,
        modifier = modifier
    )
}
