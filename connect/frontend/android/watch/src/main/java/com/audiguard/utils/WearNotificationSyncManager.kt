package com.audiguard.wear.utils

import android.content.Context
import android.os.Build
import android.util.Log
import androidx.annotation.RequiresApi
import com.audiguard.data.dao.NameDao
import com.audiguard.data.dao.NotificationHistoryDao
import com.audiguard.data.dao.NotificationSettingDao
import com.audiguard.data.entity.NameEntity
import com.audiguard.data.entity.NotificationHistoryEntity
import com.audiguard.data.entity.NotificationSettingEntity
import com.google.android.gms.wearable.DataClient
import com.google.android.gms.wearable.PutDataMapRequest
import com.google.android.gms.wearable.Wearable
import kotlinx.coroutines.*
import kotlinx.coroutines.tasks.await
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json
import java.time.ZoneOffset

class WearNotificationSyncManager(private val context: Context) {
    private val dataClient: DataClient = Wearable.getDataClient(context)
    private val nodeClient = Wearable.getNodeClient(context)
    private val json = Json {
        ignoreUnknownKeys = true
        encodeDefaults = true
    }
    private val pendingSync = mutableMapOf<String, List<Any>>()

    companion object {
        private const val TAG = "WearNotificationSyncManager"
        private const val BASE_PATH = "/audiguard_wear_sync"
        private const val NOTIFICATION_PATH = "$BASE_PATH/notifications"
        private const val SETTINGS_PATH = "$BASE_PATH/settings"
        private const val NAMES_PATH = "$BASE_PATH/names"
        private const val KEY_DATA = "data"
        private const val KEY_TIMESTAMP = "timestamp"
    }

    @kotlinx.serialization.Serializable
    private data class NotificationHistoryDTO(
        val id: Long,
        val soundType: String,
        val probability: Float,
        val timestamp: Long,
        val iconResId: String
    )

    @kotlinx.serialization.Serializable
    private data class NotificationSettingDTO(
        val id: String,
        val category: String,
        val title: String,
        val isEnabled: Boolean
    )

    @kotlinx.serialization.Serializable
    private data class NameDTO(
        val name: String
    )

    @kotlinx.serialization.Serializable
    private data class DataWrapper<T>(
        val items: List<T>
    )

    private suspend fun isPhoneConnected(): Boolean {
        return try {
            val nodes = nodeClient.connectedNodes.await()
            val connected = nodes.any { it.isNearby }
            Log.d(TAG, "Phone connected: $connected")
            connected
        } catch (e: Exception) {
            Log.e(TAG, "Error checking phone connection", e)
            false
        }
    }

    private fun NotificationHistoryEntity.toDTO(): NotificationHistoryDTO {
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationHistoryDTO(
                id = id,
                soundType = soundType,
                probability = probability,
                timestamp = timestamp.atZone(ZoneOffset.UTC).toInstant().toEpochMilli(),
                iconResId = iconResId
            )
        } else {
            NotificationHistoryDTO(
                id = id,
                soundType = soundType,
                probability = probability,
                timestamp = System.currentTimeMillis(),
                iconResId = iconResId
            )
        }
    }

    private fun NotificationSettingEntity.toDTO() = NotificationSettingDTO(
        id = id,
        category = category,
        title = title,
        isEnabled = isEnabled
    )

    private fun NameEntity.toDTO() = NameDTO(
        name = name
    )

    private suspend inline fun <reified T> syncData(
        path: String,
        data: List<T>,
        retryCount: Int = 3
    ) {
        repeat(retryCount) { attempt ->
            try {
                val connected = isPhoneConnected()
                if (!connected) {
                    Log.d(TAG, "폰이 연결되어 있지 않습니다")
                    pendingSync[path] = data as List<Any>
                    return
                }

                val wrapper = DataWrapper(data)
                val jsonString = json.encodeToString(wrapper)
                Log.d(TAG, "전송할 데이터: $jsonString")

                val putDataMapRequest = PutDataMapRequest.create(path).apply {
                    dataMap.putString(KEY_DATA, jsonString)
                    dataMap.putLong(KEY_TIMESTAMP, System.currentTimeMillis())
                }

                val putDataRequest = putDataMapRequest.asPutDataRequest()
                putDataRequest.setUrgent()

                val result = dataClient.putDataItem(putDataRequest).await()
                Log.d(TAG, "데이터 전송 완료: ${result.uri}")
                pendingSync.remove(path)
                return

            } catch (e: Exception) {
                Log.e(TAG, "동기화 실패 (시도 ${attempt + 1}/$retryCount)", e)
                pendingSync[path] = data as List<Any>
                delay((1000 * (attempt + 1)).toLong())
            }
        }
    }

    suspend fun syncNotifications(notifications: List<NotificationHistoryEntity>) {
        syncData(NOTIFICATION_PATH, notifications.map { it.toDTO() })
    }

    suspend fun syncSettings(settings: List<NotificationSettingEntity>) {
        syncData(SETTINGS_PATH, settings.map { it.toDTO() })
    }

    suspend fun syncNames(names: List<NameEntity>) {
        syncData(NAMES_PATH, names.map { it.toDTO() })
    }

    @RequiresApi(Build.VERSION_CODES.O)
    fun startAllDataMonitoring(
        scope: CoroutineScope,
        notificationDao: NotificationHistoryDao,
        settingDao: NotificationSettingDao,
        nameDao: NameDao
    ) {
        scope.launch {
            notificationDao.getAllHistory().collect { notifications ->
                syncNotifications(notifications)
            }
        }

        scope.launch {
            settingDao.getAllSettings().collect { settings ->
                syncSettings(settings)
            }
        }

        scope.launch {
            nameDao.getAllNames().collect { names ->
                syncNames(names)
            }
        }

        startPeriodicSync(scope)
    }

    private fun startPeriodicSync(scope: CoroutineScope) {
        scope.launch {
            while (isActive) {
                pendingSync.forEach { (path, data) ->
                    when (path) {
                        NOTIFICATION_PATH -> syncData(path, data as List<NotificationHistoryDTO>)
                        SETTINGS_PATH -> syncData(path, data as List<NotificationSettingDTO>)
                        NAMES_PATH -> syncData(path, data as List<NameDTO>)
                    }
                }
                delay(5 * 60 * 1000)
            }
        }
    }
}