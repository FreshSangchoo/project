package com.audiguard.viewmodel

import android.app.Application
import android.os.Build
import androidx.annotation.RequiresApi
import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import com.audiguard.data.dao.NameDao
import com.audiguard.data.dao.NotificationHistoryDao
import com.audiguard.data.dao.NotificationSettingDao

class NotificationViewModelFactory(
    private val application: Application,
    private val notificationDao: NotificationHistoryDao,
    private val settingDao: NotificationSettingDao,
    private val nameDao: NameDao
) : ViewModelProvider.Factory {

    override fun <T : ViewModel> create(modelClass: Class<T>): T {
        if (modelClass.isAssignableFrom(NotificationViewModel::class.java) ||
            modelClass.isAssignableFrom(BaseNotificationViewModel::class.java)
        ) {

            @Suppress("UNCHECKED_CAST")
            return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                NotificationViewModel(
                    application,
                    notificationDao,
                    settingDao,
                    nameDao
                ) as T
            } else {
                BaseNotificationViewModel(
                    application,
                    notificationDao,
                    settingDao,
                    nameDao
                ) as T
            }
        }
        throw IllegalArgumentException("Unknown ViewModel class")
    }
}