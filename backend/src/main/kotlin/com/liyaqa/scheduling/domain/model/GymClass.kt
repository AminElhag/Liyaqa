package com.liyaqa.scheduling.domain.model

import com.liyaqa.organization.domain.model.AccessGender
import com.liyaqa.organization.domain.model.GenderRestriction
import com.liyaqa.shared.domain.BaseEntity
import com.liyaqa.shared.domain.LocalizedText
import com.liyaqa.shared.domain.Money
import jakarta.persistence.AttributeOverride
import jakarta.persistence.AttributeOverrides
import jakarta.persistence.Column
import jakarta.persistence.Embedded
import jakarta.persistence.Entity
import jakarta.persistence.EnumType
import jakarta.persistence.Enumerated
import jakarta.persistence.Table
import org.hibernate.annotations.Filter
import org.hibernate.annotations.FilterDef
import org.hibernate.annotations.ParamDef
import java.math.BigDecimal
import java.util.UUID

/**
 * Represents a gym class definition (e.g., "Yoga Basics", "HIIT Training").
 * This is the template from which ClassSessions are created.
 */
@Entity
@Table(name = "gym_classes")
@Filter(name = "tenantFilter", condition = "tenant_id = :tenantId")
class GymClass(
    id: UUID = UUID.randomUUID(),

    @Embedded
    @AttributeOverrides(
        AttributeOverride(name = "en", column = Column(name = "name_en", nullable = false)),
        AttributeOverride(name = "ar", column = Column(name = "name_ar"))
    )
    var name: LocalizedText,

    @Embedded
    @AttributeOverrides(
        AttributeOverride(name = "en", column = Column(name = "description_en")),
        AttributeOverride(name = "ar", column = Column(name = "description_ar"))
    )
    var description: LocalizedText? = null,

    @Column(name = "location_id", nullable = false)
    var locationId: UUID,

    @Column(name = "default_trainer_id")
    var defaultTrainerId: UUID? = null,

    @Enumerated(EnumType.STRING)
    @Column(name = "class_type", nullable = false)
    var classType: ClassType = ClassType.GROUP_FITNESS,

    @Enumerated(EnumType.STRING)
    @Column(name = "difficulty_level", nullable = false)
    var difficultyLevel: DifficultyLevel = DifficultyLevel.ALL_LEVELS,

    @Column(name = "duration_minutes", nullable = false)
    var durationMinutes: Int = 60,

    @Column(name = "max_capacity", nullable = false)
    var maxCapacity: Int = 20,

    @Column(name = "waitlist_enabled", nullable = false)
    var waitlistEnabled: Boolean = true,

    @Column(name = "max_waitlist_size", nullable = false)
    var maxWaitlistSize: Int = 5,

    @Column(name = "requires_subscription", nullable = false)
    var requiresSubscription: Boolean = true,

    @Column(name = "deducts_class_from_plan", nullable = false)
    var deductsClassFromPlan: Boolean = true,

    @Column(name = "color_code")
    var colorCode: String? = null,

    @Column(name = "image_url")
    var imageUrl: String? = null,

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    var status: GymClassStatus = GymClassStatus.ACTIVE,

    @Column(name = "sort_order", nullable = false)
    var sortOrder: Int = 0,

    // ==================== GENDER RESTRICTION (Saudi Market) ====================

    /**
     * Gender restriction for this class.
     * null means the class follows the location's gender policy.
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "gender_restriction", length = 20)
    var genderRestriction: GenderRestriction? = null,

    // ==================== PRICING SETTINGS ====================

    /**
     * How this class can be paid for.
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "pricing_model", nullable = false)
    var pricingModel: ClassPricingModel = ClassPricingModel.INCLUDED_IN_MEMBERSHIP,

    /**
     * Price for drop-in/pay-per-entry bookings.
     * Required if pricingModel is PAY_PER_ENTRY or HYBRID.
     */
    @Embedded
    @AttributeOverrides(
        AttributeOverride(name = "amount", column = Column(name = "drop_in_price_amount")),
        AttributeOverride(name = "currency", column = Column(name = "drop_in_price_currency"))
    )
    var dropInPrice: Money? = null,

    /**
     * Tax rate percentage for pricing (e.g., 15.00 for 15% VAT).
     */
    @Column(name = "tax_rate")
    var taxRate: BigDecimal? = BigDecimal("15.00"),

    /**
     * Whether non-subscribers can book this class (requires pay-per-entry or class pack).
     */
    @Column(name = "allow_non_subscribers", nullable = false)
    var allowNonSubscribers: Boolean = false,

    // ==================== BOOKING SETTINGS ====================

    /**
     * How many days in advance members can book this class.
     */
    @Column(name = "advance_booking_days", nullable = false)
    var advanceBookingDays: Int = 7,

    /**
     * Hours before class start when cancellation becomes "late".
     * Late cancellations may incur a fee.
     */
    @Column(name = "cancellation_deadline_hours", nullable = false)
    var cancellationDeadlineHours: Int = 2,

    /**
     * Fee charged for late cancellations.
     * Null means no late cancellation fee.
     */
    @Embedded
    @AttributeOverrides(
        AttributeOverride(name = "amount", column = Column(name = "late_cancel_fee_amount")),
        AttributeOverride(name = "currency", column = Column(name = "late_cancel_fee_currency"))
    )
    var lateCancellationFee: Money? = null,

    // ==================== GX ACCESS POLICY ====================

    /**
     * Who can book this class.
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "access_policy", nullable = false)
    var accessPolicy: ClassAccessPolicy = ClassAccessPolicy.MEMBERS_ONLY,

    /**
     * Number of spots bookable online (rest reserved for walk-ins).
     * Null means all spots are bookable online.
     */
    @Column(name = "online_bookable_spots")
    var onlineBookableSpots: Int? = null,

    /**
     * Fee charged for no-shows.
     */
    @Embedded
    @AttributeOverrides(
        AttributeOverride(name = "amount", column = Column(name = "no_show_fee_amount")),
        AttributeOverride(name = "currency", column = Column(name = "no_show_fee_currency"))
    )
    var noShowFee: Money? = null,

    // ==================== SPOT BOOKING ====================

    /**
     * Whether members pick a specific spot when booking.
     */
    @Column(name = "spot_booking_enabled", nullable = false)
    var spotBookingEnabled: Boolean = false,

    /**
     * Reference to the room layout used for spot booking.
     */
    @Column(name = "room_layout_id")
    var roomLayoutId: UUID? = null,

    // ==================== CLASS CATEGORY ====================

    /**
     * Optional category for per-category class pack credit allocation.
     */
    @Column(name = "category_id")
    var categoryId: UUID? = null,

    // ==================== PERSONAL TRAINING ====================

    /**
     * PT session type: ONE_ON_ONE or SEMI_PRIVATE.
     * Only applicable when classType == PERSONAL_TRAINING.
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "pt_session_type", length = 20)
    var ptSessionType: PTSessionType? = null,

    /**
     * PT location type: CLUB or HOME.
     * Only applicable when classType == PERSONAL_TRAINING.
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "pt_location_type", length = 10)
    var ptLocationType: PTLocationType? = null,

    /**
     * Travel fee for HOME PT sessions.
     */
    @Embedded
    @AttributeOverrides(
        AttributeOverride(name = "amount", column = Column(name = "travel_fee_amount")),
        AttributeOverride(name = "currency", column = Column(name = "travel_fee_currency"))
    )
    var travelFee: Money? = null,

    /**
     * FK to trainers table for PT classes — the assigned trainer.
     */
    @Column(name = "trainer_profile_id")
    var trainerProfileId: UUID? = null,

    /**
     * Minimum number of clients to run the session.
     * For semi-private PT: minimum clients needed.
     */
    @Column(name = "min_capacity", nullable = false)
    var minCapacity: Int = 1

) : BaseEntity(id) {

    /**
     * Checks if the class allows the given gender to book.
     * Returns true if no restriction is set (follows location policy) or if gender matches restriction.
     */
    fun allowsGender(gender: AccessGender): Boolean = when (genderRestriction) {
        null, GenderRestriction.MIXED -> true
        GenderRestriction.MALE_ONLY -> gender == AccessGender.MALE
        GenderRestriction.FEMALE_ONLY -> gender == AccessGender.FEMALE
    }

    /**
     * Activates the class so sessions can be created.
     */
    fun activate() {
        require(status != GymClassStatus.ARCHIVED) { "Cannot activate archived class" }
        status = GymClassStatus.ACTIVE
    }

    /**
     * Deactivates the class. New sessions cannot be created.
     */
    fun deactivate() {
        require(status == GymClassStatus.ACTIVE) { "Only active classes can be deactivated" }
        status = GymClassStatus.INACTIVE
    }

    /**
     * Archives the class permanently.
     */
    fun archive() {
        status = GymClassStatus.ARCHIVED
    }

    /**
     * Checks if the class is active and can have sessions created.
     */
    fun isActive(): Boolean = status == GymClassStatus.ACTIVE

    /**
     * Updates the capacity. Cannot exceed current bookings in existing sessions.
     */
    fun updateCapacity(newCapacity: Int) {
        require(newCapacity > 0) { "Capacity must be positive" }
        maxCapacity = newCapacity
    }

    /**
     * Assigns a default trainer to this class.
     */
    fun assignDefaultTrainer(trainerId: UUID) {
        this.defaultTrainerId = trainerId
    }

    /**
     * Removes the default trainer assignment.
     */
    fun removeDefaultTrainer() {
        this.defaultTrainerId = null
    }

    // ==================== PRICING HELPERS ====================

    /**
     * Checks if this class accepts membership credits as payment.
     */
    fun acceptsMembershipCredits(): Boolean =
        pricingModel == ClassPricingModel.INCLUDED_IN_MEMBERSHIP || pricingModel == ClassPricingModel.HYBRID

    /**
     * Checks if this class accepts class pack credits as payment.
     */
    fun acceptsClassPackCredits(): Boolean =
        pricingModel == ClassPricingModel.CLASS_PACK_ONLY || pricingModel == ClassPricingModel.HYBRID

    /**
     * Checks if this class accepts pay-per-entry payment.
     */
    fun acceptsPayPerEntry(): Boolean =
        pricingModel == ClassPricingModel.PAY_PER_ENTRY || pricingModel == ClassPricingModel.HYBRID

    /**
     * Validates that pricing configuration is consistent.
     * Throws IllegalStateException if configuration is invalid.
     */
    fun validatePricingConfiguration() {
        when (pricingModel) {
            ClassPricingModel.PAY_PER_ENTRY, ClassPricingModel.HYBRID -> {
                requireNotNull(dropInPrice) {
                    "Drop-in price is required for ${pricingModel.name} pricing model"
                }
                require(dropInPrice!!.amount > java.math.BigDecimal.ZERO) {
                    "Drop-in price must be positive"
                }
            }
            else -> { /* No validation needed */ }
        }
    }

    /**
     * Gets the drop-in price with tax included.
     */
    fun getDropInPriceWithTax(): Money? {
        val price = dropInPrice ?: return null
        val rate = taxRate ?: BigDecimal.ZERO
        val taxAmount = price.amount.multiply(rate).divide(BigDecimal("100"), 2, java.math.RoundingMode.HALF_UP)
        return Money(price.amount.add(taxAmount), price.currency)
    }

    // ==================== PT HELPERS ====================

    /**
     * Checks if this class is a personal training class.
     */
    fun isPersonalTraining(): Boolean = classType == ClassType.PERSONAL_TRAINING

    /**
     * Checks if this is a home PT class.
     */
    fun isHomePT(): Boolean = isPersonalTraining() && ptLocationType == PTLocationType.HOME

    /**
     * Checks if this is a semi-private PT class.
     */
    fun isSemiPrivate(): Boolean = isPersonalTraining() && ptSessionType == PTSessionType.SEMI_PRIVATE

    /**
     * Validates PT-specific configuration.
     */
    fun validatePTConfiguration() {
        if (!isPersonalTraining()) return

        requireNotNull(ptSessionType) { "PT session type is required for personal training classes" }
        requireNotNull(ptLocationType) { "PT location type is required for personal training classes" }

        when (ptSessionType) {
            PTSessionType.ONE_ON_ONE -> require(maxCapacity == 1) { "1:1 PT classes must have capacity of 1" }
            PTSessionType.SEMI_PRIVATE -> {
                require(maxCapacity in 2..4) { "Semi-private PT classes must have capacity between 2 and 4" }
                require(minCapacity >= 1) { "Minimum capacity must be at least 1" }
                require(minCapacity <= maxCapacity) { "Minimum capacity cannot exceed max capacity" }
            }
            null -> {} // handled above
        }

        if (ptLocationType == PTLocationType.HOME) {
            // Travel fee is optional but recommended for home PT
        }
    }
}
