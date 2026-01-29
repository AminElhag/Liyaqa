package com.liyaqa.config

import com.liyaqa.shared.exception.DuplicateAgreementException
import com.liyaqa.shared.exception.DuplicateFieldException
import jakarta.servlet.http.HttpServletRequest
import org.slf4j.LoggerFactory
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.security.access.AccessDeniedException
import org.springframework.validation.FieldError
import org.springframework.web.bind.MethodArgumentNotValidException
import org.springframework.web.bind.annotation.ExceptionHandler
import org.springframework.web.bind.annotation.RestControllerAdvice
import java.time.Instant

/**
 * Global exception handler providing bilingual (EN/AR) error responses.
 * Supports Accept-Language header for language preference.
 */
@RestControllerAdvice
class GlobalExceptionHandler {

    private val logger = LoggerFactory.getLogger(GlobalExceptionHandler::class.java)

    @ExceptionHandler(NoSuchElementException::class)
    fun handleNotFound(ex: NoSuchElementException, request: HttpServletRequest): ResponseEntity<LocalizedErrorResponse> {
        logger.debug("Resource not found: ${ex.message}")
        return ResponseEntity
            .status(HttpStatus.NOT_FOUND)
            .body(
                LocalizedErrorResponse(
                    status = HttpStatus.NOT_FOUND.value(),
                    error = "Not Found",
                    errorAr = "غير موجود",
                    message = ex.message ?: "Resource not found",
                    messageAr = translateNotFoundMessage(ex.message),
                    timestamp = Instant.now(),
                    path = request.requestURI
                )
            )
    }

    @ExceptionHandler(IllegalArgumentException::class)
    fun handleBadRequest(ex: IllegalArgumentException, request: HttpServletRequest): ResponseEntity<LocalizedErrorResponse> {
        logger.debug("Bad request: ${ex.message}")
        return ResponseEntity
            .status(HttpStatus.BAD_REQUEST)
            .body(
                LocalizedErrorResponse(
                    status = HttpStatus.BAD_REQUEST.value(),
                    error = "Bad Request",
                    errorAr = "طلب غير صالح",
                    message = ex.message ?: "Invalid request",
                    messageAr = translateBadRequestMessage(ex.message),
                    timestamp = Instant.now(),
                    path = request.requestURI
                )
            )
    }

    @ExceptionHandler(IllegalStateException::class)
    fun handleConflict(ex: IllegalStateException, request: HttpServletRequest): ResponseEntity<LocalizedErrorResponse> {
        logger.debug("Conflict: ${ex.message}")
        return ResponseEntity
            .status(HttpStatus.CONFLICT)
            .body(
                LocalizedErrorResponse(
                    status = HttpStatus.CONFLICT.value(),
                    error = "Conflict",
                    errorAr = "تعارض",
                    message = ex.message ?: "Operation not allowed in current state",
                    messageAr = translateConflictMessage(ex.message),
                    timestamp = Instant.now(),
                    path = request.requestURI
                )
            )
    }

    @ExceptionHandler(AccessDeniedException::class)
    fun handleAccessDenied(ex: AccessDeniedException, request: HttpServletRequest): ResponseEntity<LocalizedErrorResponse> {
        logger.warn("Access denied for path: ${request.requestURI}")
        return ResponseEntity
            .status(HttpStatus.FORBIDDEN)
            .body(
                LocalizedErrorResponse(
                    status = HttpStatus.FORBIDDEN.value(),
                    error = "Forbidden",
                    errorAr = "محظور",
                    message = "Access denied. You don't have permission to access this resource.",
                    messageAr = "تم رفض الوصول. ليس لديك صلاحية للوصول إلى هذا المورد.",
                    timestamp = Instant.now(),
                    path = request.requestURI
                )
            )
    }

