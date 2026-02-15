package com.audiguard.data.entity

import androidx.room.ColumnInfo
import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "notification_settings")
data class NotificationSettingEntity(
    @PrimaryKey
    val id: String,  // 예: "fire", "siren" 등
    val category: String,  // "emergency", "life", "title" 등
    val title: String,
    @ColumnInfo(defaultValue = "false")
    var isEnabled: Boolean = false
)