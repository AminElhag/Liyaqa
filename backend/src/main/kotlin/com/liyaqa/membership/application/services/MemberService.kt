package com.liyaqa.membership.application.services

import com.liyaqa.membership.application.commands.CreateMemberCommand
import com.liyaqa.membership.application.commands.UpdateMemberCommand
import com.liyaqa.membership.domain.model.Address
import com.liyaqa.membership.domain.model.Member
import com.liyaqa.membership.domain.model.MemberStatus
import com.liyaqa.membership.domain.ports.MemberRepository
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.util.UUID

@Service
@Transactional
class MemberService(
    private val memberRepository: MemberRepository
) {

    fun createMember(command: CreateMemberCommand): Member {
        require(!memberRepository.existsByEmail(command.email)) {
            "A member with email ${command.email} already exists"
        }

        val member = Member(
            firstName = command.firstName,
            lastName = command.lastName,
            email = command.email,
            phone = command.phone,
            dateOfBirth = command.dateOfBirth,
            address = if (hasAddress(command)) {
                Address(
                    street = command.street,
                    city = command.city,
                    state = command.state,
                    postalCode = command.postalCode,
                    country = command.country
                )
            } else null,
            emergencyContactName = command.emergencyContactName,
            emergencyContactPhone = command.emergencyContactPhone,
            notes = command.notes,
            status = MemberStatus.ACTIVE
        )

        return memberRepository.save(member)
    }

    @Transactional(readOnly = true)
    fun getMember(id: UUID): Member {
        return memberRepository.findById(id)
            .orElseThrow { NoSuchElementException("Member not found with id: $id") }
    }

    @Transactional(readOnly = true)
    fun getMemberByEmail(email: String): Member {
        return memberRepository.findByEmail(email)
            .orElseThrow { NoSuchElementException("Member not found with email: $email") }
    }

    @Transactional(readOnly = true)
    fun getAllMembers(pageable: Pageable): Page<Member> {
        return memberRepository.findAll(pageable)
    }

    fun updateMember(id: UUID, command: UpdateMemberCommand): Member {
        val member = getMember(id)

        command.firstName?.let { member.firstName = it }
        command.lastName?.let { member.lastName = it }
        command.phone?.let { member.phone = it }
        command.dateOfBirth?.let { member.dateOfBirth = it }
        command.emergencyContactName?.let { member.emergencyContactName = it }
        command.emergencyContactPhone?.let { member.emergencyContactPhone = it }
        command.notes?.let { member.notes = it }

        if (hasAddressUpdate(command)) {
            member.address = Address(
                street = command.street ?: member.address?.street,
                city = command.city ?: member.address?.city,
                state = command.state ?: member.address?.state,
                postalCode = command.postalCode ?: member.address?.postalCode,
                country = command.country ?: member.address?.country
            )
        }

        return memberRepository.save(member)
    }

    fun suspendMember(id: UUID): Member {
        val member = getMember(id)
        member.suspend()
        return memberRepository.save(member)
    }

    fun activateMember(id: UUID): Member {
        val member = getMember(id)
        member.activate()
        return memberRepository.save(member)
    }

    fun freezeMember(id: UUID): Member {
        val member = getMember(id)
        member.freeze()
        return memberRepository.save(member)
    }

    fun unfreezeMember(id: UUID): Member {
        val member = getMember(id)
        member.unfreeze()
        return memberRepository.save(member)
    }

    fun cancelMember(id: UUID): Member {
        val member = getMember(id)
        member.cancel()
        return memberRepository.save(member)
    }

    fun deleteMember(id: UUID) {
        memberRepository.deleteById(id)
    }

    @Transactional(readOnly = true)
    fun countMembers(): Long {
        return memberRepository.count()
    }

    private fun hasAddress(command: CreateMemberCommand): Boolean {
        return listOf(
            command.street,
            command.city,
            command.state,
            command.postalCode,
            command.country
        ).any { !it.isNullOrBlank() }
    }

    private fun hasAddressUpdate(command: UpdateMemberCommand): Boolean {
        return listOf(
            command.street,
            command.city,
            command.state,
            command.postalCode,
            command.country
        ).any { it != null }
    }
}
