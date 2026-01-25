package com.liyaqa.accounts.api

import com.liyaqa.accounts.application.commands.*
import com.liyaqa.accounts.application.services.FamilyGroupService
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*
import java.util.*

@RestController
@RequestMapping("/api/family-groups")
class FamilyGroupController(
    private val familyGroupService: FamilyGroupService
) {

    @PostMapping
    fun createFamilyGroup(@RequestBody request: CreateFamilyGroupRequest): ResponseEntity<FamilyGroupDto> {
        val command = CreateFamilyGroupCommand(
            name = request.name,
            primaryMemberId = request.primaryMemberId,
            maxMembers = request.maxMembers,
            discountPercentage = request.discountPercentage,
            billingType = request.billingType,
            notes = request.notes
        )
        val familyGroup = familyGroupService.createFamilyGroup(command)
        return ResponseEntity.status(HttpStatus.CREATED).body(familyGroup.toDto())
    }

    @GetMapping("/{id}")
    fun getFamilyGroup(@PathVariable id: UUID): ResponseEntity<FamilyGroupDto> {
        val familyGroup = familyGroupService.getFamilyGroup(id)
            ?: return ResponseEntity.notFound().build()
        return ResponseEntity.ok(familyGroup.toDto())
    }

    @GetMapping
    fun listFamilyGroups(pageable: Pageable): ResponseEntity<Page<FamilyGroupSummaryDto>> {
        val page = familyGroupService.listFamilyGroups(pageable)
        return ResponseEntity.ok(page.map { it.toSummaryDto() })
    }

    @GetMapping("/member/{memberId}")
    fun getMemberFamilyGroup(@PathVariable memberId: UUID): ResponseEntity<FamilyGroupDto> {
        val familyGroup = familyGroupService.getMemberFamilyGroup(memberId)
            ?: return ResponseEntity.notFound().build()
        return ResponseEntity.ok(familyGroup.toDto())
    }

    @PutMapping("/{id}")
    fun updateFamilyGroup(
        @PathVariable id: UUID,
        @RequestBody request: UpdateFamilyGroupRequest
    ): ResponseEntity<FamilyGroupDto> {
        val command = UpdateFamilyGroupCommand(
            name = request.name,
            maxMembers = request.maxMembers,
            discountPercentage = request.discountPercentage,
            billingType = request.billingType,
            notes = request.notes
        )
        val familyGroup = familyGroupService.updateFamilyGroup(id, command)
        return ResponseEntity.ok(familyGroup.toDto())
    }

    @PostMapping("/{id}/members")
    fun addMember(
        @PathVariable id: UUID,
        @RequestBody request: AddFamilyMemberRequest
    ): ResponseEntity<FamilyGroupDto> {
        val command = AddFamilyMemberCommand(
            memberId = request.memberId,
            relationship = request.relationship
        )
        val familyGroup = familyGroupService.addMember(id, command)
        return ResponseEntity.ok(familyGroup.toDto())
    }

    @DeleteMapping("/{id}/members/{memberId}")
    fun removeMember(
        @PathVariable id: UUID,
        @PathVariable memberId: UUID
    ): ResponseEntity<FamilyGroupDto> {
        val familyGroup = familyGroupService.removeMember(id, memberId)
        return ResponseEntity.ok(familyGroup.toDto())
    }

    @PostMapping("/{id}/activate")
    fun activateFamilyGroup(@PathVariable id: UUID): ResponseEntity<FamilyGroupDto> {
        val familyGroup = familyGroupService.activateFamilyGroup(id)
        return ResponseEntity.ok(familyGroup.toDto())
    }

    @PostMapping("/{id}/suspend")
    fun suspendFamilyGroup(@PathVariable id: UUID): ResponseEntity<FamilyGroupDto> {
        val familyGroup = familyGroupService.suspendFamilyGroup(id)
        return ResponseEntity.ok(familyGroup.toDto())
    }

    @DeleteMapping("/{id}")
    fun deleteFamilyGroup(@PathVariable id: UUID): ResponseEntity<Void> {
        familyGroupService.deleteFamilyGroup(id)
        return ResponseEntity.noContent().build()
    }
}
