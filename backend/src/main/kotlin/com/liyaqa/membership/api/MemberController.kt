package com.liyaqa.membership.api

import com.liyaqa.membership.application.commands.CreateMemberCommand
import com.liyaqa.membership.application.commands.UpdateMemberCommand
import com.liyaqa.membership.application.services.MemberService
import jakarta.validation.Valid
import org.springframework.data.domain.PageRequest
import org.springframework.data.domain.Sort
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.PutMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController
import java.util.UUID

@RestController
@RequestMapping("/api/members")
class MemberController(
    private val memberService: MemberService
) {

    @PostMapping
    fun createMember(
        @Valid @RequestBody request: CreateMemberRequest
    ): ResponseEntity<MemberResponse> {
        val command = CreateMemberCommand(
            firstName = request.firstName,
            lastName = request.lastName,
            email = request.email,
            phone = request.phone,
            dateOfBirth = request.dateOfBirth,
            street = request.street,
            city = request.city,
            state = request.state,
            postalCode = request.postalCode,
            country = request.country,
            emergencyContactName = request.emergencyContactName,
            emergencyContactPhone = request.emergencyContactPhone,
            notes = request.notes
        )

        val member = memberService.createMember(command)
        return ResponseEntity.status(HttpStatus.CREATED).body(MemberResponse.from(member))
    }

    @GetMapping("/{id}")
    fun getMember(@PathVariable id: UUID): ResponseEntity<MemberResponse> {
        val member = memberService.getMember(id)
        return ResponseEntity.ok(MemberResponse.from(member))
    }

    @GetMapping
    fun getAllMembers(
        @RequestParam(defaultValue = "0") page: Int,
        @RequestParam(defaultValue = "20") size: Int,
        @RequestParam(defaultValue = "createdAt") sortBy: String,
        @RequestParam(defaultValue = "DESC") sortDirection: String
    ): ResponseEntity<PageResponse<MemberResponse>> {
        val direction = Sort.Direction.valueOf(sortDirection.uppercase())
        val pageable = PageRequest.of(page, size, Sort.by(direction, sortBy))
        val memberPage = memberService.getAllMembers(pageable)

        val response = PageResponse(
            content = memberPage.content.map { MemberResponse.from(it) },
            page = memberPage.number,
            size = memberPage.size,
            totalElements = memberPage.totalElements,
            totalPages = memberPage.totalPages,
            first = memberPage.isFirst,
            last = memberPage.isLast
        )

        return ResponseEntity.ok(response)
    }

    @PutMapping("/{id}")
    fun updateMember(
        @PathVariable id: UUID,
        @Valid @RequestBody request: UpdateMemberRequest
    ): ResponseEntity<MemberResponse> {
        val command = UpdateMemberCommand(
            firstName = request.firstName,
            lastName = request.lastName,
            phone = request.phone,
            dateOfBirth = request.dateOfBirth,
            street = request.street,
            city = request.city,
            state = request.state,
            postalCode = request.postalCode,
            country = request.country,
            emergencyContactName = request.emergencyContactName,
            emergencyContactPhone = request.emergencyContactPhone,
            notes = request.notes
        )

        val member = memberService.updateMember(id, command)
        return ResponseEntity.ok(MemberResponse.from(member))
    }

    @PostMapping("/{id}/suspend")
    fun suspendMember(@PathVariable id: UUID): ResponseEntity<MemberResponse> {
        val member = memberService.suspendMember(id)
        return ResponseEntity.ok(MemberResponse.from(member))
    }

    @PostMapping("/{id}/activate")
    fun activateMember(@PathVariable id: UUID): ResponseEntity<MemberResponse> {
        val member = memberService.activateMember(id)
        return ResponseEntity.ok(MemberResponse.from(member))
    }

    @PostMapping("/{id}/freeze")
    fun freezeMember(@PathVariable id: UUID): ResponseEntity<MemberResponse> {
        val member = memberService.freezeMember(id)
        return ResponseEntity.ok(MemberResponse.from(member))
    }

    @PostMapping("/{id}/unfreeze")
    fun unfreezeMember(@PathVariable id: UUID): ResponseEntity<MemberResponse> {
        val member = memberService.unfreezeMember(id)
        return ResponseEntity.ok(MemberResponse.from(member))
    }

    @PostMapping("/{id}/cancel")
    fun cancelMember(@PathVariable id: UUID): ResponseEntity<MemberResponse> {
        val member = memberService.cancelMember(id)
        return ResponseEntity.ok(MemberResponse.from(member))
    }

    @DeleteMapping("/{id}")
    fun deleteMember(@PathVariable id: UUID): ResponseEntity<Void> {
        memberService.deleteMember(id)
        return ResponseEntity.noContent().build()
    }

    @GetMapping("/count")
    fun countMembers(): ResponseEntity<Map<String, Long>> {
        val count = memberService.countMembers()
        return ResponseEntity.ok(mapOf("count" to count))
    }
}
