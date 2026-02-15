package com.audiguard.viewmodel

import android.app.Application
import android.os.Build
import androidx.annotation.RequiresApi
import androidx.lifecycle.*
import com.audiguard.data.dao.NotificationHistoryDao
import com.audiguard.data.dao.NotificationSettingDao
import com.audiguard.data.dao.NameDao
import com.audiguard.data.entity.NotificationHistoryEntity
import com.audiguard.data.entity.NotificationSettingEntity
import com.audiguard.data.entity.NameEntity
import com.audiguard.utils.NotificationSyncManager
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.launch
import kotlinx.coroutines.flow.firstOrNull

// Base ViewModel for API level < 26
open class BaseNotificationViewModel(
    application: Application,
    val notificationDao: NotificationHistoryDao,
    val settingDao: NotificationSettingDao,
    val nameDao: NameDao
) : AndroidViewModel(application) {

    // Flow properties for UI observation
    val notifications: Flow<List<NotificationHistoryEntity>> = notificationDao.getAllHistory()
    val settings: Flow<List<NotificationSettingEntity>> = settingDao.getAllSettings()
    val names: Flow<List<NameEntity>> = nameDao.getAllNames()

    // Basic CRUD operations that don't require API 26
    fun addNotification(notification: NotificationHistoryEntity) {
        viewModelScope.launch {
            notificationDao.insert(notification)
        }
    }

    fun deleteNotification(notification: NotificationHistoryEntity) {
        viewModelScope.launch {
            notificationDao.delete(notification)
        }
    }

    fun updateSetting(setting: NotificationSettingEntity) {
        viewModelScope.launch {
            settingDao.updateSetting(setting)
        }
    }

    fun toggleSetting(settingId: String) {
        viewModelScope.launch {
            val settings = settingDao.getSettingsByCategory(settingId).firstOrNull()
            settings?.firstOrNull()?.let { setting ->
                settingDao.updateSettingState(setting.id, !setting.isEnabled)
            }
        }
    }

    fun insertSetting(setting: NotificationSettingEntity) {
        viewModelScope.launch {
            settingDao.insertSetting(setting)
        }
    }

    fun addName(name: NameEntity) {
        viewModelScope.launch {
            nameDao.insertName(name)
        }
    }

    fun deleteName(name: NameEntity) {
        viewModelScope.launch {
            nameDao.deleteName(name)
        }
    }

    fun getSettingsByCategory(category: String): Flow<List<NotificationSettingEntity>> {
        return settingDao.getSettingsByCategory(category)
    }

    suspend fun nameExists(name: String): Boolean {
        return nameDao.getAllNames().firstOrNull()?.any { it.name == name } ?: false
    }
}

// Extended ViewModel for API level >= 26
@RequiresApi(Build.VERSION_CODES.O)
class NotificationViewModel(
    application: Application,
    notificationDao: NotificationHistoryDao,
    settingDao: NotificationSettingDao,
    nameDao: NameDao
) : BaseNotificationViewModel(application, notificationDao, settingDao, nameDao) {

    private val syncManager = NotificationSyncManager(application)

    init {
        startDataSyncing()
    }

    private fun startDataSyncing() {
        syncManager.startAllDataMonitoring(
            viewModelScope,
            notificationDao,
            settingDao,
            nameDao
        )
    }

    fun forceSyncAll() {
        viewModelScope.launch {
            syncManager.forceSyncAll(
                notificationDao,
                settingDao,
                nameDao
            )
        }
    }
}