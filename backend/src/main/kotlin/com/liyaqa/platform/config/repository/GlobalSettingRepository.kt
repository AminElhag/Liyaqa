package com.liyaqa.platform.config.repository

import com.liyaqa.platform.config.model.GlobalSetting
import com.liyaqa.platform.config.model.SettingCategory
import java.util.Optional
import java.util.UUID

interface GlobalSettingRepository {
    fun save(setting: GlobalSetting): GlobalSetting
    fun findById(id: UUID): Optional<GlobalSetting>
    fun findByKey(key: String): Optional<GlobalSetting>
    fun findAll(): List<GlobalSetting>
    fun findByCategory(category: SettingCategory): List<GlobalSetting>
}
