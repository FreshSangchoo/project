package com.audiguard

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.Service
import android.content.Intent
import android.os.Build
import android.os.Bundle
import android.os.IBinder
import android.speech.RecognitionListener
import android.speech.RecognizerIntent
import android.speech.SpeechRecognizer
import android.util.Log
import androidx.core.app.NotificationCompat
import com.google.android.gms.wearable.MessageClient
import com.google.android.gms.wearable.MessageEvent
import com.google.android.gms.wearable.Wearable
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

class MobileAudioProcessorService : Service(), MessageClient.OnMessageReceivedListener {

    private var speechRecognizer: SpeechRecognizer? = null
    private val CHANNEL_ID = "MobileAudioProcessorServiceChannel"
    private var isForegroundStarted = false

    override fun onCreate() {
        super.onCreate()
        createNotificationChannel()
        Wearable.getMessageClient(this).addListener(this)
    }

    // 워치로부터 메시지 수신
    override fun onMessageReceived(messageEvent: MessageEvent) {
        if (messageEvent.path == "/audio_chunk") {
            val audioData = messageEvent.data
            Log.d("MobileAudioProcessor", "워치에서 오디오 데이터 수신: ${audioData.size} bytes")

            // 수신한 오디오 데이터를 텍스트로 변환
            setupSpeechRecognizer()
            processAudioToText(audioData)
        }
    }

    // SpeechRecognizer 설정
    private fun setupSpeechRecognizer() {
        speechRecognizer = SpeechRecognizer.createSpeechRecognizer(this).apply {
            setRecognitionListener(object : RecognitionListener {
                override fun onReadyForSpeech(params: Bundle?) {
                    Log.d("MobileAudioProcessor", "음성 인식 준비 완료")
                }

                override fun onBeginningOfSpeech() {}
                override fun onRmsChanged(rmsdB: Float) {}
                override fun onBufferReceived(buffer: ByteArray?) {}

                override fun onEndOfSpeech() {
                    Log.d("MobileAudioProcessor", "음성 입력 종료")
                }

                override fun onError(error: Int) {
                    //더이상 음성이 안들어오면 끊어버리기.
                    if (error == SpeechRecognizer.ERROR_NO_MATCH) {
                        speechRecognizer?.stopListening()
                        //다른오류라면 계속 음성 입력받기.
                    } else {
                        val message = when (error) {
                            SpeechRecognizer.ERROR_LANGUAGE_UNAVAILABLE -> "언어 모델이 사용 불가"
                            SpeechRecognizer.ERROR_AUDIO -> "오디오 에러"
                            SpeechRecognizer.ERROR_CLIENT -> "클라이언트 에러"
                            SpeechRecognizer.ERROR_INSUFFICIENT_PERMISSIONS -> "권한 없음"
                            SpeechRecognizer.ERROR_NETWORK -> "네트워크 에러"
                            SpeechRecognizer.ERROR_NETWORK_TIMEOUT -> "네트워크 타임아웃"
                            SpeechRecognizer.ERROR_RECOGNIZER_BUSY -> "RECOGNIZER가 바쁨"
                            SpeechRecognizer.ERROR_SERVER -> "서버 에러"
                            SpeechRecognizer.ERROR_SPEECH_TIMEOUT -> "말하는 시간 초과"
                            else -> "알 수 없는 에러 ($error)"
                        }
                    }
                    Log.e("MobileAudioProcessor", "음성 인식 오류: $error")
                }

                override fun onResults(results: Bundle?) {
                    val matches = results?.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION)
                    if (!matches.isNullOrEmpty()) {
                        val textResult = matches[0]
                        Log.d("MobileAudioProcessor", "변환된 텍스트: $textResult")
                        sendTextToWearable(textResult) // 텍스트를 워치로 전송
                    }
                }

                override fun onPartialResults(partialResults: Bundle?) {
                    val partial =
                        partialResults?.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION)
                    if (!partial.isNullOrEmpty()) {
                        val partialTextResult = partial[0] // 부분 결과 업데이트
                        sendTextToWearable(partialTextResult) // 텍스트를 워치로 전송
                    }
                }

                override fun onEvent(eventType: Int, params: Bundle?) {}
            })
        }
    }

    // 오디오 데이터를 텍스트로 변환
    private fun processAudioToText(audioData: ByteArray) {
        // 음성 인식 인텐트를 설정하고 audioData를 입력으로 사용
        val intent = Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH).apply {
            putExtra(RecognizerIntent.EXTRA_LANGUAGE, "ko-KR")
            putExtra(
                RecognizerIntent.EXTRA_LANGUAGE_MODEL,
                RecognizerIntent.LANGUAGE_MODEL_FREE_FORM
            )
            putExtra(RecognizerIntent.EXTRA_PARTIAL_RESULTS, true)
            putExtra(RecognizerIntent.EXTRA_AUDIO_SOURCE, audioData)
        }
        speechRecognizer?.startListening(intent)
    }

    // 텍스트 결과를 워치로 전송
    private fun sendTextToWearable(text: String) {
        Wearable.getNodeClient(this).connectedNodes.addOnSuccessListener { nodes ->
            val nodeId = nodes.firstOrNull()?.id
            if (nodeId != null) {
                Wearable.getMessageClient(this)
                    .sendMessage(nodeId, "/text_result", text.toByteArray())
                    .addOnSuccessListener {
                        Log.d("MobileAudioProcessor", "텍스트 전송 성공")
                    }
                    .addOnFailureListener {
                        Log.e("MobileAudioProcessor", "텍스트 전송 실패", it)
                    }
            } else {
                Log.e("MobileAudioProcessor", "연결된 Node가 없습니다.")
            }
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        speechRecognizer?.destroy()
        Wearable.getMessageClient(this).removeListener(this) // 리스너 제거
    }

    override fun onBind(intent: Intent?): IBinder? {
        return null
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val serviceChannel = NotificationChannel(
                CHANNEL_ID,
                "Audio Processing Service Channel",
                NotificationManager.IMPORTANCE_LOW
            )
            val manager = getSystemService(NotificationManager::class.java)
            manager?.createNotificationChannel(serviceChannel)
        }
    }

    private fun startForegroundServiceNotification() {
        val notification = NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("Audio Processing")
            .setContentText("Processing audio in the background")
            .setSmallIcon(R.drawable.baseline_mic_24) // 아이콘을 지정하세요
            .build()

        startForeground(100, notification) // 알림 ID는 고유하게 설정해야 합니다
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        // 서비스 시작과 동시에 포그라운드 알림을 설정하여 시스템에 서비스 상태를 알림
        startForegroundServiceNotification()
        // 다른 작업 수행
        return START_STICKY
    }

}