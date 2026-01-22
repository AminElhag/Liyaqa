package com.liyaqa.shared.domain

import java.time.Instant
import java.util.UUID

/**
 * Base interface for all domain events.
 * Domain events represent something significant that happened in the domain.
 */
interface DomainEvent {
    val eventId: UUID
    val occurredAt: Instant
    val tenantId: TenantId
}

/**
 * Abstract base class for domain events providing common properties.
 * Note: tenantId defaults to current context or a fallback null-safe tenant.
 */
abstract class BaseDomainEvent(
    override val tenantId: TenantId = TenantContext.getCurrentTenantOrNull()
        ?: TenantId(UUID.fromString("00000000-0000-0000-0000-000000000000")),
    override val eventId: UUID = UUID.randomUUID(),
    override val occurredAt: Instant = Instant.now()
) : DomainEvent

/**
 * Interface for aggregate roots that can emit domain events.
 */
interface AggregateRoot {
    val domainEvents: List<DomainEvent>
    fun clearDomainEvents()
}

/**
 * Mixin implementation for aggregate roots.
 */
abstract class BaseAggregateRoot : AggregateRoot {
    private val _domainEvents: MutableList<DomainEvent> = mutableListOf()

    override val domainEvents: List<DomainEvent>
        get() = _domainEvents.toList()

    protected fun registerEvent(event: DomainEvent) {
        _domainEvents.add(event)
    }

    override fun clearDomainEvents() {
        _domainEvents.clear()
    }
}
