package com.liyaqa.employee.api

import com.liyaqa.employee.application.services.DepartmentService
import com.liyaqa.employee.application.services.JobTitleService
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
@RequestMapping("/api/job-titles")
@Tag(name = "Job Titles", description = "Job title management - CRUD, role mapping")
class JobTitleController(
    private val jobTitleService: JobTitleService,
    private val departmentService: DepartmentService
) {

    // ==================== CRUD OPERATIONS ====================

    @PostMapping
    @PreAuthorize("hasAuthority('job_titles_create')")
    @Operation(summary = "Create a new job title")
    fun createJobTitle(
        @Valid @RequestBody request: CreateJobTitleRequest
    ): ResponseEntity<JobTitleResponse> {
        val jobTitle = jobTitleService.createJobTitle(request.toCommand())
        val departmentName = jobTitle.departmentId?.let { deptId ->
            departmentService.getDepartment(deptId).name
        }
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(JobTitleResponse.from(jobTitle, departmentName))
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('job_titles_view')")
    @Operation(summary = "Get job title by ID")
    fun getJobTitle(@PathVariable id: UUID): ResponseEntity<JobTitleResponse> {
        val jobTitle = jobTitleService.getJobTitle(id)
        val departmentName = jobTitle.departmentId?.let { deptId ->
            departmentService.getDepartment(deptId).name
        }
        return ResponseEntity.ok(JobTitleResponse.from(jobTitle, departmentName))
    }

    @GetMapping
    @PreAuthorize("hasAuthority('job_titles_view')")
    @Operation(summary = "List all job titles")
    fun getAllJobTitles(
        @RequestParam(required = false) departmentId: UUID?,
        @RequestParam(required = false) activeOnly: Boolean?,
        @RequestParam(defaultValue = "0") page: Int,
        @RequestParam(defaultValue = "50") size: Int,
        @RequestParam(defaultValue = "sortOrder") sortBy: String,
        @RequestParam(defaultValue = "ASC") sortDirection: String
    ): ResponseEntity<PageResponse<JobTitleSummaryResponse>> {
        val direction = Sort.Direction.valueOf(sortDirection.uppercase())
        val pageable = PageRequest.of(page, size, Sort.by(direction, sortBy))

        // Get job titles based on filters
        val jobTitles = when {
            departmentId != null && activeOnly == true -> {
                jobTitleService.getActiveJobTitlesByDepartment(departmentId)
            }
            departmentId != null -> {
                jobTitleService.getJobTitlesByDepartment(departmentId)
            }
            activeOnly == true -> {
                jobTitleService.getActiveJobTitles()
            }
            else -> {
                // Use paginated version when no filters
                val jobTitlePage = jobTitleService.getAllJobTitles(pageable)
                val departmentNames = getDepartmentNames(jobTitlePage.content.mapNotNull { it.departmentId })

                return ResponseEntity.ok(PageResponse(
                    content = jobTitlePage.content.map {
                        JobTitleSummaryResponse.from(it, departmentNames[it.departmentId])
                    },
                    page = jobTitlePage.number,
                    size = jobTitlePage.size,
                    totalElements = jobTitlePage.totalElements,
                    totalPages = jobTitlePage.totalPages,
                    first = jobTitlePage.isFirst,
                    last = jobTitlePage.isLast
                ))
            }
        }

        // For non-paginated results, wrap in PageResponse
        val departmentNames = getDepartmentNames(jobTitles.mapNotNull { it.departmentId })
        val content = jobTitles.map { JobTitleSummaryResponse.from(it, departmentNames[it.departmentId]) }

        return ResponseEntity.ok(PageResponse(
            content = content,
            page = 0,
            size = content.size,
            totalElements = content.size.toLong(),
            totalPages = 1,
            first = true,
            last = true
        ))
    }

    @GetMapping("/active")
    @PreAuthorize("hasAuthority('job_titles_view')")
    @Operation(summary = "Get active job titles")
    fun getActiveJobTitles(): ResponseEntity<List<JobTitleSummaryResponse>> {
        val jobTitles = jobTitleService.getActiveJobTitles()
        val departmentNames = getDepartmentNames(jobTitles.mapNotNull { it.departmentId })

        val responses = jobTitles.map {
            JobTitleSummaryResponse.from(it, departmentNames[it.departmentId])
        }

        return ResponseEntity.ok(responses)
    }

    @GetMapping("/by-department/{departmentId}")
    @PreAuthorize("hasAuthority('job_titles_view')")
    @Operation(summary = "Get job titles by department")
    fun getJobTitlesByDepartment(
        @PathVariable departmentId: UUID,
        @RequestParam(required = false) activeOnly: Boolean?
    ): ResponseEntity<List<JobTitleSummaryResponse>> {
        val jobTitles = if (activeOnly == true) {
            jobTitleService.getActiveJobTitlesByDepartment(departmentId)
        } else {
            jobTitleService.getJobTitlesByDepartment(departmentId)
        }

        val departmentName = departmentService.getDepartment(departmentId).name
        val responses = jobTitles.map { JobTitleSummaryResponse.from(it, departmentName) }

        return ResponseEntity.ok(responses)
    }

    @PatchMapping("/{id}")
    @PreAuthorize("hasAuthority('job_titles_update')")
    @Operation(summary = "Update a job title")
    fun updateJobTitle(
        @PathVariable id: UUID,
        @Valid @RequestBody request: UpdateJobTitleRequest
    ): ResponseEntity<JobTitleResponse> {
        val jobTitle = jobTitleService.updateJobTitle(id, request.toCommand())
        val departmentName = jobTitle.departmentId?.let { deptId ->
            departmentService.getDepartment(deptId).name
        }
        return ResponseEntity.ok(JobTitleResponse.from(jobTitle, departmentName))
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('job_titles_delete')")
    @Operation(summary = "Delete a job title")
    fun deleteJobTitle(@PathVariable id: UUID): ResponseEntity<Void> {
        jobTitleService.deleteJobTitle(id)
        return ResponseEntity.noContent().build()
    }

    // ==================== STATUS MANAGEMENT ====================

    @PostMapping("/{id}/activate")
    @PreAuthorize("hasAuthority('job_titles_update')")
    @Operation(summary = "Activate a job title")
    fun activateJobTitle(@PathVariable id: UUID): ResponseEntity<JobTitleResponse> {
        val jobTitle = jobTitleService.activateJobTitle(id)
        val departmentName = jobTitle.departmentId?.let { deptId ->
            departmentService.getDepartment(deptId).name
        }
        return ResponseEntity.ok(JobTitleResponse.from(jobTitle, departmentName))
    }

    @PostMapping("/{id}/deactivate")
    @PreAuthorize("hasAuthority('job_titles_update')")
    @Operation(summary = "Deactivate a job title")
    fun deactivateJobTitle(@PathVariable id: UUID): ResponseEntity<JobTitleResponse> {
        val jobTitle = jobTitleService.deactivateJobTitle(id)
        val departmentName = jobTitle.departmentId?.let { deptId ->
            departmentService.getDepartment(deptId).name
        }
        return ResponseEntity.ok(JobTitleResponse.from(jobTitle, departmentName))
    }

    // ==================== STATISTICS ====================

    @GetMapping("/count")
    @PreAuthorize("hasAuthority('job_titles_view')")
    @Operation(summary = "Get job title count")
    fun getJobTitleCount(): ResponseEntity<Long> {
        return ResponseEntity.ok(jobTitleService.getJobTitleCount())
    }

    @GetMapping("/stats")
    @PreAuthorize("hasAuthority('job_titles_view')")
    @Operation(summary = "Get job title statistics")
    fun getJobTitleStats(): ResponseEntity<JobTitleStatsResponse> {
        val all = jobTitleService.getAllJobTitles()
        val stats = JobTitleStatsResponse(
            total = all.size.toLong(),
            active = all.count { it.isActive }.toLong(),
            inactive = all.count { !it.isActive }.toLong()
        )
        return ResponseEntity.ok(stats)
    }

    // ==================== HELPERS ====================

    private fun getDepartmentNames(departmentIds: List<UUID>): Map<UUID, com.liyaqa.shared.domain.LocalizedText> {
        return departmentIds.distinct().mapNotNull { deptId ->
            try {
                deptId to departmentService.getDepartment(deptId).name
            } catch (e: NoSuchElementException) {
                null
            }
        }.toMap()
    }
}
