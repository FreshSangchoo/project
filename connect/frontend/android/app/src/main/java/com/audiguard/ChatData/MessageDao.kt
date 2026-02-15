package com.audiguard.ChatData

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.Query
import kotlinx.coroutines.flow.Flow

@Dao
interface MessageDao {
    @Insert
    fun insertMessage(message: Message)

    @Query("SELECT * FROM messages WHERE chatRoomId = :roomId")
    fun getMessageForRoom(roomId: String): Flow<List<Message>>

    // Room에서 실시간 업데이트를 위해 Flow를 사용
    @Query("SELECT DISTINCT chatRoomId FROM messages ORDER BY chatRoomTitle DESC")
    fun getAllRoomIds(): Flow<List<String>>

    @Query("DELETE FROM messages WHERE chatRoomId = :roomId")
    suspend fun deleteChatRoom(roomId: String) // 특정 채팅방 삭제
}