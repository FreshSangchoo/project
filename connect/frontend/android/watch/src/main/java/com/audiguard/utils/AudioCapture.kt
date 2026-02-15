package com.audiguard.utils

import android.Manifest
import android.content.Context
import android.content.pm.PackageManager
import android.media.AudioFormat
import android.media.AudioRecord
import android.media.MediaRecorder
import android.util.Log
import androidx.core.app.ActivityCompat
import com.google.android.gms.wearable.Wearable
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

class AudioCapture(private val context: Context) {
    private var audioRecord: AudioRecord? =null
    private var isRecording = false


    fun startAudioStreamingToMobile(nodeId: String) {
        if(ActivityCompat.checkSelfPermission(context, Manifest.permission.RECORD_AUDIO) != PackageManager.PERMISSION_GRANTED){
            Log.e("AudioCapture", "오디오 녹음 권한이 없습니다.")
            return
        }
        Log.d("AudioCapture", "오디오 녹음 시작")

        val sampleRate = 16000
        val bufferSize = AudioRecord.getMinBufferSize(
            sampleRate,
            AudioFormat.CHANNEL_IN_MONO,
            AudioFormat.ENCODING_PCM_16BIT
        )

        val audioRecord = AudioRecord(
            MediaRecorder.AudioSource.MIC,
            sampleRate,
            AudioFormat.CHANNEL_IN_MONO,
            AudioFormat.ENCODING_PCM_16BIT,
            bufferSize
        )

        audioRecord.startRecording()
        isRecording=true
        val buffer = ByteArray(bufferSize)

        // Coroutine을 사용해 실시간으로 오디오 데이터를 읽고 전송
        CoroutineScope(Dispatchers.IO).launch {
            while (isRecording) {
                val readBytes = audioRecord.read(buffer, 0, buffer.size)
                if (readBytes > 0) {
                    sendAudioChunkToMobile(nodeId, buffer.copyOf(readBytes))
                }
            }
        }
    }

    // 중지
    fun stopAudioStreaming() {
        isRecording = false
        audioRecord?.stop()
        audioRecord?.release()
        audioRecord = null
    }

    // MessageClient를 사용해 오디오 청크 전송
    fun sendAudioChunkToMobile(nodeId: String, audioChunk: ByteArray) {
        Wearable.getMessageClient(context).sendMessage(nodeId, "/audio_chunk", audioChunk)
            .addOnSuccessListener {
                Log.d("WearOS", "오디오 청크 전송 성공")
            }
            .addOnFailureListener {
                Log.e("WearOS", "오디오 청크 전송 실패", it)
            }
    }

}