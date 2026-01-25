package com.liyaqa.staff.domain.model

import kotlinx.serialization.Serializable

@Serializable
data class LocalizedText(
    val en: String,
    val ar: String? = null
) {
    fun get(isArabic: Boolean): String = if (isArabic) ar ?: en else en
}
