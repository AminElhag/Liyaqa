package com.liyaqa.organization.domain.model

import com.liyaqa.shared.domain.LocalizedAddress
import jakarta.persistence.AttributeOverride
import jakarta.persistence.AttributeOverrides
import jakarta.persistence.Column
import jakarta.persistence.Embeddable
import jakarta.persistence.Embedded

/**
 * Zatca (Saudi Tax Authority) e-invoicing compliance information.
 * All fields are optional - only required when Zatca integration is enabled.
 *
 * Reference: https://zatca.gov.sa/en/E-Invoicing/Introduction/Pages/What-is-E-invoicing.aspx
 */
@Embeddable
data class ZatcaInfo(
    /**
     * VAT Registration Number (15 digits for Saudi Arabia).
     * Format: 3XXXXXXXXXX00003
     */
    @Column(name = "vat_registration_number", length = 15)
    val vatRegistrationNumber: String? = null,

    /**
     * Commercial Registration Number (CR number).
     * Issued by the Ministry of Commerce.
     */
    @Column(name = "commercial_registration_number", length = 20)
    val commercialRegistrationNumber: String? = null,

    /**
     * Full business address for Zatca compliance.
     * Required fields: street, city, district, postal code, country code
     */
    @Embedded
    @AttributeOverrides(
        AttributeOverride(name = "street.en", column = Column(name = "zatca_street_en")),
        AttributeOverride(name = "street.ar", column = Column(name = "zatca_street_ar")),
        AttributeOverride(name = "building.en", column = Column(name = "zatca_building_en")),
        AttributeOverride(name = "building.ar", column = Column(name = "zatca_building_ar")),
        AttributeOverride(name = "city.en", column = Column(name = "zatca_city_en")),
        AttributeOverride(name = "city.ar", column = Column(name = "zatca_city_ar")),
        AttributeOverride(name = "district.en", column = Column(name = "zatca_district_en")),
        AttributeOverride(name = "district.ar", column = Column(name = "zatca_district_ar")),
        AttributeOverride(name = "postalCode", column = Column(name = "zatca_postal_code")),
        AttributeOverride(name = "countryCode", column = Column(name = "zatca_country_code"))
    )
    val address: LocalizedAddress? = null
) {
    init {
        vatRegistrationNumber?.let {
            require(it.matches(Regex("^[0-9]{15}$"))) {
                "VAT Registration Number must be exactly 15 digits"
            }
        }
    }

    /**
     * Check if all required Zatca fields are present for e-invoicing.
     */
    fun isComplete(): Boolean {
        val addr = address ?: return false
        return vatRegistrationNumber != null &&
               commercialRegistrationNumber != null &&
               addr.street != null &&
               addr.city != null &&
               addr.postalCode != null
    }
}