    @ExceptionHandler(DuplicateFieldException::class)
    fun handleDuplicateField(ex: DuplicateFieldException, request: HttpServletRequest): ResponseEntity<DuplicateFieldErrorResponse> {
        logger.debug("Duplicate field: ${ex.field.fieldName} - ${ex.message}")
        return ResponseEntity
            .status(HttpStatus.CONFLICT)
            .body(
                DuplicateFieldErrorResponse(
                    status = HttpStatus.CONFLICT.value(),
                    error = "Conflict",
                    errorAr = "تعارض",
                    field = ex.field.fieldName,
                    fieldDisplayName = ex.field.displayName,
                    fieldDisplayNameAr = ex.field.displayNameAr,
                    message = ex.message ?: "A record with this value already exists",
                    messageAr = translateDuplicateFieldMessage(ex.field),
                    timestamp = Instant.now(),
                    path = request.requestURI
                )
            )
    }

    @ExceptionHandler(DuplicateAgreementException::class)
    fun handleDuplicateAgreement(ex: DuplicateAgreementException, request: HttpServletRequest): ResponseEntity<LocalizedErrorResponse> {
        logger.debug("Duplicate agreement: ${ex.message}")
        return ResponseEntity
            .status(HttpStatus.CONFLICT)
            .body(
                LocalizedErrorResponse(
                    status = HttpStatus.CONFLICT.value(),
                    error = "Conflict",
                    errorAr = "تعارض",
                    message = ex.message ?: "An agreement with the same title and type already exists",
                    messageAr = "يوجد اتفاقية بنفس العنوان والنوع بالفعل",
                    timestamp = Instant.now(),
                    path = request.requestURI
                )
            )
    }

    @ExceptionHandler(MethodArgumentNotValidException::class)
    fun handleValidationErrors(ex: MethodArgumentNotValidException, request: HttpServletRequest): ResponseEntity<LocalizedValidationErrorResponse> {
        val errors = ex.bindingResult.allErrors.associate { error ->
            val fieldName = (error as? FieldError)?.field ?: error.objectName
            fieldName to LocalizedFieldError(
                message = error.defaultMessage ?: "Invalid value",
                messageAr = translateValidationMessage(fieldName, error.defaultMessage)
            )
        }

        return ResponseEntity
            .status(HttpStatus.BAD_REQUEST)
            .body(
                LocalizedValidationErrorResponse(
                    status = HttpStatus.BAD_REQUEST.value(),
                    error = "Validation Failed",
                    errorAr = "فشل التحقق",
                    message = "One or more fields have validation errors",
                    messageAr = "يوجد أخطاء في التحقق من حقل واحد أو أكثر",
                    errors = errors,
                    timestamp = Instant.now(),
                    path = request.requestURI
                )
            )
    }

    @ExceptionHandler(Exception::class)
    fun handleGenericException(ex: Exception, request: HttpServletRequest): ResponseEntity<LocalizedErrorResponse> {
        logger.error("Unexpected error at ${request.requestURI}: ${ex.message}", ex)
        return ResponseEntity
            .status(HttpStatus.INTERNAL_SERVER_ERROR)
            .body(
                LocalizedErrorResponse(
                    status = HttpStatus.INTERNAL_SERVER_ERROR.value(),
                    error = "Internal Server Error",
                    errorAr = "خطأ داخلي في الخادم",
                    message = "An unexpected error occurred. Please try again later.",
                    messageAr = "حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى لاحقاً.",
                    timestamp = Instant.now(),
                    path = request.requestURI
                )
            )
    }

    // ==================== TRANSLATION HELPERS ====================

    private fun translateNotFoundMessage(message: String?): String {
        if (message == null) return "المورد غير موجود"

        return when {
            message.contains("Member not found") -> "العضو غير موجود"
            message.contains("Subscription not found") -> "الاشتراك غير موجود"
            message.contains("Invoice not found") -> "الفاتورة غير موجودة"
            message.contains("Organization not found") -> "المؤسسة غير موجودة"
            message.contains("Club not found") -> "النادي غير موجود"
            message.contains("Location not found") -> "الموقع غير موجود"
            message.contains("Session not found") -> "الجلسة غير موجودة"
            message.contains("Booking not found") -> "الحجز غير موجود"
            message.contains("Class not found") || message.contains("Gym class not found") -> "الحصة غير موجودة"
            message.contains("User not found") -> "المستخدم غير موجود"
            message.contains("Plan not found") || message.contains("Membership plan not found") -> "الخطة غير موجودة"
            message.contains("Notification not found") -> "الإشعار غير موجود"
            else -> "المورد غير موجود: ${extractId(message)}"
        }
    }

