package com.liyaqa.membership.application.commands

import java.time.LocalDate

data class CreateMemberCommand(
    val firstName: String,
    val lastName: String,
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

data class UpdateMemberCommand(
    val firstName: String? = null,
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
