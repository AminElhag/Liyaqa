package com.liyaqa.crm.infrastructure.jobs

import com.liyaqa.auth.domain.ports.UserRepository
import com.liyaqa.crm.domain.model.LeadActivity
import com.liyaqa.crm.domain.ports.LeadActivityRepository
import com.liyaqa.crm.domain.ports.LeadRepository
import com.liyaqa.shared.infrastructure.email.EmailService
import net.javacrumbs.shedlock.spring.annotation.SchedulerLock
import org.slf4j.LoggerFactory
import org.springframework.data.domain.PageRequest
import org.springframework.scheduling.annotation.Scheduled
import org.springframework.stereotype.Component
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDate
import java.time.format.DateTimeFormatter

/**
 * Scheduled job that sends reminder notifications for upcoming lead follow-ups.
 * Runs every 15 minutes and notifies assigned users about follow-ups due within the next hour.
 */
@Component
class LeadFollowUpReminderJob(
    private val leadActivityRepository: LeadActivityRepository,
    private val leadRepository: LeadRepository,
    private val userRepository: UserRepository,
    private val emailService: EmailService
) {
    private val logger = LoggerFactory.getLogger(LeadFollowUpReminderJob::class.java)
    private val dateFormatter = DateTimeFormatter.ofPattern("dd/MM/yyyy")

    /**
     * Processes lead follow-up reminders.
     * Finds follow-ups due today and sends email reminders to assigned users.
     * Runs every 15 minutes.
     */
    @Scheduled(cron = "0 */15 * * * *")
    @SchedulerLock(name = "processLeadFollowUpReminders", lockAtLeastFor = "1m", lockAtMostFor = "14m")
    @Transactional(readOnly = true)
    fun processLeadFollowUpReminders() {
        logger.debug("Processing lead follow-up reminders...")

        try {
            // Find all pending follow-ups due today
            val today = LocalDate.now()
            val dueFollowUps = leadActivityRepository.findPendingFollowUpsDueBefore(
                today,
                PageRequest.of(0, 500)
            )

            if (dueFollowUps.isEmpty) {
                logger.debug("No follow-ups due today")
                return
            }

            var sentCount = 0
            var errorCount = 0

            // Group follow-ups by assigned user to batch notifications
            val followUpsByUser = mutableMapOf<String, MutableList<FollowUpInfo>>()

            for (activity in dueFollowUps) {
                try {
                    val lead = leadRepository.findById(activity.leadId).orElse(null)
                    if (lead == null) {
                        logger.warn("Lead not found for activity ${activity.id}")
                        continue
                    }

                    // Get assigned user ID (from activity performer or lead assignment)
                    val assignedUserId = activity.performedByUserId ?: lead.assignedToUserId
                    if (assignedUserId == null) {
                        logger.debug("No assigned user for follow-up ${activity.id}")
                        continue
                    }

                    val user = userRepository.findById(assignedUserId).orElse(null)
                    if (user == null) {
                        logger.warn("User not found: $assignedUserId")
                        continue
                    }

                    val followUpInfo = FollowUpInfo(
                        leadId = lead.id.toString(),
                        leadName = lead.name,
                        leadEmail = lead.email,
                        followUpDate = activity.followUpDate?.format(dateFormatter) ?: "Today",
                        activityNotes = activity.notes,
                        isOverdue = activity.followUpDate?.isBefore(today) == true
                    )

                    followUpsByUser.getOrPut(user.email) { mutableListOf() }.add(followUpInfo)
                } catch (e: Exception) {
                    logger.error("Error processing follow-up ${activity.id}: ${e.message}")
                    errorCount++
                }
            }

            // Send digest emails to each user
            for ((userEmail, followUps) in followUpsByUser) {
                try {
                    sendFollowUpReminderEmail(userEmail, followUps)
                    sentCount++
                } catch (e: Exception) {
                    logger.error("Error sending reminder email to $userEmail: ${e.message}")
                    errorCount++
                }
            }

            if (sentCount > 0 || errorCount > 0) {
                logger.info("Follow-up reminders: sent $sentCount emails, $errorCount errors")
            }
        } catch (e: Exception) {
            logger.error("Error processing follow-up reminders: ${e.message}", e)
        }
    }

    private fun sendFollowUpReminderEmail(userEmail: String, followUps: List<FollowUpInfo>) {
        val overdueCount = followUps.count { it.isOverdue }
        val dueCount = followUps.size - overdueCount

        val subject = buildString {
            append("Follow-up Reminder: ")
            if (overdueCount > 0) {
                append("$overdueCount overdue, ")
            }
            append("$dueCount due today")
        }

        val htmlBody = buildFollowUpEmailHtml(followUps)

        emailService.sendHtmlEmail(
            to = userEmail,
            subject = subject,
            htmlBody = htmlBody
        )
    }

    private fun buildFollowUpEmailHtml(followUps: List<FollowUpInfo>): String {
        val overdueFollowUps = followUps.filter { it.isOverdue }
        val dueFollowUps = followUps.filter { !it.isOverdue }

        return buildString {
            append("""
                <!DOCTYPE html>
                <html>
                <head>
                    <style>
                        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                        h1 { color: #2563eb; font-size: 24px; }
                        h2 { color: #dc2626; font-size: 18px; margin-top: 20px; }
                        h3 { color: #059669; font-size: 18px; margin-top: 20px; }
                        .lead-card { background: #f8fafc; border-left: 4px solid #2563eb; padding: 15px; margin: 10px 0; border-radius: 4px; }
                        .lead-card.overdue { border-left-color: #dc2626; background: #fef2f2; }
                        .lead-name { font-weight: bold; font-size: 16px; }
                        .lead-email { color: #6b7280; font-size: 14px; }
                        .follow-up-date { color: #059669; font-size: 14px; margin-top: 5px; }
                        .follow-up-date.overdue { color: #dc2626; }
                        .notes { color: #4b5563; font-size: 14px; margin-top: 8px; font-style: italic; }
                        .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 12px; }
                    </style>
                </head>
                <body>
                <div class="container">
                    <h1>Lead Follow-up Reminder</h1>
                    <p>You have ${followUps.size} follow-up(s) requiring your attention.</p>
            """.trimIndent())

            if (overdueFollowUps.isNotEmpty()) {
                append("""
                    <h2>Overdue Follow-ups (${overdueFollowUps.size})</h2>
                """.trimIndent())
                for (followUp in overdueFollowUps) {
                    appendFollowUpCard(followUp, true)
                }
            }

            if (dueFollowUps.isNotEmpty()) {
                append("""
                    <h3>Due Today (${dueFollowUps.size})</h3>
                """.trimIndent())
                for (followUp in dueFollowUps) {
                    appendFollowUpCard(followUp, false)
                }
            }

            append("""
                    <div class="footer">
                        <p>This is an automated reminder from Liyaqa CRM.</p>
                        <p>Log in to your dashboard to complete these follow-ups.</p>
                    </div>
                </div>
                </body>
                </html>
            """.trimIndent())
        }
    }

    private fun StringBuilder.appendFollowUpCard(followUp: FollowUpInfo, isOverdue: Boolean) {
        val cardClass = if (isOverdue) "lead-card overdue" else "lead-card"
        val dateClass = if (isOverdue) "follow-up-date overdue" else "follow-up-date"

        append("""
            <div class="$cardClass">
                <div class="lead-name">${followUp.leadName}</div>
                <div class="lead-email">${followUp.leadEmail}</div>
                <div class="$dateClass">Follow-up: ${followUp.followUpDate}</div>
        """.trimIndent())

        if (!followUp.activityNotes.isNullOrBlank()) {
            append("""
                <div class="notes">"${followUp.activityNotes}"</div>
            """.trimIndent())
        }

        append("</div>")
    }

    /**
     * Data class to hold follow-up information for email rendering.
     */
    private data class FollowUpInfo(
        val leadId: String,
        val leadName: String,
        val leadEmail: String,
        val followUpDate: String,
        val activityNotes: String?,
        val isOverdue: Boolean
    )
}
