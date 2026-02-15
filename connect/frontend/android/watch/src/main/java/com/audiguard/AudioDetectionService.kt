package com.audiguard

import YAMNetClassifier
import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.media.AudioFormat
import android.media.AudioManager
import android.media.AudioRecord
import android.os.Build
import android.os.IBinder
import android.util.Log
import androidx.core.app.NotificationCompat
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.cancel
import kotlinx.coroutines.launch
import java.util.concurrent.atomic.AtomicBoolean
import android.media.MediaRecorder
import androidx.core.content.ContextCompat
import android.Manifest
import android.media.AudioAttributes
import android.media.AudioDeviceInfo
import android.os.Binder
import androidx.annotation.RequiresApi
import com.audiguard.data.AppDatabase
import com.audiguard.data.dao.NameDao
import com.audiguard.data.dao.NotificationHistoryDao
import com.audiguard.data.dao.NotificationSettingDao
import com.audiguard.data.entity.NameEntity
import com.audiguard.data.entity.NotificationHistoryEntity
import com.audiguard.data.entity.NotificationSettingEntity
import com.audiguard.utils.NotificationUtils.getNotificationIconForSound
import com.audiguard.utils.RecognitionResult
import com.audiguard.viewmodel.NotificationViewModel
import com.google.api.gax.rpc.ClientStream
import com.google.api.gax.rpc.ResponseObserver
import com.google.api.gax.rpc.StreamController
import com.google.auth.oauth2.GoogleCredentials
import com.google.cloud.speech.v1.RecognitionConfig
import com.google.cloud.speech.v1.SpeechClient
import com.google.cloud.speech.v1.SpeechContext
import com.google.cloud.speech.v1.SpeechSettings
import com.google.cloud.speech.v1.StreamingRecognitionConfig
import com.google.cloud.speech.v1.StreamingRecognizeRequest
import com.google.cloud.speech.v1.StreamingRecognizeResponse
import com.google.protobuf.ByteString
import kotlinx.coroutines.channels.Channel
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.SharedFlow
import kotlinx.coroutines.flow.asSharedFlow
import java.time.LocalDateTime

class AudioDetectionService : Service() {
    private var classifier: YAMNetClassifier? = null
    private var audioRecord: AudioRecord? = null
    private var recordingScope: CoroutineScope? = null
    private val isRecording = AtomicBoolean(false)
    private lateinit var audioManager: AudioManager
    private var audioBuffer: YAMNetClassifier.AudioBuffer? = null

    // STT 관련 변수
    private var speechClient: SpeechClient? = null
    private var currentClientStream: ClientStream<StreamingRecognizeRequest>? = null

    // STT 연속 알림 방지
    private val lastNotificationTimes = mutableMapOf<String, Long>()
    private val NOTIFICATION_COOLDOWN = 5000L  // 5초

    // STT 결과를 위한 Flow
    private val _sttResultFlow = MutableSharedFlow<RecognitionResult>()
    val sttResultFlow: SharedFlow<RecognitionResult> = _sttResultFlow.asSharedFlow()

    // 오디오 데이터 공유를 위한 채널
    private val audioDataChannel = Channel<FloatArray>(Channel.BUFFERED)
    private val rawAudioChannel = Channel<ByteArray>(Channel.BUFFERED)

    private lateinit var notificationSettingDao: NotificationSettingDao
    private var enabledSounds = emptyList<NotificationSettingEntity>()

    // Flow를 collect하기 위한 코루틴 스코프
    private val serviceScope = CoroutineScope(Dispatchers.Default + Job())

    private lateinit var nameDao: NameDao
    private var enabledNames = emptyList<NameEntity>()
    private lateinit var notificationViewModel: NotificationViewModel

    private var streamingJob: Job? = null  // 타이머용 Job 추가

    private fun startStreamingTimer() {
        streamingJob?.cancel() // 기존 타이머가 있다면 취소
        streamingJob = recordingScope?.launch {
            delay(290000) // 4분 50초 후
            Log.d(TAG, "Stream timeout approaching, initiating reconnection")
            currentClientStream?.closeSend()
            setupSTT()
            processSTT()
        }
    }

