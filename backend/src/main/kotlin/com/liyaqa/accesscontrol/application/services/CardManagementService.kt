package com.liyaqa.accesscontrol.application.services

import com.liyaqa.accesscontrol.application.commands.*
import com.liyaqa.accesscontrol.domain.model.*
import com.liyaqa.accesscontrol.domain.ports.*
import com.liyaqa.shared.domain.TenantContext
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.util.*

@Service
@Transactional
class CardManagementService(
    private val cardRepository: MemberAccessCardRepository
) {
    fun issueCard(command: IssueCardCommand): MemberAccessCard {
        // Check if card number already exists
        val existing = cardRepository.findByCardNumber(command.cardNumber)
        if (existing != null) {
            throw IllegalArgumentException("Card number already exists: ${command.cardNumber}")
        }

        val card = MemberAccessCard(
            memberId = command.memberId,
            cardType = command.cardType,
            cardNumber = command.cardNumber,
            facilityCode = command.facilityCode,
            expiresAt = command.expiresAt,
            notes = command.notes
        )
        // tenantId is automatically set by BaseEntity's @PrePersist
        return cardRepository.save(card)
    }

    fun updateCard(id: UUID, command: UpdateCardCommand): MemberAccessCard {
        val card = cardRepository.findById(id)
            ?: throw IllegalArgumentException("Card not found: $id")

        command.expiresAt?.let { card.expiresAt = it }
        command.notes?.let { card.notes = it }

        return cardRepository.save(card)
    }

    fun getCard(id: UUID) = cardRepository.findById(id)

    fun getCardsByMember(memberId: UUID) = cardRepository.findByMemberId(memberId)

    fun getActiveCardsByMember(memberId: UUID) = cardRepository.findActiveByMemberId(memberId)

    fun findCardByNumber(cardNumber: String) = cardRepository.findByCardNumber(cardNumber)

    fun listCards(pageable: Pageable) = cardRepository.findAll(pageable)

    fun suspendCard(id: UUID): MemberAccessCard {
        val card = cardRepository.findById(id)
            ?: throw IllegalArgumentException("Card not found: $id")
        card.suspend()
        return cardRepository.save(card)
    }

    fun reactivateCard(id: UUID): MemberAccessCard {
        val card = cardRepository.findById(id)
            ?: throw IllegalArgumentException("Card not found: $id")
        card.reactivate()
        return cardRepository.save(card)
    }

    fun reportCardLost(id: UUID): MemberAccessCard {
        val card = cardRepository.findById(id)
            ?: throw IllegalArgumentException("Card not found: $id")
        card.reportLost()
        return cardRepository.save(card)
    }

    fun revokeCard(id: UUID): MemberAccessCard {
        val card = cardRepository.findById(id)
            ?: throw IllegalArgumentException("Card not found: $id")
        card.revoke()
        return cardRepository.save(card)
    }

    fun deleteCard(id: UUID) {
        val card = cardRepository.findById(id)
            ?: throw IllegalArgumentException("Card not found: $id")
        cardRepository.delete(card)
    }
}