    private fun translateBadRequestMessage(message: String?): String {
        if (message == null) return "طلب غير صالح"

        return when {
            message.contains("already has an active booking") -> "العضو لديه حجز نشط بالفعل لهذه الجلسة"
            message.contains("time conflicts with") -> "لا يمكن الحجز: يوجد تعارض في الوقت مع حصة أخرى"
            message.contains("Subscription does not belong to this member") -> "الاشتراك لا ينتمي لهذا العضو"
            message.contains("Subscription is not active") -> "الاشتراك غير نشط"
            message.contains("No classes remaining") -> "لا توجد حصص متبقية في الاشتراك"
            message.contains("does not have an active subscription") -> "العضو ليس لديه اشتراك نشط"
            message.contains("Only CLOSED") -> "يمكن الحذف فقط للعناصر المغلقة"
            message.contains("Only DRAFT or CANCELLED") -> "يمكن الحذف فقط للفواتير المسودة أو الملغاة"
            message.contains("Only PERMANENTLY_CLOSED") -> "يمكن الحذف فقط للمواقع المغلقة نهائياً"
            message.contains("Invalid email") -> "البريد الإلكتروني غير صالح"
            message.contains("Invalid phone") -> "رقم الهاتف غير صالح"
            message.contains("Password") -> "كلمة المرور غير صالحة أو لا تستوفي المتطلبات"
            else -> "طلب غير صالح"
        }
    }

    private fun translateConflictMessage(message: String?): String {
        if (message == null) return "العملية غير مسموح بها في الحالة الحالية"

        return when {
            message.contains("Session is full") -> "الجلسة ممتلئة وقائمة الانتظار غير متاحة"
            message.contains("Cannot book a") -> "لا يمكن الحجز في جلسة ${translateStatus(message)}"
            message.contains("Only scheduled sessions can be cancelled") -> "يمكن إلغاء الجلسات المجدولة فقط"
            message.contains("Only scheduled sessions can be started") -> "يمكن بدء الجلسات المجدولة فقط"
            message.contains("already checked in") -> "تم تسجيل الحضور بالفعل"
            message.contains("already frozen") -> "الاشتراك مجمد بالفعل"
            message.contains("already cancelled") -> "تم الإلغاء بالفعل"
            message.contains("activate from PENDING") -> "يمكن التفعيل فقط من حالة الانتظار"
            message.contains("Invoice already paid") -> "الفاتورة مدفوعة بالفعل"
            message.contains("Invoice must be issued") -> "يجب إصدار الفاتورة أولاً"
            else -> "العملية غير مسموح بها في الحالة الحالية"
        }
    }

    private fun translateValidationMessage(fieldName: String, message: String?): String {
        val fieldAr = translateFieldName(fieldName)
        val baseMessage = message ?: "قيمة غير صالحة"

        return when {
            message?.contains("must not be blank") == true -> "$fieldAr لا يمكن أن يكون فارغاً"
            message?.contains("must not be null") == true -> "$fieldAr مطلوب"
            message?.contains("must not be empty") == true -> "$fieldAr لا يمكن أن يكون فارغاً"
            message?.contains("size must be between") == true -> "$fieldAr يجب أن يكون بين الحد الأدنى والأقصى المسموح"
            message?.contains("must be a valid email") == true -> "$fieldAr يجب أن يكون بريد إلكتروني صالح"
            message?.contains("must be positive") == true -> "$fieldAr يجب أن يكون رقماً موجباً"
            message?.contains("must be greater than") == true -> "$fieldAr يجب أن يكون أكبر من الحد الأدنى"
            message?.contains("must match") == true -> "$fieldAr لا يتطابق مع النمط المطلوب"
            else -> "$fieldAr: قيمة غير صالحة"
        }
    }

