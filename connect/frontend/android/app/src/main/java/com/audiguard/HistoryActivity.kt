package com.audiguard

import android.os.Build
import android.os.Bundle
import android.speech.tts.TextToSpeech
import android.speech.tts.UtteranceProgressListener
import android.util.Log
import android.view.View
import android.widget.Button
import android.widget.TextView
import android.widget.Toast
import androidx.annotation.RequiresApi
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.audiguard.ChatData.ChatDatabase
import com.audiguard.ChatData.Message
import com.audiguard.databinding.ActivityHistoryBinding
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.collect
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.util.Locale

class HistoryActivity : AppCompatActivity(), MessageAdapter.OnHistoryPlayButtonClickListener {
    private lateinit var binding: ActivityHistoryBinding
    private lateinit var chatRoomId: String
    private lateinit var messageAdapter: MessageAdapter
    private lateinit var recyclerView: RecyclerView
    private var isPlayingTTS = false
    private var tts: TextToSpeech? = null
    private var currentPlayButton: Button? = null // 현재 재생 중인 버튼 참조

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityHistoryBinding.inflate(layoutInflater)
        setContentView(binding.root)

        setupRecyclerView()
        setupMessageObserver()

        // TTS 초기화
        tts = TextToSpeech(this) { status ->
            if (status == TextToSpeech.SUCCESS) {
                val result = tts?.setLanguage(Locale.KOREAN)
                if (result == TextToSpeech.LANG_MISSING_DATA || result == TextToSpeech.LANG_NOT_SUPPORTED) {
                    Log.e("TTS", "언어를 지원하지 않습니다.")
                } else {
                    Log.d("TTS", "TTS 초기화 성공")
                }
                tts?.setOnUtteranceProgressListener(object : UtteranceProgressListener() {
                    override fun onStart(utteranceId: String?) {
                        runOnUiThread {
                            AudioDetectionService.pauseAudioDetection() // 백그라운드 오디오 감지 일시 중지
                            currentPlayButton?.setBackgroundResource(R.drawable.round_stop_24)
                        }
                    }

                    @RequiresApi(Build.VERSION_CODES.O)
                    override fun onDone(utteranceId: String?) {
                        runOnUiThread {
                            AudioDetectionService.resumeAudioDetection()
                            currentPlayButton?.setBackgroundResource(R.drawable.round_play_arrow_24)
                            isPlayingTTS = false
                        }
                    }

                    override fun onError(utteranceId: String?) {
                        runOnUiThread {
                            currentPlayButton?.setBackgroundResource(R.drawable.round_play_arrow_24)
                            isPlayingTTS = false
                        }
                    }
                })
            } else {
                Log.e("TTS", "TTS 초기화 실패")
            }
        }

        binding.back.setOnClickListener {
            finish()  // 현재 액티비티 종료
        }
    }

    private fun setupRecyclerView() {
        recyclerView = findViewById(R.id.recyclerview)
        recyclerView.layoutManager = LinearLayoutManager(this).apply {
            stackFromEnd = false
            reverseLayout = false
        }
        messageAdapter = MessageAdapter(emptyList(), this)
        recyclerView.adapter = messageAdapter
    }

    private fun setupMessageObserver() {
        chatRoomId = intent.getStringExtra("CHAT_ROOM_ID") ?: ""
        val db = ChatDatabase.getDatabase(applicationContext)

        lifecycleScope.launch {
            try {
                db.messageDao().getMessageForRoom(chatRoomId).collect { messages ->
                    withContext(Dispatchers.Main) {
                        if (messages.isEmpty()) {
                            findViewById<TextView>(R.id.empty_message).visibility = View.VISIBLE
                            recyclerView.visibility = View.GONE
                        } else {
                            messageAdapter = MessageAdapter(messages, this@HistoryActivity)
                            recyclerView.adapter = messageAdapter
                            recyclerView.scrollToPosition(messages.size - 1)
                        }
                    }
                }
            } catch (e: Exception) {
                Log.e("HistoryActivity", "Error loading messages: ${e.message}")
                withContext(Dispatchers.Main) {
                    Toast.makeText(
                        this@HistoryActivity,
                        "메시지를 불러오는데 실패했습니다.",
                        Toast.LENGTH_SHORT
                    ).show()
                }
            }
        }
    }

    // TTS로 텍스트 읽기 함수
    private fun startTTS(text: String, playButton: Button) {
        val params = Bundle()
        params.putString(TextToSpeech.Engine.KEY_PARAM_UTTERANCE_ID, "UniqueID")
        tts?.speak(text, TextToSpeech.QUEUE_FLUSH, params, "UniqueID")
        isPlayingTTS = true
        currentPlayButton = playButton
        playButton.setBackgroundResource(R.drawable.round_stop_24)
    }

    // TTS 정지 함수
    private fun stopTTS() {
        tts?.stop()
        isPlayingTTS = false
        currentPlayButton?.setBackgroundResource(R.drawable.round_play_arrow_24)
        currentPlayButton = null
    }

    // MessageAdapter.OnHistoryPlayButtonClickListener 구현
    override fun onPlayButtonClick(message: Message, playButton: Button) {
        if (isPlayingTTS) {
            stopTTS()
        } else {
            startTTS(message.content, playButton) // 선택한 메시지와 버튼을 전달하여 TTS 재생
        }
    }

    @RequiresApi(Build.VERSION_CODES.O)
    override fun onDestroy() {
        super.onDestroy()
        tts?.stop()
        tts?.shutdown()
        AudioDetectionService.resumeAudioDetection()
    }
}