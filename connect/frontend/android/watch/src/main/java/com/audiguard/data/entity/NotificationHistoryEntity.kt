package com.audiguard.data.entity

import androidx.room.Entity
import androidx.room.PrimaryKey
import java.time.LocalDateTime

@Entity(tableName = "notification_history")
data class NotificationHistoryEntity(
    @PrimaryKey(autoGenerate = true)
    val id: Long = 0,
    val soundType: String,        // 감지된 소리 종류
    val probability: Float,       // 감지 확률
    val timestamp: LocalDateTime, // 감지 시간
    val iconResId: String         // 아이콘 리소스 ID
)