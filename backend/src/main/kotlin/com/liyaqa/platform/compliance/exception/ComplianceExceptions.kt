package com.liyaqa.platform.compliance.exception

import com.liyaqa.platform.exception.*
import java.util.UUID

class ContractNotFoundException(id: UUID) :
    PlatformResourceNotFoundException(PlatformErrorCode.CONTRACT_NOT_FOUND, "Contract not found: $id")

class DuplicateContractNumberException(contractNumber: String) :
    PlatformDuplicateResourceException(PlatformErrorCode.DUPLICATE_CONTRACT_NUMBER, "Contract number already exists: $contractNumber")

class InvalidContractStateException(message: String) :
    PlatformInvalidStateException(PlatformErrorCode.INVALID_CONTRACT_STATE, message)

class ZatcaSubmissionNotFoundException(invoiceId: UUID) :
    PlatformResourceNotFoundException(PlatformErrorCode.ZATCA_SUBMISSION_NOT_FOUND, "ZATCA submission not found for invoice: $invoiceId")

class DataExportRequestNotFoundException(id: UUID) :
    PlatformResourceNotFoundException(PlatformErrorCode.DATA_EXPORT_NOT_FOUND, "Data export request not found: $id")

class InvalidDataExportRequestStateException(message: String) :
    PlatformInvalidStateException(PlatformErrorCode.INVALID_DATA_EXPORT_STATE, message)
