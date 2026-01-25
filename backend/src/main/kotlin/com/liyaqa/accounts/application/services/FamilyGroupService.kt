package com.liyaqa.accounts.application.services

import com.liyaqa.accounts.application.commands.*
import com.liyaqa.accounts.domain.model.*
import com.liyaqa.accounts.domain.ports.FamilyGroupRepository
import com.liyaqa.membership.domain.ports.MemberRepository
import org.slf4j.LoggerFactory
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.util.*

@Service
@Transactional
class FamilyGroupService(
    private val familyGroupRepository: FamilyGroupRepository,
    private val memberRepository: MemberRepository
) {
    private val logger = LoggerFactory.getLogger(FamilyGroupService::class.java)

    fun createFamilyGroup(command: CreateFamilyGroupCommand): FamilyGroup {
        // Validate primary member exists
        if (!memberRepository.existsById(command.primaryMemberId)) {
            throw NoSuchElementException("Primary member not found: ${command.primaryMemberId}")
        }

        // Check if primary member already has a family group
        if (familyGroupRepository.findByPrimaryMemberId(command.primaryMemberId).isPresent) {
            throw IllegalStateException("Member is already a primary member of another family group")
        }

        val familyGroup = FamilyGroup(
            name = command.name,
            primaryMemberId = command.primaryMemberId,
            maxMembers = command.maxMembers,
            discountPercentage = command.discountPercentage,
            billingType = command.billingType,
            notes = command.notes
        )

        // Add primary member to the group
        familyGroup.addMember(command.primaryMemberId, FamilyRelationship.PRIMARY)

        logger.info("Created family group: ${familyGroup.name}")
        return familyGroupRepository.save(familyGroup)
    }

    fun updateFamilyGroup(id: UUID, command: UpdateFamilyGroupCommand): FamilyGroup {
        val familyGroup = familyGroupRepository.findById(id)
            .orElseThrow { NoSuchElementException("Family group not found: $id") }

        command.name?.let { familyGroup.name = it }
        command.maxMembers?.let { familyGroup.maxMembers = it }
        command.discountPercentage?.let { familyGroup.discountPercentage = it }
        command.billingType?.let { familyGroup.billingType = it }
        command.notes?.let { familyGroup.notes = it }

        logger.info("Updated family group: $id")
        return familyGroupRepository.save(familyGroup)
    }

    @Transactional(readOnly = true)
    fun getFamilyGroup(id: UUID): FamilyGroup? =
        familyGroupRepository.findById(id).orElse(null)

    @Transactional(readOnly = true)
    fun listFamilyGroups(pageable: Pageable): Page<FamilyGroup> =
        familyGroupRepository.findAll(pageable)

    @Transactional(readOnly = true)
    fun getMemberFamilyGroup(memberId: UUID): FamilyGroup? =
        familyGroupRepository.findByMemberId(memberId).orElse(null)

    fun addMember(groupId: UUID, command: AddFamilyMemberCommand): FamilyGroup {
        val familyGroup = familyGroupRepository.findById(groupId)
            .orElseThrow { NoSuchElementException("Family group not found: $groupId") }

        if (!memberRepository.existsById(command.memberId)) {
            throw NoSuchElementException("Member not found: ${command.memberId}")
        }

        // Check if member is already in another family group
        val existingGroup = familyGroupRepository.findByMemberId(command.memberId).orElse(null)
        if (existingGroup != null && existingGroup.id != groupId) {
            throw IllegalStateException("Member is already in another family group")
        }

        familyGroup.addMember(command.memberId, command.relationship)
        logger.info("Added member ${command.memberId} to family group $groupId")

        return familyGroupRepository.save(familyGroup)
    }

    fun removeMember(groupId: UUID, memberId: UUID): FamilyGroup {
        val familyGroup = familyGroupRepository.findById(groupId)
            .orElseThrow { NoSuchElementException("Family group not found: $groupId") }

        familyGroup.removeMember(memberId)
        logger.info("Removed member $memberId from family group $groupId")

        return familyGroupRepository.save(familyGroup)
    }

    fun activateFamilyGroup(id: UUID): FamilyGroup {
        val familyGroup = familyGroupRepository.findById(id)
            .orElseThrow { NoSuchElementException("Family group not found: $id") }
        familyGroup.activate()
        return familyGroupRepository.save(familyGroup)
    }

    fun suspendFamilyGroup(id: UUID): FamilyGroup {
        val familyGroup = familyGroupRepository.findById(id)
            .orElseThrow { NoSuchElementException("Family group not found: $id") }
        familyGroup.suspend()
        return familyGroupRepository.save(familyGroup)
    }

    fun deleteFamilyGroup(id: UUID) {
        if (!familyGroupRepository.existsById(id)) {
            throw NoSuchElementException("Family group not found: $id")
        }
        familyGroupRepository.deleteById(id)
        logger.info("Deleted family group: $id")
    }
}
