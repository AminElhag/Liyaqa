package com.liyaqa.member.data.mapper

import com.liyaqa.member.data.dto.AddressDto
import com.liyaqa.member.data.dto.EmergencyContactDto
import com.liyaqa.member.data.dto.MyProfileDto
import com.liyaqa.member.data.dto.UpdateProfileRequestDto
import com.liyaqa.member.domain.model.Address
import com.liyaqa.member.domain.model.EmergencyContact
import com.liyaqa.member.domain.model.Member
import com.liyaqa.member.domain.model.MemberStatus

/**
 * Mapper functions for Profile-related DTOs to domain models.
 */

/**
 * Maps MyProfileDto to domain Member.
 */
fun MyProfileDto.toDomain(): Member = Member(
    id = id,
    firstName = firstName,
    lastName = lastName,
    fullName = fullName,
    email = email,
    phone = phone,
    dateOfBirth = dateOfBirth?.toLocalDateOrNull(),
    address = address?.toDomain(),
    emergencyContact = emergencyContact?.toDomain(),
    status = try {
        MemberStatus.valueOf(status)
    } catch (e: IllegalArgumentException) {
        MemberStatus.ACTIVE
    }
)

/**
 * Maps AddressDto to domain Address.
 */
fun AddressDto.toDomain(): Address = Address(
    street = street?.toDomain(),
    city = city,
    state = state,
    postalCode = postalCode,
    country = country
)

/**
 * Maps EmergencyContactDto to domain EmergencyContact.
 */
fun EmergencyContactDto.toDomain(): EmergencyContact = EmergencyContact(
    name = name,
    phone = phone
)

/**
 * Creates UpdateProfileRequestDto from domain values.
 */
fun createUpdateProfileRequest(
    firstName: String? = null,
    lastName: String? = null,
    phone: String? = null,
    dateOfBirth: String? = null,
    address: Address? = null,
    emergencyContact: EmergencyContact? = null
): UpdateProfileRequestDto = UpdateProfileRequestDto(
    firstName = firstName,
    lastName = lastName,
    phone = phone,
    dateOfBirth = dateOfBirth,
    address = address?.toDto(),
    emergencyContact = emergencyContact?.toDto()
)

/**
 * Maps domain Address to AddressDto.
 */
fun Address.toDto(): AddressDto = AddressDto(
    street = street?.toDto(),
    city = city,
    state = state,
    postalCode = postalCode,
    country = country
)

/**
 * Maps domain EmergencyContact to EmergencyContactDto.
 */
fun EmergencyContact.toDto(): EmergencyContactDto = EmergencyContactDto(
    name = name,
    phone = phone
)
