package com.liyaqa.scheduling.domain.model

import com.liyaqa.shared.domain.BaseEntity
import com.liyaqa.shared.domain.Money
import jakarta.persistence.AttributeOverride
import jakarta.persistence.AttributeOverrides
import jakarta.persistence.Column
import jakarta.persistence.Embedded
import jakarta.persistence.Entity
import jakarta.persistence.Table
import org.hibernate.annotations.Filter
import java.math.BigDecimal
import java.util.UUID

/**
 * Per-tenant GX (Group Exercise) settings.
 * Stores default configuration values for class booking, cancellation,
 * waitlist management, and prayer time blocking.
 */
@Entity
@Table(name = "gx_settings")
@Filter(name = "tenantFilter", condition = "tenant_id = :tenantId")
class GxSettings(
    id: UUID = UUID.randomUUID(),

    @Column(name = "default_booking_window_days", nullable = false)
    var defaultBookingWindowDays: Int = 7,

    @Column(name = "default_cancellation_deadline_hours", nullable = false)
    var defaultCancellationDeadlineHours: Int = 4,

    @Embedded
    @AttributeOverrides(
        AttributeOverride(name = "amount", column = Column(name = "default_late_cancellation_fee_amount", nullable = false)),
        AttributeOverride(name = "currency", column = Column(name = "default_late_cancellation_fee_currency", nullable = false))
    )
    var defaultLateCancellationFee: Money = Money(BigDecimal.ZERO, "SAR"),

    @Embedded
    @AttributeOverrides(
        AttributeOverride(name = "amount", column = Column(name = "default_no_show_fee_amount", nullable = false)),
        AttributeOverride(name = "currency", column = Column(name = "default_no_show_fee_currency", nullable = false))
    )
    var defaultNoShowFee: Money = Money(BigDecimal.ZERO, "SAR"),

    @Column(name = "walkin_reserve_spots", nullable = false)
    var walkinReserveSpots: Int = 0,

    @Column(name = "auto_mark_no_shows", nullable = false)
    var autoMarkNoShows: Boolean = true,

    @Column(name = "pre_class_reminder_minutes", nullable = false)
    var preClassReminderMinutes: Int = 60,

    @Column(name = "waitlist_auto_promote", nullable = false)
    var waitlistAutoPromote: Boolean = true,

    @Column(name = "waitlist_notification_channel", nullable = false)
    var waitlistNotificationChannel: String = "SMS_PUSH",

    @Column(name = "prayer_time_blocking_enabled", nullable = false)
    var prayerTimeBlockingEnabled: Boolean = true

) : BaseEntity(id)
