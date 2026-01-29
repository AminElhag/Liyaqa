package com.liyaqa.scheduling.api

import com.liyaqa.scheduling.application.services.ClassPackService
import com.liyaqa.scheduling.application.services.CreateClassPackCommand
import com.liyaqa.scheduling.application.services.UpdateClassPackCommand
import com.liyaqa.scheduling.domain.model.ClassPackBalanceStatus
import com.liyaqa.scheduling.domain.model.ClassPackStatus
import com.liyaqa.shared.api.PageResponse
import com.liyaqa.shared.domain.LocalizedText
import com.liyaqa.shared.domain.Money
import jakarta.validation.Valid
import jakarta.validation.constraints.Min
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
import java.math.BigDecimal
import java.time.Instant
import java.util.UUID

@RestController
@RequestMapping("/api/class-packs")
class ClassPackController(
    private val classPackService: ClassPackService
) {

    /**
     * Creates a new class pack.
     */
    @PostMapping
    @PreAuthorize("hasAuthority('classes_create')")
    fun createClassPack(@Valid @RequestBody request: CreateClassPackRequest): ResponseEntity<ClassPackResponse> {
        val classPack = classPackService.createClassPack(request.toCommand())
        return ResponseEntity.status(HttpStatus.CREATED).body(ClassPackResponse.from(classPack))
    }

    /**
     * Gets a class pack by ID.
     */
    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('classes_view')")
    fun getClassPack(@PathVariable id: UUID): ResponseEntity<ClassPackResponse> {
        val classPack = classPackService.getClassPack(id)
        return ResponseEntity.ok(ClassPackResponse.from(classPack))
    }

    /**
     * Lists all class packs with pagination.
     */
    @GetMapping
    @PreAuthorize("hasAuthority('classes_view')")
    fun getClassPacks(
        @RequestParam(defaultValue = "0") page: Int,
        @RequestParam(defaultValue = "20") size: Int,
        @RequestParam(defaultValue = "sortOrder") sortBy: String,
        @RequestParam(defaultValue = "ASC") sortDirection: String,
        @RequestParam status: ClassPackStatus? = null
    ): ResponseEntity<PageResponse<ClassPackResponse>> {
        val sort = Sort.by(Sort.Direction.valueOf(sortDirection.uppercase()), sortBy)
        val pageable = PageRequest.of(page, size, sort)

        val packsPage = if (status != null) {
            classPackService.getClassPacksByStatus(status, pageable)
        } else {
            classPackService.getClassPacks(pageable)
        }

        return ResponseEntity.ok(
            PageResponse(
                content = packsPage.content.map { ClassPackResponse.from(it) },
                page = packsPage.number,
                size = packsPage.size,
                totalElements = packsPage.totalElements,
                totalPages = packsPage.totalPages,
                first = packsPage.isFirst,
                last = packsPage.isLast
            )
        )
    }

    /**
     * Gets active class packs (for member purchase page).
     */
    @GetMapping("/active")
    @PreAuthorize("hasAuthority('classes_view')")
    fun getActiveClassPacks(): ResponseEntity<List<ClassPackResponse>> {
        val packs = classPackService.getActiveClassPacks()
        return ResponseEntity.ok(packs.map { ClassPackResponse.from(it) })
    }

    /**
     * Updates a class pack.
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('classes_create')")
    fun updateClassPack(
        @PathVariable id: UUID,
        @Valid @RequestBody request: UpdateClassPackRequest
    ): ResponseEntity<ClassPackResponse> {
        val classPack = classPackService.updateClassPack(id, request.toCommand())
        return ResponseEntity.ok(ClassPackResponse.from(classPack))
    }

    /**
     * Activates a class pack.
     */
    @PostMapping("/{id}/activate")
    @PreAuthorize("hasAuthority('classes_create')")
    fun activateClassPack(@PathVariable id: UUID): ResponseEntity<ClassPackResponse> {
        val classPack = classPackService.activateClassPack(id)
        return ResponseEntity.ok(ClassPackResponse.from(classPack))
    }

    /**
     * Deactivates a class pack.
     */
    @PostMapping("/{id}/deactivate")
    @PreAuthorize("hasAuthority('classes_create')")
    fun deactivateClassPack(@PathVariable id: UUID): ResponseEntity<ClassPackResponse> {
        val classPack = classPackService.deactivateClassPack(id)
        return ResponseEntity.ok(ClassPackResponse.from(classPack))
    }

    /**
     * Deletes a class pack.
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('classes_delete')")
    fun deleteClassPack(@PathVariable id: UUID): ResponseEntity<Void> {
        classPackService.deleteClassPack(id)
        return ResponseEntity.noContent().build()
    }

    // ==================== MEMBER BALANCE ENDPOINTS ====================

    /**
     * Gets class pack balances for a member.
     */
    @GetMapping("/members/{memberId}/balances")
    @PreAuthorize("hasAuthority('classes_view')")
    fun getMemberBalances(
        @PathVariable memberId: UUID,
        @RequestParam(defaultValue = "0") page: Int,
        @RequestParam(defaultValue = "20") size: Int
    ): ResponseEntity<PageResponse<MemberClassPackBalanceResponse>> {
        val pageable = PageRequest.of(page, size)
        val balancesPage = classPackService.getMemberBalances(memberId, pageable)

        return ResponseEntity.ok(
            PageResponse(
                content = balancesPage.content.map { balance ->
                    val pack = classPackService.getClassPack(balance.classPackId)
                    MemberClassPackBalanceResponse.from(balance, pack.name)
                },
                page = balancesPage.number,
                size = balancesPage.size,
                totalElements = balancesPage.totalElements,
                totalPages = balancesPage.totalPages,
                first = balancesPage.isFirst,
                last = balancesPage.isLast
            )
        )
    }

    /**
     * Gets active balances for a member.
     */
    @GetMapping("/members/{memberId}/balances/active")
    @PreAuthorize("hasAuthority('classes_view')")
    fun getActiveMemberBalances(@PathVariable memberId: UUID): ResponseEntity<List<MemberClassPackBalanceResponse>> {
        val balances = classPackService.getActiveMemberBalances(memberId)
        val responses = balances.map { balance ->
            val pack = classPackService.getClassPack(balance.classPackId)
            MemberClassPackBalanceResponse.from(balance, pack.name)
        }
        return ResponseEntity.ok(responses)
    }

    /**
     * Grants a class pack to a member (complimentary).
     */
    @PostMapping("/members/{memberId}/grant")
    @PreAuthorize("hasAuthority('classes_create')")
    fun grantPackToMember(
        @PathVariable memberId: UUID,
        @Valid @RequestBody request: GrantClassPackRequest
    ): ResponseEntity<MemberClassPackBalanceResponse> {
        val balance = classPackService.grantPackToMember(memberId, request.classPackId)
        val pack = classPackService.getClassPack(balance.classPackId)
        return ResponseEntity.status(HttpStatus.CREATED).body(
            MemberClassPackBalanceResponse.from(balance, pack.name)
        )
    }

    /**
     * Cancels a member's class pack balance.
     */
    @PostMapping("/balances/{balanceId}/cancel")
    @PreAuthorize("hasAuthority('classes_delete')")
    fun cancelBalance(@PathVariable balanceId: UUID): ResponseEntity<MemberClassPackBalanceResponse> {
        val balance = classPackService.cancelBalance(balanceId)
        val pack = classPackService.getClassPack(balance.classPackId)
        return ResponseEntity.ok(MemberClassPackBalanceResponse.from(balance, pack.name))
    }
}

