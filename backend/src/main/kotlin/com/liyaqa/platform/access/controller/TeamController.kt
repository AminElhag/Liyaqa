package com.liyaqa.platform.access.controller

import com.liyaqa.auth.infrastructure.security.JwtUserPrincipal
import com.liyaqa.platform.access.dto.ChangeRoleRequest
import com.liyaqa.platform.access.dto.InviteResponse
import com.liyaqa.platform.access.dto.InviteTeamMemberRequest
import com.liyaqa.platform.access.dto.PasswordResetResponse
import com.liyaqa.platform.access.dto.TeamMemberResponse
import com.liyaqa.platform.access.service.TeamService
import com.liyaqa.platform.domain.model.PlatformPermission
import com.liyaqa.platform.domain.model.PlatformUserRole
import com.liyaqa.platform.domain.model.PlatformUserStatus
import com.liyaqa.platform.infrastructure.security.PlatformSecured
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import jakarta.validation.Valid
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.http.ResponseEntity
import org.springframework.security.core.annotation.AuthenticationPrincipal
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
@RequestMapping("/api/v1/platform/team")
@PlatformSecured
@Tag(name = "Platform Team Management", description = "Team member management with invite and password reset flows")
class TeamController(
    private val teamService: TeamService
) {

    @Operation(summary = "List team members")
    @GetMapping
    @PlatformSecured(permissions = [PlatformPermission.USERS_VIEW])
    fun listMembers(
        @RequestParam(required = false) status: PlatformUserStatus?,
        @RequestParam(required = false) role: PlatformUserRole?,
        @RequestParam(required = false) search: String?,
        pageable: Pageable
    ): ResponseEntity<Page<TeamMemberResponse>> {
        return ResponseEntity.ok(teamService.listMembers(status, role, search, pageable))
    }

    @Operation(summary = "Invite a new team member")
    @PostMapping
    @PlatformSecured(permissions = [PlatformPermission.USERS_CREATE])
    fun inviteMember(
        @Valid @RequestBody request: InviteTeamMemberRequest,
        @AuthenticationPrincipal principal: JwtUserPrincipal
    ): ResponseEntity<InviteResponse> {
        return ResponseEntity.ok(teamService.inviteMember(request, principal.userId))
    }

    @Operation(summary = "Change a team member's role")
    @PutMapping("/{id}/role")
    @PlatformSecured(permissions = [PlatformPermission.USERS_ROLE_ASSIGN])
    fun changeRole(
        @PathVariable id: UUID,
        @Valid @RequestBody request: ChangeRoleRequest
    ): ResponseEntity<Map<String, String>> {
        teamService.changeRole(id, request.role)
        return ResponseEntity.ok(mapOf("message" to "Role updated successfully"))
    }

    @Operation(summary = "Deactivate a team member")
    @PutMapping("/{id}/deactivate")
    @PlatformSecured(permissions = [PlatformPermission.USERS_EDIT])
    fun deactivateUser(
        @PathVariable id: UUID,
        @AuthenticationPrincipal principal: JwtUserPrincipal
    ): ResponseEntity<Map<String, String>> {
        teamService.deactivateUser(id, principal.userId)
        return ResponseEntity.ok(mapOf("message" to "User deactivated successfully"))
    }

    @Operation(summary = "Send password reset email to a team member")
    @PutMapping("/{id}/reset-password")
    @PlatformSecured(permissions = [PlatformPermission.USERS_EDIT])
    fun sendPasswordReset(
        @PathVariable id: UUID,
        @AuthenticationPrincipal principal: JwtUserPrincipal
    ): ResponseEntity<PasswordResetResponse> {
        return ResponseEntity.ok(teamService.sendPasswordReset(id, principal.userId))
    }
}
