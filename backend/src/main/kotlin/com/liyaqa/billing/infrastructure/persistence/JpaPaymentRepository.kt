package com.liyaqa.billing.infrastructure.persistence

import com.liyaqa.billing.domain.ports.PaymentRepository
import org.springframework.stereotype.Repository

@Repository
interface JpaPaymentRepository : PaymentRepository
