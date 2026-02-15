package com.audiguard.repository

import android.util.Log

class ChatRepository {
    fun saveChatData(chatRoomId: Int, messagees: List<String>){
        Log.d("ChatRepository", "Saving chat data for room $chatRoomId")
    }
}