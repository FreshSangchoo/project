package com.audiguard

import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.TextView
import androidx.recyclerview.widget.RecyclerView


// ChatRoomAdapter.kt
class ChatRoomAdapter(
    var chatRooms: List<ChatRoom>,
    private val listener: OnChatRoomItemClickListener
) :
    RecyclerView.Adapter<ChatRoomAdapter.ViewHolder>() {

    data class ChatRoom(
        val roomId: String,
        val title: String,
        val time: String
    )

    class ViewHolder(view: View) : RecyclerView.ViewHolder(view) {
        val titleText: TextView = view.findViewById(R.id.chatRoomTitle)
        val time:TextView = view.findViewById(R.id.time)
        val rootView: View = view
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ViewHolder {
        val view = LayoutInflater.from(parent.context)
            .inflate(R.layout.chat_room_item, parent, false)
        return ViewHolder(view)
    }

    override fun onBindViewHolder(holder: ViewHolder, position: Int) {
        val chatRoom = chatRooms[position]
        holder.titleText.text = chatRoom.title
        holder.time.text = chatRoom.time
        holder.rootView.setOnClickListener {
            listener.onChatRoomClick(chatRoom.roomId)
        }
    }

    override fun getItemCount() = chatRooms.size
}