package com.liyaqa.dashboard.features.member.domain.usecase

import com.liyaqa.dashboard.core.domain.BaseUseCase
import com.liyaqa.dashboard.core.domain.Result
import com.liyaqa.dashboard.features.member.data.repository.MemberRepository

class DeleteMemberUseCase(
    private val repository: MemberRepository
) : BaseUseCase<DeleteMemberUseCase.Params, Unit>() {

    data class Params(val id: String)

    override suspend fun execute(params: Params): Result<Unit> {
        if (params.id.isBlank()) {
            return Result.Error(
                IllegalArgumentException("Member ID cannot be blank"),
                "Member ID cannot be blank"
            )
        }
        return repository.deleteMember(params.id)
    }
}