    private fun translateFieldName(fieldName: String): String {
        return when (fieldName.lowercase()) {
            "email" -> "البريد الإلكتروني"
            "password" -> "كلمة المرور"
            "firstname", "first_name" -> "الاسم الأول"
            "lastname", "last_name" -> "اسم العائلة"
            "phone" -> "رقم الهاتف"
            "nameen", "name_en" -> "الاسم بالإنجليزية"
            "namear", "name_ar" -> "الاسم بالعربية"
            "price" -> "السعر"
            "duration" -> "المدة"
            "capacity", "maxcapacity" -> "السعة"
            "startdate", "start_date" -> "تاريخ البداية"
            "enddate", "end_date" -> "تاريخ النهاية"
            "starttime", "start_time" -> "وقت البداية"
            "endtime", "end_time" -> "وقت النهاية"
            "sessiondate", "session_date" -> "تاريخ الجلسة"
            "amount" -> "المبلغ"
            "quantity" -> "الكمية"
            "memberid", "member_id" -> "معرف العضو"
            "subscriptionid", "subscription_id" -> "معرف الاشتراك"
            "planid", "plan_id" -> "معرف الخطة"
            "organizationid", "organization_id" -> "معرف المؤسسة"
            "clubid", "club_id" -> "معرف النادي"
            "locationid", "location_id" -> "معرف الموقع"
            else -> fieldName
        }
    }

    private fun translateStatus(message: String): String {
        return when {
            message.contains("CANCELLED") -> "ملغاة"
            message.contains("COMPLETED") -> "مكتملة"
            message.contains("IN_PROGRESS") -> "جارية"
            else -> ""
        }
    }

    private fun extractId(message: String): String {
        val uuidPattern = Regex("[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}", RegexOption.IGNORE_CASE)
        return uuidPattern.find(message)?.value ?: ""
    }

    private fun translateDuplicateFieldMessage(field: com.liyaqa.shared.exception.DuplicateField): String {
        return when (field) {
            com.liyaqa.shared.exception.DuplicateField.EMAIL -> "يوجد عضو بهذا البريد الإلكتروني بالفعل"
            com.liyaqa.shared.exception.DuplicateField.PHONE -> "يوجد عضو برقم الهاتف هذا بالفعل"
            com.liyaqa.shared.exception.DuplicateField.NATIONAL_ID -> "يوجد عضو برقم الهوية الوطنية هذا بالفعل"
        }
    }
}

/**
 * Localized error response with both English and Arabic messages.
 */
data class LocalizedErrorResponse(
    val status: Int,
    val error: String,
    val errorAr: String,
    val message: String,
    val messageAr: String,
    val timestamp: Instant,
    val path: String? = null
)

/**
 * Localized field error for validation failures.
 */
data class LocalizedFieldError(
    val message: String,
    val messageAr: String
)

/**
 * Localized validation error response.
 */
data class LocalizedValidationErrorResponse(
    val status: Int,
    val error: String,
    val errorAr: String,
    val message: String,
    val messageAr: String,
    val errors: Map<String, LocalizedFieldError>,
    val timestamp: Instant,
    val path: String? = null
)

// Keep old ErrorResponse for backwards compatibility
data class ErrorResponse(
    val status: Int,
    val error: String,
    val message: String,
    val timestamp: Instant
)

data class ValidationErrorResponse(
    val status: Int,
    val error: String,
    val message: String,
    val errors: Map<String, String>,
    val timestamp: Instant
)

/**
 * Error response for duplicate field conflicts.
 * Includes field information for targeted error display.
 */
data class DuplicateFieldErrorResponse(
    val status: Int,
    val error: String,
    val errorAr: String,
    val field: String,
    val fieldDisplayName: String,
    val fieldDisplayNameAr: String,
    val message: String,
    val messageAr: String,
    val timestamp: Instant,
    val path: String? = null
)
