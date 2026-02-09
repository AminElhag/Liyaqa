package com.liyaqa.platform.exception

enum class PlatformErrorCode(val code: String, val messageEn: String, val messageAr: String) {
    // Generic
    RESOURCE_NOT_FOUND("PLATFORM_001", "Resource not found", "المورد غير موجود"),
    DUPLICATE_RESOURCE("PLATFORM_002", "Resource already exists", "المورد موجود بالفعل"),
    INVALID_STATE("PLATFORM_003", "Invalid state transition", "انتقال حالة غير صالح"),
    ACCESS_DENIED("PLATFORM_004", "Access denied", "تم رفض الوصول"),
    VALIDATION_FAILED("PLATFORM_005", "Validation failed", "فشل التحقق"),

    // Subscription
    SUBSCRIPTION_NOT_FOUND("SUB_001", "Subscription not found", "الاشتراك غير موجود"),
    PLAN_NOT_FOUND("SUB_002", "Subscription plan not found", "خطة الاشتراك غير موجودة"),
    ACTIVE_SUBSCRIPTION_EXISTS("SUB_003", "Active subscription already exists", "يوجد اشتراك نشط بالفعل"),
    INVALID_SUBSCRIPTION_STATE("SUB_004", "Invalid subscription state", "حالة اشتراك غير صالحة"),
    INVOICE_NOT_FOUND("SUB_005", "Invoice not found", "الفاتورة غير موجودة"),
    INVOICE_INVALID_STATE("SUB_006", "Invalid invoice state", "حالة فاتورة غير صالحة"),
    DUPLICATE_PLAN_TIER("SUB_007", "Plan tier already exists", "مستوى الخطة موجود بالفعل"),
    FEATURE_FLAG_NOT_FOUND("SUB_008", "Feature flag not found", "علامة الميزة غير موجودة"),
    DUPLICATE_FEATURE_KEY("SUB_009", "Feature key already exists", "مفتاح الميزة موجود بالفعل"),

    // Support
    TICKET_NOT_FOUND("TKT_001", "Ticket not found", "التذكرة غير موجودة"),
    INVALID_TICKET_TRANSITION("TKT_002", "Invalid ticket status transition", "انتقال حالة تذكرة غير صالح"),
    CANNED_RESPONSE_NOT_FOUND("TKT_003", "Canned response not found", "الرد الجاهز غير موجود"),
    TICKET_RATING_ERROR("TKT_004", "Invalid ticket rating", "تقييم تذكرة غير صالح"),

    // Access
    IMPERSONATION_READ_ONLY("ACC_001", "Write operations not allowed during impersonation", "العمليات الكتابية غير مسموحة أثناء انتحال الشخصية"),
    IMPERSONATION_SESSION_NOT_FOUND("ACC_002", "Impersonation session not found", "جلسة الانتحال غير موجودة"),
    ACTIVE_IMPERSONATION_EXISTS("ACC_003", "Active impersonation session already exists", "جلسة انتحال نشطة موجودة بالفعل"),
    IMPERSONATION_SESSION_EXPIRED("ACC_004", "Impersonation session expired", "انتهت صلاحية جلسة الانتحال"),
    INVITE_TOKEN_NOT_FOUND("ACC_005", "Invite token not found", "رمز الدعوة غير موجود"),
    INVITE_TOKEN_EXPIRED("ACC_006", "Invite token expired", "انتهت صلاحية رمز الدعوة"),
    INVITE_TOKEN_USED("ACC_007", "Invite token already used", "رمز الدعوة مستخدم بالفعل"),
    API_KEY_NOT_FOUND("ACC_008", "API key not found", "مفتاح API غير موجود"),
    API_KEY_REVOKED("ACC_009", "API key already revoked", "مفتاح API تم إلغاؤه بالفعل"),

    // Communication
    ANNOUNCEMENT_NOT_FOUND("COM_001", "Announcement not found", "الإعلان غير موجود"),
    INVALID_ANNOUNCEMENT_STATE("COM_002", "Invalid announcement state", "حالة إعلان غير صالحة"),
    COMM_TEMPLATE_NOT_FOUND("COM_003", "Communication template not found", "قالب الاتصال غير موجود"),
    DUPLICATE_TEMPLATE_CODE("COM_004", "Template code already exists", "رمز القالب موجود بالفعل"),

    // Config
    SETTING_NOT_FOUND("CFG_001", "Setting not found", "الإعداد غير موجود"),
    SETTING_NOT_EDITABLE("CFG_002", "Setting is not editable", "الإعداد غير قابل للتعديل"),
    SETTING_TYPE_MISMATCH("CFG_003", "Setting value type mismatch", "عدم تطابق نوع قيمة الإعداد"),
    MAINTENANCE_WINDOW_NOT_FOUND("CFG_004", "Maintenance window not found", "نافذة الصيانة غير موجودة"),

    // Content
    ARTICLE_NOT_FOUND("CNT_001", "Article not found", "المقال غير موجود"),
    DUPLICATE_SLUG("CNT_002", "Slug already exists", "الرابط الثابت موجود بالفعل"),
    CONTENT_TEMPLATE_NOT_FOUND("CNT_003", "Template not found", "القالب غير موجود"),
    DUPLICATE_TEMPLATE_KEY("CNT_004", "Template key already exists", "مفتاح القالب موجود بالفعل"),
    TEMPLATE_RENDER_ERROR("CNT_005", "Template rendering failed", "فشل عرض القالب"),

    // Compliance
    CONTRACT_NOT_FOUND("CMP_001", "Contract not found", "العقد غير موجود"),
    DUPLICATE_CONTRACT_NUMBER("CMP_002", "Contract number already exists", "رقم العقد موجود بالفعل"),
    INVALID_CONTRACT_STATE("CMP_003", "Invalid contract state", "حالة عقد غير صالحة"),
    ZATCA_SUBMISSION_NOT_FOUND("CMP_004", "ZATCA submission not found", "إرسال هيئة الزكاة غير موجود"),
    DATA_EXPORT_NOT_FOUND("CMP_005", "Data export request not found", "طلب تصدير البيانات غير موجود"),
    INVALID_DATA_EXPORT_STATE("CMP_006", "Invalid data export request state", "حالة طلب تصدير بيانات غير صالحة"),

    // Analytics
    ANALYTICS_UNAVAILABLE("ANL_001", "Analytics data unavailable", "بيانات التحليلات غير متاحة"),
    UNSUPPORTED_EXPORT_FORMAT("ANL_002", "Unsupported export format", "صيغة تصدير غير مدعومة"),
}
