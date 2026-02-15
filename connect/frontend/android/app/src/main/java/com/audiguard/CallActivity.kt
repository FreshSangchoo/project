package com.audiguard

import android.content.Intent
import android.os.Bundle
import android.util.Log
import androidx.activity.OnBackPressedCallback
import androidx.appcompat.app.AppCompatActivity
import com.audiguard.databinding.ActivityCallBinding
import java.util.UUID
import java.util.UUID.*

class CallActivity : AppCompatActivity() {
    private lateinit var binding: ActivityCallBinding

    override fun onCreate(savedInstanceState: Bundle?) {

        super.onCreate(savedInstanceState)

        binding = ActivityCallBinding.inflate(layoutInflater)
        setContentView(binding.root)

        val detectedName = intent.getStringExtra("DETECTED_NAME")
        Log.d("CallActivity_debug", "Detected name: $detectedName")

        binding.nameTextview.text = "$detectedName 님을"

        binding.btnMoveToChat.setOnClickListener {
            //채팅방 id생성
            val chatRoomId =  randomUUID().toString()
            Log.d("aa",chatRoomId.toString())
            //ChatActivity로 채팅방 id전달
            val intent = Intent(this, ChatActivity::class.java).apply {
                putExtra("CHAT_ROOM_ID",chatRoomId)
            }
            startActivity(intent)
        }

        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                val intent = Intent(this@CallActivity, MainActivity::class.java)
                intent.flags = Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_SINGLE_TOP
                startActivity(intent)
                finish()
            }
        })
    }
}