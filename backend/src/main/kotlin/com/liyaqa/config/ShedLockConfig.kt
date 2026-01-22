package com.liyaqa.config

import jakarta.annotation.PostConstruct
import net.javacrumbs.shedlock.core.LockProvider
import net.javacrumbs.shedlock.provider.jdbctemplate.JdbcTemplateLockProvider
import net.javacrumbs.shedlock.spring.annotation.EnableSchedulerLock
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.jdbc.core.JdbcTemplate
import org.springframework.scheduling.annotation.EnableScheduling
import javax.sql.DataSource

/**
 * Configuration for ShedLock - distributed lock for scheduled jobs.
 *
 * ShedLock ensures that scheduled jobs run only once across multiple
 * application instances. This is critical for jobs like:
 * - Sending notification reminders (avoid duplicates)
 * - Processing expired subscriptions (avoid double processing)
 * - Marking invoices as overdue (avoid duplicate state changes)
 *
 * The lock is held for the duration of the job execution, and released
 * when the job completes (or after the lockAtMostFor duration).
 */
@Configuration
@EnableScheduling
@EnableSchedulerLock(defaultLockAtMostFor = "10m")
class ShedLockConfig(private val dataSource: DataSource) {

    /**
     * Creates the SHEDLOCK table for H2 in dev mode.
     * In production, this table is created via Flyway migration V13.
     */
    @PostConstruct
    fun createShedLockTableIfNeeded() {
        val jdbcTemplate = JdbcTemplate(dataSource)
        try {
            // Check if table exists by trying to query it
            jdbcTemplate.queryForObject("SELECT COUNT(*) FROM shedlock", Int::class.java)
        } catch (e: Exception) {
            // Table doesn't exist, create it (H2 compatible syntax)
            jdbcTemplate.execute("""
                CREATE TABLE IF NOT EXISTS shedlock (
                    name VARCHAR(64) NOT NULL PRIMARY KEY,
                    lock_until TIMESTAMP(3) NOT NULL,
                    locked_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
                    locked_by VARCHAR(255) NOT NULL
                )
            """.trimIndent())
        }
    }

    /**
     * Creates a JDBC-based lock provider for ShedLock.
     * Uses the same database as the application to store lock information.
     */
    @Bean
    fun lockProvider(): LockProvider {
        return JdbcTemplateLockProvider.Configuration.builder()
            .withJdbcTemplate(JdbcTemplate(dataSource))
            .usingDbTime() // Use database time instead of application time
            .build()
            .let { JdbcTemplateLockProvider(it) }
    }
}
