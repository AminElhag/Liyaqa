package com.liyaqa.organization.application.commands

import com.liyaqa.organization.domain.model.OrganizationType
import com.liyaqa.shared.domain.LocalizedAddress
import com.liyaqa.shared.domain.LocalizedText
import java.util.UUID

data class CreateOrganizationCommand(
    val name: LocalizedText,
    val tradeName: LocalizedText? = null,
    val organizationType: OrganizationType,
    val email: String? = null,
    val phone: String? = null,
    val website: String? = null,
    val vatRegistrationNumber: String? = null,
    val commercialRegistrationNumber: String? = null,
    val zatcaAddress: LocalizedAddress? = null
)

data class UpdateOrganizationCommand(
    val name: LocalizedText? = null,
    val tradeName: LocalizedText? = null,
    val organizationType: OrganizationType? = null,
    val email: String? = null,
    val phone: String? = null,
    val website: String? = null,
    val vatRegistrationNumber: String? = null,
    val commercialRegistrationNumber: String? = null,
    val zatcaAddress: LocalizedAddress? = null
)

data class CreateClubCommand(
    val organizationId: UUID,
    val name: LocalizedText,
    val description: LocalizedText? = null
)

data class UpdateClubCommand(
    val name: LocalizedText? = null,
    val description: LocalizedText? = null
)

data class CreateLocationCommand(
    val clubId: UUID,
    val name: LocalizedText,
    val address: LocalizedAddress? = null,
    val phone: String? = null,
    val email: String? = null
)

data class UpdateLocationCommand(
    val name: LocalizedText? = null,
    val address: LocalizedAddress? = null,
    val phone: String? = null,
    val email: String? = null
)