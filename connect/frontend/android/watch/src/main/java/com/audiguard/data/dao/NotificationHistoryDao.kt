package com.audiguard.data.dao

import androidx.room.*
import com.audiguard.data.entity.NotificationHistoryEntity
import kotlinx.coroutines.flow.Flow
import kotlinx.serialization.Serializable
import java.time.LocalDateTime

@Dao
interface NotificationHistoryDao {
    @Query("SELECT * FROM notification_history ORDER BY timestamp DESC")
    fun getAllHistory(): Flow<List<NotificationHistoryEntity>>

    @Query("SELECT * FROM notification_history WHERE timestamp BETWEEN :startDate AND :endDate ORDER BY timestamp DESC")
    fun getHistoryBetweenDates(
        startDate: LocalDateTime,
        endDate: LocalDateTime
    ): Flow<List<NotificationHistoryEntity>>

    @Insert
    suspend fun insert(history: NotificationHistoryEntity)

    @Delete
    suspend fun delete(history: NotificationHistoryEntity)

    @Query("DELETE FROM notification_history")
    suspend fun deleteAll()

    @Query("SELECT * FROM notification_history WHERE timestamp > :date ORDER BY timestamp DESC")
    fun getRecentHistory(date: LocalDateTime): Flow<List<NotificationHistoryEntity>>

    @Query("DELETE FROM notification_history WHERE timestamp < :date")
    suspend fun deleteOldNotifications(date: LocalDateTime)
}