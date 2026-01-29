package com.liyaqa.shared.exception

/**
 * Exception thrown when attempting to create/update an agreement with a
 * title and type combination that already exists within the tenant.
 */
class DuplicateAgreementException(message: String) : RuntimeException(message)
