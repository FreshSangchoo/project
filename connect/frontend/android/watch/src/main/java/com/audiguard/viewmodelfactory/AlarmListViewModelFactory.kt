package com.audiguard.viewmodelfactory

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import com.audiguard.data.dao.NotificationHistoryDao
import com.audiguard.viewmodel.AlarmListViewModel

class AlarmListViewModelFactory(
    private val notificationDao: NotificationHistoryDao
) : ViewModelProvider.Factory {
    override fun <T : ViewModel> create(modelClass: Class<T>): T {
        if (modelClass.isAssignableFrom(AlarmListViewModel::class.java)) {
            @Suppress("UNCHECKED_CAST")
            return AlarmListViewModel(notificationDao) as T
        }
        throw IllegalArgumentException("Unknown ViewModel class")
    }
}