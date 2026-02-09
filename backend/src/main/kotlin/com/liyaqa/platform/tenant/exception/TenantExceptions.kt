package com.liyaqa.platform.tenant.exception

import java.util.UUID

class TenantNotFoundException(id: UUID) :
    NoSuchElementException("Tenant not found: $id")

class TenantAlreadyExistsException(field: String, value: String) :
    IllegalArgumentException("Tenant already exists with $field: $value")

class DealNotWonException(dealId: UUID) :
    IllegalStateException("Deal $dealId is not in WON stage")

class ActiveSubscriptionExistsException(tenantId: UUID) :
    IllegalStateException("Cannot deactivate tenant $tenantId: active subscription exists")

class DataExportRequiredException(tenantId: UUID) :
    IllegalStateException("Cannot archive tenant $tenantId: completed data export required")

class DataExportInProgressException(tenantId: UUID) :
    IllegalStateException("Cannot start new export for tenant $tenantId: export already pending or in progress")

class DataExportNotFoundException(id: UUID) :
    NoSuchElementException("Data export job not found: $id")
