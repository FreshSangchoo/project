package com.audiguard

import YAMNetClassifier
import android.Manifest
import android.content.Context
import android.content.pm.PackageManager
import android.media.AudioFormat
import android.media.AudioManager
import android.media.AudioRecord
import android.media.MediaRecorder
import android.util.Log
import androidx.core.content.ContextCompat
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.cancel
import kotlinx.coroutines.launch
import java.util.concurrent.atomic.AtomicBoolean

class AudioManager(private val context: Context) {
    private var audioRecord: AudioRecord? = null
    private var recordingScope: CoroutineScope? = null
    private val isRecording = AtomicBoolean(false)
    private val systemAudioManager: AudioManager =
        context.getSystemService(Context.AUDIO_SERVICE) as AudioManager
    private var audioBuffer: YAMNetClassifier.AudioBuffer? = null
    private var classifier: YAMNetClassifier? = null

    companion object {
        private const val TAG = "AudioManager"
        private const val SAMPLE_RATE = 16000
    }

    var onAudioProcessed: ((String) -> Unit)? = null
    var onStatusChanged: ((Boolean, String?) -> Unit)? = null

    init {
        initializeClassifier()
    }

    private fun initializeClassifier() {
        try {
            classifier = YAMNetClassifier(context)
            Log.d(TAG, "Classifier initialized successfully")
        } catch (e: Exception) {
            Log.e(TAG, "Failed to initialize classifier", e)
            throw RuntimeException("Failed to initialize classifier: ${e.message}")
        }
    }

    fun startRecording() {
        if (!checkPermission()) {
            onStatusChanged?.invoke(false, "No permission to record audio")
            return
        }

        try {
            setupAudioRecord()
            recordingScope = CoroutineScope(Dispatchers.Default + Job())
            audioBuffer = YAMNetClassifier.AudioBuffer()

            audioRecord?.let { record ->
                record.startRecording()
                isRecording.set(true)
                onStatusChanged?.invoke(true, "Recording started")

                recordingScope?.launch {
                    processAudioData()
                }
            }
        } catch (e: Exception) {
            Log.e(TAG, "Failed to start recording", e)
            onStatusChanged?.invoke(false, "Error: ${e.message}")
        }
    }

    fun stopRecording() {
        isRecording.set(false)
        recordingScope?.cancel()
        recordingScope = null

        try {
            audioRecord?.let { record ->
                if (checkPermission()) {
                    record.stop()
                }
                record.release()
            }
            audioRecord = null
            audioBuffer = null
            onStatusChanged?.invoke(false, "Recording stopped")
        } catch (e: Exception) {
            Log.e(TAG, "Error stopping recording", e)
            onStatusChanged?.invoke(false, "Error: ${e.message}")
        }
    }

    fun setSpeakerphoneOn(enabled: Boolean) {
        systemAudioManager.mode = if (enabled) {
            AudioManager.MODE_IN_COMMUNICATION
        } else {
            AudioManager.MODE_NORMAL
        }
        systemAudioManager.isSpeakerphoneOn = enabled
    }

    private fun checkPermission(): Boolean {
        return ContextCompat.checkSelfPermission(
            context,
            Manifest.permission.RECORD_AUDIO
        ) == PackageManager.PERMISSION_GRANTED
    }

    private suspend fun processAudioData() {
        if (!checkPermission()) {
            onStatusChanged?.invoke(false, "Permission denied")
            return
        }

        val readBufferSize = (SAMPLE_RATE * 0.1f).toInt()
        val tempBuffer = FloatArray(readBufferSize)

        while (isRecording.get() && checkPermission()) {
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
                            val predictions = classifier?.classifyAudio(
                                audioData = windowData,
                                originalSampleRate = SAMPLE_RATE,
                                isstereo = false
                            )

                            predictions?.let { predictionList ->
                                val mostFrequentPrediction = predictionList
                                    .groupBy { it }
                                    .maxByOrNull { it.value.size }
                                    ?.key

                                mostFrequentPrediction?.let {
                                    onAudioProcessed?.invoke(it)
                                }
                            }

                            buffer.slide()
                        }
                    }
                }
            } catch (e: Exception) {
                Log.e(TAG, "Error processing audio", e)
                onStatusChanged?.invoke(false, "Error: ${e.message}")
                break
            }
        }
    }

    private fun setupAudioRecord() {
        if (!checkPermission()) {
            throw SecurityException("RECORD_AUDIO permission not granted")
        }

        val bufferSize = AudioRecord.getMinBufferSize(
            SAMPLE_RATE,
            AudioFormat.CHANNEL_IN_MONO,
            AudioFormat.ENCODING_PCM_FLOAT
        )

        if (bufferSize == AudioRecord.ERROR || bufferSize == AudioRecord.ERROR_BAD_VALUE) {
            throw IllegalStateException("Invalid buffer size: $bufferSize")
        }

        val audioSource = if (systemAudioManager.isSpeakerphoneOn) {
            MediaRecorder.AudioSource.VOICE_COMMUNICATION
        } else {
            MediaRecorder.AudioSource.MIC
        }

        audioRecord = AudioRecord(
            audioSource,
            SAMPLE_RATE,
            AudioFormat.CHANNEL_IN_MONO,
            AudioFormat.ENCODING_PCM_FLOAT,
            bufferSize
        )

        if (audioRecord?.state != AudioRecord.STATE_INITIALIZED) {
            throw IllegalStateException("AudioRecord initialization failed")
        }
    }

    fun release() {
        if (isRecording.get()) {
            stopRecording()
        }
        systemAudioManager.mode = AudioManager.MODE_NORMAL
        systemAudioManager.isSpeakerphoneOn = false
        classifier?.close()
    }

    fun isRecording(): Boolean = isRecording.get()
}