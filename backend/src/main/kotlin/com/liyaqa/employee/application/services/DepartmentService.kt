package com.liyaqa.employee.application.services

import com.liyaqa.employee.application.commands.CreateDepartmentCommand
import com.liyaqa.employee.application.commands.SetDepartmentManagerCommand
import com.liyaqa.employee.application.commands.UpdateDepartmentCommand
import com.liyaqa.employee.domain.model.Department
import com.liyaqa.employee.domain.model.DepartmentStatus
import com.liyaqa.employee.domain.ports.DepartmentRepository
import com.liyaqa.employee.domain.ports.EmployeeRepository
import org.slf4j.LoggerFactory
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.util.UUID

/**
 * Service for managing departments.
 *
 * Handles:
 * - Department CRUD operations
 * - Hierarchical department structure (tree)
 * - Manager assignment
 */
@Service
@Transactional
class DepartmentService(
    private val departmentRepository: DepartmentRepository,
    private val employeeRepository: EmployeeRepository
) {
    private val logger = LoggerFactory.getLogger(DepartmentService::class.java)

    // ==================== CRUD OPERATIONS ====================

    /**
     * Create a new department.
     */
    fun createDepartment(command: CreateDepartmentCommand): Department {
        // Verify parent department exists if specified
        command.parentDepartmentId?.let { parentId ->
            require(departmentRepository.existsById(parentId)) {
                "Parent department not found with id: $parentId"
            }
        }

        val department = Department.create(
            name = command.name,
            description = command.description,
            parentDepartmentId = command.parentDepartmentId,
            sortOrder = command.sortOrder
        )

        val saved = departmentRepository.save(department)
        logger.info("Created department ${saved.id}: ${saved.name.en}")
        return saved
    }

    /**
     * Get department by ID.
     */
    @Transactional(readOnly = true)
    fun getDepartment(id: UUID): Department {
        return departmentRepository.findById(id)
            .orElseThrow { NoSuchElementException("Department not found with id: $id") }
    }

    /**
     * Get all departments.
     */
    @Transactional(readOnly = true)
    fun getAllDepartments(): List<Department> {
        return departmentRepository.findAll()
    }

    /**
     * Get all departments with pagination.
     */
    @Transactional(readOnly = true)
    fun getAllDepartments(pageable: Pageable): Page<Department> {
        return departmentRepository.findAll(pageable)
    }

    /**
     * Get active departments.
     */
    @Transactional(readOnly = true)
    fun getActiveDepartments(): List<Department> {
        return departmentRepository.findByStatus(DepartmentStatus.ACTIVE)
    }

    /**
     * Get root departments (no parent).
     */
    @Transactional(readOnly = true)
    fun getRootDepartments(): List<Department> {
        return departmentRepository.findRootDepartments()
    }

    /**
     * Get child departments.
     */
    @Transactional(readOnly = true)
    fun getChildDepartments(parentId: UUID): List<Department> {
        return departmentRepository.findByParentDepartmentId(parentId)
    }

    /**
     * Get department tree (hierarchical structure).
     */
    @Transactional(readOnly = true)
    fun getDepartmentTree(): List<DepartmentTreeNode> {
        val allDepartments = departmentRepository.findAll()
        val departmentMap = allDepartments.associateBy { it.id }

        // Build tree starting from root departments
        val roots = allDepartments.filter { it.parentDepartmentId == null }
            .sortedBy { it.sortOrder }

        return roots.map { buildTreeNode(it, departmentMap) }
    }

    private fun buildTreeNode(
        department: Department,
        allDepartments: Map<UUID, Department>
    ): DepartmentTreeNode {
        val children = allDepartments.values
            .filter { it.parentDepartmentId == department.id }
            .sortedBy { it.sortOrder }
            .map { buildTreeNode(it, allDepartments) }

        val employeeCount = employeeRepository.countByDepartmentId(department.id)

        return DepartmentTreeNode(
            department = department,
            children = children,
            employeeCount = employeeCount
        )
    }

    /**
     * Update a department.
     */
    fun updateDepartment(id: UUID, command: UpdateDepartmentCommand): Department {
        val department = getDepartment(id)

        command.name?.let { department.name = it }
        command.description?.let { department.description = it }
        command.parentDepartmentId?.let { parentId ->
            // Prevent circular reference
            require(parentId != id) { "Department cannot be its own parent" }
            require(departmentRepository.existsById(parentId)) {
                "Parent department not found with id: $parentId"
            }
            // Check for circular reference in hierarchy
            validateNoCircularReference(id, parentId)
            department.setParent(parentId)
        }
        command.sortOrder?.let { department.sortOrder = it }

        val updated = departmentRepository.save(department)
        logger.info("Updated department $id")
        return updated
    }

    private fun validateNoCircularReference(departmentId: UUID, newParentId: UUID) {
        var currentId: UUID? = newParentId
        while (currentId != null) {
            require(currentId != departmentId) {
                "Cannot set parent: would create circular reference"
            }
            val parent = departmentRepository.findById(currentId).orElse(null)
            currentId = parent?.parentDepartmentId
        }
    }

    /**
     * Delete a department.
     */
    fun deleteDepartment(id: UUID) {
        val department = getDepartment(id)

        // Check if department has children
        require(!departmentRepository.existsByParentDepartmentId(id)) {
            "Cannot delete department with child departments"
        }

        // Check if department has employees
        val employeeCount = employeeRepository.countByDepartmentId(id)
        require(employeeCount == 0L) {
            "Cannot delete department with assigned employees"
        }

        departmentRepository.deleteById(id)
        logger.info("Deleted department $id")
    }

    // ==================== STATUS MANAGEMENT ====================

    fun activateDepartment(id: UUID): Department {
        val department = getDepartment(id)
        department.activate()
        val updated = departmentRepository.save(department)
        logger.info("Activated department $id")
        return updated
    }

    fun deactivateDepartment(id: UUID): Department {
        val department = getDepartment(id)
        department.deactivate()
        val updated = departmentRepository.save(department)
        logger.info("Deactivated department $id")
        return updated
    }

    // ==================== MANAGER MANAGEMENT ====================

    fun setDepartmentManager(command: SetDepartmentManagerCommand): Department {
        val department = getDepartment(command.departmentId)

        command.employeeId?.let { empId ->
            require(employeeRepository.existsById(empId)) {
                "Employee not found with id: $empId"
            }
        }

        department.setManager(command.employeeId)
        val updated = departmentRepository.save(department)
        logger.info("Set manager ${command.employeeId} for department ${command.departmentId}")
        return updated
    }

    fun clearDepartmentManager(id: UUID): Department {
        val department = getDepartment(id)
        department.clearManager()
        val updated = departmentRepository.save(department)
        logger.info("Cleared manager for department $id")
        return updated
    }

    // ==================== STATISTICS ====================

    @Transactional(readOnly = true)
    fun getDepartmentCount(): Long {
        return departmentRepository.count()
    }
}

/**
 * Tree node for department hierarchy.
 */
data class DepartmentTreeNode(
    val department: Department,
    val children: List<DepartmentTreeNode>,
    val employeeCount: Long
)
