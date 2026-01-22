package com.liyaqa.employee.api

import com.liyaqa.employee.application.services.EmployeeService
import com.liyaqa.employee.domain.model.EmployeeStatus
import com.liyaqa.employee.domain.model.EmploymentType
import com.liyaqa.membership.api.PageResponse
import com.liyaqa.organization.domain.ports.LocationRepository
import com.liyaqa.shared.domain.LocalizedText
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import jakarta.validation.Valid
import org.springframework.data.domain.PageRequest
import org.springframework.data.domain.Sort
import org.springframework.format.annotation.DateTimeFormat
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.web.bind.annotation.*
import java.time.LocalDate
import java.util.UUID

@RestController
@RequestMapping("/api/employees")
@Tag(name = "Employees", description = "Employee management - CRUD, status transitions, location assignments")
class EmployeeController(
    private val employeeService: EmployeeService,
    private val locationRepository: LocationRepository
) {

    // ==================== CRUD OPERATIONS ====================

    @PostMapping
    @PreAuthorize("hasAuthority('employees_create')")
    @Operation(summary = "Create a new employee", description = "Create an employee profile from an existing user")
    fun createEmployee(
        @Valid @RequestBody request: CreateEmployeeRequest
    ): ResponseEntity<EmployeeResponse> {
        val employee = employeeService.createEmployee(request.toCommand())
        val assignments = employeeService.getEmployeeLocationAssignments(employee.id)
        val locationNames = assignments.mapNotNull { assignment ->
            locationRepository.findById(assignment.locationId).orElse(null)?.let { location ->
                assignment.locationId to location.name
            }
        }.toMap()

        val assignmentResponses = assignments.map { assignment ->
            EmployeeLocationAssignmentResponse.from(assignment, locationNames[assignment.locationId])
        }

        return ResponseEntity.status(HttpStatus.CREATED)
            .body(EmployeeResponse.from(employee, assignedLocations = assignmentResponses))
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('employees_view')")
    @Operation(summary = "Get employee by ID")
    fun getEmployee(@PathVariable id: UUID): ResponseEntity<EmployeeResponse> {
        val employee = employeeService.getEmployee(id)
        val assignments = employeeService.getEmployeeLocationAssignments(id)
        val locationNames = getLocationNames(assignments.map { it.locationId })

        val assignmentResponses = assignments.map { assignment ->
            EmployeeLocationAssignmentResponse.from(assignment, locationNames[assignment.locationId])
        }

        return ResponseEntity.ok(EmployeeResponse.from(employee, assignedLocations = assignmentResponses))
    }

    @GetMapping
    @PreAuthorize("hasAuthority('employees_view')")
    @Operation(summary = "List employees with search and filtering")
    fun getAllEmployees(
        @RequestParam(required = false) search: String?,
        @RequestParam(required = false) status: EmployeeStatus?,
        @RequestParam(required = false) departmentId: UUID?,
        @RequestParam(required = false) employmentType: EmploymentType?,
        @RequestParam(defaultValue = "0") page: Int,
        @RequestParam(defaultValue = "20") size: Int,
        @RequestParam(defaultValue = "createdAt") sortBy: String,
        @RequestParam(defaultValue = "DESC") sortDirection: String
    ): ResponseEntity<PageResponse<EmployeeSummaryResponse>> {
        val direction = Sort.Direction.valueOf(sortDirection.uppercase())
        val pageable = PageRequest.of(page, size, Sort.by(direction, sortBy))

        val employeePage = if (search != null || status != null || departmentId != null || employmentType != null) {
            employeeService.searchEmployees(search, status, departmentId, employmentType, pageable)
        } else {
            employeeService.getAllEmployees(pageable)
        }

        val response = PageResponse(
            content = employeePage.content.map { EmployeeSummaryResponse.from(it) },
            page = employeePage.number,
            size = employeePage.size,
            totalElements = employeePage.totalElements,
            totalPages = employeePage.totalPages,
            first = employeePage.isFirst,
            last = employeePage.isLast
        )

        return ResponseEntity.ok(response)
    }

    @PatchMapping("/{id}")
    @PreAuthorize("hasAuthority('employees_update')")
    @Operation(summary = "Update an employee")
    fun updateEmployee(
        @PathVariable id: UUID,
        @Valid @RequestBody request: UpdateEmployeeRequest
    ): ResponseEntity<EmployeeResponse> {
        val employee = employeeService.updateEmployee(id, request.toCommand())
        return ResponseEntity.ok(EmployeeResponse.from(employee))
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('employees_delete')")
    @Operation(summary = "Delete an employee", description = "Only terminated or inactive employees can be deleted")
    fun deleteEmployee(@PathVariable id: UUID): ResponseEntity<Void> {
        employeeService.deleteEmployee(id)
        return ResponseEntity.noContent().build()
    }

    // ==================== STATUS TRANSITIONS ====================

    @PostMapping("/{id}/activate")
    @PreAuthorize("hasAuthority('employees_update')")
    @Operation(summary = "Activate an employee")
    fun activateEmployee(@PathVariable id: UUID): ResponseEntity<EmployeeResponse> {
        val employee = employeeService.activateEmployee(id)
        return ResponseEntity.ok(EmployeeResponse.from(employee))
    }

    @PostMapping("/{id}/deactivate")
    @PreAuthorize("hasAuthority('employees_update')")
    @Operation(summary = "Deactivate an employee")
    fun deactivateEmployee(@PathVariable id: UUID): ResponseEntity<EmployeeResponse> {
        val employee = employeeService.deactivateEmployee(id)
        return ResponseEntity.ok(EmployeeResponse.from(employee))
    }

    @PostMapping("/{id}/set-on-leave")
    @PreAuthorize("hasAuthority('employees_update')")
    @Operation(summary = "Set employee on leave")
    fun setEmployeeOnLeave(@PathVariable id: UUID): ResponseEntity<EmployeeResponse> {
        val employee = employeeService.setEmployeeOnLeave(id)
        return ResponseEntity.ok(EmployeeResponse.from(employee))
    }

    @PostMapping("/{id}/return-from-leave")
    @PreAuthorize("hasAuthority('employees_update')")
    @Operation(summary = "Return employee from leave")
    fun returnEmployeeFromLeave(@PathVariable id: UUID): ResponseEntity<EmployeeResponse> {
        val employee = employeeService.returnEmployeeFromLeave(id)
        return ResponseEntity.ok(EmployeeResponse.from(employee))
    }

    @PostMapping("/{id}/terminate")
    @PreAuthorize("hasAuthority('employees_update')")
    @Operation(summary = "Terminate an employee")
    fun terminateEmployee(
        @PathVariable id: UUID,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) terminationDate: LocalDate?
    ): ResponseEntity<EmployeeResponse> {
        val employee = employeeService.terminateEmployee(id, terminationDate ?: LocalDate.now())
        return ResponseEntity.ok(EmployeeResponse.from(employee))
    }

    // ==================== LOCATION ASSIGNMENTS ====================

    @GetMapping("/{id}/locations")
    @PreAuthorize("hasAuthority('employees_view')")
    @Operation(summary = "Get employee's assigned locations")
    fun getEmployeeLocations(@PathVariable id: UUID): ResponseEntity<List<EmployeeLocationAssignmentResponse>> {
        val assignments = employeeService.getEmployeeLocationAssignments(id)
        val locationNames = getLocationNames(assignments.map { it.locationId })

        val responses = assignments.map { assignment ->
            EmployeeLocationAssignmentResponse.from(assignment, locationNames[assignment.locationId])
        }

        return ResponseEntity.ok(responses)
    }

    @PostMapping("/{id}/locations")
    @PreAuthorize("hasAuthority('employees_update')")
    @Operation(summary = "Assign employee to a location")
    fun assignEmployeeToLocation(
        @PathVariable id: UUID,
        @Valid @RequestBody request: AssignEmployeeToLocationRequest
    ): ResponseEntity<EmployeeLocationAssignmentResponse> {
        val command = com.liyaqa.employee.application.commands.AssignEmployeeToLocationCommand(
            employeeId = id,
            locationId = request.locationId,
            isPrimary = request.isPrimary
        )
        val assignment = employeeService.assignEmployeeToLocation(command)
        val locationName = locationRepository.findById(request.locationId).orElse(null)?.name

        return ResponseEntity.status(HttpStatus.CREATED)
            .body(EmployeeLocationAssignmentResponse.from(assignment, locationName))
    }

    @DeleteMapping("/{id}/locations/{locationId}")
    @PreAuthorize("hasAuthority('employees_update')")
    @Operation(summary = "Remove employee from a location")
    fun removeEmployeeFromLocation(
        @PathVariable id: UUID,
        @PathVariable locationId: UUID
    ): ResponseEntity<Void> {
        employeeService.removeEmployeeFromLocation(id, locationId)
        return ResponseEntity.noContent().build()
    }

    @PostMapping("/{id}/locations/{locationId}/set-primary")
    @PreAuthorize("hasAuthority('employees_update')")
    @Operation(summary = "Set a location as the employee's primary location")
    fun setPrimaryLocation(
        @PathVariable id: UUID,
        @PathVariable locationId: UUID
    ): ResponseEntity<EmployeeLocationAssignmentResponse> {
        val assignment = employeeService.setPrimaryLocation(id, locationId)
        val locationName = locationRepository.findById(locationId).orElse(null)?.name

        return ResponseEntity.ok(EmployeeLocationAssignmentResponse.from(assignment, locationName))
    }

    // ==================== CERTIFICATIONS ====================

    @GetMapping("/expiring-certifications")
    @PreAuthorize("hasAuthority('employees_view')")
    @Operation(summary = "Get employees with expiring certifications")
    fun getExpiringCertifications(
        @RequestParam(defaultValue = "30") daysAhead: Int
    ): ResponseEntity<List<ExpiringCertificationResponse>> {
        val expiring = employeeService.findEmployeesWithExpiringCertifications(daysAhead)

        val responses = expiring.map { exp ->
            ExpiringCertificationResponse(
                employeeId = exp.employeeId,
                employeeName = exp.employeeName,
                certificationName = exp.certificationName,
                expiresAt = exp.expiresAt,
                daysUntilExpiry = java.time.temporal.ChronoUnit.DAYS.between(LocalDate.now(), exp.expiresAt)
            )
        }

        return ResponseEntity.ok(responses)
    }

    // ==================== STATISTICS ====================

    @GetMapping("/count")
    @PreAuthorize("hasAuthority('employees_view')")
    @Operation(summary = "Get employee count")
    fun getEmployeeCount(): ResponseEntity<Long> {
        return ResponseEntity.ok(employeeService.getEmployeeCount())
    }

    @GetMapping("/stats")
    @PreAuthorize("hasAuthority('employees_view')")
    @Operation(summary = "Get employee statistics by status")
    fun getEmployeeStats(): ResponseEntity<EmployeeStatsResponse> {
        val stats = EmployeeStatsResponse(
            total = employeeService.getEmployeeCount(),
            active = employeeService.getEmployeeCountByStatus(EmployeeStatus.ACTIVE),
            inactive = employeeService.getEmployeeCountByStatus(EmployeeStatus.INACTIVE),
            onLeave = employeeService.getEmployeeCountByStatus(EmployeeStatus.ON_LEAVE),
            probation = employeeService.getEmployeeCountByStatus(EmployeeStatus.PROBATION),
            terminated = employeeService.getEmployeeCountByStatus(EmployeeStatus.TERMINATED)
        )
        return ResponseEntity.ok(stats)
    }

    // ==================== HELPERS ====================

    private fun getLocationNames(locationIds: List<UUID>): Map<UUID, LocalizedText> {
        return locationIds.mapNotNull { locId ->
            locationRepository.findById(locId).orElse(null)?.let { location ->
                locId to location.name
            }
        }.toMap()
    }
}
