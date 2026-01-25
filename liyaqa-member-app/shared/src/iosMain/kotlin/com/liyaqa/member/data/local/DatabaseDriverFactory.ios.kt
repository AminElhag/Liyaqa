package com.liyaqa.member.data.local

import app.cash.sqldelight.db.SqlDriver
import app.cash.sqldelight.driver.native.NativeSqliteDriver

actual class DatabaseDriverFactory {
    actual fun createDriver(): SqlDriver {
        return NativeSqliteDriver(
            schema = LiyaqaMemberDatabase.Schema,
            name = DATABASE_NAME
        )
    }
}
