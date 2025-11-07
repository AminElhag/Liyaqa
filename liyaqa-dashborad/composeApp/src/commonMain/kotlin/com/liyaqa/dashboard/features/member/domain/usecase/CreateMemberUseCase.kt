package com.liyaqa.dashboard.features.member.domain.usecase

import com.liyaqa.dashboard.core.domain.BaseUseCase
import com.liyaqa.dashboard.core.domain.Result
import com.liyaqa.dashboard.features.member.data.dto.CreateMemberRequest
import com.liyaqa.dashboard.features.member.data.dto.toDto
import com.liyaqa.dashboard.features.member.data.repository.MemberRepository
import com.liyaqa.dashboard.features.member.domain.model.EmergencyContact
import com.liyaqa.dashboard.features.member.domain.model.Member

class CreateMemberUseCase(
    private val repository: MemberRepository
) : BaseUseCase<CreateMemberUseCase.Params, Member>() {

    data class Params(
        val firstName: String,
        val lastName: String,
        val email: String,
        val phoneNumber: String? = null,
        val dateOfBirth: String? = null,
        val gender: String? = null,
        val address: String? = null,
        val emergencyContact: EmergencyContact? = null,
        val notes: String? = null
    )

    override suspend fun execute(params: Params): Result<Member> {
        // Validation
        if (params.firstName.isBlank()) {
            return Result.Error(
                IllegalArgumentException("First name cannot be blank"),
                "First name cannot be blank"
            )
        }
        if (params.lastName.isBlank()) {
            return Result.Error(
                IllegalArgumentException("Last name cannot be blank"),
                "Last name cannot be blank"
            )
        }
        if (params.email.isBlank()) {
            return Result.Error(
                IllegalArgumentException("Email cannot be blank"),
                "Email cannot be blank"
            )
        }

        val request = CreateMemberRequest(
            firstName = params.firstName,
            lastName = params.lastName,
            email = params.email,
            phoneNumber = params.phoneNumber,
            dateOfBirth = params.dateOfBirth,
            gender = params.gender,
            address = params.address,
            emergencyContact = params.emergencyContact?.toDto(),
            notes = params.notes
        )

        return repository.createMember(request)
    }
}
