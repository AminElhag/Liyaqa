package com.liyaqa.scheduling.application.services

import com.liyaqa.scheduling.domain.model.ClassPack
import com.liyaqa.scheduling.domain.model.ClassPackAllocationMode
import com.liyaqa.scheduling.domain.model.ClassPackBalanceStatus
import com.liyaqa.scheduling.domain.model.ClassPackCategoryAllocation
import com.liyaqa.scheduling.domain.model.ClassPackStatus
import com.liyaqa.scheduling.domain.model.GymClass
import com.liyaqa.scheduling.domain.model.MemberCategoryBalance
import com.liyaqa.scheduling.domain.model.MemberClassPackBalance
import com.liyaqa.scheduling.domain.ports.ClassCategoryRepository
import com.liyaqa.scheduling.domain.ports.ClassPackCategoryAllocationRepository
import com.liyaqa.scheduling.domain.ports.ClassPackRepository
import com.liyaqa.scheduling.domain.ports.GymClassRepository
import com.liyaqa.scheduling.domain.ports.MemberCategoryBalanceRepository
import com.liyaqa.scheduling.domain.ports.MemberClassPackBalanceRepository
import com.liyaqa.shared.domain.LocalizedText
import com.liyaqa.shared.domain.Money
import org.slf4j.LoggerFactory
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.scheduling.annotation.Scheduled
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.math.BigDecimal
import java.time.Instant
import java.util.UUID

/**
 * Commands for class pack operations.
 */
data class CategoryAllocationInput(
    val categoryId: UUID,
    val creditCount: Int
)

data class CreateClassPackCommand(
    val name: LocalizedText,
    val description: LocalizedText? = null,
    val classCount: Int,
    val price: Money,
    val taxRate: BigDecimal = BigDecimal("15.00"),
    val validityDays: Int? = null,
    val validClassTypes: List<String>? = null,
    val validClassIds: List<UUID>? = null,
    val sortOrder: Int = 0,
    val imageUrl: String? = null,
    val allocationMode: ClassPackAllocationMode = ClassPackAllocationMode.FLAT,
    val categoryAllocations: List<CategoryAllocationInput>? = null
)

data class UpdateClassPackCommand(
    val name: LocalizedText? = null,
    val description: LocalizedText? = null,
    val classCount: Int? = null,
    val price: Money? = null,
    val taxRate: BigDecimal? = null,
    val validityDays: Int? = null,
    val validClassTypes: List<String>? = null,
    val validClassIds: List<UUID>? = null,
    val sortOrder: Int? = null,
    val imageUrl: String? = null,
    val allocationMode: ClassPackAllocationMode? = null,
    val categoryAllocations: List<CategoryAllocationInput>? = null
)

/**
 * Service for managing class packs and member balances.
 */
