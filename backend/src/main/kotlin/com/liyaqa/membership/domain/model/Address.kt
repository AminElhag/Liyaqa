package com.liyaqa.membership.domain.model

import jakarta.persistence.Column
import jakarta.persistence.Embeddable

@Embeddable
data class Address(
    @Column(name = "street")
    val street: String? = null,

    @Column(name = "city")
    val city: String? = null,

    @Column(name = "state")
    val state: String? = null,

    @Column(name = "postal_code")
    val postalCode: String? = null,

    @Column(name = "country")
    val country: String? = null
) {
    fun toFormattedString(): String {
        return listOfNotNull(street, city, state, postalCode, country)
            .filter { it.isNotBlank() }
            .joinToString(", ")
    }
}
