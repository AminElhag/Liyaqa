package com.liyaqa.notification.application.services

import com.liyaqa.notification.domain.ports.EmailService
import org.slf4j.LoggerFactory
import org.springframework.scheduling.annotation.Async
import org.springframework.stereotype.Service

/**
 * Service responsible for sending platform passwordless login emails.
 * All email sending is done asynchronously to not impact user-facing performance.
 */
@Service
class PlatformLoginEmailService(
    private val emailService: EmailService
) {
    private val logger = LoggerFactory.getLogger(PlatformLoginEmailService::class.java)

    /**
     * Sends a passwordless login code via email.
     *
     * @param email The user's email address
     * @param code The 6-digit OTP code
     * @param expirationMinutes How many minutes until the code expires (default: 10)
     */
    @Async
    fun sendLoginCode(
        email: String,
        code: String,
        expirationMinutes: Int = 10
    ) {
        try {
            val body = buildLoginCodeEmailHtml(code, expirationMinutes)

            emailService.sendEmail(
                to = email,
                subject = "Your Liyaqa Login Code - رمز تسجيل الدخول",
                body = body,
                isHtml = true
            )

            logger.info("Login code sent to: $email")
        } catch (e: Exception) {
            logger.error("Failed to send login code to $email", e)
            throw e // Re-throw to let the caller know email failed
        }
    }

    /**
     * Builds bilingual HTML email for the login code.
     */
    private fun buildLoginCodeEmailHtml(code: String, expirationMinutes: Int): String {
        return """
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <style>
                    body {
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                        line-height: 1.6;
                        color: #1f2937;
                        margin: 0;
                        padding: 0;
                        background-color: #f3f4f6;
                    }
                    .container {
                        max-width: 600px;
                        margin: 40px auto;
                        background-color: white;
                        border-radius: 12px;
                        overflow: hidden;
                        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                    }
                    .header {
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        color: white;
                        padding: 40px 30px;
                        text-align: center;
                    }
                    .header h1 {
                        margin: 0;
                        font-size: 28px;
                        font-weight: 600;
                    }
                    .header p {
                        margin: 10px 0 0 0;
                        font-size: 16px;
                        opacity: 0.9;
                    }
                    .content {
                        padding: 40px 30px;
                    }
                    .code-box {
                        background: linear-gradient(135deg, #667eea15 0%, #764ba215 100%);
                        border: 2px solid #667eea;
                        border-radius: 12px;
                        padding: 30px;
                        margin: 30px 0;
                        text-align: center;
                    }
                    .code-label {
                        font-size: 14px;
                        color: #6b7280;
                        margin-bottom: 10px;
                        font-weight: 500;
                        text-transform: uppercase;
                        letter-spacing: 0.5px;
                    }
                    .code {
                        font-size: 48px;
                        font-weight: 700;
                        letter-spacing: 8px;
                        color: #667eea;
                        font-family: 'Courier New', monospace;
                        margin: 10px 0;
                    }
                    .expiry {
                        font-size: 14px;
                        color: #9ca3af;
                        margin-top: 10px;
                    }
                    .warning-box {
                        background-color: #fef3c7;
                        border-left: 4px solid #f59e0b;
                        padding: 15px 20px;
                        margin: 20px 0;
                        border-radius: 6px;
                    }
                    .warning-box p {
                        margin: 5px 0;
                        color: #92400e;
                        font-size: 14px;
                    }
                    .footer {
                        text-align: center;
                        padding: 30px;
                        background-color: #f9fafb;
                        color: #6b7280;
                        font-size: 12px;
                        border-top: 1px solid #e5e7eb;
                    }
                    .footer a {
                        color: #667eea;
                        text-decoration: none;
                    }
                    .divider {
                        height: 1px;
                        background: linear-gradient(90deg, transparent, #e5e7eb, transparent);
                        margin: 40px 0;
                    }
                    .rtl {
                        direction: rtl;
                        text-align: right;
                    }
                    .rtl .code-box,
                    .rtl .footer {
                        text-align: center;
                    }
                    @media only screen and (max-width: 600px) {
                        .container {
                            margin: 20px;
                            border-radius: 8px;
                        }
                        .code {
                            font-size: 36px;
                            letter-spacing: 4px;
                        }
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <!-- English Version -->
                    <div class="header">
                        <h1>🔐 Login Code</h1>
                        <p>Liyaqa Platform</p>
                    </div>

                    <div class="content">
                        <p>Hello,</p>
                        <p>You requested to log in to your Liyaqa platform account. Use the code below to complete your login:</p>

                        <div class="code-box">
                            <div class="code-label">Your Login Code</div>
                            <div class="code">${code}</div>
                            <div class="expiry">⏱ Valid for $expirationMinutes minutes</div>
                        </div>

                        <div class="warning-box">
                            <p><strong>⚠️ Security Notice:</strong></p>
                            <p>• Never share this code with anyone</p>
                            <p>• Liyaqa staff will never ask for your code</p>
                            <p>• If you didn't request this code, please ignore this email</p>
                        </div>

                        <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
                            Need help? Contact our support team at <a href="mailto:support@liyaqa.com" style="color: #667eea;">support@liyaqa.com</a>
                        </p>
                    </div>

                    <div class="divider"></div>

                    <!-- Arabic Version -->
                    <div class="header rtl">
                        <h1>🔐 رمز تسجيل الدخول</h1>
                        <p>منصة ليقا</p>
                    </div>

                    <div class="content rtl">
                        <p>مرحباً،</p>
                        <p>لقد طلبت تسجيل الدخول إلى حساب منصة ليقا الخاص بك. استخدم الرمز أدناه لإكمال تسجيل الدخول:</p>

                        <div class="code-box">
                            <div class="code-label">رمز تسجيل الدخول</div>
                            <div class="code">${code}</div>
                            <div class="expiry">⏱ صالح لمدة $expirationMinutes دقائق</div>
                        </div>

                        <div class="warning-box rtl">
                            <p><strong>⚠️ تنبيه أمني:</strong></p>
                            <p>• لا تشارك هذا الرمز مع أي شخص</p>
                            <p>• لن يطلب فريق ليقا رمزك أبداً</p>
                            <p>• إذا لم تطلب هذا الرمز، يرجى تجاهل هذا البريد الإلكتروني</p>
                        </div>

                        <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
                            تحتاج مساعدة؟ اتصل بفريق الدعم على <a href="mailto:support@liyaqa.com" style="color: #667eea;">support@liyaqa.com</a>
                        </p>
                    </div>

                    <div class="footer">
                        <p>© ${java.time.Year.now().value} Liyaqa. All rights reserved.</p>
                        <p>This is an automated message, please do not reply to this email.</p>
                    </div>
                </div>
            </body>
            </html>
        """.trimIndent()
    }
}
