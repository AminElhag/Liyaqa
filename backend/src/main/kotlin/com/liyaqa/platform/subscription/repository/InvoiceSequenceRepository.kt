package com.liyaqa.platform.subscription.repository

import com.liyaqa.platform.subscription.model.InvoiceSequence
import java.util.Optional

interface InvoiceSequenceRepository {
    fun findForUpdate(): Optional<InvoiceSequence>
    fun save(seq: InvoiceSequence): InvoiceSequence
}
