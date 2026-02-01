package com.liyaqa.notification.application.services

import com.liyaqa.shared.infrastructure.email.EmailService
import org.slf4j.LoggerFactory
import org.springframework.scheduling.annotation.Async
import org.springframework.stereotype.Service
import java.time.Instant
import java.time.ZoneId
import java.time.format.DateTimeFormatter
import java.util.UUID

/**
 * Service responsible for sending security-related email notifications.
 * All email sending is done asynchronously to not impact user-facing performance.
 */
@Service
class SecurityEmailService(
    private val emailService: EmailService
) {
    private val logger = LoggerFactory.getLogger(SecurityEmailService::class.java)

    /**
     * Sends an email notification when an account is locked due to failed login attempts.
     *
     * @param email The user's email address
     * @param userName The user's display name
     * @param lockTimestamp When the account was locked
     * @param ipAddress The IP address from which the failed attempts originated
     * @param deviceInfo Device information (browser, OS, etc.)
     * @param failedAttempts Number of failed attempts that triggered the lock
     */
    @Async
    fun sendAccountLockedNotification(
        email: String,
        userName: String,
        lockTimestamp: Instant,
        ipAddress: String,
        deviceInfo: String?,
        failedAttempts: Int
    ) {
        try {
            val formattedTime = DateTimeFormatter
                .ofPattern("MMMM dd, yyyy 'at' h:mm a")
                .withZone(ZoneId.systemDefault())
                .format(lockTimestamp)

            val htmlBody = buildAccountLockedEmailHtml(
                userName,
                formattedTime,
                ipAddress,
                deviceInfo ?: "Unknown Device",
                failedAttempts
            )

            emailService.sendHtmlEmail(
                to = email,
                subject = "Account Locked - حساب محظور - Liyaqa Security Alert",
                htmlBody = htmlBody
            )

            logger.info("Account locked notification sent to: $email")
        } catch (e: Exception) {
            // Log error but don't fail the lockout process
            logger.error("Failed to send account locked notification to $email", e)
        }
    }

    /**
     * Sends an email notification for suspicious login activity.
     *
     * @param email The user's email address
     * @param userName The user's display name
     * @param attemptTimestamp When the suspicious activity occurred
     * @param ipAddress The IP address
     * @param location Geographic location (if available)
     * @param deviceInfo Device information
     * @param reason Why this was flagged as suspicious
     */
    @Async
    fun sendSuspiciousActivityNotification(
        email: String,
        userName: String,
        attemptTimestamp: Instant,
        ipAddress: String,
        location: String?,
        deviceInfo: String?,
        reason: String
    ) {
        try {
            val formattedTime = DateTimeFormatter
                .ofPattern("MMMM dd, yyyy 'at' h:mm a")
                .withZone(ZoneId.systemDefault())
                .format(attemptTimestamp)

            val htmlBody = buildSuspiciousActivityEmailHtml(
                userName,
                formattedTime,
                ipAddress,
                location ?: "Unknown Location",
                deviceInfo ?: "Unknown Device",
                reason
            )

            emailService.sendHtmlEmail(
                to = email,
                subject = "Suspicious Login Activity - نشاط مشبوه - Liyaqa Security Alert",
                htmlBody = htmlBody
            )

            logger.info("Suspicious activity notification sent to: $email")
        } catch (e: Exception) {
            logger.error("Failed to send suspicious activity notification to $email", e)
        }
    }

    /**
     * Sends an email notification when a new device is detected.
     *
     * @param email The user's email address
     * @param userName The user's display name
     * @param loginTimestamp When the login occurred
     * @param ipAddress The IP address
     * @param location Geographic location (if available)
     * @param deviceInfo Device information
     */
    @Async
    fun sendNewDeviceNotification(
        email: String,
        userName: String,
        loginTimestamp: Instant,
        ipAddress: String,
        location: String?,
        deviceInfo: String?
    ) {
        try {
            val formattedTime = DateTimeFormatter
                .ofPattern("MMMM dd, yyyy 'at' h:mm a")
                .withZone(ZoneId.systemDefault())
                .format(loginTimestamp)

            val htmlBody = buildNewDeviceEmailHtml(
                userName,
                formattedTime,
                ipAddress,
                location ?: "Unknown Location",
                deviceInfo ?: "Unknown Device"
            )

            emailService.sendHtmlEmail(
                to = email,
                subject = "New Device Login - تسجيل دخول من جهاز جديد - Liyaqa",
                htmlBody = htmlBody
            )

            logger.info("New device notification sent to: $email")
        } catch (e: Exception) {
            logger.error("Failed to send new device notification to $email", e)
        }
    }

    /**
     * Builds HTML email for account locked notification.
     */
    private fun buildAccountLockedEmailHtml(
        userName: String,
        timestamp: String,
        ipAddress: String,
        deviceInfo: String,
        failedAttempts: Int
    ): String {
        return """
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background-color: #dc2626; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
                    .content { background-color: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
                    .info-box { background-color: white; padding: 15px; margin: 15px 0; border-left: 4px solid #dc2626; }
                    .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 12px; }
                    .button { display: inline-block; padding: 12px 24px; background-color: #dc2626; color: white; text-decoration: none; border-radius: 6px; margin: 10px 0; }
                    .rtl { direction: rtl; text-align: right; }
                </style>
            </head>
            <body>
                <div class="container">
                    <!-- English Version -->
                    <div class="header">
                        <h2 style="margin: 0;">🔒 Account Locked</h2>
                    </div>
                    <div class="content">
                        <p>Hello <strong>$userName</strong>,</p>

                        <p>Your account has been locked due to $failedAttempts consecutive failed login attempts.</p>

                        <div class="info-box">
                            <strong>Details:</strong><br>
                            <strong>Time:</strong> $timestamp<br>
                            <strong>IP Address:</strong> $ipAddress<br>
                            <strong>Device:</strong> $deviceInfo<br>
                            <strong>Failed Attempts:</strong> $failedAttempts
                        </div>

                        <p><strong>What happened?</strong></p>
                        <p>For your security, we lock accounts after multiple failed login attempts to protect against unauthorized access.</p>

                        <p><strong>What should you do?</strong></p>
                        <ul>
                            <li>If this was you, please contact support to unlock your account</li>
                            <li>If this wasn't you, your account may be under attack - contact support immediately</li>
                            <li>Once unlocked, we recommend changing your password</li>
                        </ul>

                        <p><strong>Need help?</strong> Contact our support team for assistance.</p>
                    </div>

                    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 40px 0;">

                    <!-- Arabic Version -->
                    <div class="header rtl">
                        <h2 style="margin: 0;">🔒 تم قفل الحساب</h2>
                    </div>
                    <div class="content rtl">
                        <p>مرحباً <strong>$userName</strong>،</p>

                        <p>تم قفل حسابك بسبب $failedAttempts محاولات تسجيل دخول فاشلة متتالية.</p>

                        <div class="info-box">
                            <strong>التفاصيل:</strong><br>
                            <strong>الوقت:</strong> $timestamp<br>
                            <strong>عنوان IP:</strong> $ipAddress<br>
                            <strong>الجهاز:</strong> $deviceInfo<br>
                            <strong>المحاولات الفاشلة:</strong> $failedAttempts
                        </div>

                        <p><strong>ماذا حدث؟</strong></p>
                        <p>لأمانك، نقوم بقفل الحسابات بعد عدة محاولات تسجيل دخول فاشلة لحمايتك من الوصول غير المصرح به.</p>

                        <p><strong>ماذا يجب أن تفعل؟</strong></p>
                        <ul>
                            <li>إذا كان هذا أنت، يرجى الاتصال بالدعم لفتح حسابك</li>
                            <li>إذا لم يكن هذا أنت، قد يكون حسابك تحت هجوم - اتصل بالدعم فوراً</li>
                            <li>بمجرد فتح الحساب، نوصي بتغيير كلمة المرور</li>
                        </ul>

                        <p><strong>تحتاج مساعدة؟</strong> اتصل بفريق الدعم للحصول على المساعدة.</p>
                    </div>

                    <div class="footer">
                        <p>This is an automated security notification from Liyaqa.<br>
                        هذا إشعار أمني تلقائي من لياقة</p>
                        <p>© ${java.time.Year.now().value} Liyaqa. All rights reserved.</p>
                    </div>
                </div>
            </body>
            </html>
        """.trimIndent()
    }

    /**
     * Builds HTML email for suspicious activity notification.
     */
    private fun buildSuspiciousActivityEmailHtml(
        userName: String,
        timestamp: String,
        ipAddress: String,
        location: String,
        deviceInfo: String,
        reason: String
    ): String {
        return """
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background-color: #f59e0b; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
                    .content { background-color: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
                    .info-box { background-color: white; padding: 15px; margin: 15px 0; border-left: 4px solid #f59e0b; }
                    .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 12px; }
                    .rtl { direction: rtl; text-align: right; }
                </style>
            </head>
            <body>
                <div class="container">
                    <!-- English Version -->
                    <div class="header">
                        <h2 style="margin: 0;">⚠️ Suspicious Login Activity Detected</h2>
                    </div>
                    <div class="content">
                        <p>Hello <strong>$userName</strong>,</p>

                        <p>We detected a suspicious login attempt on your account.</p>

                        <div class="info-box">
                            <strong>Details:</strong><br>
                            <strong>Time:</strong> $timestamp<br>
                            <strong>Location:</strong> $location<br>
                            <strong>IP Address:</strong> $ipAddress<br>
                            <strong>Device:</strong> $deviceInfo<br>
                            <strong>Reason:</strong> $reason
                        </div>

                        <p><strong>Was this you?</strong></p>
                        <p>If you recognize this activity, you can safely ignore this email. Otherwise, please take action immediately.</p>

                        <p><strong>If this wasn't you:</strong></p>
                        <ul>
                            <li>Change your password immediately</li>
                            <li>Review your recent login history</li>
                            <li>Contact support if you need assistance</li>
                        </ul>
                    </div>

                    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 40px 0;">

                    <!-- Arabic Version -->
                    <div class="header rtl">
                        <h2 style="margin: 0;">⚠️ تم اكتشاف نشاط تسجيل دخول مشبوه</h2>
                    </div>
                    <div class="content rtl">
                        <p>مرحباً <strong>$userName</strong>،</p>

                        <p>اكتشفنا محاولة تسجيل دخول مشبوهة على حسابك.</p>

                        <div class="info-box">
                            <strong>التفاصيل:</strong><br>
                            <strong>الوقت:</strong> $timestamp<br>
                            <strong>الموقع:</strong> $location<br>
                            <strong>عنوان IP:</strong> $ipAddress<br>
                            <strong>الجهاز:</strong> $deviceInfo<br>
                            <strong>السبب:</strong> $reason
                        </div>

                        <p><strong>هل كان هذا أنت؟</strong></p>
                        <p>إذا تعرفت على هذا النشاط، يمكنك تجاهل هذا البريد الإلكتروني بأمان. وإلا، يرجى اتخاذ إجراء فوراً.</p>

                        <p><strong>إذا لم يكن هذا أنت:</strong></p>
                        <ul>
                            <li>قم بتغيير كلمة المرور فوراً</li>
                            <li>راجع سجل تسجيل الدخول الأخير</li>
                            <li>اتصل بالدعم إذا كنت بحاجة إلى مساعدة</li>
                        </ul>
                    </div>

                    <div class="footer">
                        <p>This is an automated security notification from Liyaqa.<br>
                        هذا إشعار أمني تلقائي من لياقة</p>
                        <p>© ${java.time.Year.now().value} Liyaqa. All rights reserved.</p>
                    </div>
                </div>
            </body>
            </html>
        """.trimIndent()
    }

    /**
     * Builds HTML email for new device notification.
     */
    private fun buildNewDeviceEmailHtml(
        userName: String,
        timestamp: String,
        ipAddress: String,
        location: String,
        deviceInfo: String
    ): String {
        return """
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background-color: #3b82f6; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
                    .content { background-color: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
                    .info-box { background-color: white; padding: 15px; margin: 15px 0; border-left: 4px solid #3b82f6; }
                    .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 12px; }
                    .rtl { direction: rtl; text-align: right; }
                </style>
            </head>
            <body>
                <div class="container">
                    <!-- English Version -->
                    <div class="header">
                        <h2 style="margin: 0;">🔔 New Device Login</h2>
                    </div>
                    <div class="content">
                        <p>Hello <strong>$userName</strong>,</p>

                        <p>We detected a login from a new device.</p>

                        <div class="info-box">
                            <strong>Details:</strong><br>
                            <strong>Time:</strong> $timestamp<br>
                            <strong>Location:</strong> $location<br>
                            <strong>IP Address:</strong> $ipAddress<br>
                            <strong>Device:</strong> $deviceInfo
                        </div>

                        <p><strong>Was this you?</strong></p>
                        <p>If you recognize this device, no action is needed. This is just a security notification.</p>

                        <p><strong>If this wasn't you:</strong></p>
                        <p>Please secure your account immediately by changing your password and reviewing your login history.</p>
                    </div>

                    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 40px 0;">

                    <!-- Arabic Version -->
                    <div class="header rtl">
                        <h2 style="margin: 0;">🔔 تسجيل دخول من جهاز جديد</h2>
                    </div>
                    <div class="content rtl">
                        <p>مرحباً <strong>$userName</strong>،</p>

                        <p>اكتشفنا تسجيل دخول من جهاز جديد.</p>

                        <div class="info-box">
                            <strong>التفاصيل:</strong><br>
                            <strong>الوقت:</strong> $timestamp<br>
                            <strong>الموقع:</strong> $location<br>
                            <strong>عنوان IP:</strong> $ipAddress<br>
                            <strong>الجهاز:</strong> $deviceInfo
                        </div>

                        <p><strong>هل كان هذا أنت؟</strong></p>
                        <p>إذا تعرفت على هذا الجهاز، لا حاجة لأي إجراء. هذا مجرد إشعار أمني.</p>

                        <p><strong>إذا لم يكن هذا أنت:</strong></p>
                        <p>يرجى تأمين حسابك فوراً عن طريق تغيير كلمة المرور ومراجعة سجل تسجيل الدخول.</p>
                    </div>

                    <div class="footer">
                        <p>This is an automated security notification from Liyaqa.<br>
                        هذا إشعار أمني تلقائي من لياقة</p>
                        <p>© ${java.time.Year.now().value} Liyaqa. All rights reserved.</p>
                    </div>
                </div>
            </body>
            </html>
        """.trimIndent()
    }
}