// ==================== DTOs ====================

data class CreateClassPackRequest(
    @field:NotBlank(message = "English name is required")
    val nameEn: String,
    val nameAr: String? = null,
    val descriptionEn: String? = null,
    val descriptionAr: String? = null,
    @field:Min(1, message = "Class count must be at least 1")
    val classCount: Int,
    @field:Min(0, message = "Price cannot be negative")
    val priceAmount: BigDecimal,
    val priceCurrency: String = "SAR",
    val taxRate: BigDecimal = BigDecimal("15.00"),
    val validityDays: Int? = null,
    val validClassTypes: List<String>? = null,
    val validClassIds: List<UUID>? = null,
    val sortOrder: Int = 0,
    val imageUrl: String? = null
) {
    fun toCommand() = CreateClassPackCommand(
        name = LocalizedText(nameEn, nameAr),
        description = if (descriptionEn != null) LocalizedText(descriptionEn, descriptionAr) else null,
        classCount = classCount,
        price = Money.of(priceAmount, priceCurrency),
        taxRate = taxRate,
        validityDays = validityDays,
        validClassTypes = validClassTypes,
        validClassIds = validClassIds,
        sortOrder = sortOrder,
        imageUrl = imageUrl
    )
}

data class UpdateClassPackRequest(
    val nameEn: String? = null,
    val nameAr: String? = null,
    val descriptionEn: String? = null,
    val descriptionAr: String? = null,
    @field:Min(1, message = "Class count must be at least 1")
    val classCount: Int? = null,
    @field:Min(0, message = "Price cannot be negative")
    val priceAmount: BigDecimal? = null,
    val priceCurrency: String? = null,
    val taxRate: BigDecimal? = null,
    val validityDays: Int? = null,
    val validClassTypes: List<String>? = null,
    val validClassIds: List<UUID>? = null,
    val sortOrder: Int? = null,
    val imageUrl: String? = null
) {
    fun toCommand() = UpdateClassPackCommand(
        name = nameEn?.let { LocalizedText(it, nameAr) },
        description = descriptionEn?.let { LocalizedText(it, descriptionAr) },
        classCount = classCount,
        price = priceAmount?.let { Money.of(it, priceCurrency ?: "SAR") },
        taxRate = taxRate,
        validityDays = validityDays,
        validClassTypes = validClassTypes,
        validClassIds = validClassIds,
        sortOrder = sortOrder,
        imageUrl = imageUrl
    )
}

