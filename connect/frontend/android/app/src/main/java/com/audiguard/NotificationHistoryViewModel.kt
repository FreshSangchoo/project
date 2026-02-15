package com.audiguard.viewmodel

import android.app.Application
import android.os.Build
import androidx.annotation.RequiresApi
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import com.audiguard.data.AppDatabase
import kotlinx.coroutines.launch
import java.time.LocalDateTime

@RequiresApi(Build.VERSION_CODES.O)
class NotificationHistoryViewModel(application: Application) : AndroidViewModel(application) {
    private val notificationHistoryDao =
        AppDatabase.getDatabase(application).notificationHistoryDao()

    // 14일 이내의 알림만 가져오기
    val historyItems = notificationHistoryDao.getRecentHistory(LocalDateTime.now().minusDays(14))

    init {
        // 앱 시작시 14일이 지난 알림 삭제
        viewModelScope.launch {
            deleteOldNotifications()
        }
    }

    @RequiresApi(Build.VERSION_CODES.O)
    private suspend fun deleteOldNotifications() {
        val fourteenDaysAgo = LocalDateTime.now().minusDays(14)
        notificationHistoryDao.deleteOldNotifications(fourteenDaysAgo)
    }

    class Factory(private val application: Application) : ViewModelProvider.Factory {
        override fun <T : ViewModel> create(modelClass: Class<T>): T {
            if (modelClass.isAssignableFrom(NotificationHistoryViewModel::class.java)) {
                @Suppress("UNCHECKED_CAST")
                return NotificationHistoryViewModel(application) as T
            }
            throw IllegalArgumentException("Unknown ViewModel class")
        }
    }
}