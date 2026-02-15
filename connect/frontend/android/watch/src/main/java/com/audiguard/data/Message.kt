package com.audiguard.data

data class Message(
    val content: String,
    val isUser: Int, // 1: 상대방, 2: 사용자
    val chatRoomId: String,
    val chatRoomTitle: String
)
