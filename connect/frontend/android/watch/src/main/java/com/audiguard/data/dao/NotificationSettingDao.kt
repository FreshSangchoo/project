package com.audiguard.data.dao

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import androidx.room.Update
import com.audiguard.data.entity.NotificationSettingEntity
import kotlinx.coroutines.flow.Flow

@Dao
interface NotificationSettingDao {
    @Query("SELECT * FROM notification_settings")
    fun getAllSettings(): Flow<List<NotificationSettingEntity>>

    @Query("SELECT * FROM notification_settings WHERE category = :category")
    fun getSettingsByCategory(category: String): Flow<List<NotificationSettingEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertSetting(setting: NotificationSettingEntity)

    @Update
    suspend fun updateSetting(setting: NotificationSettingEntity)

    @Query("UPDATE notification_settings SET isEnabled = :isEnabled WHERE id = :id")
    suspend fun updateSettingState(id: String, isEnabled: Boolean)

    @Query("SELECT COUNT(*) FROM notification_settings")
    suspend fun getSettingsCount(): Int

    @Query("DELETE FROM notification_settings")
    suspend fun deleteAllSettings()
}