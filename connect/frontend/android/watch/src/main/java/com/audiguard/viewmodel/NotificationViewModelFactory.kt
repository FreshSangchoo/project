package com.audiguard.viewmodel

import android.app.Application
import android.os.Build
import androidx.annotation.RequiresApi
import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import com.audiguard.data.dao.NotificationHistoryDao

class NotificationViewModelFactory(
    private val application: Application,
    private val notificationDao: NotificationHistoryDao
) : ViewModelProvider.Factory {

    @RequiresApi(Build.VERSION_CODES.O)
    override fun <T : ViewModel> create(modelClass: Class<T>): T {
        if (modelClass.isAssignableFrom(NotificationViewModel::class.java)) {
            @Suppress("UNCHECKED_CAST")
            return NotificationViewModel(application, notificationDao) as T
        }
        throw IllegalArgumentException("Unknown ViewModel class")
    }
}