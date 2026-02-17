package com.liyaqa.scheduling.api

import com.liyaqa.scheduling.application.services.ClassCategoryService
import com.liyaqa.scheduling.application.services.CreateClassCategoryCommand
import com.liyaqa.scheduling.application.services.UpdateClassCategoryCommand
import com.liyaqa.scheduling.domain.model.ClassCategory
import com.liyaqa.shared.domain.LocalizedText
import jakarta.validation.Valid
import jakarta.validation.constraints.NotBlank
import org.springframework.data.domain.PageRequest
import org.springframework.data.domain.Sort
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.PutMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController
import java.time.Instant
import java.util.UUID

// ==================== DTOs ====================

data class CreateClassCategoryRequest(
    @field:NotBlank(message = "Name (English) is required")
    val nameEn: String,
    val nameAr: String? = null,
    val descriptionEn: String? = null,
    val descriptionAr: String? = null,
    val colorCode: String? = null,
    val icon: String? = null,
    val sortOrder: Int = 0
) {
    fun toCommand() = CreateClassCategoryCommand(
        name = LocalizedText(en = nameEn, ar = nameAr),
        description = if (!descriptionEn.isNullOrBlank()) LocalizedText(en = descriptionEn, ar = descriptionAr) else null,
        colorCode = colorCode,
        icon = icon,
        sortOrder = sortOrder
    )
}

data class UpdateClassCategoryRequest(
    val nameEn: String? = null,
    val nameAr: String? = null,
    val descriptionEn: String? = null,
    val descriptionAr: String? = null,
    val colorCode: String? = null,
    val icon: String? = null,
    val sortOrder: Int? = null
) {
    fun toCommand() = UpdateClassCategoryCommand(
        name = if (nameEn != null) LocalizedText(en = nameEn, ar = nameAr) else null,
        description = if (descriptionEn != null) LocalizedText(en = descriptionEn, ar = descriptionAr) else null,
        colorCode = colorCode,
        icon = icon,
        sortOrder = sortOrder
    )
}

data class ClassCategoryResponse(
    val id: UUID,
    val name: LocalizedTextResponse,
    val description: LocalizedTextResponse?,
    val colorCode: String?,
    val icon: String?,
    val sortOrder: Int,
    val isActive: Boolean,
    val createdAt: Instant,
    val updatedAt: Instant
) {
    companion object {
        fun from(category: ClassCategory) = ClassCategoryResponse(
            id = category.id,
            name = LocalizedTextResponse.from(category.name),
            description = LocalizedTextResponse.fromNullable(category.description),
            colorCode = category.colorCode,
            icon = category.icon,
            sortOrder = category.sortOrder,
            isActive = category.isActive,
            createdAt = category.createdAt,
            updatedAt = category.updatedAt
        )
    }
}

// ==================== Controller ====================

@RestController
@RequestMapping("/api/class-categories")
class ClassCategoryController(
    private val classCategoryService: ClassCategoryService
) {

    @PostMapping
    @PreAuthorize("hasAuthority('classes_create')")
    fun createCategory(@Valid @RequestBody request: CreateClassCategoryRequest): ResponseEntity<ClassCategoryResponse> {
        val category = classCategoryService.createCategory(request.toCommand())
        return ResponseEntity.status(HttpStatus.CREATED).body(ClassCategoryResponse.from(category))
    }

    @GetMapping
    @PreAuthorize("hasAuthority('classes_view')")
    fun getCategories(
        @RequestParam(defaultValue = "0") page: Int,
        @RequestParam(defaultValue = "50") size: Int,
        @RequestParam(defaultValue = "sortOrder") sortBy: String,
        @RequestParam(defaultValue = "ASC") sortDirection: String
    ): ResponseEntity<PageResponse<ClassCategoryResponse>> {
        val sort = Sort.by(Sort.Direction.valueOf(sortDirection.uppercase()), sortBy)
        val pageable = PageRequest.of(page, size, sort)
        val categories = classCategoryService.getCategories(pageable)
        return ResponseEntity.ok(PageResponse(
            content = categories.content.map { ClassCategoryResponse.from(it) },
            page = categories.number,
            size = categories.size,
            totalElements = categories.totalElements,
            totalPages = categories.totalPages,
            first = categories.isFirst,
            last = categories.isLast
        ))
    }

    @GetMapping("/active")
    @PreAuthorize("hasAuthority('classes_view')")
    fun getActiveCategories(): ResponseEntity<List<ClassCategoryResponse>> {
        val categories = classCategoryService.getActiveCategories()
        return ResponseEntity.ok(categories.map { ClassCategoryResponse.from(it) })
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('classes_view')")
    fun getCategory(@PathVariable id: UUID): ResponseEntity<ClassCategoryResponse> {
        val category = classCategoryService.getCategory(id)
        return ResponseEntity.ok(ClassCategoryResponse.from(category))
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('classes_create')")
    fun updateCategory(
        @PathVariable id: UUID,
        @Valid @RequestBody request: UpdateClassCategoryRequest
    ): ResponseEntity<ClassCategoryResponse> {
        val category = classCategoryService.updateCategory(id, request.toCommand())
        return ResponseEntity.ok(ClassCategoryResponse.from(category))
    }

    @PostMapping("/{id}/activate")
    @PreAuthorize("hasAuthority('classes_create')")
    fun activateCategory(@PathVariable id: UUID): ResponseEntity<ClassCategoryResponse> {
        val category = classCategoryService.activateCategory(id)
        return ResponseEntity.ok(ClassCategoryResponse.from(category))
    }

    @PostMapping("/{id}/deactivate")
    @PreAuthorize("hasAuthority('classes_create')")
    fun deactivateCategory(@PathVariable id: UUID): ResponseEntity<ClassCategoryResponse> {
        val category = classCategoryService.deactivateCategory(id)
        return ResponseEntity.ok(ClassCategoryResponse.from(category))
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('classes_create')")
    fun deleteCategory(@PathVariable id: UUID): ResponseEntity<Void> {
        classCategoryService.deleteCategory(id)
        return ResponseEntity.noContent().build()
    }
}
