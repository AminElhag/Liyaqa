package com.liyaqa.membership.api

import com.liyaqa.membership.domain.model.Address
import com.liyaqa.membership.domain.model.Member
import com.liyaqa.membership.domain.model.MemberStatus
import jakarta.validation.constraints.Email
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Size
import java.time.Instant
import java.time.LocalDate
import java.util.UUID

data class CreateMemberRequest(
    @field:NotBlank(message = "First name is required")
    @field:Size(min = 1, max = 100, message = "First name must be between 1 and 100 characters")
    val firstName: String,

    @field:NotBlank(message = "Last name is required")
    @field:Size(min = 1, max = 100, message = "Last name must be between 1 and 100 characters")
    val lastName: String,

    @field:NotBlank(message = "Email is required")
    @field:Email(message = "Email must be valid")
    val email: String,

    val phone: String? = null,
    val dateOfBirth: LocalDate? = null,
    val street: String? = null,
    val city: String? = null,
    val state: String? = null,
    val postalCode: String? = null,
    val country: String? = null,
    val emergencyContactName: String? = null,
    val emergencyContactPhone: String? = null,
    val notes: String? = null
)

data class UpdateMemberRequest(
    @field:Size(min = 1, max = 100, message = "First name must be between 1 and 100 characters")
    val firstName: String? = null,

    @field:Size(min = 1, max = 100, message = "Last name must be between 1 and 100 characters")
    val lastName: String? = null,

    val phone: String? = null,
    val dateOfBirth: LocalDate? = null,
    val street: String? = null,
    val city: String? = null,
    val state: String? = null,
    val postalCode: String? = null,
    val country: String? = null,
    val emergencyContactName: String? = null,
    val emergencyContactPhone: String? = null,
    val notes: String? = null
)

data class MemberResponse(
    val id: UUID,
    val firstName: String,
    val lastName: String,
    val fullName: String,
    val email: String,
    val phone: String?,
    val dateOfBirth: LocalDate?,
    val status: MemberStatus,
    val address: AddressResponse?,
    val emergencyContactName: String?,
    val emergencyContactPhone: String?,
    val notes: String?,
    val createdAt: Instant,
    val updatedAt: Instant
) {
    companion object {
        fun from(member: Member): MemberResponse = MemberResponse(
            id = member.id,
            firstName = member.firstName,
            lastName = member.lastName,
            fullName = member.fullName,
            email = member.email,
            phone = member.phone,
            dateOfBirth = member.dateOfBirth,
            status = member.status,
            address = member.address?.let { AddressResponse.from(it) },
            emergencyContactName = member.emergencyContactName,
            emergencyContactPhone = member.emergencyContactPhone,
            notes = member.notes,
            createdAt = member.createdAt,
            updatedAt = member.updatedAt
        )
    }
}

data class AddressResponse(
    val street: String?,
    val city: String?,
    val state: String?,
    val postalCode: String?,
    val country: String?,
    val formatted: String
) {
    companion object {
        fun from(address: Address): AddressResponse = AddressResponse(
            street = address.street,
            city = address.city,
            state = address.state,
            postalCode = address.postalCode,
            country = address.country,
            formatted = address.toFormattedString()
        )
    }
}

data class PageResponse<T>(
    val content: List<T>,
    val page: Int,
    val size: Int,
    val totalElements: Long,
    val totalPages: Int,
    val first: Boolean,
    val last: Boolean
)
