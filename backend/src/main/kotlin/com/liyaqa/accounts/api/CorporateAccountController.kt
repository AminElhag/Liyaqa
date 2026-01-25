package com.liyaqa.accounts.api

import com.liyaqa.accounts.application.commands.*
import com.liyaqa.accounts.application.services.CorporateAccountService
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*
import java.util.*

@RestController
@RequestMapping("/api/corporate-accounts")
class CorporateAccountController(
    private val corporateAccountService: CorporateAccountService
) {

    @PostMapping
    fun createCorporateAccount(@RequestBody request: CreateCorporateAccountRequest): ResponseEntity<CorporateAccountDto> {
        val command = CreateCorporateAccountCommand(
            companyName = request.companyName,
            companyNameAr = request.companyNameAr,
            contactPerson = request.contactPerson,
            contactEmail = request.contactEmail,
            contactPhone = request.contactPhone,
            crNumber = request.crNumber,
            vatNumber = request.vatNumber,
            address = request.address,
            contractStartDate = request.contractStartDate,
            contractEndDate = request.contractEndDate,
            maxMembers = request.maxMembers,
            discountPercentage = request.discountPercentage,
            billingType = request.billingType,
            paymentTermsDays = request.paymentTermsDays,
            notes = request.notes
        )
        val account = corporateAccountService.createCorporateAccount(command)
        return ResponseEntity.status(HttpStatus.CREATED).body(account.toDto())
    }

    @GetMapping("/{id}")
    fun getCorporateAccount(@PathVariable id: UUID): ResponseEntity<CorporateAccountDto> {
        val account = corporateAccountService.getCorporateAccount(id)
            ?: return ResponseEntity.notFound().build()
        return ResponseEntity.ok(account.toDto())
    }

    @GetMapping
    fun listCorporateAccounts(pageable: Pageable): ResponseEntity<Page<CorporateAccountSummaryDto>> {
        val page = corporateAccountService.listCorporateAccounts(pageable)
        return ResponseEntity.ok(page.map { it.toSummaryDto() })
    }

    @GetMapping("/search")
    fun searchCorporateAccounts(
        @RequestParam query: String,
        pageable: Pageable
    ): ResponseEntity<Page<CorporateAccountSummaryDto>> {
        val page = corporateAccountService.searchCorporateAccounts(query, pageable)
        return ResponseEntity.ok(page.map { it.toSummaryDto() })
    }

    @GetMapping("/member/{memberId}")
    fun getMemberCorporateAccount(@PathVariable memberId: UUID): ResponseEntity<CorporateAccountDto> {
        val account = corporateAccountService.getMemberCorporateAccount(memberId)
            ?: return ResponseEntity.notFound().build()
        return ResponseEntity.ok(account.toDto())
    }

    @GetMapping("/expiring")
    fun getExpiringContracts(
        @RequestParam(defaultValue = "30") withinDays: Int,
        pageable: Pageable
    ): ResponseEntity<Page<CorporateAccountSummaryDto>> {
        val page = corporateAccountService.getExpiringContracts(withinDays, pageable)
        return ResponseEntity.ok(page.map { it.toSummaryDto() })
    }

    @PutMapping("/{id}")
    fun updateCorporateAccount(
        @PathVariable id: UUID,
        @RequestBody request: UpdateCorporateAccountRequest
    ): ResponseEntity<CorporateAccountDto> {
        val command = UpdateCorporateAccountCommand(
            companyName = request.companyName,
            companyNameAr = request.companyNameAr,
            contactPerson = request.contactPerson,
            contactEmail = request.contactEmail,
            contactPhone = request.contactPhone,
            crNumber = request.crNumber,
            vatNumber = request.vatNumber,
            address = request.address,
            contractStartDate = request.contractStartDate,
            contractEndDate = request.contractEndDate,
            maxMembers = request.maxMembers,
            discountPercentage = request.discountPercentage,
            billingType = request.billingType,
            paymentTermsDays = request.paymentTermsDays,
            notes = request.notes
        )
        val account = corporateAccountService.updateCorporateAccount(id, command)
        return ResponseEntity.ok(account.toDto())
    }

    @PostMapping("/{id}/members")
    fun addMember(
        @PathVariable id: UUID,
        @RequestBody request: AddCorporateMemberRequest
    ): ResponseEntity<CorporateAccountDto> {
        val command = AddCorporateMemberCommand(
            memberId = request.memberId,
            employeeId = request.employeeId,
            department = request.department,
            position = request.position
        )
        val account = corporateAccountService.addMember(id, command)
        return ResponseEntity.ok(account.toDto())
    }

    @DeleteMapping("/{id}/members/{memberId}")
    fun removeMember(
        @PathVariable id: UUID,
        @PathVariable memberId: UUID
    ): ResponseEntity<CorporateAccountDto> {
        val account = corporateAccountService.removeMember(id, memberId)
        return ResponseEntity.ok(account.toDto())
    }

    @PostMapping("/{id}/activate")
    fun activateCorporateAccount(@PathVariable id: UUID): ResponseEntity<CorporateAccountDto> {
        val account = corporateAccountService.activateCorporateAccount(id)
        return ResponseEntity.ok(account.toDto())
    }

    @PostMapping("/{id}/suspend")
    fun suspendCorporateAccount(@PathVariable id: UUID): ResponseEntity<CorporateAccountDto> {
        val account = corporateAccountService.suspendCorporateAccount(id)
        return ResponseEntity.ok(account.toDto())
    }

    @PostMapping("/{id}/terminate")
    fun terminateCorporateAccount(@PathVariable id: UUID): ResponseEntity<CorporateAccountDto> {
        val account = corporateAccountService.terminateCorporateAccount(id)
        return ResponseEntity.ok(account.toDto())
    }

    @DeleteMapping("/{id}")
    fun deleteCorporateAccount(@PathVariable id: UUID): ResponseEntity<Void> {
        corporateAccountService.deleteCorporateAccount(id)
        return ResponseEntity.noContent().build()
    }
}
