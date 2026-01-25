package com.liyaqa.member.data.local

import app.cash.sqldelight.db.SqlDriver

/**
 * Factory for creating platform-specific SQLite drivers
 */
expect class DatabaseDriverFactory {
    fun createDriver(): SqlDriver
}

const val DATABASE_NAME = "liyaqa_member.db"
