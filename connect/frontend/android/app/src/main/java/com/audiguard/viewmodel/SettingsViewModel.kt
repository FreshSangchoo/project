package com.audiguard.viewmodel

import android.app.Application
import android.content.Context
import androidx.lifecycle.ViewModel
import com.audiguard.data.entity.NameEntity
import com.audiguard.data.entity.NotificationSettingEntity
import com.audiguard.repository.SettingsRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import javax.inject.Inject
import kotlinx.coroutines.flow.Flow

@HiltViewModel
class SettingsViewModel @Inject constructor(
    private val repository: SettingsRepository,
    private val application: Application
) : ViewModel() {
    val settings: Flow<List<NotificationSettingEntity>> = repository.getAllSettings()
    val names: Flow<List<NameEntity>> = repository.getAllNames()

    suspend fun updateSetting(id: String, enabled: Boolean) {
        repository.updateSetting(id, enabled)
    }

    suspend fun addName(name: String) {
        repository.addName(NameEntity(name = name))
    }

    suspend fun deleteName(name: NameEntity) {
        repository.deleteName(name)
    }

    fun getApplication(): Context = application

}