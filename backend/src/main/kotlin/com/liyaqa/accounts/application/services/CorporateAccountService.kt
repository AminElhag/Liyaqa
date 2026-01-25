package com.liyaqa.accounts.application.services

import com.liyaqa.accounts.application.commands.*
import com.liyaqa.accounts.domain.model.*
import com.liyaqa.accounts.domain.ports.CorporateAccountRepository
import com.liyaqa.membership.domain.ports.MemberRepository
import org.slf4j.LoggerFactory
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDate
import java.util.*

@Service
@Transactional
class CorporateAccountService(
    private val corporateAccountRepository: CorporateAccountRepository,
    private val memberRepository: MemberRepository
) {
    private val logger = LoggerFactory.getLogger(CorporateAccountService::class.java)

    fun createCorporateAccount(command: CreateCorporateAccountCommand): CorporateAccount {
        val account = CorporateAccount(
            companyName = command.companyName,
            companyNameAr = command.companyNameAr,
            contactPerson = command.contactPerson,
            contactEmail = command.contactEmail,
            contactPhone = command.contactPhone,
            crNumber = command.crNumber,
            vatNumber = command.vatNumber,
            address = command.address,
            contractStartDate = command.contractStartDate,
            contractEndDate = command.contractEndDate,
            maxMembers = command.maxMembers,
            discountPercentage = command.discountPercentage,
            billingType = command.billingType,
            paymentTermsDays = command.paymentTermsDays,
            notes = command.notes
        )

        logger.info("Created corporate account: ${account.companyName}")
        return corporateAccountRepository.save(account)
    }

    fun updateCorporateAccount(id: UUID, command: UpdateCorporateAccountCommand): CorporateAccount {
        val account = corporateAccountRepository.findById(id)
            .orElseThrow { NoSuchElementException("Corporate account not found: $id") }

        command.companyName?.let { account.companyName = it }
        command.companyNameAr?.let { account.companyNameAr = it }
        command.contactPerson?.let { account.contactPerson = it }
        command.contactEmail?.let { account.contactEmail = it }
        command.contactPhone?.let { account.contactPhone = it }
        command.crNumber?.let { account.crNumber = it }
        command.vatNumber?.let { account.vatNumber = it }
        command.address?.let { account.address = it }
        command.contractStartDate?.let { account.contractStartDate = it }
        command.contractEndDate?.let { account.contractEndDate = it }
        command.maxMembers?.let { account.maxMembers = it }
        command.discountPercentage?.let { account.discountPercentage = it }
        command.billingType?.let { account.billingType = it }
        command.paymentTermsDays?.let { account.paymentTermsDays = it }
        command.notes?.let { account.notes = it }

        logger.info("Updated corporate account: $id")
        return corporateAccountRepository.save(account)
    }

    @Transactional(readOnly = true)
    fun getCorporateAccount(id: UUID): CorporateAccount? =
        corporateAccountRepository.findById(id).orElse(null)

    @Transactional(readOnly = true)
    fun listCorporateAccounts(pageable: Pageable): Page<CorporateAccount> =
        corporateAccountRepository.findAll(pageable)

    @Transactional(readOnly = true)
    fun searchCorporateAccounts(query: String, pageable: Pageable): Page<CorporateAccount> =
        corporateAccountRepository.search(query, pageable)

    @Transactional(readOnly = true)
    fun getMemberCorporateAccount(memberId: UUID): CorporateAccount? =
        corporateAccountRepository.findByMemberId(memberId).orElse(null)

    @Transactional(readOnly = true)
    fun getExpiringContracts(withinDays: Int, pageable: Pageable): Page<CorporateAccount> {
        val expiryDate = LocalDate.now().plusDays(withinDays.toLong())
        return corporateAccountRepository.findByContractEndDateBefore(expiryDate, pageable)
    }

    fun addMember(accountId: UUID, command: AddCorporateMemberCommand): CorporateAccount {
        val account = corporateAccountRepository.findById(accountId)
            .orElseThrow { NoSuchElementException("Corporate account not found: $accountId") }

        if (!memberRepository.existsById(command.memberId)) {
            throw NoSuchElementException("Member not found: ${command.memberId}")
        }

        // Check if member is already in another corporate account
        val existingAccount = corporateAccountRepository.findByMemberId(command.memberId).orElse(null)
        if (existingAccount != null && existingAccount.id != accountId) {
            throw IllegalStateException("Member is already in another corporate account")
        }

        account.addMember(
            memberId = command.memberId,
            employeeId = command.employeeId,
            department = command.department,
            position = command.position
        )

        logger.info("Added member ${command.memberId} to corporate account $accountId")
        return corporateAccountRepository.save(account)
    }

    fun removeMember(accountId: UUID, memberId: UUID): CorporateAccount {
        val account = corporateAccountRepository.findById(accountId)
            .orElseThrow { NoSuchElementException("Corporate account not found: $accountId") }

        account.removeMember(memberId)
        logger.info("Removed member $memberId from corporate account $accountId")

        return corporateAccountRepository.save(account)
    }

    fun activateCorporateAccount(id: UUID): CorporateAccount {
        val account = corporateAccountRepository.findById(id)
            .orElseThrow { NoSuchElementException("Corporate account not found: $id") }
        account.activate()
        return corporateAccountRepository.save(account)
    }

    fun suspendCorporateAccount(id: UUID): CorporateAccount {
        val account = corporateAccountRepository.findById(id)
            .orElseThrow { NoSuchElementException("Corporate account not found: $id") }
        account.suspend()
        return corporateAccountRepository.save(account)
    }

    fun terminateCorporateAccount(id: UUID): CorporateAccount {
        val account = corporateAccountRepository.findById(id)
            .orElseThrow { NoSuchElementException("Corporate account not found: $id") }
        account.terminate()
        return corporateAccountRepository.save(account)
    }

    fun deleteCorporateAccount(id: UUID) {
        if (!corporateAccountRepository.existsById(id)) {
            throw NoSuchElementException("Corporate account not found: $id")
        }
        corporateAccountRepository.deleteById(id)
        logger.info("Deleted corporate account: $id")
    }
}
