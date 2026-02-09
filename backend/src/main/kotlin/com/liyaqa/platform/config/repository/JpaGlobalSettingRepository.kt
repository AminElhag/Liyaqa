package com.liyaqa.platform.config.repository

import com.liyaqa.platform.config.model.GlobalSetting
import com.liyaqa.platform.config.model.SettingCategory
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository
import java.util.Optional
import java.util.UUID

interface SpringDataGlobalSettingRepository : JpaRepository<GlobalSetting, UUID> {
    fun findByKey(key: String): Optional<GlobalSetting>
    fun findByCategory(category: SettingCategory): List<GlobalSetting>
}

@Repository
class JpaGlobalSettingRepository(
    private val springDataRepository: SpringDataGlobalSettingRepository
) : GlobalSettingRepository {

    override fun save(setting: GlobalSetting): GlobalSetting =
        springDataRepository.save(setting)

    override fun findById(id: UUID): Optional<GlobalSetting> =
        springDataRepository.findById(id)

    override fun findByKey(key: String): Optional<GlobalSetting> =
        springDataRepository.findByKey(key)

    override fun findAll(): List<GlobalSetting> =
        springDataRepository.findAll()

    override fun findByCategory(category: SettingCategory): List<GlobalSetting> =
        springDataRepository.findByCategory(category)
}