    companion object {
        private const val TAG = "AudioDetectionService"
        private const val SAMPLE_RATE = 16000

        // Service 상태 관리를 위한 변수들
        private var isServiceRunning = false
        private var isSTTActive = false  // 추가

        fun isRunning() = isServiceRunning

        // STT 활성화/비활성화 메서드 추가
        private var instance: AudioDetectionService? = null

        fun pauseAudioDetection() {
            instance?.let { service ->
                service.stopRecording()
                Log.d(TAG, "Audio detection stopped for STT")
            }
        }

        @RequiresApi(Build.VERSION_CODES.O)
        fun resumeAudioDetection() {
            instance?.let { service ->
                try {
                    // 이미 실행 중이면 중지
                    if (service.isRecording.get()) {
                        service.stopRecording()
                    }

                    // AudioRecord 재설정
                    service.setupAudioRecord()
                    service.recordingScope = CoroutineScope(Dispatchers.Default + Job())
                    service.audioBuffer = YAMNetClassifier.AudioBuffer()

                    service.audioRecord?.let { record ->
                        record.startRecording()
                        service.isRecording.set(true)

                        // 메인 오디오 처리 코루틴
                        service.recordingScope?.launch {
                            service.processAudioInput()
                        }

                        // 소리 감지 처리 코루틴
                        service.recordingScope?.launch {
                            service.processSoundDetection()
                        }

                        // STT 처리 코루틴
                        service.recordingScope?.launch {
                            service.setupSTT()
                            service.processSTT()
                        }

                        Log.d(TAG, "Audio detection and STT processing resumed successfully")
                    } ?: run {
                        Log.e(TAG, "Failed to initialize AudioRecord during resume")
                    }
                } catch (e: Exception) {
                    Log.e(TAG, "Error resuming audio detection: ${e.message}", e)
                }
            }
        }

        private const val NOTIFICATION_SERVICE_CHANNEL_ID = "AudioDetectionServiceChannel"
        private const val NOTIFICATION_ALERT_CHANNEL_ID = "AudioDetectionAlertChannel"
        private const val NOTIFICATION_NAME_CHANNEL_ID = "NameDetectionChannel"
        private const val SERVICE_NOTIFICATION_ID = 1

        // 최소 확률 임계값 설정
        private const val PROBABILITY_THRESHOLD = 0.5f
    }

    private lateinit var notificationManager: NotificationManager
    private lateinit var notificationHistoryDao: NotificationHistoryDao

    @RequiresApi(Build.VERSION_CODES.O)
    override fun onCreate() {
        super.onCreate()
        instance = this
        notificationManager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        createNotificationChannels()  // 여기서 호출

        audioManager = getSystemService(Context.AUDIO_SERVICE) as AudioManager
        setupSpeakerMode()
        initializeClassifier()
        initializeSpeechClient()

        // Room 데이터베이스 초기화
        val database = AppDatabase.getDatabase(applicationContext)
        notificationSettingDao = database.notificationSettingDao()
        notificationHistoryDao = database.notificationHistoryDao()
        nameDao = database.nameDao()

        // ViewModel 초기화
        notificationViewModel = NotificationViewModel(
            application = application,
            notificationDao = database.notificationHistoryDao()
        )

        // 알림 공지를 위한 호칭별 마지막으로 공지 시각
        enabledNames.forEach { nameEntity ->
            lastNotificationTimes[nameEntity.name] = 0L
        }

        // 활성화된 설정 모니터링
        serviceScope.launch {
            // 소리 설정 구독
            launch {
                notificationSettingDao.getAllSettings()
                    .collect { settings ->
                        Log.d(TAG, "Total settings in database: ${settings.size}")
                        settings.forEach { setting ->
                            Log.d(
                                TAG,
                                "Setting found - ID: ${setting.id}, Title: ${setting.title}, Enabled: ${setting.isEnabled}"
                            )
                        }
                        enabledSounds = settings.filter { it.isEnabled }
                        Log.d(TAG, "Enabled sounds filtered: ${enabledSounds.map { it.id }}")
                    }
            }

            // 이름 구독 - 별도의 코루틴으로 실행
            launch {
                nameDao.getAllNames()
                    .collect { names ->
                        Log.d("NAME", "Total names in database: ${names.size}")
                        enabledNames = names  // 모든 이름을 저장
                        Log.d("NAME", "Loaded names: ${enabledNames.map { it.name }}")
                    }
            }
        }

        // 노티피케이션 채널 추가
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val nameChannel = NotificationChannel(
                NOTIFICATION_NAME_CHANNEL_ID,
                "Name Detection Alerts",
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = "Alerts when registered names are detected"
                enableVibration(true)
                enableLights(true)
                setShowBadge(true)
            }
            notificationManager.createNotificationChannel(nameChannel)
        }

