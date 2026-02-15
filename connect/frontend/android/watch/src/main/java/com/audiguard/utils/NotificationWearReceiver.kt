package com.audiguard.utils

import android.net.Uri
import android.util.Log
import com.audiguard.data.dao.NotificationHistoryDao
import com.audiguard.data.dao.NotificationSettingDao
import com.audiguard.data.dao.NameDao
import com.audiguard.data.dto.*
import com.audiguard.data.entity.NotificationHistoryEntity
import com.audiguard.data.entity.NotificationSettingEntity
import com.audiguard.data.entity.NameEntity
import com.google.android.gms.wearable.*
import kotlinx.coroutines.*
import kotlinx.coroutines.tasks.await
import kotlinx.serialization.json.Json
import java.time.Instant
import java.time.LocalDateTime
import java.time.ZoneOffset

class NotificationWearReceiver(
    private val dataClient: DataClient,
    private val notificationDao: NotificationHistoryDao,
    private val settingDao: NotificationSettingDao,
    private val nameDao: NameDao
) : DataClient.OnDataChangedListener {

    private val json = Json {
        ignoreUnknownKeys = true
        coerceInputValues = true
    }

    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.IO)
    private val lastProcessedTimestamps = mutableMapOf<String, Long>()

    companion object {
        private const val TAG = "NotificationWearReceiver"
        private const val BASE_PATH = "/audiguard_sync"
        private const val NOTIFICATION_PATH = "$BASE_PATH/notifications"
        private const val SETTINGS_PATH = "$BASE_PATH/settings"
        private const val NAMES_PATH = "$BASE_PATH/names"
        const val KEY_DATA = "data"
    }

    // DTO to Entity 변환 함수들
    private fun NotificationHistoryDTO.toEntity() = NotificationHistoryEntity(
        id = id,
        soundType = soundType,
        probability = probability,
        timestamp = LocalDateTime.ofInstant(
            Instant.ofEpochMilli(timestamp),
            ZoneOffset.UTC
        ),
        iconResId = iconResId
    )

    private fun NotificationSettingDTO.toEntity() = NotificationSettingEntity(
        id = id,
        category = category,
        title = title,
        isEnabled = isEnabled
    )

    private fun NameDTO.toEntity() = NameEntity(
        name = name
    )

    override fun onDataChanged(dataEvents: DataEventBuffer) {
        dataEvents.forEach { event ->
            when (event.type) {
                DataEvent.TYPE_CHANGED -> {
                    val uri = event.dataItem.uri
                    val path = uri.path ?: return

                    if (path.startsWith(BASE_PATH)) {
                        val timestamp = DataMapItem.fromDataItem(event.dataItem)
                            .dataMap.getLong("timestamp")
                        val lastTimestamp = lastProcessedTimestamps[path] ?: 0L

                        if (timestamp > lastTimestamp) {
                            processDataItem(event.dataItem)
                            lastProcessedTimestamps[path] = timestamp
                        }
                    }
                }

                DataEvent.TYPE_DELETED -> {
                    Log.d(TAG, "데이터 삭제됨: ${event.dataItem.uri}")
                }
            }
        }
    }

    private fun processDataItem(dataItem: DataItem) {
        val dataMap = DataMapItem.fromDataItem(dataItem).dataMap
        val dataJson = dataMap.getString(KEY_DATA) ?: return
        val path = dataItem.uri.path ?: return

        Log.d(TAG, "데이터 수신 - Path: $path, Data: $dataJson")

        scope.launch {
            try {
                withContext(Dispatchers.IO) {
                    when (path) {
                        NOTIFICATION_PATH -> processNotifications(dataJson)
                        SETTINGS_PATH -> processSettings(dataJson)
                        NAMES_PATH -> processNames(dataJson)
                    }
                }
            } catch (e: Exception) {
                Log.e(TAG, "데이터 처리 실패 - Path: $path", e)
            }
        }
    }

    private suspend fun processNotifications(dataJson: String) {
        try {
            val wrapper = json.decodeFromString<DataWrapper<NotificationHistoryDTO>>(dataJson)
            Log.d(TAG, "알림 처리: ${wrapper.items.size}개")
            wrapper.items.forEach { dto ->
                notificationDao.insert(dto.toEntity())
            }
        } catch (e: Exception) {
            Log.e(TAG, "알림 처리 실패", e)
        }
    }

    private suspend fun processSettings(dataJson: String) {
        try {
            val wrapper = json.decodeFromString<DataWrapper<NotificationSettingDTO>>(dataJson)
            Log.d(TAG, "설정 처리: ${wrapper.items.size}개")
            wrapper.items.forEach { dto ->
                settingDao.insertSetting(dto.toEntity())
            }
        } catch (e: Exception) {
            Log.e(TAG, "설정 처리 실패", e)
        }
    }

    private suspend fun processNames(dataJson: String) {
        try {
            val wrapper = json.decodeFromString<DataWrapper<NameDTO>>(dataJson)
            Log.d(TAG, "이름 처리: ${wrapper.items.size}개")
            wrapper.items.forEach { dto ->
                nameDao.insertName(dto.toEntity())
            }
        } catch (e: Exception) {
            Log.e(TAG, "이름 처리 실패", e)
        }
    }

    // 기존 데이터 동기화
    fun syncExistingData() {
        scope.launch {
            try {
                listOf(NOTIFICATION_PATH, SETTINGS_PATH, NAMES_PATH).forEach { path ->
                    val uri = Uri.Builder()
                        .scheme(PutDataRequest.WEAR_URI_SCHEME)
                        .path(path)
                        .build()

                    val dataItemBuffer = dataClient.getDataItems(uri).await()
                    dataItemBuffer.forEach { dataItem ->
                        val timestamp = DataMapItem.fromDataItem(dataItem)
                            .dataMap.getLong("timestamp")
                        val lastTimestamp = lastProcessedTimestamps[path] ?: 0L

                        if (timestamp > lastTimestamp) {
                            Log.d(TAG, "기존 데이터 발견: ${dataItem.uri}")
                            processDataItem(dataItem)
                            lastProcessedTimestamps[path] = timestamp
                        }
                    }
                    dataItemBuffer.release()
                }
            } catch (e: Exception) {
                Log.e(TAG, "기존 데이터 동기화 실패", e)
            }
        }
    }

    fun cleanup() {
        scope.cancel()
    }
}

// 데이터 래퍼 클래스
@kotlinx.serialization.Serializable
private data class DataWrapper<T>(
    val items: List<T>
)