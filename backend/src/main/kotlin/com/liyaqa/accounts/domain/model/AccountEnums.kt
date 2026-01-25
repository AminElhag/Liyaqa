package com.liyaqa.accounts.domain.model

enum class FamilyRelationship {
    PRIMARY,
    SPOUSE,
    CHILD,
    PARENT,
    SIBLING,
    OTHER
}

enum class FamilyBillingType {
    INDIVIDUAL,
    CONSOLIDATED
}

enum class CorporateBillingType {
    INVOICE,
    PREPAID,
    PER_MEMBER
}

enum class AccountStatus {
    ACTIVE,
    SUSPENDED,
    TERMINATED
}

enum class CorporateMemberStatus {
    ACTIVE,
    SUSPENDED,
    TERMINATED
}
