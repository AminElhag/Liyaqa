package com.liyaqa.employee.api

import com.liyaqa.employee.application.services.DepartmentService
import com.liyaqa.employee.domain.model.DepartmentStatus
import com.liyaqa.membership.api.PageResponse
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import jakarta.validation.Valid
import org.springframework.data.domain.PageRequest
import org.springframework.data.domain.Sort
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.web.bind.annotation.*
import java.util.UUID

@RestController
@RequestMapping("/api/departments")
@Tag(name = "Departments", description = "Department management - CRUD, hierarchy, manager assignment")
class DepartmentController(
    private val departmentService: DepartmentService
) {

    // ==================== CRUD OPERATIONS ====================

    @PostMapping
    @PreAuthorize("hasAuthority('departments_create')")
    @Operation(summary = "Create a new department")
    fun createDepartment(
        @Valid @RequestBody request: CreateDepartmentRequest
    ): ResponseEntity<DepartmentResponse> {
        val department = departmentService.createDepartment(request.toCommand())
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(DepartmentResponse.from(department))
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('departments_view')")
    @Operation(summary = "Get department by ID")
    fun getDepartment(@PathVariable id: UUID): ResponseEntity<DepartmentResponse> {
        val department = departmentService.getDepartment(id)
        return ResponseEntity.ok(DepartmentResponse.from(department))
    }

    @GetMapping
    @PreAuthorize("hasAuthority('departments_view')")
    @Operation(summary = "List all departments")
    fun getAllDepartments(
        @RequestParam(defaultValue = "0") page: Int,
        @RequestParam(defaultValue = "50") size: Int,
        @RequestParam(defaultValue = "sortOrder") sortBy: String,
        @RequestParam(defaultValue = "ASC") sortDirection: String
    ): ResponseEntity<PageResponse<DepartmentResponse>> {
        val direction = Sort.Direction.valueOf(sortDirection.uppercase())
        val pageable = PageRequest.of(page, size, Sort.by(direction, sortBy))

        val departmentPage = departmentService.getAllDepartments(pageable)

        val response = PageResponse(
            content = departmentPage.content.map { DepartmentResponse.from(it) },
            page = departmentPage.number,
            size = departmentPage.size,
            totalElements = departmentPage.totalElements,
            totalPages = departmentPage.totalPages,
            first = departmentPage.isFirst,
            last = departmentPage.isLast
        )

        return ResponseEntity.ok(response)
    }

    @GetMapping("/tree")
    @PreAuthorize("hasAuthority('departments_view')")
    @Operation(summary = "Get department tree (hierarchical structure)")
    fun getDepartmentTree(): ResponseEntity<List<DepartmentTreeNodeResponse>> {
        val tree = departmentService.getDepartmentTree()
        return ResponseEntity.ok(tree.map { DepartmentTreeNodeResponse.from(it) })
    }

    @GetMapping("/root")
    @PreAuthorize("hasAuthority('departments_view')")
    @Operation(summary = "Get root departments (no parent)")
    fun getRootDepartments(): ResponseEntity<List<DepartmentResponse>> {
        val departments = departmentService.getRootDepartments()
        return ResponseEntity.ok(departments.map { DepartmentResponse.from(it) })
    }

    @GetMapping("/{id}/children")
    @PreAuthorize("hasAuthority('departments_view')")
    @Operation(summary = "Get child departments")
    fun getChildDepartments(@PathVariable id: UUID): ResponseEntity<List<DepartmentResponse>> {
        val departments = departmentService.getChildDepartments(id)
        return ResponseEntity.ok(departments.map { DepartmentResponse.from(it) })
    }

    @GetMapping("/active")
    @PreAuthorize("hasAuthority('departments_view')")
    @Operation(summary = "Get active departments")
    fun getActiveDepartments(): ResponseEntity<List<DepartmentResponse>> {
        val departments = departmentService.getActiveDepartments()
        return ResponseEntity.ok(departments.map { DepartmentResponse.from(it) })
    }

    @PatchMapping("/{id}")
    @PreAuthorize("hasAuthority('departments_update')")
    @Operation(summary = "Update a department")
    fun updateDepartment(
        @PathVariable id: UUID,
        @Valid @RequestBody request: UpdateDepartmentRequest
    ): ResponseEntity<DepartmentResponse> {
        val department = departmentService.updateDepartment(id, request.toCommand())
        return ResponseEntity.ok(DepartmentResponse.from(department))
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('departments_delete')")
    @Operation(summary = "Delete a department", description = "Cannot delete departments with children or employees")
    fun deleteDepartment(@PathVariable id: UUID): ResponseEntity<Void> {
        departmentService.deleteDepartment(id)
        return ResponseEntity.noContent().build()
    }

    // ==================== STATUS MANAGEMENT ====================

    @PostMapping("/{id}/activate")
    @PreAuthorize("hasAuthority('departments_update')")
    @Operation(summary = "Activate a department")
    fun activateDepartment(@PathVariable id: UUID): ResponseEntity<DepartmentResponse> {
        val department = departmentService.activateDepartment(id)
        return ResponseEntity.ok(DepartmentResponse.from(department))
    }

    @PostMapping("/{id}/deactivate")
    @PreAuthorize("hasAuthority('departments_update')")
    @Operation(summary = "Deactivate a department")
    fun deactivateDepartment(@PathVariable id: UUID): ResponseEntity<DepartmentResponse> {
        val department = departmentService.deactivateDepartment(id)
        return ResponseEntity.ok(DepartmentResponse.from(department))
    }

    // ==================== MANAGER MANAGEMENT ====================

    @PostMapping("/{id}/set-manager")
    @PreAuthorize("hasAuthority('departments_update')")
    @Operation(summary = "Set department manager")
    fun setDepartmentManager(
        @PathVariable id: UUID,
        @Valid @RequestBody request: SetDepartmentManagerRequest
    ): ResponseEntity<DepartmentResponse> {
        val department = departmentService.setDepartmentManager(request.toCommand(id))
        return ResponseEntity.ok(DepartmentResponse.from(department))
    }

    @PostMapping("/{id}/clear-manager")
    @PreAuthorize("hasAuthority('departments_update')")
    @Operation(summary = "Clear department manager")
    fun clearDepartmentManager(@PathVariable id: UUID): ResponseEntity<DepartmentResponse> {
        val department = departmentService.clearDepartmentManager(id)
        return ResponseEntity.ok(DepartmentResponse.from(department))
    }

    // ==================== STATISTICS ====================

    @GetMapping("/count")
    @PreAuthorize("hasAuthority('departments_view')")
    @Operation(summary = "Get department count")
    fun getDepartmentCount(): ResponseEntity<Long> {
        return ResponseEntity.ok(departmentService.getDepartmentCount())
    }

    @GetMapping("/stats")
    @PreAuthorize("hasAuthority('departments_view')")
    @Operation(summary = "Get department statistics")
    fun getDepartmentStats(): ResponseEntity<DepartmentStatsResponse> {
        val all = departmentService.getAllDepartments()
        val stats = DepartmentStatsResponse(
            total = all.size.toLong(),
            active = all.count { it.status == DepartmentStatus.ACTIVE }.toLong(),
            inactive = all.count { it.status == DepartmentStatus.INACTIVE }.toLong()
        )
        return ResponseEntity.ok(stats)
    }
}
