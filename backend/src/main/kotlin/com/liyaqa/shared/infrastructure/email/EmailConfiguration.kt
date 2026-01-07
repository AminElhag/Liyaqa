package com.liyaqa.shared.infrastructure.email

import org.springframework.boot.context.properties.ConfigurationProperties
import org.springframework.context.annotation.Configuration

/**
 * Email configuration properties.
 * Configure via application.yml:
 *
 * liyaqa:
 *   email:
 *     enabled: true
 *     from-address: noreply@liyaqa.com
 *     from-name: Liyaqa
 *
 * spring:
 *   mail:
 *     host: smtp.gmail.com
 *     port: 587
 *     username: your-email@gmail.com
 *     password: your-app-password
 *     properties:
 *       mail.smtp.auth: true
 *       mail.smtp.starttls.enable: true
 */
@Configuration
@ConfigurationProperties(prefix = "liyaqa.email")
class EmailConfiguration {
    /**
     * Whether email sending is enabled.
     * If false, emails are logged to console instead.
     */
    var enabled: Boolean = false

    /**
     * From email address for outgoing emails.
     */
    var fromAddress: String = "noreply@liyaqa.com"

    /**
     * Display name for the sender.
     */
    var fromName: String = "Liyaqa"

    /**
     * Base URL for links in emails (e.g., password reset).
     */
    var baseUrl: String = "http://localhost:3000"
}
