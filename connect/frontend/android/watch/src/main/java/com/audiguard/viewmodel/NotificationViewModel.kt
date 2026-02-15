package com.audiguard.viewmodel

import android.app.Application
import android.os.Build
import androidx.annotation.RequiresApi
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.audiguard.data.dao.NotificationHistoryDao
import com.audiguard.data.entity.NotificationHistoryEntity
import com.audiguard.utils.NotificationSyncManager
import kotlinx.coroutines.launch

@RequiresApi(Build.VERSION_CODES.O)
class NotificationViewModel(
    application: Application,
    private val notificationDao: NotificationHistoryDao
) : AndroidViewModel(application) {

    private val syncManager = NotificationSyncManager(application)

    init {
        // Room의 데이터 변경을 관찰하고 워치에 동기화
        viewModelScope.launch {
            notificationDao.getAllHistory().collect { notifications ->
                syncManager.syncNotifications(notifications)
            }
        }
    }

    // 새 알림 추가 시
    fun addNotification(notification: NotificationHistoryEntity) {
        viewModelScope.launch {
            notificationDao.insert(notification)
            // 새 알림을 즉시 워치에 동기화
            syncManager.syncNotification(notification)
        }
    }

    // 알림 삭제 시
    fun deleteNotification(notification: NotificationHistoryEntity) {
        viewModelScope.launch {
            notificationDao.delete(notification)
            // 변경된 전체 목록을 워치에 동기화
            notificationDao.getAllHistory().collect { notifications ->
                syncManager.syncNotifications(notifications)
            }
        }
    }
}