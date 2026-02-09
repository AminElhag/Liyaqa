package com.liyaqa.platform.compliance.repository

import com.liyaqa.platform.compliance.model.ZatcaSubmission
import com.liyaqa.platform.compliance.model.ZatcaSubmissionStatus
import java.util.Optional
import java.util.UUID

interface ZatcaSubmissionRepository {
    fun save(submission: ZatcaSubmission): ZatcaSubmission
    fun findById(id: UUID): Optional<ZatcaSubmission>
    fun findByInvoiceId(invoiceId: UUID): Optional<ZatcaSubmission>
    fun findByTenantId(tenantId: UUID): List<ZatcaSubmission>
    fun findByStatus(status: ZatcaSubmissionStatus): List<ZatcaSubmission>
    fun countByStatus(status: ZatcaSubmissionStatus): Long
    fun countByTenantIdAndStatus(tenantId: UUID, status: ZatcaSubmissionStatus): Long
    fun countAll(): Long
    fun countByTenantId(tenantId: UUID): Long
    fun findDistinctTenantIds(): List<UUID>
}
