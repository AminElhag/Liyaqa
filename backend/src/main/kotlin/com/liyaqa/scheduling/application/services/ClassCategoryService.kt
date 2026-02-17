package com.liyaqa.scheduling.application.services

import com.liyaqa.scheduling.domain.model.ClassCategory
import com.liyaqa.scheduling.domain.ports.ClassCategoryRepository
import com.liyaqa.scheduling.domain.ports.GymClassRepository
import com.liyaqa.shared.domain.LocalizedText
import org.slf4j.LoggerFactory
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.util.UUID

data class CreateClassCategoryCommand(
    val name: LocalizedText,
    val description: LocalizedText? = null,
    val colorCode: String? = null,
    val icon: String? = null,
    val sortOrder: Int = 0
)

data class UpdateClassCategoryCommand(
    val name: LocalizedText? = null,
    val description: LocalizedText? = null,
    val colorCode: String? = null,
    val icon: String? = null,
    val sortOrder: Int? = null
)

@Service
@Transactional
class ClassCategoryService(
    private val classCategoryRepository: ClassCategoryRepository,
    private val gymClassRepository: GymClassRepository
) {
    private val logger = LoggerFactory.getLogger(ClassCategoryService::class.java)

    fun createCategory(command: CreateClassCategoryCommand): ClassCategory {
        val category = ClassCategory(
            name = command.name,
            description = command.description,
            colorCode = command.colorCode,
            icon = command.icon,
            sortOrder = command.sortOrder
        )
        logger.info("Created class category: ${category.name.en}")
        return classCategoryRepository.save(category)
    }

    @Transactional(readOnly = true)
    fun getCategory(id: UUID): ClassCategory {
        return classCategoryRepository.findById(id)
            .orElseThrow { NoSuchElementException("Class category not found: $id") }
    }

    @Transactional(readOnly = true)
    fun getCategories(pageable: Pageable): Page<ClassCategory> {
        return classCategoryRepository.findAll(pageable)
    }

    @Transactional(readOnly = true)
    fun getActiveCategories(): List<ClassCategory> {
        return classCategoryRepository.findByIsActiveTrue()
    }

    fun updateCategory(id: UUID, command: UpdateClassCategoryCommand): ClassCategory {
        val category = classCategoryRepository.findById(id)
            .orElseThrow { NoSuchElementException("Class category not found: $id") }

        command.name?.let { category.name = it }
        command.description?.let { category.description = it }
        command.colorCode?.let { category.colorCode = it }
        command.icon?.let { category.icon = it }
        command.sortOrder?.let { category.sortOrder = it }

        logger.info("Updated class category: $id")
        return classCategoryRepository.save(category)
    }

    fun activateCategory(id: UUID): ClassCategory {
        val category = classCategoryRepository.findById(id)
            .orElseThrow { NoSuchElementException("Class category not found: $id") }
        category.activate()
        logger.info("Activated class category: $id")
        return classCategoryRepository.save(category)
    }

    fun deactivateCategory(id: UUID): ClassCategory {
        val category = classCategoryRepository.findById(id)
            .orElseThrow { NoSuchElementException("Class category not found: $id") }
        category.deactivate()
        logger.info("Deactivated class category: $id")
        return classCategoryRepository.save(category)
    }

    fun deleteCategory(id: UUID) {
        val category = classCategoryRepository.findById(id)
            .orElseThrow { NoSuchElementException("Class category not found: $id") }

        // Check if any classes reference this category
        val classCount = gymClassRepository.countByCategoryId(id)
        require(classCount == 0L) {
            "Cannot delete category with $classCount classes assigned. Reassign or remove category from classes first."
        }

        classCategoryRepository.deleteById(id)
        logger.info("Deleted class category: $id")
    }
}
