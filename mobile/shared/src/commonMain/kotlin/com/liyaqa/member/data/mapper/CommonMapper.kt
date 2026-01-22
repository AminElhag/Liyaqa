package com.liyaqa.member.data.mapper

import com.liyaqa.member.core.localization.LocalizedText
import com.liyaqa.member.data.dto.LocalizedTextDto
import kotlinx.datetime.Instant
import kotlinx.datetime.LocalDate
import kotlinx.datetime.LocalTime

/**
 * Common mapping utilities for DTOs to domain models.
 * Provides date/time parsing and common type conversions.
 */

/**
 * Maps LocalizedTextDto to domain LocalizedText.
 */
fun LocalizedTextDto.toDomain(): LocalizedText = LocalizedText(
    en = en,
    ar = ar
)

/**
 * Maps domain LocalizedText to LocalizedTextDto.
 */
fun LocalizedText.toDto(): LocalizedTextDto = LocalizedTextDto(
    en = en,
    ar = ar
)

/**
 * Parses ISO-8601 date string to LocalDate.
 * Expected format: "2024-01-15"
 */
fun String.toLocalDate(): LocalDate = LocalDate.parse(this)

/**
 * Parses ISO-8601 time string to LocalTime.
 * Expected format: "09:30:00" or "09:30"
 */
fun String.toLocalTime(): LocalTime = LocalTime.parse(this)

/**
 * Parses ISO-8601 instant string to Instant.
 * Expected format: "2024-01-15T09:30:00Z"
 */
fun String.toInstant(): Instant = Instant.parse(this)

/**
 * Safely parses a nullable date string.
 */
fun String?.toLocalDateOrNull(): LocalDate? = this?.let { LocalDate.parse(it) }

/**
 * Safely parses a nullable time string.
 */
fun String?.toLocalTimeOrNull(): LocalTime? = this?.let { LocalTime.parse(it) }

/**
 * Safely parses a nullable instant string.
 */
fun String?.toInstantOrNull(): Instant? = this?.let { Instant.parse(it) }
