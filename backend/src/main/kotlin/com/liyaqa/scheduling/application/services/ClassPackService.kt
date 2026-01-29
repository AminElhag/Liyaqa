package com.liyaqa.scheduling.application.services

import com.liyaqa.scheduling.domain.model.ClassPack
import com.liyaqa.scheduling.domain.model.ClassPackBalanceStatus
import com.liyaqa.scheduling.domain.model.ClassPackStatus
import com.liyaqa.scheduling.domain.model.GymClass
import com.liyaqa.scheduling.domain.model.MemberClassPackBalance
import com.liyaqa.scheduling.domain.ports.ClassPackRepository
import com.liyaqa.scheduling.domain.ports.GymClassRepository
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
    val imageUrl: String? = null
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
    val imageUrl: String? = null
)

/**
 * Service for managing class packs and member balances.
 */
@Service
@Transactional
class ClassPackService(
    private val classPackRepository: ClassPackRepository,
    private val balanceRepository: MemberClassPackBalanceRepository,
    private val gymClassRepository: GymClassRepository
) {
    private val logger = LoggerFactory.getLogger(ClassPackService::class.java)

    // ==================== CLASS PACK CRUD ====================

    /**
     * Creates a new class pack.
     */
    fun createClassPack(command: CreateClassPackCommand): ClassPack {
        require(command.classCount > 0) { "Class count must be positive" }
        require(command.price.amount > BigDecimal.ZERO) { "Price must be positive" }

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
            imageUrl = command.imageUrl
        )

        logger.info("Created class pack: ${classPack.name.en} with ${classPack.classCount} classes")
        return classPackRepository.save(classPack)
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
            require(it.amount > BigDecimal.ZERO) { "Price must be positive" }
            classPack.price = it
        }
        command.taxRate?.let { classPack.taxRate = it }
        command.validityDays?.let { classPack.validityDays = it }
        command.validClassTypes?.let { classPack.validClassTypes = it.joinToString(",") }
        command.validClassIds?.let { classPack.validClassIds = it.joinToString(",") { uuid -> uuid.toString() } }
        command.sortOrder?.let { classPack.sortOrder = it }
        command.imageUrl?.let { classPack.imageUrl = it }

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
     * Filters balances to only those valid for the given class type/ID.
     */
    @Transactional(readOnly = true)
    fun getValidBalancesForClass(memberId: UUID, classId: UUID): List<MemberClassPackBalance> {
        val gymClass = gymClassRepository.findById(classId)
            .orElseThrow { NoSuchElementException("Gym class not found: $classId") }

        val activeBalances = balanceRepository.findActiveByMemberId(memberId)

        return activeBalances.filter { balance ->
            val classPack = classPackRepository.findById(balance.classPackId).orElse(null)
            classPack?.isValidForClass(gymClass) ?: false
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
     * Called when booking a class with a class pack.
     */
    fun useCredit(balanceId: UUID): MemberClassPackBalance {
        val balance = balanceRepository.findById(balanceId)
            .orElseThrow { NoSuchElementException("Balance not found: $balanceId") }

        balance.useClass()
        logger.info("Used credit from balance $balanceId for member ${balance.memberId}. Remaining: ${balance.classesRemaining}")
        return balanceRepository.save(balance)
    }

    /**
     * Refunds a credit back to a balance.
     * Called when a booking is cancelled.
     */
    fun refundCredit(balanceId: UUID): MemberClassPackBalance {
        val balance = balanceRepository.findById(balanceId)
            .orElseThrow { NoSuchElementException("Balance not found: $balanceId") }

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
        logger.info("Granted class pack $classPackId (${classPack.classCount} classes) to member $memberId")
        return balanceRepository.save(balance)
    }

    /**
     * Creates a balance from a purchase (called after successful payment).
     */
    fun createBalanceFromPurchase(memberId: UUID, classPackId: UUID, orderId: UUID): MemberClassPackBalance {
        val classPack = classPackRepository.findById(classPackId)
            .orElseThrow { NoSuchElementException("Class pack not found: $classPackId") }

        val balance = MemberClassPackBalance.fromPurchase(memberId, classPack, orderId)
        logger.info("Created class pack balance for member $memberId from order $orderId")
        return balanceRepository.save(balance)
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
