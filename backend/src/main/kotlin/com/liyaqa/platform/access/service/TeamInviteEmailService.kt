package com.liyaqa.platform.access.service

import com.liyaqa.notification.domain.ports.EmailService
import org.slf4j.LoggerFactory
import org.springframework.scheduling.annotation.Async
import org.springframework.stereotype.Service

@Service
class TeamInviteEmailService(
    private val emailService: EmailService
) {
    private val logger = LoggerFactory.getLogger(TeamInviteEmailService::class.java)

    @Async
    fun sendInviteEmail(email: String, token: String, baseUrl: String) {
        try {
            val link = "$baseUrl/platform-invite?token=$token"
            val body = buildInviteEmailHtml(link)

            emailService.sendEmail(
                to = email,
                subject = "You're Invited to Liyaqa Platform - دعوة للانضمام لمنصة ليقا",
                body = body,
                isHtml = true
            )

            logger.info("Invite email sent to: {}", email)
        } catch (e: Exception) {
            logger.error("Failed to send invite email to {}", email, e)
            throw e
        }
    }

    @Async
    fun sendPasswordResetEmail(email: String, token: String, baseUrl: String) {
        try {
            val link = "$baseUrl/platform-reset-password?token=$token"
            val body = buildPasswordResetEmailHtml(link)

            emailService.sendEmail(
                to = email,
                subject = "Reset Your Liyaqa Password - إعادة تعيين كلمة المرور",
                body = body,
                isHtml = true
            )

            logger.info("Password reset email sent to: {}", email)
        } catch (e: Exception) {
            logger.error("Failed to send password reset email to {}", email, e)
            throw e
        }
    }

    private fun buildInviteEmailHtml(link: String): String {
        return """
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <style>
                    body { font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f4f4f4; }
                    .container { max-width: 600px; margin: 0 auto; background: #ffffff; }
                    .header { background-color: #1a1a2e; color: #ffffff; padding: 30px; text-align: center; }
                    .content { padding: 30px; }
                    .btn { display: inline-block; background-color: #6366f1; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; }
                    .footer { padding: 20px; text-align: center; color: #666; font-size: 12px; }
                    .rtl { direction: rtl; text-align: right; }
                    .divider { border-top: 1px solid #eee; margin: 30px 0; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>Welcome to Liyaqa</h1>
                        <p>Platform Team Invitation</p>
                    </div>
                    <div class="content">
                        <p>Hello,</p>
                        <p>You have been invited to join the Liyaqa platform team. Click the button below to set your password and get started:</p>
                        <p style="text-align: center; margin: 30px 0;">
                            <a href="$link" class="btn">Accept Invitation</a>
                        </p>
                        <p style="color: #666; font-size: 13px;">This invitation link expires in 48 hours. If you didn't expect this email, please ignore it.</p>
                    </div>
                    <div class="divider"></div>
                    <div class="content rtl">
                        <p>مرحبا،</p>
                        <p>تمت دعوتك للانضمام لفريق منصة ليقا. اضغط على الزر أدناه لتعيين كلمة المرور والبدء:</p>
                        <p style="text-align: center; margin: 30px 0;">
                            <a href="$link" class="btn">قبول الدعوة</a>
                        </p>
                        <p style="color: #666; font-size: 13px;">تنتهي صلاحية هذا الرابط خلال 48 ساعة. إذا لم تكن تتوقع هذا البريد، يرجى تجاهله.</p>
                    </div>
                    <div class="footer">
                        <p>&copy; ${java.time.Year.now().value} Liyaqa. All rights reserved.</p>
                    </div>
                </div>
            </body>
            </html>
        """.trimIndent()
    }

    private fun buildPasswordResetEmailHtml(link: String): String {
        return """
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <style>
                    body { font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f4f4f4; }
                    .container { max-width: 600px; margin: 0 auto; background: #ffffff; }
                    .header { background-color: #1a1a2e; color: #ffffff; padding: 30px; text-align: center; }
                    .content { padding: 30px; }
                    .btn { display: inline-block; background-color: #6366f1; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; }
                    .footer { padding: 20px; text-align: center; color: #666; font-size: 12px; }
                    .rtl { direction: rtl; text-align: right; }
                    .divider { border-top: 1px solid #eee; margin: 30px 0; }
                    .warning-box { background-color: #fef3c7; border: 1px solid #f59e0b; border-radius: 6px; padding: 15px; margin: 20px 0; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>Password Reset</h1>
                        <p>Liyaqa Platform</p>
                    </div>
                    <div class="content">
                        <p>Hello,</p>
                        <p>A password reset has been requested for your Liyaqa platform account. Click the button below to set a new password:</p>
                        <p style="text-align: center; margin: 30px 0;">
                            <a href="$link" class="btn">Reset Password</a>
                        </p>
                        <div class="warning-box">
                            <p><strong>Security Notice:</strong> This link expires in 1 hour. If you didn't request this reset, please contact support immediately.</p>
                        </div>
                    </div>
                    <div class="divider"></div>
                    <div class="content rtl">
                        <p>مرحبا،</p>
                        <p>تم طلب إعادة تعيين كلمة المرور لحسابك في منصة ليقا. اضغط على الزر أدناه لتعيين كلمة مرور جديدة:</p>
                        <p style="text-align: center; margin: 30px 0;">
                            <a href="$link" class="btn">إعادة تعيين كلمة المرور</a>
                        </p>
                        <div class="warning-box">
                            <p><strong>تنبيه أمني:</strong> تنتهي صلاحية هذا الرابط خلال ساعة واحدة. إذا لم تطلب إعادة التعيين، يرجى التواصل مع الدعم فورا.</p>
                        </div>
                    </div>
                    <div class="footer">
                        <p>&copy; ${java.time.Year.now().value} Liyaqa. All rights reserved.</p>
                    </div>
                </div>
            </body>
            </html>
        """.trimIndent()
    }
}