@Service
@Transactional
class ClassPackService(
    private val classPackRepository: ClassPackRepository,
    private val balanceRepository: MemberClassPackBalanceRepository,
    private val gymClassRepository: GymClassRepository,
    private val allocationRepository: ClassPackCategoryAllocationRepository,
    private val categoryBalanceRepository: MemberCategoryBalanceRepository,
    private val classCategoryRepository: ClassCategoryRepository
) {
    private val logger = LoggerFactory.getLogger(ClassPackService::class.java)

    // ==================== CLASS PACK CRUD ====================

    /**
     * Creates a new class pack.
     */
    fun createClassPack(command: CreateClassPackCommand): ClassPack {
        require(command.classCount > 0) { "Class count must be positive" }
        require(command.price.amount >= BigDecimal.ZERO) { "Price cannot be negative" }

        // Validate PER_CATEGORY allocations
        if (command.allocationMode == ClassPackAllocationMode.PER_CATEGORY) {
            val allocations = command.categoryAllocations
            require(!allocations.isNullOrEmpty()) { "Category allocations are required for PER_CATEGORY mode" }
            val sum = allocations.sumOf { it.creditCount }
            require(sum == command.classCount) {
                "Category allocation sum ($sum) must equal class count (${command.classCount})"
            }
            // Validate all categories exist
            allocations.forEach { alloc ->
                require(classCategoryRepository.existsById(alloc.categoryId)) {
                    "Category not found: ${alloc.categoryId}"
                }
            }
            // No duplicate categories
            val distinctCategories = allocations.map { it.categoryId }.distinct()
            require(distinctCategories.size == allocations.size) {
                "Duplicate categories in allocations"
            }
        }

        val classPack = ClassPack(
            name = command.name,
            description = command.description,
            classCount = command.classCount,
            price = command.price,
            taxRate = command.taxRate,
            validityDays = command.validityDays,
            validClassTypes = command.validClassTypes?.joinToString(","),
            validClassIds = command.validClassIds?.joinToString(",") { it.toString() },
            sortOrder = command.sortOrder,
            imageUrl = command.imageUrl,
            allocationMode = command.allocationMode
        )

        val savedPack = classPackRepository.save(classPack)

        // Save category allocations if PER_CATEGORY
        if (command.allocationMode == ClassPackAllocationMode.PER_CATEGORY) {
            command.categoryAllocations!!.forEach { alloc ->
                allocationRepository.save(
                    ClassPackCategoryAllocation(
                        classPackId = savedPack.id,
                        categoryId = alloc.categoryId,
                        creditCount = alloc.creditCount
                    )
                )
            }
        }

        logger.info("Created class pack: ${savedPack.name.en} with ${savedPack.classCount} classes (${savedPack.allocationMode})")
        return savedPack
    }

    /**
     * Gets a class pack by ID.
     */
    @Transactional(readOnly = true)
    fun getClassPack(id: UUID): ClassPack {
        return classPackRepository.findById(id)
            .orElseThrow { NoSuchElementException("Class pack not found: $id") }
    }

    /**
     * Gets all class packs with pagination.
     */
    @Transactional(readOnly = true)
    fun getClassPacks(pageable: Pageable): Page<ClassPack> {
        return classPackRepository.findAll(pageable)
    }

    /**
     * Gets active class packs sorted by sort order.
     */
    @Transactional(readOnly = true)
    fun getActiveClassPacks(): List<ClassPack> {
        return classPackRepository.findByStatusOrderBySortOrder(ClassPackStatus.ACTIVE)
    }

    /**
     * Gets class packs by status with pagination.
     */
    @Transactional(readOnly = true)
    fun getClassPacksByStatus(status: ClassPackStatus, pageable: Pageable): Page<ClassPack> {
        return classPackRepository.findByStatus(status, pageable)
    }

    @Transactional(readOnly = true)
    fun getClassPacksByServiceType(serviceType: com.liyaqa.scheduling.domain.model.ServiceType, pageable: Pageable): Page<ClassPack> {
        return classPackRepository.findByServiceType(serviceType, pageable)
    }

    @Transactional(readOnly = true)
    fun getClassPacksByStatusAndServiceType(status: ClassPackStatus, serviceType: com.liyaqa.scheduling.domain.model.ServiceType, pageable: Pageable): Page<ClassPack> {
        return classPackRepository.findByStatusAndServiceType(status, serviceType, pageable)
    }

    /**
     * Updates a class pack.
     */
    fun updateClassPack(id: UUID, command: UpdateClassPackCommand): ClassPack {
        val classPack = classPackRepository.findById(id)
            .orElseThrow { NoSuchElementException("Class pack not found: $id") }

        command.name?.let { classPack.name = it }
        command.description?.let { classPack.description = it }
        command.classCount?.let {
            require(it > 0) { "Class count must be positive" }
            classPack.classCount = it
        }
        command.price?.let {
            require(it.amount >= BigDecimal.ZERO) { "Price cannot be negative" }
            classPack.price = it
        }
        command.taxRate?.let { classPack.taxRate = it }
        command.validityDays?.let { classPack.validityDays = it }
        command.validClassTypes?.let { classPack.validClassTypes = it.joinToString(",") }
        command.validClassIds?.let { classPack.validClassIds = it.joinToString(",") { uuid -> uuid.toString() } }
        command.sortOrder?.let { classPack.sortOrder = it }
        command.imageUrl?.let { classPack.imageUrl = it }
        command.allocationMode?.let { classPack.allocationMode = it }

        // Update category allocations if provided
        if (command.categoryAllocations != null) {
            val effectiveClassCount = command.classCount ?: classPack.classCount
            val effectiveMode = command.allocationMode ?: classPack.allocationMode

            if (effectiveMode == ClassPackAllocationMode.PER_CATEGORY) {
                val allocations = command.categoryAllocations
                val sum = allocations.sumOf { it.creditCount }
                require(sum == effectiveClassCount) {
                    "Category allocation sum ($sum) must equal class count ($effectiveClassCount)"
                }
                allocations.forEach { alloc ->
                    require(classCategoryRepository.existsById(alloc.categoryId)) {
                        "Category not found: ${alloc.categoryId}"
                    }
                }

                // Replace existing allocations
                allocationRepository.deleteByClassPackId(id)
                allocations.forEach { alloc ->
                    allocationRepository.save(
                        ClassPackCategoryAllocation(
                            classPackId = id,
                            categoryId = alloc.categoryId,
                            creditCount = alloc.creditCount
                        )
                    )
                }
            } else {
                // Switching to FLAT — remove allocations
                allocationRepository.deleteByClassPackId(id)
            }
        }

        logger.info("Updated class pack: $id")
        return classPackRepository.save(classPack)
    }

    /**
     * Activates a class pack.
     */
    fun activateClassPack(id: UUID): ClassPack {
        val classPack = classPackRepository.findById(id)
            .orElseThrow { NoSuchElementException("Class pack not found: $id") }
        classPack.activate()
        logger.info("Activated class pack: $id")
        return classPackRepository.save(classPack)
    }

    /**
     * Deactivates a class pack.
     */
    fun deactivateClassPack(id: UUID): ClassPack {
        val classPack = classPackRepository.findById(id)
            .orElseThrow { NoSuchElementException("Class pack not found: $id") }
        classPack.deactivate()
        logger.info("Deactivated class pack: $id")
        return classPackRepository.save(classPack)
    }

    /**
     * Deletes a class pack.
     * Only inactive packs with no active balances can be deleted.
     */
    fun deleteClassPack(id: UUID) {
        val classPack = classPackRepository.findById(id)
            .orElseThrow { NoSuchElementException("Class pack not found: $id") }

        require(classPack.status == ClassPackStatus.INACTIVE) {
            "Only inactive class packs can be deleted"
        }

        val activeBalanceCount = balanceRepository.findByClassPackId(id, Pageable.unpaged())
            .content.count { it.status == ClassPackBalanceStatus.ACTIVE }
        require(activeBalanceCount == 0) {
            "Cannot delete pack with $activeBalanceCount active balances"
        }

        classPackRepository.deleteById(id)
        logger.info("Deleted class pack: $id")
    }

    // ==================== MEMBER BALANCE OPERATIONS ====================

    /**
     * Gets all balances for a member.
     */
    @Transactional(readOnly = true)
    fun getMemberBalances(memberId: UUID, pageable: Pageable): Page<MemberClassPackBalance> {
        return balanceRepository.findByMemberId(memberId, pageable)
    }

    /**
     * Gets active balances for a member (with remaining credits, not expired).
     */
    @Transactional(readOnly = true)
    fun getActiveMemberBalances(memberId: UUID): List<MemberClassPackBalance> {
        return balanceRepository.findActiveByMemberId(memberId)
    }

    /**
     * Gets valid balances for a specific class.
     * For FLAT packs, filters by class type/ID restrictions.
     * For PER_CATEGORY packs, checks if the class has a category with remaining credits.
     */
    @Transactional(readOnly = true)
    fun getValidBalancesForClass(memberId: UUID, classId: UUID): List<MemberClassPackBalance> {
        val gymClass = gymClassRepository.findById(classId)
            .orElseThrow { NoSuchElementException("Gym class not found: $classId") }

        val activeBalances = balanceRepository.findActiveByMemberId(memberId)

        return activeBalances.filter { balance ->
            val classPack = classPackRepository.findById(balance.classPackId).orElse(null) ?: return@filter false
            when (classPack.allocationMode) {
                ClassPackAllocationMode.FLAT -> classPack.isValidForClass(gymClass)
                ClassPackAllocationMode.PER_CATEGORY -> {
                    val categoryId = gymClass.categoryId ?: return@filter false
                    val categoryBalance = categoryBalanceRepository
                        .findByBalanceIdAndCategoryId(balance.id, categoryId)
                        .orElse(null)
                    categoryBalance?.hasCredits() ?: false
                }
            }
        }
    }

    /**
     * Gets a single balance by ID.
     */
    @Transactional(readOnly = true)
    fun getBalance(id: UUID): MemberClassPackBalance {
        return balanceRepository.findById(id)
            .orElseThrow { NoSuchElementException("Balance not found: $id") }
    }

    /**
     * Uses a credit from a balance.
     * For PER_CATEGORY packs, categoryId is required and the specific category balance is decremented.
     * Returns the category balance ID if applicable (for tracking on the booking).
     */
    fun useCredit(balanceId: UUID, categoryId: UUID? = null): Pair<MemberClassPackBalance, UUID?> {
        val balance = balanceRepository.findById(balanceId)
            .orElseThrow { NoSuchElementException("Balance not found: $balanceId") }

        val pack = classPackRepository.findById(balance.classPackId)
            .orElseThrow { NoSuchElementException("Class pack not found: ${balance.classPackId}") }

        var categoryBalanceId: UUID? = null

        if (pack.allocationMode == ClassPackAllocationMode.PER_CATEGORY) {
            requireNotNull(categoryId) { "categoryId is required for PER_CATEGORY packs" }
            val categoryBalance = categoryBalanceRepository.findByBalanceIdAndCategoryId(balanceId, categoryId)
                .orElseThrow { NoSuchElementException("No category balance for category $categoryId in balance $balanceId") }
            categoryBalance.useCredit()
            categoryBalanceRepository.save(categoryBalance)
            categoryBalanceId = categoryBalance.id
        }

        balance.useClass()
        logger.info("Used credit from balance $balanceId for member ${balance.memberId}. Remaining: ${balance.classesRemaining}")
        return Pair(balanceRepository.save(balance), categoryBalanceId)
    }

    /**
     * Refunds a credit back to a balance.
     * For PER_CATEGORY packs, categoryBalanceId is used to refund the specific category.
     */
    fun refundCredit(balanceId: UUID, categoryBalanceId: UUID? = null): MemberClassPackBalance {
        val balance = balanceRepository.findById(balanceId)
            .orElseThrow { NoSuchElementException("Balance not found: $balanceId") }

        // Refund category balance if applicable
        if (categoryBalanceId != null) {
            val categoryBalance = categoryBalanceRepository.findById(categoryBalanceId)
                .orElseThrow { NoSuchElementException("Category balance not found: $categoryBalanceId") }
            categoryBalance.refundCredit()
            categoryBalanceRepository.save(categoryBalance)
        }

        balance.refundClass()
        logger.info("Refunded credit to balance $balanceId for member ${balance.memberId}. Remaining: ${balance.classesRemaining}")
        return balanceRepository.save(balance)
    }

    /**
     * Grants a class pack to a member (admin operation).
     * Creates a balance without requiring payment.
     */
    fun grantPackToMember(memberId: UUID, classPackId: UUID): MemberClassPackBalance {
        val classPack = classPackRepository.findById(classPackId)
            .orElseThrow { NoSuchElementException("Class pack not found: $classPackId") }

        val balance = MemberClassPackBalance.grantComplimentary(memberId, classPack)
        val savedBalance = balanceRepository.save(balance)

        // Create category balances for PER_CATEGORY packs
        createCategoryBalancesIfNeeded(savedBalance, classPack)

        logger.info("Granted class pack $classPackId (${classPack.classCount} classes) to member $memberId")
        return savedBalance
    }

    /**
     * Creates a balance from a purchase (called after successful payment).
     */
    fun createBalanceFromPurchase(memberId: UUID, classPackId: UUID, orderId: UUID): MemberClassPackBalance {
        val classPack = classPackRepository.findById(classPackId)
            .orElseThrow { NoSuchElementException("Class pack not found: $classPackId") }

        val balance = MemberClassPackBalance.fromPurchase(memberId, classPack, orderId)
        val savedBalance = balanceRepository.save(balance)

        // Create category balances for PER_CATEGORY packs
        createCategoryBalancesIfNeeded(savedBalance, classPack)

        logger.info("Created class pack balance for member $memberId from order $orderId")
        return savedBalance
    }

    private fun createCategoryBalancesIfNeeded(balance: MemberClassPackBalance, classPack: ClassPack) {
        if (classPack.allocationMode == ClassPackAllocationMode.PER_CATEGORY) {
            val allocations = allocationRepository.findByClassPackId(classPack.id)
            allocations.forEach { alloc ->
                categoryBalanceRepository.save(
                    MemberCategoryBalance(
                        balanceId = balance.id,
                        categoryId = alloc.categoryId,
                        creditsAllocated = alloc.creditCount,
                        creditsRemaining = alloc.creditCount
                    )
                )
            }
        }
    }

    /**
     * Cancels a member's balance (e.g., for refund).
     */
    fun cancelBalance(balanceId: UUID): MemberClassPackBalance {
        val balance = balanceRepository.findById(balanceId)
            .orElseThrow { NoSuchElementException("Balance not found: $balanceId") }

        balance.cancel()
        logger.info("Cancelled balance $balanceId for member ${balance.memberId}")
        return balanceRepository.save(balance)
    }

    /**
     * Gets total remaining credits for a member across all active packs.
     */
    @Transactional(readOnly = true)
    fun getTotalRemainingCredits(memberId: UUID): Int {
        return balanceRepository.sumClassesRemainingByMemberIdAndStatus(memberId, ClassPackBalanceStatus.ACTIVE)
    }

    /**
     * Gets category balances for a member's class pack balance.
     */
    @Transactional(readOnly = true)
    fun getCategoryBalances(balanceId: UUID): List<MemberCategoryBalance> {
        return categoryBalanceRepository.findByBalanceId(balanceId)
    }

    /**
     * Gets category allocations for a class pack.
     */
    @Transactional(readOnly = true)
    fun getCategoryAllocations(classPackId: UUID): List<ClassPackCategoryAllocation> {
        return allocationRepository.findByClassPackId(classPackId)
    }

    // ==================== VALIDATION HELPERS ====================

    /**
     * Checks if a class pack is valid for a specific gym class.
     */
    @Transactional(readOnly = true)
    fun isPackValidForClass(classPackId: UUID, gymClassId: UUID): Boolean {
        val classPack = classPackRepository.findById(classPackId).orElse(null) ?: return false
        val gymClass = gymClassRepository.findById(gymClassId).orElse(null) ?: return false
        return classPack.isValidForClass(gymClass)
    }

    /**
     * Checks if a member has any valid credits for a class.
     */
    @Transactional(readOnly = true)
    fun memberHasValidCreditsForClass(memberId: UUID, gymClassId: UUID): Boolean {
        return getValidBalancesForClass(memberId, gymClassId).isNotEmpty()
    }

    // ==================== SCHEDULED TASKS ====================

    /**
     * Expires balances that have passed their expiry date.
     * Runs daily at 1 AM.
     */
    @Scheduled(cron = "0 0 1 * * *")
    fun expireBalances() {
        val now = Instant.now()
        val expiredBalances = balanceRepository.findByStatusAndExpiresAtBefore(ClassPackBalanceStatus.ACTIVE, now)

        for (balance in expiredBalances) {
            balance.markExpired()
            balanceRepository.save(balance)
            logger.info("Expired balance ${balance.id} for member ${balance.memberId}")
        }

        if (expiredBalances.isNotEmpty()) {
            logger.info("Expired ${expiredBalances.size} class pack balances")
        }
    }
}
