package com.audiguard.ChatData

import android.util.Log
import androidx.room.Room
import com.audiguard.repository.ChatRepository
import com.google.android.gms.wearable.MessageEvent
import com.google.android.gms.wearable.WearableListenerService
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.cancel
import kotlinx.coroutines.launch

class ChatDataReceiverService : WearableListenerService() {

    private lateinit var db: ChatDatabase
    private val serviceScope = CoroutineScope(Dispatchers.IO)

    override fun onCreate() {
        super.onCreate()
        // 데이터베이스 초기화
        db = Room.databaseBuilder(
            applicationContext,
            ChatDatabase::class.java,
            "chat-database"
        ).build()
        Log.d("ChatDataReceiver", "Service created and database initialized")
    }

    override fun onMessageReceived(messageEvent: MessageEvent) {
        Log.d("ChatDataReceiver", "Message received with path: ${messageEvent.path}")

        if (messageEvent.path == "/save_chat") {
            val chatData = String(messageEvent.data)
            Log.d("ChatDataReceiver", "Received chat data: $chatData")

            val message = parseChatData(chatData)
            message?.let {
                // IO 스레드에서 메시지 저장 작업 수행
                serviceScope.launch {
                    try {
                        db.messageDao().insertMessage(it)
                        Log.d("Database", "Message inserted successfully")
                    } catch (e: Exception) {
                        Log.e("Database", "Error inserting message: ${e.message}")
                    }
                }
            }
        }
    }

    private fun parseChatData(chatData: String): Message? {
        Log.d("ChatDataReceiver", "parseChatData: ${chatData}")
        return try {

            val content = chatData.substringAfter("content: ").substringBefore(", isUser: ").trim()
            val isUser = chatData.substringAfter("isUser: ").substringBefore(", chatRoomId: ").trim().toIntOrNull() ?: 0
            val chatRoomId = chatData.substringAfter("chatRoomId: ").substringBefore(", chatRoomTitle: ").trim()
            val chatRoomTitle = chatData.substringAfter("chatRoomTitle: ").trim()
            Log.d("ChatDataReceiver", "parseChatData: ${chatRoomId} , ${chatRoomTitle}")
            Message(
                content = content,
                isUser = isUser,
                chatRoomId = chatRoomId,
                chatRoomTitle = chatRoomTitle
            )
        } catch (e: Exception) {
            Log.d("ChatDataReceiver", "Failed to parse chat data", e)
            null
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        serviceScope.cancel() // 서비스가 종료될 때 코루틴 스코프도 종료
    }
}
