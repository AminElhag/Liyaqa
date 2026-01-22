package com.liyaqa.organization.domain.model

/**
 * Gender policy for locations in Saudi Arabia.
 * Saudi regulations often require gender separation in fitness facilities.
 */
enum class GenderPolicy {
    /** Location is open to all genders at all times */
    MIXED,

    /** Location is exclusively for male members */
    MALE_ONLY,

    /** Location is exclusively for female members */
    FEMALE_ONLY,

    /** Location switches between male and female based on time schedule */
    TIME_BASED
}

/**
 * Gender restriction for gym classes.
 */
enum class GenderRestriction {
    /** Class is open to all genders */
    MIXED,

    /** Class is exclusively for male members */
    MALE_ONLY,

    /** Class is exclusively for female members */
    FEMALE_ONLY
}

/**
 * Gender type for access control purposes.
 * Used in gender schedules and access validation.
 * Note: This is distinct from trainer.domain.model.Gender which includes OTHER and PREFER_NOT_TO_SAY.
 */
enum class AccessGender {
    MALE,
    FEMALE;

    companion object {
        /**
         * Converts from trainer Gender to AccessGender.
         * Returns null for OTHER and PREFER_NOT_TO_SAY.
         */
        fun fromTrainerGender(gender: com.liyaqa.trainer.domain.model.Gender?): AccessGender? = when (gender) {
            com.liyaqa.trainer.domain.model.Gender.MALE -> MALE
            com.liyaqa.trainer.domain.model.Gender.FEMALE -> FEMALE
            else -> null
        }
    }
}
