package com.audiguard

import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Button
import android.widget.TextView
import androidx.recyclerview.widget.RecyclerView
import com.audiguard.ChatData.Message

class MessageAdapter(
    private val chatList: List<Message>,
    private val listener: OnHistoryPlayButtonClickListener) :
    RecyclerView.Adapter<RecyclerView.ViewHolder>() {

    companion object {
        const val VIEW_TYPE_LEFT = 1    // 상대방 메시지
        const val VIEW_TYPE_RIGHT = 2   // 사용자 메시지
    }

    interface OnHistoryPlayButtonClickListener {
        fun onPlayButtonClick(message: Message, playButton: Button)
    }

    override fun getItemViewType(position: Int): Int {
        return if (chatList[position].isUser == 1) VIEW_TYPE_LEFT else VIEW_TYPE_RIGHT
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): RecyclerView.ViewHolder {
        return if (viewType == VIEW_TYPE_RIGHT) {
            val view = LayoutInflater.from(parent.context)
                .inflate(R.layout.item_message_right, parent, false)
            RightMessageViewHolder(view)
        } else {
            val view = LayoutInflater.from(parent.context)
                .inflate(R.layout.item_message_left, parent, false)
            LeftMessageViewHolder(view)
        }
    }

    override fun onBindViewHolder(holder: RecyclerView.ViewHolder, position: Int) {
        val chatMessage = chatList[position]
        if (holder is RightMessageViewHolder) {
            holder.bind(chatMessage)
        } else if (holder is LeftMessageViewHolder) {
            holder.bind(chatMessage)
        }
    }

    override fun getItemCount(): Int = chatList.size

    // ViewHolder for Other Messages (Left)
    inner class LeftMessageViewHolder(itemView: View) : RecyclerView.ViewHolder(itemView) {
        private val messageText: TextView = itemView.findViewById(R.id.textLeftMessage)
        private val play : Button = itemView.findViewById(R.id.play)

        fun bind(chatMessage: Message) {
            messageText.text = chatMessage.content
            play.setOnClickListener {
                listener.onPlayButtonClick(chatMessage,play) // 클릭 이벤트 전달
            }
        }
    }

    // ViewHolder for User Messages (Right)
    inner class RightMessageViewHolder(itemView: View) : RecyclerView.ViewHolder(itemView) {
        private val messageText: TextView = itemView.findViewById(R.id.textRightMessage)
        private val play : Button = itemView.findViewById(R.id.play)

        fun bind(chatMessage: Message) {
            messageText.text = chatMessage.content
            play.setOnClickListener {
                listener.onPlayButtonClick(chatMessage,play) // 클릭 이벤트 전달
            }
        }
    }
}
