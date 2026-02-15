package com.audiguard.data.dto

import kotlinx.serialization.Serializable

@Serializable
data class NotificationHistoryDTO(
    val id: Long,
    val soundType: String,
    val probability: Float,
    val timestamp: Long,
    val iconResId: String
)

@Serializable
data class NotificationSettingDTO(
    val id: String,
    val category: String,
    val title: String,
    val isEnabled: Boolean
)

@Serializable
data class NameDTO(
    val name: String
)

@Serializable
data class DataWrapper<T>(
    val items: List<T>
)

@Serializable
data class NotificationItemDto(
    val id: Long,
    val soundType: String,
    val probability: Float,
    val timestamp: Long,
    val iconResId: String
)

@Serializable
data class NotificationListDto(
    val notifications: List<NotificationItemDto>
)