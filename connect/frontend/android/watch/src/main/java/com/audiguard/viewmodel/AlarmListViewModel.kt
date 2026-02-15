package com.audiguard.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.audiguard.data.dao.NotificationHistoryDao
import com.audiguard.data.entity.NotificationHistoryEntity
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.launch

class AlarmListViewModel(
    private val notificationDao: NotificationHistoryDao
) : ViewModel() {
    // 알림 목록을 Flow로 관리
    val notifications: Flow<List<NotificationHistoryEntity>> = notificationDao.getAllHistory()

    // 필요한 경우 알림 목록 갱신
    fun refreshNotifications() {
        viewModelScope.launch {
            // 필요한 경우 추가적인 데이터 갱신 로직
        }
    }
}