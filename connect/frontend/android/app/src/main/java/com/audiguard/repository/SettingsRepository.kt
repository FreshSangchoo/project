package com.audiguard.repository

import com.audiguard.data.dao.NameDao
import com.audiguard.data.dao.NotificationSettingDao
import com.audiguard.data.entity.NameEntity
import com.audiguard.data.entity.NotificationSettingEntity
import kotlinx.coroutines.flow.Flow
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class SettingsRepository @Inject constructor(
    private val notificationSettingDao: NotificationSettingDao,
    private val nameDao: NameDao
) {
    fun getAllSettings(): Flow<List<NotificationSettingEntity>> =
        notificationSettingDao.getAllSettings()

    fun getSettingsByCategory(category: String): Flow<List<NotificationSettingEntity>> =
        notificationSettingDao.getSettingsByCategory(category)

    suspend fun updateSetting(id: String, isEnabled: Boolean) {
        notificationSettingDao.updateSettingState(id, isEnabled)
    }

    fun getAllNames(): Flow<List<NameEntity>> = nameDao.getAllNames()

    suspend fun addName(name: NameEntity) {
        nameDao.insertName(name)
    }

    suspend fun deleteName(name: NameEntity) {
        nameDao.deleteName(name)
    }
}