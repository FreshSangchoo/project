package com.audiguard.utils

import com.google.android.gms.wearable.DataClient
import com.google.android.gms.wearable.PutDataMapRequest
import com.google.android.gms.wearable.Wearable
import android.content.Context
import android.os.Build
import android.util.Log
import androidx.annotation.RequiresApi
import com.audiguard.data.dao.NotificationHistoryDao
import com.audiguard.data.entity.NotificationHistoryEntity
import kotlinx.coroutines.*
import kotlinx.coroutines.tasks.await
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json
import java.time.ZoneOffset
import kotlinx.coroutines.delay

class NotificationSyncManager(private val context: Context) {
    private val dataClient: DataClient = Wearable.getDataClient(context)
    private val nodeClient = Wearable.getNodeClient(context)
    private val json = Json {
        ignoreUnknownKeys = true
        encodeDefaults = true
    }
    private var lastSyncTime: Long = 0
    private val pendingSync = mutableListOf<NotificationHistoryEntity>()

    companion object {
        private const val NOTIFICATION_PATH = "/notification_history"
        private const val KEY_NOTIFICATIONS = "notifications"
        private const val KEY_TIMESTAMP = "timestamp"
    }

    // NotificationHistory를 전송 가능한 형태로 변환하는 data class
    @kotlinx.serialization.Serializable
    private data class NotificationHistoryDTO(
        val id: Long,
        val soundType: String,
        val probability: Float,
        val timestamp: Long,  // LocalDateTime을 epoch seconds로 변환
        val iconResId: String
    )

    // 리스트를 감싸는 래퍼 클래스 추가
    @kotlinx.serialization.Serializable
    private data class NotificationHistoryListDTO(
        val notifications: List<NotificationHistoryDTO>
    )

    // NotificationHistory를 DTO로 변환
    @RequiresApi(Build.VERSION_CODES.O)
    private fun NotificationHistoryEntity.toDTO(): NotificationHistoryDTO =
        NotificationHistoryDTO(
            id = id,
            soundType = soundType,
            probability = probability,
            timestamp = timestamp.toEpochSecond(ZoneOffset.UTC),
            iconResId = iconResId
        )

    suspend fun isWearableConnected(): Boolean {
        return try {
            val nodes = nodeClient.connectedNodes.await()
            nodes.isNotEmpty()
        } catch (e: Exception) {
            Log.e("NotificationSyncManager", "연결 상태 확인 실패", e)
            false
        }
    }

    // 데이터베이스 변경 모니터링 시작
    @RequiresApi(Build.VERSION_CODES.O)
    suspend fun startSyncMonitoring(dao: NotificationHistoryDao) {
        Log.d("NotificationSyncManager", "모니터링 시작")
        try {
            dao.getAllHistory().collect { notifications ->
                Log.d("NotificationSyncManager", "데이터 변경 감지: ${notifications.size}개")
                syncNotifications(notifications)
            }
        } catch (e: Exception) {
            Log.e("NotificationSyncManager", "모니터링 실패", e)
        }
    }

    // 재시도 메커니즘이 포함된 동기화
    @RequiresApi(Build.VERSION_CODES.O)
    suspend fun syncWithRetry(notifications: List<NotificationHistoryEntity>, maxRetries: Int = 3) {
        repeat(maxRetries) { attempt ->
            try {
                if (!isWearableConnected()) {
                    Log.d("NotificationSyncManager", "웨어러블 기기가 연결되어 있지 않습니다")
                    pendingSync.addAll(notifications)
                    return
                }
                syncNotifications(notifications)
                pendingSync.clear()
                return
            } catch (e: Exception) {
                Log.e("NotificationSyncManager", "동기화 실패 (시도 ${attempt + 1}/$maxRetries)", e)
                pendingSync.addAll(notifications)
                delay((1000 * (attempt + 1)).toLong())
            }
        }
    }

    // 주기적 동기화 시작
    @RequiresApi(Build.VERSION_CODES.O)
    fun startPeriodicSync(scope: CoroutineScope) {
        scope.launch {
            while (isActive) {
                if (pendingSync.isNotEmpty()) {
                    syncWithRetry(pendingSync)
                }
                delay(5 * 60 * 1000) // 5분마다 체크
            }
        }
    }

    // 단일 알림 전송
    @RequiresApi(Build.VERSION_CODES.O)
    suspend fun syncNotification(notification: NotificationHistoryEntity) {
        try {
            val notificationDTO = notification.toDTO()
            val putDataMapRequest = PutDataMapRequest.create(NOTIFICATION_PATH).apply {
                dataMap.putString(KEY_NOTIFICATIONS, json.encodeToString(notificationDTO))
                dataMap.putLong(KEY_TIMESTAMP, System.currentTimeMillis())
            }

            val putDataRequest = putDataMapRequest.asPutDataRequest()
            putDataRequest.setUrgent()

            dataClient.putDataItem(putDataRequest).await()
            lastSyncTime = System.currentTimeMillis()
        } catch (e: Exception) {
            Log.e("NotificationSyncManager", "단일 알림 동기화 실패", e)
            throw e
        }
    }

    // 알림 목록 전송
    @RequiresApi(Build.VERSION_CODES.O)
    suspend fun syncNotifications(notifications: List<NotificationHistoryEntity>) {
        try {
            val notificationDTOs = notifications.map { it.toDTO() }
            Log.d("NotificationSyncManager", "전송할 DTO 개수: ${notificationDTOs.size}")

            // 래퍼 클래스로 감싸서 직렬화
            val wrapper = NotificationHistoryListDTO(notificationDTOs)
            val jsonString = json.encodeToString(wrapper)
            Log.d("NotificationSyncManager", "전송할 JSON: $jsonString")

            val putDataMapRequest = PutDataMapRequest.create(NOTIFICATION_PATH).apply {
                dataMap.putString(KEY_NOTIFICATIONS, jsonString)
                dataMap.putLong(KEY_TIMESTAMP, System.currentTimeMillis())
            }

            val putDataRequest = putDataMapRequest.asPutDataRequest()
            putDataRequest.setUrgent()

            val result = dataClient.putDataItem(putDataRequest).await()
            Log.d("NotificationSyncManager", "데이터 전송 완료: ${result.uri}")
            lastSyncTime = System.currentTimeMillis()

        } catch (e: Exception) {
            Log.e("NotificationSyncManager", "데이터 전송 실패", e)
            throw e
        }
    }
}