        isServiceRunning = true
    }

    private fun initializeSpeechClient() {
        try {
            val credentials = assets.open("a502-440808-dc54a437639a.json").use {
                GoogleCredentials.fromStream(it)
            }
            speechClient = SpeechClient.create(
                SpeechSettings.newBuilder()
                    .setCredentialsProvider { credentials }
                    .build())
        } catch (e: Exception) {
            Log.e(TAG, "Failed to initialize SpeechClient", e)
        }
    }

    private fun createNotificationChannels() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            // 서비스용 채널 (포그라운드 서비스 노티피케이션)
            val serviceChannel = NotificationChannel(
                NOTIFICATION_SERVICE_CHANNEL_ID,
                "Audio Detection Service",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "Shows when the audio detection service is running"
                setShowBadge(false)
            }

            // 알림용 채널 (소리 감지시 알림)
            val alertChannel = NotificationChannel(
                NOTIFICATION_ALERT_CHANNEL_ID,
                "Sound Alerts",
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = "Alerts when specific sounds are detected"
                enableVibration(true)
                enableLights(true)
                setShowBadge(true)
            }

            val notificationManager =
                getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            notificationManager.createNotificationChannel(serviceChannel)
            notificationManager.createNotificationChannel(alertChannel)
        }
    }

    private fun createForegroundNotification(): Notification {
        val pendingIntent = PendingIntent.getActivity(
            this,
            0,
            Intent(this, WatchMainActivity::class.java),
            PendingIntent.FLAG_IMMUTABLE
        )

        return NotificationCompat.Builder(this, NOTIFICATION_SERVICE_CHANNEL_ID)
            .setContentTitle("Audio Detection Active")
            .setContentText("Monitoring for specific sounds...")
            .setSmallIcon(R.drawable.ic_notification)
            .setContentIntent(pendingIntent)
            .setSilent(true)  // 서비스 알림은 소리 없이
            .setOngoing(true) // 사용자가 스와이프로 제거할 수 없게
            .build()
    }

    @RequiresApi(Build.VERSION_CODES.O)
    private fun sendDetectionNotification(
        id: String, // Fire alarm
        detectedSound: String, // 화재
        category: String, // emergency
        probability: Float // 50%
    ) {
        val formattedProbability = (probability * 100).toInt()
        val notification = NotificationCompat.Builder(this, NOTIFICATION_ALERT_CHANNEL_ID)
            .setContentTitle("${if (category == "emergency") "응급 상황" else "생활"} 소리 감지")
            .setContentText("$detectedSound 소리가 감지되었습니다.")
            .setSmallIcon(getNotificationIconForSound(id))  // 감지된 소리에 맞는 아이콘 사용
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setCategory(NotificationCompat.CATEGORY_ALARM)
            .setAutoCancel(true)
            .setVibrate(longArrayOf(0, 500, 250, 500))
            .build()

        notificationManager.notify(System.currentTimeMillis().toInt(), notification)
        Log.d(TAG, "Notification sent - Sound: $detectedSound, Probability: $formattedProbability%")

        // 기록 저장
        CoroutineScope(Dispatchers.IO).launch {
            val history = NotificationHistoryEntity(
                soundType = detectedSound,
                probability = probability,
                timestamp = LocalDateTime.now(),
                iconResId = id
            )
            notificationViewModel.addNotification(history)
        }
    }

    @RequiresApi(Build.VERSION_CODES.O)
    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        startForeground(SERVICE_NOTIFICATION_ID, createForegroundNotification())
        startAudioProcessing()
        return START_STICKY
    }

    private fun setupSpeakerMode() {
        audioManager.setMode(AudioManager.MODE_IN_COMMUNICATION)
        when {
            Build.VERSION.SDK_INT >= Build.VERSION_CODES.S -> {
                // Android 12 이상
                val audioAttributes = AudioAttributes.Builder()
                    .setUsage(AudioAttributes.USAGE_VOICE_COMMUNICATION)
                    .setContentType(AudioAttributes.CONTENT_TYPE_SPEECH)
                    .build()

                audioManager.getDevices(AudioManager.GET_DEVICES_OUTPUTS)
                    .firstOrNull { it.type == AudioDeviceInfo.TYPE_BUILTIN_SPEAKER }
                    ?.let { speakerDevice ->
                        audioManager.setCommunicationDevice(speakerDevice)
                    } ?: run {
                    // 스피커 장치를 찾지 못한 경우 기존 방식으로 폴백
                    @Suppress("DEPRECATION")
                    audioManager.isSpeakerphoneOn = true
                }
            }

            else -> {
                // Android 12 미만
                audioManager.mode = AudioManager.MODE_IN_COMMUNICATION
                @Suppress("DEPRECATION")
                audioManager.isSpeakerphoneOn = true
            }
        }
    }

    private fun startAudioProcessing() {
        if (isRecording.get()) return

        setupAudioRecord()
        recordingScope = CoroutineScope(Dispatchers.Default + Job())
        audioBuffer = YAMNetClassifier.AudioBuffer()

        audioRecord?.let { record ->
            record.startRecording()
            isRecording.set(true)

            // 메인 오디오 처리 코루틴
            recordingScope?.launch {
                processAudioInput()
            }

            // 소리 감지 처리 코루틴
            recordingScope?.launch {
                processSoundDetection()
            }

            // STT 처리 코루틴
            recordingScope?.launch {
                setupSTT()
                processSTT()
            }
        }
    }

    private suspend fun processAudioInput() {
        val readBufferSize = (SAMPLE_RATE * 0.1f).toInt()
        val tempBuffer = FloatArray(readBufferSize)
        val byteBuffer = ByteArray(readBufferSize * 2) // 16bit PCM용

        while (isRecording.get()) {
            try {
                val result =
                    audioRecord?.read(tempBuffer, 0, tempBuffer.size, AudioRecord.READ_BLOCKING)
                if (result != null && result > 0) {
                    // Float 버퍼를 각 처리 파이프라인으로 전송
                    audioDataChannel.send(tempBuffer.clone())

                    // Float를 16bit PCM로 변환하여 STT용으로 전송
                    convertFloatToPCM16(tempBuffer, byteBuffer)
                    rawAudioChannel.send(byteBuffer.clone())
                }
            } catch (e: Exception) {
                Log.e(TAG, "Error reading audio data", e)
                break
            }
        }
    }

    private fun convertFloatToPCM16(floatData: FloatArray, outBuffer: ByteArray) {
        for (i in floatData.indices) {
            val value = (floatData[i] * Short.MAX_VALUE).toInt()
                .coerceIn(Short.MIN_VALUE.toInt(), Short.MAX_VALUE.toInt())
            outBuffer[i * 2] = (value and 0xFF).toByte()
            outBuffer[i * 2 + 1] = (value shr 8 and 0xFF).toByte()
        }
    }

    private suspend fun processSoundDetection() {
        val detectionCooldown = mutableMapOf<String, Long>()
        val COOLDOWN_PERIOD = 10000L

        for (audioData in audioDataChannel) {
            audioBuffer?.let { buffer ->
                buffer.add(audioData)

                if (buffer.isFull()) {
                    val windowData = buffer.getBuffer()
                    classifier?.classifyAudioWithProbability(
                        audioData = windowData,
                        originalSampleRate = SAMPLE_RATE,
                        isstereo = false
                    )?.let { predictions ->
                        val topPrediction = predictions.maxByOrNull { it.second }

                        topPrediction?.let { (label, probability) ->
                            if (probability >= PROBABILITY_THRESHOLD &&
                                enabledSounds.any { it.id.equals(label, ignoreCase = true) }
                            ) {
                                val currentTime = System.currentTimeMillis()
                                val lastDetectionTime = detectionCooldown[label] ?: 0L

                                if (currentTime - lastDetectionTime > COOLDOWN_PERIOD) {
                                    val matchingSetting = enabledSounds.first {
                                        it.id.equals(label, ignoreCase = true)
                                    }
                                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                                        sendDetectionNotification(
                                            matchingSetting.id,
                                            matchingSetting.title,
                                            matchingSetting.category,
                                            probability
                                        )
                                    }
                                    detectionCooldown[label] = currentTime
                                }
                            }
                        }
                    }
                    buffer.slide()
                }
            }
        }
    }


    private suspend fun setupSTT() {
        // SpeechContext 생성을 위한 빌더
        val speechContextBuilder = SpeechContext.newBuilder()

        // enabledNames 리스트의 각 이름을 phrases로 추가
        enabledNames.forEach { nameEntity ->
            speechContextBuilder.addPhrases(nameEntity.name)
        }

        // 가중치 설정 및 SpeechContext 빌드
        speechContextBuilder.setBoost(20f)

        val streamingConfig = StreamingRecognitionConfig.newBuilder()
            .setConfig(
                RecognitionConfig.newBuilder()
                    .setEncoding(RecognitionConfig.AudioEncoding.LINEAR16)
                    .setSampleRateHertz(SAMPLE_RATE)
                    .setLanguageCode("ko-KR")
                    .setModel("command_and_search")
                    .setUseEnhanced(true)
                    .addSpeechContexts(speechContextBuilder.build())
                    .build()
            )
            .setInterimResults(true)
            .setSingleUtterance(false)  // 연속 인식 가능하도록 설정
            .build()

        val responseObserver = object : ResponseObserver<StreamingRecognizeResponse> {
            @RequiresApi(Build.VERSION_CODES.O)
            override fun onResponse(response: StreamingRecognizeResponse) {
                response.resultsList.forEach { result ->
                    result.alternativesList.firstOrNull()?.let { alternative ->
                        Log.d("STT", "Transcript: ${alternative.transcript}")

                        // Scope 상태 확인
                        Log.d("STT_DEBUG", "recordingScope is null: ${recordingScope == null}")

                        if (recordingScope == null) {
                            Log.e("STT_DEBUG", "recordingScope is null, reinitializing...")
                            recordingScope = CoroutineScope(Dispatchers.Main + Job())
                        }

                        try {
                            recordingScope?.launch {
                                Log.d("STT_DEBUG", "Launching coroutine in recordingScope")
                                _sttResultFlow.emit(
                                    RecognitionResult(
                                        text = alternative.transcript,
                                        isFinal = result.isFinal
                                    )
                                )
                                Log.d("STT_DEBUG", "Emitted result to flow")

                                checkNameAndNotify(alternative.transcript)
                                Log.d("STT_DEBUG", "Completed checkNameAndNotify ${result.isFinal}")
                            } ?: run {
                                Log.e("STT_DEBUG", "Failed to launch coroutine - scope was null")
                            }
                        } catch (e: Exception) {
                            Log.e("STT_DEBUG", "Error in coroutine: ${e.message}", e)
                        }
                    }
                }
            }

            override fun onStart(controller: StreamController) {
                Log.d(TAG, "STT Stream started")
            }

            override fun onError(t: Throwable) {
                Log.e(TAG, "STT Streaming error", t)
                recordingScope?.launch {
                    _sttResultFlow.emit(RecognitionResult("Error: ${t.message}", true))
                    delay(1000)
                    processSTT()
                }
            }

            override fun onComplete() {
                Log.d(TAG, "STT Stream completed")
            }
        }

        currentClientStream =
            speechClient?.streamingRecognizeCallable()?.splitCall(responseObserver)
        currentClientStream?.send(
            StreamingRecognizeRequest.newBuilder()
                .setStreamingConfig(streamingConfig)
                .build()
        )

        // 스트리밍 타이머 시작
        startStreamingTimer()

        // 디버그를 위한 로그
        Log.d(TAG, "STT setup completed with names: ${enabledNames.map { it.name }}")
    }

    private suspend fun processSTT() {
        try {
            for (audioData in rawAudioChannel) {
                currentClientStream?.send(
                    StreamingRecognizeRequest.newBuilder()
                        .setAudioContent(ByteString.copyFrom(audioData))
                        .build()
                )
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error in STT stream", e)
        }
    }


    @RequiresApi(Build.VERSION_CODES.O)
    private fun checkNameAndNotify(text: String) {
        enabledNames.forEach { nameEntity ->
            if (text.contains(nameEntity.name, ignoreCase = true)) {
                val currentTime = System.currentTimeMillis()
                val lastNotificationTime = lastNotificationTimes[nameEntity.name] ?: 0L

                if (currentTime - lastNotificationTime >= NOTIFICATION_COOLDOWN) {
                    lastNotificationTimes[nameEntity.name] = currentTime
                    sendNameDetectionNotification(nameEntity.name)

                    Log.d(
                        TAG,
                        "sendName DetectionNotification name: ${nameEntity.name} in text: $text"
                    )
                } else {
                    Log.d(
                        TAG,
                        "Skipped DetectionNotification for ${nameEntity.name} - cooldown active"
                    )
                }
            }
        }
    }

    @RequiresApi(Build.VERSION_CODES.O)
    private fun sendNameDetectionNotification(detectedName: String) {
        val notification = NotificationCompat.Builder(this, NOTIFICATION_NAME_CHANNEL_ID)
            .setContentTitle("이름 감지됨")
            .setContentText("대화 중 '$detectedName' 이(가) 감지되었습니다")
            .setSmallIcon(R.drawable.ic_notification)
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setCategory(NotificationCompat.CATEGORY_MESSAGE)
            .setAutoCancel(true)
            .setVibrate(longArrayOf(0, 500, 250, 500))
            .build()

        notificationManager.notify(System.currentTimeMillis().toInt(), notification)
        Log.d(TAG, "Name detection notification sent for: $detectedName")

        // 기록 저장 (필요한 경우)
        CoroutineScope(Dispatchers.IO).launch {
            val history = NotificationHistoryEntity(
                soundType = detectedName,
                probability = 1.0f,
                timestamp = LocalDateTime.now(),
                iconResId = "name_detection"
            )
            notificationViewModel.addNotification(history)
        }
    }

    @RequiresApi(Build.VERSION_CODES.O)
    private fun startRecording() {
        try {
            if (audioRecord?.state == AudioRecord.STATE_INITIALIZED) {
                Log.d(TAG, "AudioRecord already initialized, stopping first")
                stopRecording()
            }

            setupAudioRecord()
            recordingScope = CoroutineScope(Dispatchers.Default + Job())
            audioBuffer = YAMNetClassifier.AudioBuffer()

            audioRecord?.let { record ->
                record.startRecording()
                isRecording.set(true)

                recordingScope?.launch {
                    processAudioData()
                }
            }
        } catch (e: Exception) {
            Log.e(TAG, "startRecording: Failed to start recording", e)
        }
    }

    @RequiresApi(Build.VERSION_CODES.O)
    private suspend fun processAudioData() {
        if (!checkPermission()) {
            Log.e(TAG, "processAudioData: No permission to process audio")
            stopSelf()
            return
        }

        val readBufferSize = (SAMPLE_RATE * 0.1f).toInt()
        val tempBuffer = FloatArray(readBufferSize)
        val detectionCooldown = mutableMapOf<String, Long>()
        val COOLDOWN_PERIOD = 10000L  // 10초 쿨다운

        while (isRecording.get()) {
            // STT가 활성화되어 있으면 오디오 처리 건너뛰기
            if (isSTTActive) {
                delay(100)
                continue
            }
            try {
                val result = audioRecord?.read(
                    tempBuffer,
                    0,
                    tempBuffer.size,
                    AudioRecord.READ_BLOCKING
                )

                if (result != null && result > 0) {
                    audioBuffer?.let { buffer ->
                        buffer.add(tempBuffer)

                        if (buffer.isFull()) {
                            val windowData = buffer.getBuffer()
                            val predictions = classifier?.classifyAudioWithProbability(
                                audioData = windowData,
                                originalSampleRate = SAMPLE_RATE,
                                isstereo = false
                            )

                            predictions?.let { predictionList ->
                                // 모든 예측 결과를 로그에 기록
                                predictionList.forEach { (label, probability) ->
                                    Log.d(
                                        TAG,
                                        "All Sounds - Label: $label, Probability: ${(probability * 100).toInt()}%"
                                    )
                                }

                                // 기존 알림 로직
                                val topPrediction = predictionList.maxByOrNull { it.second }
                                topPrediction?.let { (label, probability) ->
                                    if (probability >= PROBABILITY_THRESHOLD &&
                                        enabledSounds.any { it.id.equals(label, ignoreCase = true) }
                                    ) {
                                        val currentTime = System.currentTimeMillis()
                                        val lastDetectionTime = detectionCooldown[label] ?: 0L

                                        if (currentTime - lastDetectionTime > COOLDOWN_PERIOD) {
                                            val matchingSetting = enabledSounds.first {
                                                it.id.equals(label, ignoreCase = true)
                                            }
                                            sendDetectionNotification(
                                                matchingSetting.id,
                                                matchingSetting.title,
                                                matchingSetting.category,
                                                probability
                                            )
                                            detectionCooldown[label] = currentTime
                                        }
                                    }
                                }
                            }

                            buffer.slide()
                        }
                    }
                }
            } catch (e: Exception) {
                Log.e(TAG, "Error processing audio", e)
                break
            }
        }
    }


    // stopRecording 함수도 업데이트하여 모든 리소스를 올바르게 정리
    private fun stopRecording() {
        try {
            isRecording.set(false)
            streamingJob?.cancel()  // 타이머 취소 추가
            recordingScope?.cancel()
            recordingScope = null

            // STT 관련 리소스 정리
            currentClientStream?.closeSend()

            audioRecord?.let { record ->
                if (record.state == AudioRecord.STATE_INITIALIZED) {
                    record.stop()
                }
                record.release()
            }
            audioRecord = null
            audioBuffer = null

            Log.d(TAG, "Stopped recording and cleaned up resources successfully")
        } catch (e: Exception) {
            Log.e(TAG, "Error stopping recording: ${e.message}", e)
        }
    }

    private fun initializeClassifier() {
        Log.d(TAG, "initializeClassifier: Starting classifier initialization")
        try {
            // TFLite 모델 파일 존재 확인
            val modelFile = assets.list("")?.find { it.endsWith(".tflite") }
            if (modelFile == null) {
                throw IllegalStateException("TFLite model file not found in assets")
            }
            Log.d(TAG, "initializeClassifier: Found model file: $modelFile")

            classifier = YAMNetClassifier(this)
            Log.d(TAG, "initializeClassifier: Classifier initialized successfully")
        } catch (e: Exception) {
            Log.e(TAG, "initializeClassifier: Failed to initialize classifier", e)
            throw RuntimeException("Failed to initialize classifier: ${e.message}")
        }
    }

    private fun checkPermission(): Boolean {
        return ContextCompat.checkSelfPermission(
            this,
            Manifest.permission.RECORD_AUDIO
        ) == PackageManager.PERMISSION_GRANTED
    }

    private fun setupAudioRecord() {
        Log.d(TAG, "setupAudioRecord: Starting audio record setup")

        if (!checkPermission()) {
            val error = "RECORD_AUDIO permission not granted"
            Log.e(TAG, "setupAudioRecord: $error")
            throw SecurityException(error)
        }

        val bufferSize = AudioRecord.getMinBufferSize(
            SAMPLE_RATE,
            AudioFormat.CHANNEL_IN_MONO,
            AudioFormat.ENCODING_PCM_FLOAT
        )
        Log.d(TAG, "setupAudioRecord: Calculated buffer size: $bufferSize")

        if (bufferSize == AudioRecord.ERROR || bufferSize == AudioRecord.ERROR_BAD_VALUE) {
            val error = "Invalid buffer size received: $bufferSize"
            Log.e(TAG, "setupAudioRecord: $error")
            throw IllegalStateException(error)
        }

        try {
            // AudioSource를 VOICE_COMMUNICATION으로 설정 (스피커 모드)
            if (checkPermission()) {  // 한번 더 권한 체크
                audioRecord = AudioRecord(
                    MediaRecorder.AudioSource.VOICE_COMMUNICATION,
                    SAMPLE_RATE,
                    AudioFormat.CHANNEL_IN_MONO,
                    AudioFormat.ENCODING_PCM_FLOAT,
                    bufferSize
                )

                // 상태 검사
                if (audioRecord?.state != AudioRecord.STATE_INITIALIZED) {
                    val error = "AudioRecord initialization failed. State: ${audioRecord?.state}"
                    Log.e(TAG, "setupAudioRecord: $error")
                    throw IllegalStateException(error)
                }

                Log.d(TAG, "setupAudioRecord: AudioRecord initialized successfully")
            } else {
                throw SecurityException("RECORD_AUDIO permission lost during initialization")
            }
        } catch (e: Exception) {
            Log.e(TAG, "setupAudioRecord: Failed to create AudioRecord", e)
            throw e
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        instance = null
        isRecording.set(false)
        streamingJob?.cancel()  // 타이머 취소 추가
        recordingScope?.cancel()
        audioRecord?.stop()
        audioRecord?.release()
        audioRecord = null
        currentClientStream?.closeSend()
        speechClient?.shutdown()
        serviceScope.cancel()
        audioManager.mode = AudioManager.MODE_NORMAL
        audioManager.isSpeakerphoneOn = false
        classifier?.close()
        isServiceRunning = false
    }

    // Binder 클래스 추가
    inner class LocalBinder : Binder() {
        fun getService(): AudioDetectionService = this@AudioDetectionService
    }

    private val binder = LocalBinder()

    override fun onBind(intent: Intent): IBinder {
        return binder
    }
}