data class GrantClassPackRequest(
    val classPackId: UUID
)

data class ClassPackResponse(
    val id: UUID,
    val name: LocalizedTextResponse,
    val description: LocalizedTextResponse?,
    val classCount: Int,
    val price: MoneyResponse,
    val priceWithTax: MoneyResponse,
    val taxRate: BigDecimal,
    val validityDays: Int?,
    val validClassTypes: List<String>,
    val validClassIds: List<UUID>,
    val status: ClassPackStatus,
    val sortOrder: Int,
    val imageUrl: String?,
    val createdAt: Instant,
    val updatedAt: Instant
) {
    companion object {
        fun from(pack: com.liyaqa.scheduling.domain.model.ClassPack) = ClassPackResponse(
            id = pack.id,
            name = LocalizedTextResponse(pack.name.en, pack.name.ar),
            description = pack.description?.let { LocalizedTextResponse(it.en, it.ar) },
            classCount = pack.classCount,
            price = MoneyResponse(pack.price.amount, pack.price.currency),
            priceWithTax = MoneyResponse(pack.getPriceWithTax().amount, pack.getPriceWithTax().currency),
            taxRate = pack.taxRate,
            validityDays = pack.validityDays,
            validClassTypes = pack.getValidClassTypesList().map { it.name },
            validClassIds = pack.getValidClassIdsList(),
            status = pack.status,
            sortOrder = pack.sortOrder,
            imageUrl = pack.imageUrl,
            createdAt = pack.createdAt,
            updatedAt = pack.updatedAt
        )
    }
}

data class MemberClassPackBalanceResponse(
    val id: UUID,
    val memberId: UUID,
    val classPackId: UUID,
    val packName: LocalizedTextResponse,
    val classesPurchased: Int,
    val classesRemaining: Int,
    val classesUsed: Int,
    val purchasedAt: Instant,
    val expiresAt: Instant?,
    val status: com.liyaqa.scheduling.domain.model.ClassPackBalanceStatus,
    val createdAt: Instant,
    val updatedAt: Instant
) {
    companion object {
        fun from(
            balance: com.liyaqa.scheduling.domain.model.MemberClassPackBalance,
            packName: LocalizedText
        ) = MemberClassPackBalanceResponse(
            id = balance.id,
            memberId = balance.memberId,
            classPackId = balance.classPackId,
            packName = LocalizedTextResponse(packName.en, packName.ar),
            classesPurchased = balance.classesPurchased,
            classesRemaining = balance.classesRemaining,
            classesUsed = balance.classesUsed(),
            purchasedAt = balance.purchasedAt,
            expiresAt = balance.expiresAt,
            status = balance.status,
            createdAt = balance.createdAt,
            updatedAt = balance.updatedAt
        )
    }
}
